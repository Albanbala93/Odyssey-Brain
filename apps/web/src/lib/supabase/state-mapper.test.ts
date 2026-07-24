import { describe, expect, it } from "vitest";
import { CAPABILITIES } from "@/domain/capabilities-catalog";
import type { OdysseyState } from "@/domain/types";
import { createGuestUserModel } from "@/domain/user-model";
import {
  mapRowsToOdysseyState,
  mapStateToCapabilityUpserts,
  mapStateToPreferencesUpsert,
  mapStateToProfileUpsert,
  mapStateToSessionUpserts,
  type OdysseyStateRows,
} from "./state-mapper";

function emptyRows(overrides: Partial<OdysseyStateRows> = {}): OdysseyStateRows {
  return {
    profile: {
      id: "profile-1",
      auth_user_id: "auth-1",
      display_name: "Camille",
      native_language: "fr",
      target_language: "en",
      profession: null,
      onboarding_completed_at: "2026-01-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    preferences: null,
    goals: [],
    contexts: [],
    capabilities: [],
    recurringErrors: [],
    memories: [],
    sessions: [],
    turnsBySessionId: {},
    ...overrides,
  };
}

describe("mapRowsToOdysseyState", () => {
  it("fills every catalogue capability, defaulting to not_explored when no row exists", () => {
    const state = mapRowsToOdysseyState(emptyRows());
    expect(state.user.capabilities).toHaveLength(CAPABILITIES.length);
    expect(state.user.capabilities.every((c) => c.status === "not_explored")).toBe(true);
  });

  it("maps a practiced capability row onto the matching catalogue entry", () => {
    const target = CAPABILITIES[0];
    const state = mapRowsToOdysseyState(
      emptyRows({
        capabilities: [
          {
            user_id: "profile-1",
            capability_id: target.id,
            status: "functional",
            confidence_score: 60,
            demonstrated_score: 55,
            attempt_count: 2,
            trend: "up",
            evidence: ["evidence-1"],
            last_practiced_at: "2026-01-02T00:00:00.000Z",
          },
        ],
      }),
    );
    const mapped = state.user.capabilities.find((c) => c.capabilityId === target.id);
    expect(mapped?.status).toBe("functional");
    expect(mapped?.attemptCount).toBe(2);
    expect(mapped?.evidence).toEqual(["evidence-1"]);
  });

  it("orders conversation turns by turn_index regardless of row order", () => {
    const state = mapRowsToOdysseyState(
      emptyRows({
        sessions: [
          {
            id: "session-1",
            user_id: "profile-1",
            mission_id: "mission-introduce-yourself",
            status: "completed",
            started_at: "2026-01-01T00:00:00.000Z",
            completed_at: "2026-01-01T00:05:00.000Z",
            duration_seconds: 300,
            learner_word_count: 10,
            coach_word_count: 12,
            translation_usage_count: 1,
            aggregate_scores: {},
            debrief: null,
          },
        ],
        turnsBySessionId: {
          "session-1": [
            {
              id: "turn-2",
              session_id: "session-1",
              turn_index: 1,
              role: "coach",
              english_text: "second",
              french_text: null,
              transcription_confidence: null,
              correction: null,
              created_at: "2026-01-01T00:01:00.000Z",
            },
            {
              id: "turn-1",
              session_id: "session-1",
              turn_index: 0,
              role: "coach",
              english_text: "first",
              french_text: null,
              transcription_confidence: null,
              correction: null,
              created_at: "2026-01-01T00:00:00.000Z",
            },
          ],
        },
      }),
    );
    expect(state.sessions[0].turns.map((t) => t.englishText)).toEqual(["first", "second"]);
  });

  it("falls back to default preferences and consent when no preferences row exists", () => {
    const state = mapRowsToOdysseyState(emptyRows());
    expect(state.user.preferences.translationMode).toBe("adaptive");
    expect(state.user.consent.storeVoice).toBe(false);
  });
});

describe("state -> row mappers", () => {
  const baseState: OdysseyState = {
    schemaVersion: 1,
    user: createGuestUserModel(new Date("2026-01-01T00:00:00.000Z")),
    sessions: [],
  };

  it("maps identity fields onto the profile upsert", () => {
    const row = mapStateToProfileUpsert("auth-1", baseState);
    expect(row.auth_user_id).toBe("auth-1");
    expect(row.native_language).toBe("fr");
    expect(row.target_language).toBe("en");
  });

  it("maps preferences and consent onto the preferences upsert", () => {
    const row = mapStateToPreferencesUpsert("profile-1", baseState);
    expect(row.translation_mode).toBe("adaptive");
    expect(row.consent).toEqual(baseState.user.consent);
  });

  it("only upserts capabilities that have been attempted at least once", () => {
    const stateWithProgress: OdysseyState = {
      ...baseState,
      user: {
        ...baseState.user,
        capabilities: baseState.user.capabilities.map((c, i) =>
          i === 0 ? { ...c, attemptCount: 1, status: "discovered" as const } : c,
        ),
      },
    };
    const rows = mapStateToCapabilityUpserts("profile-1", stateWithProgress);
    expect(rows).toHaveLength(1);
    expect(rows[0].capability_id).toBe(baseState.user.capabilities[0].capabilityId);
  });

  it("maps sessions including their debrief", () => {
    const stateWithSession: OdysseyState = {
      ...baseState,
      sessions: [
        {
          id: "session-1",
          userId: "profile-1",
          missionId: "mission-introduce-yourself",
          status: "completed",
          startedAt: "2026-01-01T00:00:00.000Z",
          completedAt: "2026-01-01T00:05:00.000Z",
          durationSeconds: 300,
          turns: [],
          learnerWordCount: 5,
          coachWordCount: 8,
          translationUsageCount: 0,
          debrief: {
            missionId: "mission-introduce-yourself",
            capabilityId: "introduce_yourself",
            strengths: ["Good start"],
            priorityImprovement: "Add detail",
            improvedExample: "Example",
            correctionSource: "generic",
            practiceRecommendation: null,
            learnerWordCount: 5,
            scoreDelta: 5,
            recommendedNextMissionId: null,
            usedSuccessKeyword: true,
          },
        },
      ],
    };
    const rows = mapStateToSessionUpserts("profile-1", stateWithSession);
    expect(rows).toHaveLength(1);
    expect(rows[0].debrief).toEqual(stateWithSession.sessions[0].debrief);
  });
});
