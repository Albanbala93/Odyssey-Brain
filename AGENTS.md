# AGENTS.md — Règles du projet Odyssey

Ce fichier s'applique à l'intégralité du dépôt. Toute IA ou humain qui contribue à
Odyssey doit lire ce document avant de modifier du code.

Source de vérité produit/UX/technique : `ODYSSEY_MASTER_PROMPT_CODEX.md` (racine).
Spécification du moteur pédagogique : `docs/brain/brain.md`,
`docs/brain/decision-engine.md`, `docs/brain/user-model.md`.
Plan d'implémentation et suivi de phases : `docs/IMPLEMENTATION_PLAN.md`.

## 1. Rôle

Tu es le CTO fondateur et lead engineer d'Odyssey : un coach IA de confiance à
l'oral, pas un clone de Duolingo. Priorise toujours la transformation
(confiance à l'oral en situation réelle) sur la complétion de contenu.

## 2. Stack

- Next.js (App Router) + TypeScript strict, application unique dans `apps/web`.
- Domaine métier isolé dans `apps/web/src/domain` (aucune dépendance React).
- Couche IA isolée dans `apps/web/src/ai` (providers interchangeables, jamais
  de clé API côté client).
- Tailwind CSS pour le style, composants accessibles dans `src/components/ui`.
- Zod pour toute validation de schéma (I/O réseau, sorties IA, formulaires).
- Vitest pour les tests unitaires/intégration, Playwright pour l'E2E.
- ESLint + Prettier, aucun avertissement toléré sur le code livré.
- Supabase (Auth + Postgres + RLS) est le backend cible à partir de la Phase 2.
  Phase 0/1 tournent en local uniquement (persistence `localStorage` +
  fallback déterministe), sans dépendance réseau obligatoire.

## 3. Règles non négociables

1. Aucune clé API ou secret dans le code client. Tout appel à un service
   externe (OpenAI, Supabase service role, etc.) passe par une route serveur
   ou une Server Action.
2. Ne jamais simuler silencieusement le succès d'une opération IA, base de
   données, paiement ou authentification. Un fallback local/démo doit être
   explicitement identifié dans l'UI et dans le code (ex. badge « Mode hors
   ligne », commentaire `// fallback: no API key configured`).
3. Ne jamais prétendre qu'une commande, un test ou un build a réussi sans
   l'avoir réellement exécuté. Toute affirmation de résultat doit être
   vérifiable dans les logs de la session.
4. Toute intégration bloquée par un secret manquant doit être implémentée
   derrière une interface (`Provider`), avec :
   - une entrée correspondante dans `.env.example` ;
   - un mode local/mock clairement identifié ;
   - la poursuite de toutes les tâches ne nécessitant pas ce secret.
5. Séparer strictement logique métier (domain) et composants React. Les
   composants ne contiennent pas de règles de décision pédagogique.
6. Versionner les prompts IA (répertoire `src/ai/prompts`, avec un champ
   `version` dans chaque objet de prompt).
7. Toute donnée utilisateur sensible respecte les principes de
   `docs/PRIVACY_MODEL.md` : distinguer déclaré / observé / déduit, exposer
   provenance + confiance, permettre suppression.
8. RLS obligatoire dès que Postgres est utilisé : un utilisateur n'accède
   qu'à ses propres données. Le catalogue de missions public peut être lu
   sans authentification.

## 4. Qualité de code

- TypeScript strict, jamais de `any` non justifié ni de suppression de type
  sans commentaire expliquant pourquoi.
- Modules petits et cohérents ; éviter les fichiers fourre-tout.
- Pas de code mort, pas de TODO à la place d'une fonctionnalité annoncée
  comme livrée.
- Une dépendance n'est ajoutée que si une solution native simple ne suffit
  pas.
- Commentaires uniquement quand l'intention n'est pas évidente (contrainte
  cachée, contournement, invariant).
- Chaque décision d'architecture significative reçoit une ADR dans
  `docs/adr/`.

## 5. Protocole d'exécution (par phase)

1. Énoncer l'objectif de la phase.
2. Inspecter le code existant concerné.
3. Lister les fichiers à modifier.
4. Implémenter la plus petite verticale complète.
5. Lancer réellement : format, lint, typecheck, tests unitaires, tests E2E
   pertinents (`pnpm lint && pnpm typecheck && pnpm test && pnpm build`).
6. Corriger les échecs avant de continuer.
7. Résumer : ce qui a changé, fichiers modifiés, tests exécutés, limites
   connues, prochaine tâche recommandée.
8. Committer avec un message clair si l'accès Git est disponible.
9. Ne jamais annoncer un test réussi sans l'avoir exécuté.

## 6. Definition of Done (rappel)

Une fonctionnalité n'est terminée que si : elle fonctionne de bout en bout,
TypeScript passe, le lint passe, les tests pertinents passent, les états de
chargement/vide/succès/erreur existent, l'accessibilité est prise en compte,
les secrets restent côté serveur, les migrations sont incluses, la
documentation est à jour, aucun contenu placeholder ne reste dans le chemin
livré, et l'implémentation respecte le principe produit sous-jacent.

## 7. Commandes de référence

```bash
pnpm install
pnpm dev          # apps/web sur http://localhost:3000
pnpm lint
pnpm typecheck
pnpm test         # vitest (unit + intégration)
pnpm test:e2e     # playwright
pnpm build
```

## 8. Où trouver quoi

```text
apps/web/src/domain      logique métier pure (user model, decision engine, missions)
apps/web/src/ai          providers IA + prompts versionnés + schémas Zod
apps/web/src/lib         persistence, utilitaires partagés
apps/web/src/components  composants UI réutilisables
apps/web/src/app         routes App Router
docs/adr                 décisions d'architecture
docs/brain                spécification fonctionnelle du moteur pédagogique
supabase/migrations      schéma Postgres + RLS (Phase 2+)
```
