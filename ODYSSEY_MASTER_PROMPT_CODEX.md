# ODYSSEY — MASTER BUILD BRIEF FOR CODEX

## 0. ROLE AND OPERATING MODE

You are the founding CTO and senior product engineer for **Odyssey**.

Your mission is to design, build, test, document, and prepare for deployment a production-grade MVP of an AI-first language-learning application focused on spoken confidence in real-life situations.

Do not treat this as a mockup exercise. Build a coherent, maintainable application that can be run locally, tested, and deployed.

Work autonomously. Do not ask for confirmation for routine technical decisions. When a decision is ambiguous, choose the simplest production-quality option consistent with this brief, document the decision, and continue.

Before writing code:

1. Inspect the repository completely.
2. Preserve useful existing work.
3. Identify technical debt, broken assumptions, secrets, and incompatible dependencies.
4. Write a concise implementation plan in `docs/IMPLEMENTATION_PLAN.md`.
5. Create or update `AGENTS.md` with the project rules Codex must follow.
6. Then implement the product in vertical slices.

Never expose API secrets in client-side code.
Never silently fake a successful AI, database, payment, or authentication operation.
Use explicit local/demo fallbacks only when they are clearly identified in the UI and code.

---

# 1. PRODUCT VISION

Odyssey is not a traditional English-learning app.

It is an AI speaking companion that helps users become confident in real-life situations.

Core promise:

> Help users succeed in real-life situations by speaking English with greater confidence.

The product must prioritize:

- transformation over course completion;
- speaking confidence over academic knowledge;
- relationship with a coach over chatbot mechanics;
- personalized missions over generic lessons;
- useful real-world situations over abstract exercises;
- user speech over coach speech;
- capabilities over XP and arbitrary levels.

The learner should speak approximately 70–80% of a session.

The first spoken or written English response should occur in under 60 seconds after first launch.

Do not build a clone of Duolingo, Babbel, or a course catalogue.

---

# 2. PRIMARY USER EXPERIENCE

The core loop is:

User intent  
→ Real situation  
→ Mission  
→ Conversation  
→ Reflection  
→ Replay  
→ Capability improved

The application should feel like opening a conversation with a trusted coach.

The coach is the product. The dashboard is secondary.

The main entry screen is **Today** and should answer three questions instantly:

1. What should I do now?
2. Why is it useful to me?
3. How long will it take?

---

# 3. TARGET USERS

Primary users:

- French-speaking adults;
- professionals who need English for meetings, clients, presentations, interviews, networking, travel, or international collaboration;
- people who understand some English but lack confidence speaking;
- users who may feel anxious, blocked, embarrassed, or afraid of mistakes.

Secondary users:

- travellers;
- students;
- job seekers;
- adults rebuilding dormant English skills.

The MVP interface language is French.
The practiced language is English.
The architecture must allow additional native and target languages later.

---

# 4. PRODUCT PRINCIPLES

Implement these as product rules:

1. One primary action per screen.
2. No screen should require more than three seconds to understand.
3. No explicit placement test during onboarding.
4. Infer ability progressively from actual interactions.
5. Correct selectively; do not interrupt every mistake.
6. Protect confidence before optimizing linguistic precision.
7. Never shame the learner.
8. Translation must prevent confusion without becoming a permanent dependency.
9. Every session must end with useful reflection.
10. Progress must be represented by real capabilities.
11. The system must remember relevant context with user control and consent.
12. Every AI-generated output shown to the user must have a safe fallback.

---

# 5. MVP SCOPE

Build the following functional product areas.

## 5.1 Authentication

Support:

- email magic link;
- optional demo/guest mode;
- logout;
- session persistence;
- protected application routes;
- account deletion flow;
- basic privacy consent.

Preferred implementation: Supabase Auth.

Guest mode must create a local temporary user and clearly state that progress is stored only on the device until an account is created.

## 5.2 Invisible onboarding

The onboarding must feel like a conversation, not a form.

Required flow:

### Screen 1 — Welcome

- Odyssey logo;
- headline: “Let’s speak.”;
- French reassurance;
- one CTA: “Continuer”.

### Screen 2 — Coach introduction

Coach:

- “Hi, I’m Alex.”
- French translation underneath.
- “I’ll help you feel more confident when speaking English.”
- French translation.
- “What’s your name?”
- French translation.

Allow voice or text response.

### Screen 3 — Main motivation

Ask:

- “Why are you here today?”
- French translation.

Choices:

- Work / Travail
- Travel / Voyage
- Studies / Études
- Personal / Personnel

### Screen 4 — Context

If Work, ask a short open question such as:

- “What kind of work do you do?”
- translated into French.

Store the response.

### Screen 5 — Situations

Ask:

- “When do you usually need English?”
- French translation.

Choices:

- Meetings;
- Clients;
- Emails;
- Presentations;
- Interviews;
- Networking;
- Other.

Allow multiple selections.

### Screen 6 — Immediate first mission

Do not show a tutorial or dashboard first.

Start a very short, useful conversation based on the selected context.

Onboarding target duration: under two minutes.

## 5.3 Today screen

The Today screen is the product’s central screen.

Required hierarchy:

1. personalized greeting;
2. short coach message;
3. one recommended daily mission;
4. primary CTA;
5. a small set of alternative intents;
6. current capabilities;
7. minimal bottom navigation.

Daily mission card must include:

- title;
- real-life purpose;
- estimated duration;
- modality: voice;
- translation status;
- difficulty indicator expressed naturally;
- CTA: “Commencer”.

Alternative intents:

- Situation réelle;
- Discussion libre;
- Session de 5 minutes;
- Aide-moi à progresser;
- Surprends-moi.

Do not show a giant course catalogue.

## 5.4 Mission system

A mission represents a real-life outcome.

Mission fields:

- id;
- title;
- description;
- target situation;
- target capability;
- context;
- estimated duration;
- difficulty;
- opening prompt;
- success conditions;
- optional character;
- completion status;
- replay history.

Seed the MVP with at least 12 missions covering:

- introducing oneself;
- presenting an idea;
- participating in a meeting;
- asking for clarification;
- giving an opinion;
- disagreeing politely;
- handling an objection;
- small talk before a meeting;
- networking introduction;
- presenting one’s work;
- job interview answer;
- travel problem resolution.

## 5.5 Conversation experience

The conversation screen must support:

- microphone interaction;
- text fallback;
- coach speech playback;
- slow playback;
- live or post-utterance transcription;
- English coach message;
- contextual French translation;
- ability to show or hide translation;
- turn progress;
- exit;
- graceful handling of microphone denial;
- graceful handling of API failure;
- loading state that feels conversational.

The coach must:

- ask one question at a time;
- keep responses concise;
- adapt difficulty;
- maintain the scenario;
- encourage elaboration;
- avoid long explanations during the live exchange;
- avoid correcting every sentence;
- speak less than the learner;
- use natural English suitable for the inferred level.

The session should normally last 5–10 minutes.

## 5.6 Translation layer

Translation is a core accessibility feature.

Implement a reusable `TranslationLayer` component.

Rules:

- English is visually primary.
- French translation is visually secondary.
- During onboarding, translation is displayed automatically.
- In sessions, behavior follows the user setting:
  - always visible;
  - adaptive;
  - on demand.
- Default: adaptive.
- The user can toggle translation for each message.
- Translation must convey contextual meaning, not literal word-by-word translation.
- The setting persists.
- The user can always restore translation.

For the learner’s own utterance:

- show English transcription;
- optionally show French meaning;
- only ask for confirmation when transcription or meaning confidence is low.

## 5.7 Voice

Provide an abstraction layer for voice services.

MVP implementation:

- browser audio recording;
- server-side transcription when configured;
- Web Speech API fallback only where supported;
- text input fallback everywhere;
- text-to-speech for coach responses;
- slow playback option.

Preferred production path:

- OpenAI transcription or Realtime API behind the server;
- never expose API keys;
- support cancellation, timeout, retry, and microphone errors.

Store audio only if explicit consent is given.
By default, store transcript and learning signals, not raw audio.

## 5.8 AI coach

Coach name: Alex.

Alex should feel:

- calm;
- encouraging;
- attentive;
- concise;
- credible;
- non-judgmental;
- progressively familiar without being intrusive.

Implement the coach through a server-side AI service.

The service must receive:

- user profile;
- inferred level;
- confidence state;
- selected mission;
- target capability;
- recent conversation turns;
- known recurring errors;
- translation preference;
- correction policy;
- relevant user memories.

The service must return structured output validated against a schema.

Suggested response shape:

```ts
type CoachTurn = {
  english: string;
  french: string;
  intent: "prompt" | "follow_up" | "challenge" | "support" | "wrap_up";
  difficulty: 1 | 2 | 3 | 4 | 5;
  shouldCorrectNow: boolean;
  correction?: {
    original: string;
    improved: string;
    explanationFr: string;
  };
  detectedSignals?: {
    hesitation?: number;
    confidence?: number;
    comprehensionRisk?: number;
  };
};
```

Reject invalid AI output safely.
Log server-side validation failures without exposing sensitive data.

Create a deterministic local fallback mission so the product remains testable without an API key.

## 5.9 Session debrief

Every completed mission must produce a debrief.

Required elements:

- mission completed;
- capability improved;
- two strengths maximum;
- one priority improvement;
- one improved example phrase;
- learner speaking time or word count;
- option to replay;
- recommended next mission.

Do not show a wall of corrections.

The debrief should separate:

- communication success;
- confidence;
- fluency;
- vocabulary;
- grammar;
- pronunciation when data is available.

The first version may use a mixture of deterministic metrics and structured AI analysis.

## 5.10 Progress

Represent progress through capabilities, not only CEFR levels.

Initial capability set:

- introduce yourself;
- describe your role;
- present an idea;
- give an opinion;
- ask for clarification;
- participate in a meeting;
- disagree politely;
- handle objections;
- network informally;
- present with structure;
- answer interview questions;
- solve a travel problem.

Each capability should include:

- confidence score;
- demonstrated score;
- number of attempts;
- last practiced date;
- trend;
- evidence;
- recommended next action.

CEFR may exist internally as an inferred signal but should not dominate the interface.

## 5.11 Profile and settings

Profile must include:

- name;
- native language;
- target language;
- goals;
- relevant contexts;
- profession or domain;
- confidence self-perception;
- translation preference;
- voice preference;
- session duration preference;
- notification preference;
- consent and privacy controls.

Settings:

- translation: always / adaptive / on demand;
- automatic coach audio;
- slow speech preference;
- session length;
- delete history;
- delete account;
- export personal data.

## 5.12 Memory

Implement a user-controlled memory system.

Memory categories:

- identity;
- professional context;
- goals;
- upcoming situations;
- preferences;
- recurring vocabulary;
- recurring errors;
- confidence triggers;
- successful formulations;
- relationship context.

Memory rules:

- store only useful information;
- distinguish explicit user facts from system inferences;
- include provenance and timestamp;
- allow deletion;
- do not store highly sensitive content by default;
- do not store raw audio without consent;
- expire low-value temporary context;
- expose a simple “Ce qu’Odyssey retient de moi” view.

---

# 6. USER MODEL

Create a robust typed user model.

Minimum conceptual structure:

```ts
type UserModel = {
  identity: {
    id: string;
    name?: string;
    nativeLanguage: string;
    targetLanguage: string;
    timezone?: string;
  };
  goals: UserGoal[];
  contexts: UserContext[];
  languageProfile: {
    inferredCefr?: string;
    vocabularyBreadth?: number;
    grammarControl?: number;
    listeningComprehension?: number;
    speakingFluency?: number;
    pronunciation?: number;
  };
  confidence: {
    global: number;
    byContext: Record<string, number>;
    anxietySignals?: string[];
  };
  capabilities: CapabilityProgress[];
  preferences: {
    translationMode: "always" | "adaptive" | "on_demand";
    autoSpeak: boolean;
    slowSpeech: boolean;
    preferredSessionMinutes: number;
  };
  recurringErrors: RecurringError[];
  memories: UserMemory[];
  consent: ConsentState;
};
```

Use strict TypeScript types and runtime validation.

---

# 7. DECISION ENGINE

Implement a first version of a deterministic decision engine, separated from UI and AI prompts.

It must decide:

- next mission;
- difficulty;
- translation visibility;
- correction timing;
- whether to encourage elaboration;
- whether the user appears stuck;
- when to reduce complexity;
- when to end or extend a mission;
- which capability to update;
- which memory is worth saving.

Inputs:

- user model;
- current mission;
- current turn;
- recent performance;
- hesitation signals;
- translation use;
- correction history;
- user time preference.

Outputs must be inspectable and testable.

Do not hide all product logic inside a single prompt.

---

# 8. TECHNICAL ARCHITECTURE

Use a modern TypeScript monorepo or a clean full-stack Next.js repository.

Preferred stack:

- Next.js latest stable with App Router;
- TypeScript strict mode;
- React;
- Tailwind CSS;
- accessible component primitives;
- Supabase Auth and Postgres;
- OpenAI server-side integration;
- Zod for schemas;
- React Hook Form where useful;
- Vitest for unit tests;
- Playwright for end-to-end tests;
- ESLint and Prettier;
- Vercel-compatible deployment.

A monorepo is acceptable if justified, for example:

```text
apps/
  web/
packages/
  ui/
  domain/
  ai/
  config/
supabase/
docs/
```

Do not introduce complexity without benefit.

The final repository must include:

- `.env.example`;
- migration files;
- seed data;
- README;
- architecture documentation;
- test commands;
- deployment instructions;
- no committed secrets.

---

# 9. DATA MODEL

Design normalized tables with migrations.

Minimum entities:

## profiles

- id;
- auth_user_id;
- display_name;
- native_language;
- target_language;
- profession;
- onboarding_completed_at;
- created_at;
- updated_at.

## user_preferences

- user_id;
- translation_mode;
- auto_speak;
- slow_speech;
- preferred_session_minutes;
- notification settings.

## goals

- id;
- user_id;
- category;
- label;
- priority;
- active.

## user_contexts

- id;
- user_id;
- type;
- label;
- metadata.

## missions

- id;
- slug;
- title;
- description;
- target_capability_id;
- context_type;
- difficulty;
- estimated_minutes;
- opening_prompt;
- success_criteria;
- active.

## sessions

- id;
- user_id;
- mission_id;
- status;
- started_at;
- completed_at;
- duration_seconds;
- learner_word_count;
- coach_word_count;
- translation_usage_count;
- aggregate_scores;
- debrief.

## conversation_turns

- id;
- session_id;
- turn_index;
- role;
- english_text;
- french_text;
- transcription_confidence;
- created_at.

## capabilities

- id;
- slug;
- label_fr;
- description_fr.

## user_capabilities

- user_id;
- capability_id;
- confidence_score;
- demonstrated_score;
- attempt_count;
- trend;
- evidence;
- last_practiced_at.

## recurring_errors

- id;
- user_id;
- category;
- pattern;
- example;
- count;
- status;
- last_seen_at.

## user_memories

- id;
- user_id;
- category;
- content;
- source;
- confidence;
- expires_at;
- created_at.

## consent_records

- id;
- user_id;
- consent_type;
- granted;
- version;
- timestamp.

Apply Row Level Security.
Users must only access their own personal data.
Public mission catalogue data may be readable without authentication.
Service-role operations must remain server-side.

---

# 10. SECURITY AND PRIVACY

Mandatory:

- no API key in browser bundles;
- no service-role key in client code;
- validate all API inputs;
- rate-limit AI endpoints;
- protect against prompt injection from stored user content;
- avoid logging full sensitive transcripts in production;
- use RLS;
- sanitize rendered content;
- secure cookies;
- CSRF-safe patterns;
- explicit error states;
- privacy-first audio handling;
- account and data deletion;
- French GDPR-oriented consent language for the MVP;
- document retention assumptions.

Create `docs/SECURITY.md` and `docs/PRIVACY_MODEL.md`.

---

# 11. DESIGN SYSTEM

Visual direction:

- minimal;
- premium;
- calm;
- warm;
- modern;
- not childish;
- not game-like by default.

Inspiration principles:

- Apple-like clarity;
- Linear-like restraint;
- ChatGPT-like conversational focus;
- Headspace-like reassurance.

Do not copy branded visual assets.

Typography:

- Inter or a high-quality system font stack.

Color:

- neutral background;
- dark primary text;
- one blue or violet accent;
- accessible contrast;
- semantic success, warning, and error colors.

Core components:

- `MissionCard`;
- `CoachMessage`;
- `UserMessage`;
- `TranslationLayer`;
- `IntentCard`;
- `CapabilityCard`;
- `VoiceRecorder`;
- `AudioPlayback`;
- `FeedbackCard`;
- `ProgressIndicator`;
- `EmptyState`;
- `ErrorState`;
- `LoadingCoach`;
- `BottomNavigation`;
- `ConsentDialog`.

Accessibility:

- keyboard navigable;
- visible focus states;
- ARIA labels;
- sufficient contrast;
- reduced-motion support;
- screen-reader-friendly status changes;
- usable without microphone;
- usable without audio playback.

Responsive priority:

1. mobile web;
2. desktop;
3. architecture ready for native mobile later.

---

# 12. ROUTES

Suggested routes:

```text
/
 /welcome
 /auth
 /onboarding
 /today
 /missions
 /missions/[missionId]
 /session/[sessionId]
 /session/[sessionId]/debrief
 /progress
 /profile
 /profile/memory
 /settings
 /privacy
```

Protected routes must redirect cleanly when unauthenticated.

---

# 13. API CONTRACTS

Create typed server-side endpoints or server actions.

Minimum operations:

- create/update profile;
- finish onboarding;
- list recommended missions;
- start session;
- create coach turn;
- submit learner turn;
- finish session;
- generate debrief;
- get progress;
- update preferences;
- list/delete memories;
- delete account.

AI endpoints must return structured, validated responses.

Include idempotency where session completion could be retried.

---

# 14. ANALYTICS

Implement privacy-conscious product events.

Minimum events:

- app_opened;
- onboarding_started;
- onboarding_completed;
- first_english_response;
- mission_viewed;
- mission_started;
- learner_turn_submitted;
- translation_shown;
- translation_hidden;
- microphone_denied;
- session_completed;
- session_abandoned;
- mission_replayed;
- debrief_viewed;
- next_mission_started.

Key product metrics:

- time to first English response;
- onboarding completion;
- mission start rate;
- mission completion rate;
- learner speaking share;
- average session duration;
- translation dependency trend;
- replay rate;
- D1 and D7 retention;
- self-reported confidence change;
- session satisfaction.

Use an internal analytics abstraction so a vendor can be added later.

---

# 15. ERROR AND FALLBACK BEHAVIOR

Design explicit behavior for:

- OpenAI unavailable;
- malformed AI response;
- transcription failure;
- text-to-speech unsupported;
- microphone denied;
- Supabase unavailable;
- network offline;
- expired auth session;
- empty AI output;
- duplicate session completion;
- user leaves during recording.

The app must remain understandable.
Never show raw stack traces.
Never pretend a response was personalized if it came from a fallback.
A local mission fallback may be used and labeled discreetly as offline mode.

---

# 16. TESTING

Write tests as part of implementation, not afterward.

## Unit tests

Cover:

- decision engine;
- translation visibility policy;
- capability score updates;
- memory retention policy;
- debrief metric calculations;
- AI schema validation;
- fallback behavior.

## Integration tests

Cover:

- onboarding persistence;
- session creation;
- conversation turn storage;
- AI endpoint with mocked provider;
- session completion;
- RLS-sensitive access patterns.

## End-to-end tests

Cover at least:

1. guest onboarding to first mission;
2. authenticated onboarding;
3. completing a mission with typed responses;
4. toggling translation;
5. microphone denial fallback;
6. viewing debrief;
7. progress update;
8. logout and login persistence.

No critical user journey should depend on a live paid API during automated tests.

---

# 17. SEED CONTENT

Create realistic French/English seed data for the 12 MVP missions.

Each mission must include:

- French title and description;
- English scenario;
- target capability;
- difficulty;
- opening line;
- three likely follow-up intents;
- completion conditions;
- example debrief;
- fallback scripted turns.

Do not use placeholder lorem ipsum.

---

# 18. IMPLEMENTATION PHASES

Build in this order.

## Phase 0 — Repository audit and foundation

Deliver:

- repository audit;
- architecture decision record;
- `AGENTS.md`;
- environment validation;
- lint, typecheck, and test setup;
- CI workflow;
- database migrations.

Exit criteria:

- project installs;
- development server starts;
- tests run;
- no secrets committed.

## Phase 1 — Functional vertical slice

Deliver:

- welcome;
- guest onboarding;
- Today screen;
- one mission;
- typed conversation;
- translation layer;
- deterministic fallback;
- debrief;
- local persistence.

Exit criteria:

A new user can complete the entire core loop without external APIs.

## Phase 2 — Authentication and database

Deliver:

- Supabase Auth;
- profile persistence;
- missions and sessions in Postgres;
- RLS;
- account states;
- guest upgrade path.

Exit criteria:

Progress survives devices for authenticated users.

## Phase 3 — AI conversation

Deliver:

- server-side OpenAI integration;
- structured coach responses;
- mission-aware prompting;
- schema validation;
- rate limiting;
- fallback behavior;
- prompt versioning.

Exit criteria:

A mission can sustain a useful adaptive conversation without breaking the scenario.

## Phase 4 — Voice

Deliver:

- recording;
- transcription;
- playback;
- slow playback;
- permissions;
- text fallback;
- voice-related metrics.

Exit criteria:

A supported user can complete a mission primarily by voice.

## Phase 5 — Learning intelligence

Deliver:

- capability updates;
- confidence signals;
- selective corrections;
- debrief analysis;
- next-mission recommendation;
- basic memory.

Exit criteria:

Two users with different performance receive meaningfully different follow-ups.

## Phase 6 — Product hardening

Deliver:

- accessibility review;
- responsive polish;
- security review;
- analytics;
- privacy controls;
- performance optimization;
- deployment configuration;
- smoke tests.

Exit criteria:

The MVP is deployable for a closed beta.

---

# 19. DEFINITION OF DONE

A feature is done only when:

- it works end to end;
- TypeScript passes;
- lint passes;
- relevant tests pass;
- loading, empty, success, and error states exist;
- accessibility is considered;
- secrets remain server-side;
- migrations are included;
- documentation is updated;
- no placeholder content remains in the shipped path;
- the implementation matches the product principle behind the feature.

---

# 20. CODE QUALITY RULES

- TypeScript strict mode.
- Prefer small cohesive modules.
- Separate domain logic from React components.
- Avoid giant files.
- Avoid duplicated prompt strings.
- Version AI prompts.
- Use runtime schemas at network and AI boundaries.
- Use meaningful names.
- Do not suppress type errors without explanation.
- Do not leave dead code.
- Do not add a dependency when a small native solution is clearer.
- Keep UI components reusable.
- Use database transactions where consistency requires them.
- Add comments only where intent is not obvious.
- Add ADRs for meaningful architectural decisions.

---

# 21. CODEX EXECUTION PROTOCOL

Follow this protocol for every phase:

1. State the phase objective.
2. Inspect relevant code and files.
3. List the files you expect to change.
4. Implement the smallest complete vertical slice.
5. Run formatting, linting, typecheck, unit tests, and relevant E2E tests.
6. Fix failures before moving on.
7. Summarize:
   - what changed;
   - files changed;
   - tests run;
   - known limitations;
   - next recommended task.
8. Commit logically if Git access is available.
9. Never claim a test passed unless it was actually run.

When blocked by a missing credential:

- implement the integration behind an interface;
- provide `.env.example`;
- add a deterministic mock or fallback;
- document exactly what credential is required;
- continue with all work that does not require the credential.

Do not stop after producing a plan.
Do not only generate static screens.
Do not replace core functionality with TODO comments.
Do not rewrite working code unnecessarily.

---

# 22. FIRST TASK TO EXECUTE NOW

Start with Phase 0 and Phase 1.

Specifically:

1. Audit the current repository.
2. Preserve and reuse valuable Odyssey V1–V3 code where appropriate.
3. Choose the final project structure.
4. Create `AGENTS.md`.
5. Create database migrations and seed foundations even if Phase 1 initially runs locally.
6. Build the complete local vertical slice:
   - welcome;
   - conversational onboarding;
   - translation;
   - Today;
   - one real mission;
   - typed conversation;
   - optional browser voice if safe;
   - debrief;
   - local profile and progress persistence.
7. Add tests for the critical path.
8. Run the application and all checks.
9. Report exact results and remaining blockers.
10. Then proceed to Phase 2 unless a genuine blocking issue prevents it.

The initial experience must be polished enough to place in front of a test user.

Begin now.
