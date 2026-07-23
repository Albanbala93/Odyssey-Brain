# Odyssey — Plan d'implémentation

Document vivant. Mis à jour à chaque phase. Voir `AGENTS.md` pour les règles
et `ODYSSEY_MASTER_PROMPT_CODEX.md` pour le brief produit complet.

## 1. Audit du dépôt (2026-07-20)

État initial constaté :

- Le dépôt GitHub `Albanbala93/Odyssey-Brain` était **entièrement vide**
  (aucun commit, aucune branche).
- Aucun code applicatif préexistant. Les seuls artefacts disponibles étaient
  4 documents de spécification fournis hors dépôt par l'utilisateur :
  - `ODYSSEY_MASTER_PROMPT_CODEX.md` — brief produit/technique complet (V1).
  - `docs/brain/brain.md` — spécification fonctionnelle de l'Odyssey Brain.
  - `docs/brain/decision-engine.md` — spécification du moteur de décision.
  - `docs/brain/user-model.md` — spécification du modèle utilisateur.
  - `docs/legacy/odyssey-mvp-v2-prototype.html` — prototype statique HTML/JS
    (V2) : onboarding conversationnel, écran Today, mission scénarisée à 3
    tours, Web Speech API (reconnaissance + synthèse), debrief avec score,
    persistence `localStorage`.

Décision : ces 5 documents constituent le point de départ. Le prototype V2
n'est pas du code réutilisable tel quel (HTML global sans typage, logique
mélangée à l'UI, un seul mission codée en dur), mais sa **logique produit**
est valable et reprise fidèlement : flow d'onboarding en 3 écrans + mission
immédiate, structure de bulle de conversation avec traduction togglable,
debrief avec point fort / axe de progrès / score, persistence locale par
défaut. Elle est portée dans le domaine métier typé plutôt que copiée.

Rien à supprimer, rien de cassé à corriger : le dépôt était vide.

## 2. Décision d'architecture (ADR-0001 résumée, détail dans `docs/adr/0001-architecture.md`)

Application unique **Next.js (App Router) + TypeScript strict**, plutôt
qu'un monorepo multi-packages. Le brief autorise un monorepo « si justifié »
et demande explicitement de ne pas introduire de complexité sans bénéfice.
Pour une Phase 0/1 mono-application, sans autre consommateur du domaine
métier (pas d'app mobile native prévue à court terme), un monorepo pnpm
ajouterait de la friction d'outillage (build inter-packages, résolution de
types) sans bénéfice mesurable. La séparation demandée par le brief
(`packages/ui`, `packages/domain`, `packages/ai`) est obtenue par des
dossiers `src/domain`, `src/ai`, `src/components/ui` avec des règles
d'import strictes documentées dans `AGENTS.md`, migrables vers de vrais
packages pnpm si un second consommateur apparaît (ex. app mobile React
Native).

## 3. Plan de phases

### Phase 0 — Fondation (ce build)

- Scaffold Next.js 15 / React 19 / TypeScript strict / Tailwind.
- ESLint + Prettier + Vitest + Playwright configurés et fonctionnels.
- `.env.example` documentant toutes les variables (OpenAI, Supabase).
- CI GitHub Actions : install, lint, typecheck, test, build.
- Migrations Supabase de base (schéma complet du brief, RLS), non
  connectées en Phase 1 (le produit tourne 100% local).
- `docs/adr/0001-architecture.md`, `docs/SECURITY.md`,
  `docs/PRIVACY_MODEL.md`.

Critères de sortie : `pnpm install` fonctionne, `pnpm dev` démarre,
`pnpm test` s'exécute, aucun secret committé. **Statut : voir rapport de fin
de session.**

### Phase 1 — Verticale fonctionnelle locale (ce build)

- Welcome → onboarding conversationnel (nom, motivation, contexte,
  situations) → Today → mission → conversation typée avec
  `TranslationLayer` → debrief → retour Today, capacité mise à jour.
- Moteur de décision déterministe (pas d'IA générative) : sélection de
  mission recommandée, politique de traduction adaptative, politique de
  correction, mise à jour des capacités.
- 12 missions seed FR/EN avec tours scriptés déterministes (fallback local
  garanti, testable sans clé API).
- Persistence `localStorage` via une interface `UserStateRepository`
  remplaçable plus tard par Supabase.
- Aucune dépendance réseau requise pour compléter le parcours complet.

Critères de sortie : un nouvel utilisateur termine la boucle complète sans
API externe. **Statut : voir rapport de fin de session.**

### Phase 2 — Authentification et base de données

Code livré et testé (typecheck/lint/build/unit/e2e tous verts) :

- Clients Supabase browser/server (`src/lib/supabase/client.ts`,
  `server.ts`), toujours `null`-safe quand les variables d'env sont
  absentes — l'app entière continue de fonctionner en mode invité local
  sans aucune configuration.
- Authentification par lien magique (`/auth`, `/auth/callback`), contexte
  `AuthProvider` (`src/lib/auth/auth-context.tsx`), déconnexion.
- `SupabaseStateRepository` (`src/lib/supabase/state-repository.ts`)
  implémentant `UserStateRepository` (devenue asynchrone) en lisant/écrivant
  les tables normalisées des migrations (profils, préférences, objectifs,
  contextes, capacités, sessions, tours de conversation, mémoires) plutôt
  qu'un blob JSON. Mapping pur et testé unitairement dans
  `state-mapper.ts` / `state-mapper.test.ts` (8 tests).
- Bascule invité → compte automatique : à la première connexion, l'état
  local en mémoire est migré vers le nouveau compte Supabase
  (`app-state.tsx`, effet d'hydratation).
- Suppression de compte (`/api/account/delete`) via le client service-role
  côté serveur, cascade sur toutes les tables via les FK `on delete
cascade` des migrations.
- Migration `0001_init.sql` complétée d'une colonne `user_preferences.consent`
  pour stocker l'état de consentement courant.

**Statut : vérifié en conditions réelles (2026-07-20).** Un projet Supabase
a été créé, les migrations `0001_init.sql` et `supabase/seed.sql` exécutées,
et `apps/web/.env.local` renseigné avec les 3 identifiants. Vérifié
manuellement contre la vraie base : connexion par lien magique reçue et
fonctionnelle, redirection `/auth/callback` correcte, bascule invité →
compte confirmée (ligne créée dans `profiles` avec les données migrées), UI
`/settings` affichant l'e-mail du compte et l'option de déconnexion. Le mode
invité local reste inchangé et testé end-to-end quand ces variables sont
absentes.

**Limitation technique notable** : `postgrest-js@2.110.7` échoue à inférer
correctement les génériques de `.upsert()` contre un `Database` à ~13
tables (`.select()` infère correctement, `.upsert()` résout `never` quel
que soit l'argument — reproduit en isolation, y compris avec `createClient`
direct sans passer par notre code). Contournement documenté et isolé dans
`state-repository.ts` (`asUpsertArg`/`asWrite`) : la sécurité de forme est
préservée en amont par les fonctions `mapStateTo*Upsert` (testées), seul le
re-contrôle au point d'appel `.upsert()` est court-circuité.

**Bugs trouvés et corrigés lors de la vérification live** (tous les 4 avec
un utilisateur réel, projet Supabase réel) :

- `createId()` préfixait chaque identifiant généré côté app
  (`session_...`, `turn_...`, `guest_...`, etc.), incompatible avec les
  colonnes Postgres `uuid` des tables normalisées — toute écriture pour un
  compte authentifié échouait silencieusement. `createId()` retourne
  désormais toujours un UUID v4 nu.
- `SupabaseStateRepository.load()` confondait « aucun profil n'existe
  encore » (cas normal en première connexion) et « la requête a échoué »
  (erreur réseau/RLS) — les deux retournaient `null`, ce qui pouvait
  redéclencher la bascule invité→compte sur un compte déjà existant et
  casser sa clé primaire (violation de la FK `user_preferences.user_id`).
  `load()` lève désormais une erreur explicite dans ce second cas.
- `save()` écrivait les tours de conversation (`conversation_turns`) dans
  le même `Promise.all` que leur session parente ; la policy RLS de
  `conversation_turns` exige que la session référencée existe déjà, et les
  deux requêtes PostgREST étant indépendantes, le tour pouvait arriver
  avant que la session ne soit committée. Les tours sont désormais écrits
  dans un second lot, après confirmation de l'écriture des sessions.
- Le schéma JSON strict envoyé à OpenAI (voir Phase 3) marquait deux champs
  comme optionnels sans les lister dans `required`, ce qu'OpenAI rejette
  en mode `strict: true` — corrigé en parallèle du bug ci-dessus lors de
  la même session de debug.

Après ces 4 correctifs, le parcours complet (invité → connexion par lien
magique → bascule de compte → missions avec conversation IA réelle →
debrief) a été revérifié de bout en bout sans erreur.

### Phase 3 — Conversation IA

Code livré et testé (typecheck/lint/build/unit/e2e tous verts) :

- L'écran de session (`app/session/[sessionId]/page.tsx`) appelle désormais
  la route serveur `POST /api/coach/turn` (`lib/app-state.tsx`,
  `requestCoachTurn`) au lieu d'instancier `LocalCoachProvider` côté client.
  La route sélectionne `OpenAiCoachProvider` quand `OPENAI_API_KEY` est
  configuré côté serveur, et retombe sur le fournisseur local déterministe
  sinon — dans les deux cas la réponse porte un champ `source` (`"openai"`
  ou `"local_fallback"`).
- Si la requête réseau vers la route échoue elle-même (hors ligne), le
  client retombe directement sur `LocalCoachProvider` en local, avec le
  même label `local_fallback` — la session ne reste jamais bloquée.
- Le label de secours est visible dans l'UI : `CoachMessage` affiche
  « Mode hors ligne » au-dessus de toute réponse dont `source ===
"local_fallback"`, pour ne jamais faire croire à une conversation IA
  générative quand ce n'est pas le cas (AGENTS.md, `ODYSSEY_MASTER_PROMPT_CODEX.md`
  §21).
- `ConversationTurn.source` est persisté tel quel dans `localStorage` (mode
  invité, blob JSON complet). **Limitation connue** : la table Supabase
  `conversation_turns` n'a pas encore de colonne `source`, donc pour les
  comptes authentifiés ce label n'est pas restitué après un rechargement
  depuis la base (uniquement pendant la session live). Sans impact sur le
  fonctionnement réel — à ajouter dans une migration ultérieure si
  l'historique exact du fournisseur devient nécessaire.

**Statut : vérifié en conditions réelles (2026-07-22).** `OPENAI_API_KEY`
fournie par l'utilisateur, configurée en local et sur Vercel. Corrigé au
passage : le schéma JSON strict envoyé à OpenAI (Structured Outputs,
`strict: true`) marquait `correction` et `detectedSignals` comme optionnels
sans les lister dans `required`, ce qu'OpenAI rejette avec un 400 avant
même de générer une réponse — chaque appel réel échouait silencieusement
et retombait en mode hors ligne. Les deux champs sont désormais
nullable-et-obligatoires (voir `openai-coach-provider.ts`), et le corps de
réponse d'une erreur OpenAI est maintenant journalisé en entier plutôt que
le seul code de statut. Conversation IA générative confirmée fonctionnelle
de bout en bout (local et production), label « Mode hors ligne » absent
quand OpenAI répond normalement.

### Phase 4 — Voix

Code livré et testé (typecheck/lint/build/unit/e2e tous verts, vérifié
visuellement dans un vrai navigateur) :

- Nouvelle route serveur `POST /api/voice/transcribe`
  (`src/app/api/voice/transcribe/route.ts`) : reçoit l'audio enregistré tel
  quel (pas de multipart), l'envoie à l'API de transcription OpenAI Whisper
  (`OpenAiTranscriptionProvider`, `src/ai/providers/openai-transcription-provider.ts`,
  `server-only`) quand `OPENAI_API_KEY` est configuré. Un `GET` sur la même
  route expose uniquement un booléen `available` (jamais la clé) pour que le
  client sache quelle méthode utiliser avant même de demander l'accès au
  micro.
- `VoiceRecorder` (`src/components/coach/VoiceRecorder.tsx`) réécrit pour
  suivre l'ordre de préférence du brief (§5.7) : enregistrement navigateur +
  transcription serveur en priorité quand configuré (`MediaRecorder` +
  `getUserMedia`), repli sur la Web Speech API du navigateur si non
  configuré ou non disponible, champ texte toujours disponible en dernier
  recours. Gère explicitement le refus de micro, une durée maximale
  d'enregistrement (30s), l'annulation en cours d'enregistrement, et
  n'affiche jamais d'erreur bloquante — chaque échec retombe sur la méthode
  suivante ou sur le texte.
- Lecture vocale du coach et lecture ralentie déjà livrées en Phase 1
  (`src/lib/speech-synthesis.ts`, réglage `Lecture ralentie` dans
  `/settings`) — inchangées, aucun travail supplémentaire nécessaire.
- Métrique vocale : `ConversationTurn.transcriptionConfidence` (déjà présent
  dans le domaine mais jamais alimenté avant cette phase) est maintenant
  rempli de bout en bout — `VoiceRecorder` → `handleSend` →
  `submitUserTurn` — avec la confiance renvoyée par la Web Speech API
  nativement, ou une heuristique dérivée des `avg_logprob` des segments
  Whisper (`estimateConfidence`, `src/ai/transcription-confidence.ts`,
  testée unitairement ; Whisper ne renvoie pas de score de confiance
  direct).
- Stockage de l'audio brut : jamais implémenté, conforme au brief (« store
  transcript and learning signals, not raw audio » par défaut) — le blob
  audio n'existe que le temps de la requête vers la route de transcription
  et n'est jamais persisté (ni `localStorage`, ni Supabase).

**Non fait délibérément** : l'API Realtime d'OpenAI (streaming bidirectionnel
à faible latence, citée comme « preferred production path » plutôt que MVP
dans le brief) n'a pas été implémentée — le round-trip enregistrement →
transcription reste plus simple et suffit au critère de sortie de cette
phase. Piste d'amélioration future si la latence perçue devient un problème.

### Phase 5 — Intelligence d'apprentissage

Mémoire utilisateur, corrections sélectives basées sur l'historique réel,
détection de plateau — nécessite des données de sessions réelles
(post-Phase 2/3).

### Phase 6 — Durcissement produit

Accessibilité, sécurité, analytics, déploiement — après stabilisation des
phases précédentes.

## 4. Blocages connus

| Blocage                                                                      | Impact                                                                      | Contournement actuel                                                                                                                                                                   |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY` non fourni                                                  | Pas de conversation IA générative réelle                                    | `LocalCoachProvider` déterministe, clairement labellisé « Mode hors ligine » dans l'UI                                                                                                 |
| Identifiants Supabase non fournis                                            | Pas de compte persistant multi-appareil                                     | `LocalStorageUserStateRepository`, migrations prêtes pour bascule ultérieure                                                                                                           |
| Écriture GitHub via MCP renvoie `403 Resource not accessible by integration` | Impossible de pousser directement depuis cette session au moment de l'audit | Commits Git locaux propres ; nouvelle tentative de push documentée dans le rapport de session ; sinon l'utilisateur pousse depuis sa machine ou ajuste les permissions de l'app GitHub |

Aucun de ces blocages n'empêche la Phase 0 et la Phase 1 d'être livrées
complètes et testées.
