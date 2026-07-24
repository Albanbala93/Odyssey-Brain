"use client";

import type { CoachContext } from "@/ai/coach-provider";
import { LocalCoachProvider } from "@/ai/providers/local-coach-provider";
import { CoachTurnResponseSchema, type CoachTurn, type CoachTurnResponse } from "@/ai/schemas";
import { decideCorrectionPolicy, recommendMission } from "@/domain/decision-engine";
import { updateCapabilityProgress } from "@/domain/capability";
import { computeSessionDebrief } from "@/domain/debrief";
import { evaluateMemoryCandidate } from "@/domain/memory-policy";
import { upsertRecurringError } from "@/domain/recurring-errors";
import { getCapabilityBySlug } from "@/domain/capabilities-catalog";
import { getMissionById, MISSIONS } from "@/domain/missions";
import type {
  ConversationTurn,
  Mission,
  OdysseyState,
  Session,
  TranslationMode,
  UserMemory,
  UserModel,
} from "@/domain/types";
import {
  applyOnboardingAnswers,
  createGuestUserModel,
  type OnboardingAnswers,
} from "@/domain/user-model";
import { useAuth } from "@/lib/auth/auth-context";
import { createId } from "@/lib/id";
import { trackEvent } from "@/lib/analytics";
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
// Safety cap so memories (Phase 5 "basic memory") can't grow unbounded
// across a long-lived account; oldest entries are dropped first.
const MAX_MEMORIES = 30;

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
        recurringErrors: context.user.recurringErrors,
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
  updateConsent: (partial: Partial<Omit<UserModel["consent"], "version" | "updatedAt">>) => void;
  deleteMemory: (memoryId: string) => void;
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
        trackEvent("account_created", migrated.user.consent.analytics, {
          sessionsCarriedOver: migrated.sessions.length,
        });
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
    // onboarding/page.tsx calls startMission() immediately after this, in
    // the same synchronous stretch of code — before the `stateRef` mirror
    // effect above has a chance to run on the next render. Without this,
    // startMission read the pre-onboarding user (empty `contexts`), so the
    // very first mission was picked with zero context relevance no matter
    // what the learner selected in onboarding. Assigning stateRef.current
    // here directly keeps the mirror's documented invariant ("read the
    // latest state synchronously") true for this specific call chain.
    const updatedUser = applyOnboardingAnswers(stateRef.current.user, answers);
    stateRef.current = { ...stateRef.current, user: updatedUser };
    setState((prev) => ({ ...prev, user: updatedUser }));
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

  // Phase 6 privacy control: consent was previously read-only in the UI —
  // this is the only place `UserModel.consent` is ever mutated by the user
  // themselves (ODYSSEY_MASTER_PROMPT_CODEX.md §10, docs/PRIVACY_MODEL.md).
  const updateConsent = useCallback(
    (partial: Partial<Omit<UserModel["consent"], "version" | "updatedAt">>) => {
      setState((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          consent: { ...prev.user.consent, ...partial, updatedAt: new Date().toISOString() },
        },
      }));
    },
    [],
  );

  const deleteMemory = useCallback((memoryId: string) => {
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        memories: prev.user.memories.filter((m) => m.id !== memoryId),
      },
    }));
  }, []);

  // Called during render (today/page.tsx computes this inside a useMemo to
  // decide what to display) — must read `state` directly like getSession
  // below, not `stateRef.current`, which only resyncs one render later via
  // an effect. A settings change (e.g. Niveau) followed by navigating
  // straight to Today would otherwise render the recommendation computed
  // from the pre-change user until some unrelated re-render caught up.
  const recommendedMission = useCallback(() => {
    return recommendMission(state.user, MISSIONS, undefined, state.sessions);
  }, [state]);

  const startMission = useCallback(async (missionId?: string) => {
    const currentUser = stateRef.current.user;
    const mission = missionId
      ? getMissionById(missionId)
      : recommendMission(currentUser, MISSIONS, undefined, stateRef.current.sessions).mission;
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
    trackEvent("session_started", currentUser.consent.analytics, {
      missionId: mission.id,
      contextType: mission.contextType,
    });
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

      setState((prev) => {
        // Phase 5 "corrections sélectives": a real correction from the coach
        // is the only reliable, non-fabricated signal we have for what the
        // learner actually struggles with — track it so future sessions
        // (this one included, via the system prompt) can watch for the same
        // pattern instead of correcting generically every time.
        const recurringErrors = nextTurn.correction
          ? upsertRecurringError(prev.user.recurringErrors, {
              category: nextTurn.correction.category,
              pattern: nextTurn.correction.explanationFr,
              example: `${nextTurn.correction.original} → ${nextTurn.correction.improved}`,
            })
          : prev.user.recurringErrors;

        return {
          ...prev,
          user: { ...prev.user, recurringErrors },
          sessions: prev.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  turns: [...s.turns, coachTurn],
                  coachWordCount: s.coachWordCount + countWords(nextTurn.english),
                }
              : s,
          ),
        };
      });
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
      otherMissions.length > 0
        ? recommendMission(currentState.user, otherMissions, undefined, currentState.sessions)
        : null;

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

      // Phase 5 "basic memory": the only fact about this session we can
      // assert without fabricating anything is whether the learner actually
      // used one of the mission's expected success keywords — a real,
      // deterministic signal (debrief.ts), not an AI guess.
      let memories = prev.user.memories;
      if (debrief.usedSuccessKeyword) {
        const decision = evaluateMemoryCandidate({
          category: "successful_formulation",
          content: `A réussi « ${mission.titleFr} » en utilisant une formulation attendue.`,
          source: "observed",
          confidence: 0.6,
        });
        if (decision.retain) {
          const newMemory: UserMemory = {
            id: createId(),
            category: "successful_formulation",
            content: `A réussi « ${mission.titleFr} » en utilisant une formulation attendue.`,
            source: "observed",
            confidence: 0.6,
            createdAt: now.toISOString(),
            expiresAt: decision.expiresAt,
          };
          memories = [...memories, newMemory].slice(-MAX_MEMORIES);
        }
      }

      return {
        ...prev,
        user: {
          ...prev.user,
          capabilities,
          memories,
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
    trackEvent("session_completed", currentState.user.consent.analytics, {
      missionId: mission.id,
      scoreDelta: debrief.scoreDelta,
      learnerWordCount: debrief.learnerWordCount,
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
      updateConsent,
      deleteMemory,
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
      updateConsent,
      deleteMemory,
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
