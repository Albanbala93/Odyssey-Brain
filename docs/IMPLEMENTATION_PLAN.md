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

### Phase 2 — Authentification et base de données (bloquée par secrets)

Nécessite `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
(non fournis). Travail réalisable sans ces secrets et livré dès maintenant :
schéma de migrations complet + RLS, interface `AuthProvider` /
`UserStateRepository` avec implémentation `LocalStorageProvider` (actif) et
`SupabaseProvider` (squelette, activable dès que les variables d'env sont
renseignées). Le reste (upgrade de compte invité, persistence
multi-appareils) reprendra dès que les secrets seront fournis.

### Phase 3 — Conversation IA (bloquée par secret `OPENAI_API_KEY`)

Interface `CoachProvider` avec schéma `CoachTurn` (Zod) déjà définie en
Phase 1 pour que le fallback déterministe et le futur provider OpenAI soient
interchangeables sans changement d'UI. Implémentation OpenAI ajoutée dès que
la clé est disponible.

### Phase 4 — Voix

Web Speech API déjà en fallback navigateur dans le prototype V2 ; portée en
Phase 1 comme option (dégradation gracieuse vers texte). Transcription
serveur (Whisper/Realtime) ajoutée en Phase 4 quand `OPENAI_API_KEY` est
disponible.

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
