"use client";

import type { CoachContext } from "@/ai/coach-provider";
import { LocalCoachProvider } from "@/ai/providers/local-coach-provider";
import { CoachTurnResponseSchema, type CoachTurn, type CoachTurnResponse } from "@/ai/schemas";
import { decideCorrectionPolicy, recommendMission } from "@/domain/decision-engine";
import { updateCapabilityProgress } from "@/domain/capability";
import { computeSessionDebrief } from "@/domain/debrief";
import { getCapabilityBySlug } from "@/domain/capabilities-catalog";
import { getMissionById, MISSIONS } from "@/domain/missions";
import type {
  ConversationTurn,
  Mission,
  OdysseyState,
  Session,
  TranslationMode,
  UserModel,
} from "@/domain/types";
import {
  applyOnboardingAnswers,
  createGuestUserModel,
  type OnboardingAnswers,
} from "@/domain/user-model";
import { useAuth } from "@/lib/auth/auth-context";
import { createId } from "@/lib/id";
import { countWords } from "@/lib/text";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LocalStorageStateRepository } from "./local-storage-repository";
import { STATE_SCHEMA_VERSION, type UserStateRepository } from "./state-repository";
import { SupabaseStateRepository } from "./supabase/state-repository";

const localStorageRepository = new LocalStorageStateRepository();
const localCoachProvider = new LocalCoachProvider();

function createInitialState(): OdysseyState {
  return { schemaVersion: STATE_SCHEMA_VERSION, user: createGuestUserModel(), sessions: [] };
}

/**
 * Requests the next coach turn from `/api/coach/turn` (OpenAI-backed when
 * `OPENAI_API_KEY` is configured server-side, deterministic local fallback
 * otherwise — the route always labels which one produced the reply). Falls
 * back to the local provider directly if the request itself fails (e.g. the
 * device is offline), so a session never gets stuck.
 */
async function requestCoachTurn(context: CoachContext): Promise<CoachTurnResponse> {
  try {
    const response = await fetch("/api/coach/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: context.mission.id,
        turnIndex: context.turnIndex,
        history: context.history,
        correctionPolicy: context.correctionPolicy,
        learnerName: context.user.identity.name,
        translationMode: context.user.preferences.translationMode,
        confidenceGlobal: context.user.confidence.global,
      }),
    });
    if (!response.ok) throw new Error(`coach/turn responded with ${response.status}`);
    return CoachTurnResponseSchema.parse(await response.json());
  } catch (error) {
    console.error("[app-state] coach/turn request failed, using local coach", error);
    const turn: CoachTurn = await localCoachProvider.generateTurn(context);
    return { turn, source: "local_fallback" };
  }
}

interface AppStateValue {
  state: OdysseyState;
  isReady: boolean;
  completeOnboarding: (answers: OnboardingAnswers) => void;
  startMission: (missionId?: string) => Promise<string>;
  submitUserTurn: (
    sessionId: string,
    text: string,
    transcriptionConfidence?: number,
  ) => Promise<void>;
  finishSession: (sessionId: string) => void;
  recordTranslationToggle: (sessionId: string, visible: boolean) => void;
  updatePreferences: (partial: Partial<UserModel["preferences"]>) => void;
  resetProfile: () => void;
  deleteAccount: () => Promise<void>;
  getSession: (sessionId: string) => Session | undefined;
  getMissionForSession: (sessionId: string) => Mission | undefined;
  recommendedMission: () => { mission: Mission; reason: string };
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, isReady: authReady, supabaseConfigured, signOut } = useAuth();
  const [state, setState] = useState<OdysseyState>(() => createInitialState());
  const [isReady, setIsReady] = useState(false);
  const stateRef = useRef(state);

  // Keep a ref mirror so action callbacks (startMission, submitUserTurn…)
  // can read the latest state synchronously without becoming stale
  // closures. Updated in an effect, not during render, so it never mutates
  // the ref as a render side effect.
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const repository = useMemo<UserStateRepository>(() => {
    if (supabaseConfigured && user) return new SupabaseStateRepository(user.id);
    return localStorageRepository;
  }, [supabaseConfigured, user]);

  useEffect(() => {
    // Wait until we know whether there's an active Supabase session before
    // hydrating, so a returning authenticated user doesn't briefly flash
    // stale guest data. This external store (localStorage or Supabase)
    // cannot be read during SSR/first render, so reading it here and
    // committing the result is the correct place for this setState call.
    if (!authReady) return;
    let cancelled = false;

    async function hydrate() {
      let loaded: OdysseyState | null = null;
      let loadFailed = false;
      try {
        loaded = await repository.load();
      } catch (error) {
        // A real query error (network, RLS, etc.) is not the same as "no
        // profile exists yet" — treating it as the latter would re-run the
        // guest-to-account migration below against an account that already
        // has one, minting a new id that collides with existing foreign
        // keys. Leave the current state untouched and let the user retry.
        console.error("[app-state] failed to load account state", error);
        loadFailed = true;
      }
      if (cancelled) return;

      if (loaded) {
        setState(loaded);
      } else if (user && !loadFailed) {
        // Authenticated but no account data yet (first sign-in): migrate
        // whatever guest/local progress exists into the new account
        // (ODYSSEY_MASTER_PROMPT_CODEX.md §5.1 guest upgrade path). A fresh
        // id is minted for the account rather than reusing the local guest
        // one, since the two identities are conceptually distinct.
        const guestState = (await localStorageRepository.load()) ?? stateRef.current;
        const newUserId = createId();
        const migrated: OdysseyState = {
          ...guestState,
          user: {
            ...guestState.user,
            identity: { ...guestState.user.identity, id: newUserId, isGuest: false },
          },
          sessions: guestState.sessions.map((s) => ({ ...s, userId: newUserId })),
        };
        await repository.save(migrated);
        if (!cancelled) setState(migrated);
      }

      if (!cancelled) setIsReady(true);
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [repository, authReady, user]);

  useEffect(() => {
    if (isReady) repository.save(state);
  }, [state, isReady, repository]);

  const completeOnboarding = useCallback((answers: OnboardingAnswers) => {
    setState((prev) => ({ ...prev, user: applyOnboardingAnswers(prev.user, answers) }));
  }, []);

  const updatePreferences = useCallback((partial: Partial<UserModel["preferences"]>) => {
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        preferences: { ...prev.user.preferences, ...partial },
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const recommendedMission = useCallback(() => {
    return recommendMission(stateRef.current.user, MISSIONS);
  }, []);

  const startMission = useCallback(async (missionId?: string) => {
    const currentUser = stateRef.current.user;
    const mission = missionId
      ? getMissionById(missionId)
      : recommendMission(currentUser, MISSIONS).mission;
    if (!mission) throw new Error(`Unknown mission: ${missionId}`);

    const correctionPolicy = decideCorrectionPolicy(currentUser.confidence.global);
    const now = new Date();

    const { turn: openingTurn, source } = await requestCoachTurn({
      user: currentUser,
      mission,
      turnIndex: 0,
      history: [],
      correctionPolicy,
    });

    const sessionId = createId();
    const coachTurn: ConversationTurn = {
      id: createId(),
      turnIndex: 0,
      role: "coach",
      englishText: openingTurn.english,
      frenchText: openingTurn.french,
      comprehensionRisk: openingTurn.detectedSignals?.comprehensionRisk,
      source,
      createdAt: now.toISOString(),
    };

    const session: Session = {
      id: sessionId,
      userId: currentUser.identity.id,
      missionId: mission.id,
      status: "in_progress",
      startedAt: now.toISOString(),
      completedAt: null,
      durationSeconds: null,
      turns: [coachTurn],
      learnerWordCount: 0,
      coachWordCount: countWords(openingTurn.english),
      translationUsageCount: 0,
      debrief: null,
    };

    setState((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
    return sessionId;
  }, []);

  const submitUserTurn = useCallback(
    async (sessionId: string, text: string, transcriptionConfidence?: number) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const currentState = stateRef.current;
      const session = currentState.sessions.find((s) => s.id === sessionId);
      if (!session || session.status !== "in_progress") return;
      const mission = getMissionById(session.missionId);
      if (!mission) return;

      const correctionPolicy = decideCorrectionPolicy(currentState.user.confidence.global);
      const coachTurnCount = session.turns.filter((t) => t.role === "coach").length;

      const userTurn: ConversationTurn = {
        id: createId(),
        turnIndex: session.turns.length,
        role: "user",
        englishText: trimmed,
        transcriptionConfidence,
        createdAt: new Date().toISOString(),
      };

      const history = [...session.turns, userTurn].map((t) => ({
        role: t.role,
        text: t.englishText,
      }));

      // Show the learner's own message as soon as they send it, rather than
      // holding it back until the coach's reply arrives — the round trip to
      // the AI provider can take a couple of seconds, and bundling both turns
      // into one update made the UI look unresponsive until it resolved.
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                turns: [...s.turns, userTurn],
                learnerWordCount: s.learnerWordCount + countWords(trimmed),
              }
            : s,
        ),
      }));

      const { turn: nextTurn, source } = await requestCoachTurn({
        user: currentState.user,
        mission,
        turnIndex: coachTurnCount,
        history,
        correctionPolicy,
      });

      const coachTurn: ConversationTurn = {
        id: createId(),
        turnIndex: userTurn.turnIndex + 1,
        role: "coach",
        englishText: nextTurn.english,
        frenchText: nextTurn.french,
        comprehensionRisk: nextTurn.detectedSignals?.comprehensionRisk,
        source,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                turns: [...s.turns, coachTurn],
                coachWordCount: s.coachWordCount + countWords(nextTurn.english),
              }
            : s,
        ),
      }));
    },
    [],
  );

  const finishSession = useCallback((sessionId: string) => {
    const currentState = stateRef.current;
    const session = currentState.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const mission = getMissionById(session.missionId);
    if (!mission) return;
    if (session.status === "completed" && session.debrief) return;

    const userTurns = session.turns.filter((t) => t.role === "user").map((t) => t.englishText);
    const otherMissions = MISSIONS.filter((m) => m.id !== mission.id);
    const next =
      otherMissions.length > 0 ? recommendMission(currentState.user, otherMissions) : null;

    const debrief = computeSessionDebrief({
      mission,
      userTurns,
      recommendedNextMissionId: next?.mission.id ?? null,
    });

    const capabilityDefinition = getCapabilityBySlug(mission.targetCapabilitySlug);
    const now = new Date();
    const startedAt = new Date(session.startedAt);

    setState((prev) => {
      const capabilities = capabilityDefinition
        ? prev.user.capabilities.map((c) =>
            c.capabilityId === capabilityDefinition.id
              ? updateCapabilityProgress(c, {
                  scoreDelta: debrief.scoreDelta,
                  evidence: `${mission.title} — ${now.toISOString().slice(0, 10)}`,
                  now,
                })
              : c,
          )
        : prev.user.capabilities;

      const confidenceGain = userTurns.length >= 2 ? 0.03 : 0.01;

      return {
        ...prev,
        user: {
          ...prev.user,
          capabilities,
          confidence: {
            ...prev.user.confidence,
            global: Math.min(1, prev.user.confidence.global + confidenceGain),
          },
          updatedAt: now.toISOString(),
        },
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: "completed" as const,
                completedAt: now.toISOString(),
                durationSeconds: Math.max(
                  1,
                  Math.round((now.getTime() - startedAt.getTime()) / 1000),
                ),
                debrief,
              }
            : s,
        ),
      };
    });
  }, []);

  const recordTranslationToggle = useCallback((sessionId: string, visible: boolean) => {
    if (!visible) return;
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, translationUsageCount: s.translationUsageCount + 1 } : s,
      ),
    }));
  }, []);

  const resetProfile = useCallback(() => {
    repository.clear();
    setState(createInitialState());
  }, [repository]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    const response = await fetch("/api/account/delete", { method: "POST" });
    if (!response.ok) {
      throw new Error("Account deletion failed");
    }
    await signOut();
    await localStorageRepository.clear();
    setState(createInitialState());
  }, [user, signOut]);

  // Unlike the action callbacks above (startMission, submitUserTurn…),
  // these read `state` directly rather than `stateRef.current`: they're
  // called during render (session/page.tsx reads `getSession(id)` to decide
  // what to display), and `stateRef.current` is only resynced by an effect
  // after commit — one render behind. Reading it here meant a just-arrived
  // coach turn wouldn't show up until some unrelated re-render (e.g. typing
  // in the reply box) happened to run after the ref had caught up.
  const getSession = useCallback(
    (sessionId: string) => {
      return state.sessions.find((s) => s.id === sessionId);
    },
    [state],
  );

  const getMissionForSession = useCallback(
    (sessionId: string) => {
      const session = state.sessions.find((s) => s.id === sessionId);
      return session ? getMissionById(session.missionId) : undefined;
    },
    [state],
  );

  const value = useMemo<AppStateValue>(
    () => ({
      state,
      isReady,
      completeOnboarding,
      startMission,
      submitUserTurn,
      finishSession,
      recordTranslationToggle,
      updatePreferences,
      resetProfile,
      deleteAccount,
      getSession,
      getMissionForSession,
      recommendedMission,
    }),
    [
      state,
      isReady,
      completeOnboarding,
      startMission,
      submitUserTurn,
      finishSession,
      recordTranslationToggle,
      updatePreferences,
      resetProfile,
      deleteAccount,
      getSession,
      getMissionForSession,
      recommendedMission,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export type { TranslationMode };
