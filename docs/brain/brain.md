# Odyssey Brain
## Spécification fonctionnelle et comportementale
### Version 0.1 — Document fondateur

---

## 1. Objet du document

`brain.md` définit le fonctionnement central de l’intelligence d’Odyssey.

L’Odyssey Brain est le système qui observe, comprend, mémorise, décide et adapte l’expérience d’apprentissage pour chaque utilisateur.

Il ne doit jamais se comporter comme un simple chatbot ni comme un catalogue de leçons.

Sa mission est de transformer chaque interaction en une expérience utile, personnalisée et progressive, orientée vers une capacité réelle à parler avec davantage de fluidité et de confiance.

Ce document sert de référence commune pour :

- le produit ;
- le design ;
- le développement ;
- l’architecture IA ;
- le moteur pédagogique ;
- le modèle de données ;
- les tests qualité.

---

## 2. Mission de l’Odyssey Brain

L’Odyssey Brain doit être capable de répondre en permanence à cinq questions :

1. Qui est cet utilisateur aujourd’hui ?
2. Que cherche-t-il réellement à accomplir ?
3. Qu’est-ce qui l’empêche actuellement de parler avec fluidité ?
4. Quelle est la meilleure prochaine expérience pour le faire progresser ?
5. Comment l’aider sans casser sa confiance ni sa spontanéité ?

La finalité n’est pas de maximiser le temps passé dans l’application.

La finalité est d’augmenter la capacité de l’utilisateur à réussir des situations réelles dans une autre langue.

---

## 3. Principe directeur

> L’Odyssey Brain ne choisit jamais une activité parce qu’elle existe dans un programme.  
> Il choisit une expérience parce qu’elle représente la meilleure prochaine étape pour cet utilisateur précis.

Toute décision doit prendre en compte simultanément :

- l’objectif réel ;
- le niveau observé ;
- la confiance ;
- les erreurs récurrentes ;
- les capacités déjà acquises ;
- le contexte immédiat ;
- le temps disponible ;
- l’historique récent ;
- la charge cognitive ;
- la motivation.

---

## 4. Responsabilités principales

L’Odyssey Brain est responsable de six fonctions centrales.

### 4.1 Comprendre l’utilisateur

Il construit et met à jour un modèle vivant de l’utilisateur.

Ce modèle comprend notamment :

- ses objectifs ;
- ses motivations ;
- ses situations prioritaires ;
- son niveau linguistique par compétence ;
- son niveau de confiance ;
- ses habitudes ;
- ses centres d’intérêt ;
- ses préférences ;
- ses blocages ;
- ses erreurs récurrentes ;
- son rythme d’apprentissage ;
- son historique de progression.

### 4.2 Décider de la prochaine action

Il choisit ce que l’utilisateur doit faire ensuite.

Exemples :

- lancer une conversation ;
- répéter une expression ;
- simuler une réunion ;
- reprendre une erreur récente ;
- augmenter la difficulté ;
- réduire la difficulté ;
- proposer une mission réelle ;
- faire une révision ;
- demander une information complémentaire.

### 4.3 Générer l’expérience

Il produit une expérience adaptée au contexte.

Cette expérience peut inclure :

- un scénario ;
- un rôle ;
- un interlocuteur ;
- un objectif ;
- un niveau de difficulté ;
- des contraintes ;
- des expressions utiles ;
- des événements imprévus ;
- un feedback final.

### 4.4 Observer les performances

Il analyse notamment :

- la compréhension ;
- la fluidité ;
- la précision ;
- le vocabulaire ;
- la grammaire ;
- la prononciation ;
- le temps de réponse ;
- les hésitations ;
- les reformulations ;
- la longueur des réponses ;
- l’initiative ;
- la capacité à maintenir une conversation.

### 4.5 Corriger intelligemment

Il décide :

- quoi corriger ;
- quand corriger ;
- comment corriger ;
- ce qui peut attendre ;
- ce qui doit être rejoué immédiatement ;
- ce qui doit être mémorisé pour plus tard.

### 4.6 Mesurer la progression

Il transforme les interactions en indicateurs compréhensibles.

La progression est mesurée sur des capacités concrètes.

Exemples :

- se présenter avec aisance ;
- demander une clarification ;
- prendre la parole en réunion ;
- expliquer une idée ;
- défendre un point de vue ;
- gérer une objection ;
- commander au restaurant ;
- participer à une conversation informelle.

---

## 5. Architecture logique

L’Odyssey Brain est composé de plusieurs moteurs spécialisés.

```text
Utilisateur
    |
    v
Interface voix / texte
    |
    v
Session Orchestrator
    |
    +--> User Model
    +--> Context Engine
    +--> Learning Engine
    +--> Conversation Engine
    +--> Feedback Engine
    +--> Confidence Engine
    +--> Progress Engine
    +--> Memory Engine
    |
    v
Réponse / activité / feedback / prochaine mission
```

Le `Session Orchestrator` coordonne l’ensemble.

Aucun moteur spécialisé ne doit piloter seul l’expérience.

---

## 6. Les moteurs du Brain

### 6.1 Session Orchestrator

Le Session Orchestrator est le chef d’orchestre.

Il reçoit :

- le message ou la voix de l’utilisateur ;
- le contexte de session ;
- le profil utilisateur ;
- les objectifs actifs ;
- les signaux de performance ;
- les contraintes produit.

Il décide ensuite quels moteurs appeler et dans quel ordre.

#### Responsabilités

- identifier l’intention ;
- déterminer le mode de session ;
- récupérer les souvenirs utiles ;
- définir l’objectif pédagogique ;
- choisir le scénario ;
- demander la génération du dialogue ;
- analyser la réponse ;
- produire le feedback ;
- mettre à jour le profil ;
- définir la prochaine action.

---

### 6.2 User Model

Le User Model est la représentation structurée de l’utilisateur.

Il doit être :

- progressif ;
- explicable ;
- modifiable ;
- réversible ;
- respectueux du consentement ;
- distinct des simples données de compte.

Le User Model ne contient que les informations utiles à l’expérience.

Il distingue :

- les informations déclarées ;
- les informations observées ;
- les informations déduites ;
- les informations incertaines.

Chaque information déduite doit porter un niveau de confiance.

Exemple :

```json
{
  "professional_context": {
    "value": "marketing",
    "source": "declared",
    "confidence": 1.0
  },
  "speaking_confidence": {
    "value": 0.42,
    "source": "observed",
    "confidence": 0.78
  }
}
```

---

### 6.3 Context Engine

Le Context Engine détermine ce qui est pertinent maintenant.

Il prend en compte :

- l’heure ;
- la durée disponible ;
- la dernière session ;
- les objectifs urgents ;
- les événements à venir ;
- l’état émotionnel exprimé ;
- le niveau de fatigue éventuel ;
- le canal utilisé ;
- la présence ou non d’écouteurs ;
- les contraintes de l’environnement.

Exemples :

- cinq minutes disponibles : micro-session ;
- réunion demain : préparation ciblée ;
- utilisateur fatigué : activité légère ;
- utilisateur dans les transports : mode discret ;
- utilisateur seul avec écouteurs : conversation vocale complète.

---

### 6.4 Learning Engine

Le Learning Engine choisit la meilleure prochaine expérience pédagogique.

Il optimise plusieurs objectifs en même temps :

- utilité réelle ;
- progression ;
- confiance ;
- mémorisation ;
- répétition ;
- variété ;
- engagement ;
- difficulté adaptée.

Il ne doit jamais maximiser uniquement la difficulté ou la quantité de contenu.

#### Règle centrale

La difficulté cible doit se situer légèrement au-dessus de la zone de confort actuelle.

Une session doit être :

- assez accessible pour préserver la confiance ;
- assez difficile pour produire un apprentissage ;
- assez concrète pour sembler utile.

#### Types de décisions

- renforcer une faiblesse ;
- consolider une capacité ;
- introduire une nouvelle situation ;
- réutiliser une expression ;
- varier le contexte ;
- préparer un événement réel ;
- détecter un plateau ;
- provoquer une prise d’initiative.

---

### 6.5 Conversation Engine

Le Conversation Engine génère les dialogues.

Il doit produire des conversations :

- naturelles ;
- cohérentes ;
- adaptées au niveau ;
- adaptées au profil ;
- orientées vers un objectif ;
- suffisamment imprévisibles ;
- compatibles avec une vraie interaction humaine.

Chaque conversation possède :

```text
Contexte
Rôle de l’utilisateur
Rôle de l’interlocuteur
Objectif réel
Objectif pédagogique
Niveau de difficulté
Expressions cibles
Contraintes
Événements possibles
Condition de réussite
```

#### Règle fondamentale

L’utilisateur doit parler davantage que le coach.

Cible produit :

- utilisateur : 70 à 80 % du temps de parole ;
- coach ou interlocuteur : 20 à 30 %.

Le moteur doit éviter :

- les longs monologues ;
- les explications non sollicitées ;
- les questions trop scolaires ;
- les dialogues artificiels ;
- la répétition excessive de formules identiques.

---

### 6.6 Feedback Engine

Le Feedback Engine choisit les corrections les plus utiles.

Il ne corrige pas tout.

Il priorise selon :

1. impact sur la compréhension ;
2. fréquence de l’erreur ;
3. importance pour l’objectif de la session ;
4. capacité de l’utilisateur à intégrer la correction ;
5. risque de casser la fluidité ;
6. valeur de réutilisation.

#### Limite recommandée

Après une conversation courte :

- une réussite principale ;
- un à trois axes de progression maximum ;
- une reformulation utile ;
- une occasion de rejouer.

#### Modes de feedback

- correction implicite ;
- reformulation naturelle ;
- correction immédiate ;
- correction différée ;
- mini-explication ;
- répétition guidée ;
- comparaison avant / après ;
- replay de la scène.

#### Principe

> Le feedback doit donner envie de recommencer, pas faire ressentir l’échec.

---

### 6.7 Confidence Engine

Le Confidence Engine estime la relation de l’utilisateur à la prise de parole.

Il observe notamment :

- le délai avant de répondre ;
- la fréquence des silences ;
- les abandons ;
- les réponses très courtes ;
- les demandes d’aide ;
- l’initiative ;
- la capacité à reformuler ;
- l’acceptation de l’imprévu ;
- la stabilité de la voix ;
- l’évolution d’une session à l’autre.

Le score de confiance ne doit pas être présenté comme une note absolue.

Il doit servir à :

- ajuster la difficulté ;
- choisir le ton du coach ;
- décider du niveau de soutien ;
- détecter un besoin de réassurance ;
- valoriser les progrès.

---

### 6.8 Progress Engine

Le Progress Engine suit des capacités concrètes.

Il ne remplace pas nécessairement le CECRL, mais le rend secondaire.

Chaque capacité peut avoir les états suivants :

```text
Non explorée
Découverte
En cours d’acquisition
Fonctionnelle
Solide
Spontanée
```

Exemple :

```text
Prendre la parole en réunion : Fonctionnelle
Présenter une recommandation : En cours d’acquisition
Répondre à une objection : Découverte
Faire du small talk : Solide
```

Le moteur doit pouvoir expliquer pourquoi un statut a changé.

---

### 6.9 Memory Engine

Le Memory Engine permet au coach de construire une relation dans le temps.

Il gère plusieurs types de mémoire.

#### Mémoire de session

Ce qui vient de se produire.

#### Mémoire récente

Les dernières sessions, erreurs et objectifs.

#### Mémoire durable

Les informations stables et utiles.

Exemples :

- profession ;
- voyage prévu ;
- situation redoutée ;
- centres d’intérêt ;
- objectif long terme ;
- préférences d’apprentissage.

#### Mémoire pédagogique

- erreurs récurrentes ;
- expressions maîtrisées ;
- expressions fragiles ;
- capacités acquises ;
- situations travaillées.

#### Mémoire relationnelle

- sujets déjà évoqués ;
- engagements pris ;
- réussites racontées ;
- moments importants partagés volontairement.

#### Règles de mémoire

- ne pas mémoriser tout par défaut ;
- privilégier l’utilité ;
- demander le consentement lorsque nécessaire ;
- permettre la consultation et la suppression ;
- distinguer fait, hypothèse et inférence ;
- ne pas utiliser une information personnelle sans pertinence.

---

## 7. Cycle complet d’une session

Chaque session suit le cycle suivant.

### Étape 1 — Comprendre l’intention

Exemples :

- s’entraîner ;
- préparer une réunion ;
- discuter librement ;
- réviser ;
- poser une question ;
- raconter une réussite ;
- reprendre après une absence.

### Étape 2 — Charger le contexte utile

Le Brain sélectionne uniquement les informations pertinentes.

### Étape 3 — Définir l’objectif de session

L’objectif doit être observable.

Mauvais objectif :

> Améliorer l’anglais.

Bon objectif :

> Être capable d’expliquer une recommandation en moins de deux minutes et de répondre à une objection simple.

### Étape 4 — Choisir le mode

Modes possibles :

- conversation libre ;
- simulation ;
- mission guidée ;
- entraînement express ;
- débrief ;
- répétition ;
- préparation réelle ;
- immersion narrative.

### Étape 5 — Exécuter l’expérience

Le Brain adapte la difficulté en temps réel.

### Étape 6 — Observer

Les signaux sont enregistrés sans interrompre inutilement.

### Étape 7 — Donner un feedback

Le feedback est court, priorisé et actionnable.

### Étape 8 — Faire rejouer

L’utilisateur réutilise immédiatement une correction importante.

### Étape 9 — Mettre à jour le modèle

Le User Model, la mémoire et la progression sont actualisés.

### Étape 10 — Proposer la meilleure prochaine action

Exemples :

- recommencer ;
- passer à une variante plus difficile ;
- sauvegarder une expression ;
- préparer une autre situation ;
- lancer une mission réelle ;
- arrêter sur une réussite.

---

## 8. Modes de session du MVP

Le MVP doit commencer avec un nombre limité de modes.

### 8.1 Première rencontre

Objectifs :

- comprendre la motivation ;
- créer la confiance ;
- estimer le niveau ;
- identifier une première situation ;
- produire une valeur immédiate.

### 8.2 Simulation réelle

Exemples :

- réunion ;
- entretien ;
- présentation ;
- restaurant ;
- hôtel ;
- conversation informelle.

### 8.3 Conversation quotidienne

Conversation courte, personnalisée et naturelle.

### 8.4 Préparation urgente

L’utilisateur décrit une situation réelle proche.

Le Brain crée une session ciblée.

### 8.5 Replay

L’utilisateur rejoue une scène après feedback.

### 8.6 Débrief

Le Brain explique les progrès, les points forts et la prochaine étape.

---

## 9. Modèle de décision pédagogique

Le Learning Engine attribue un score à chaque activité candidate.

Exemple conceptuel :

```text
activity_score =
    real_world_relevance
  + learning_value
  + confidence_fit
  + memory_value
  + urgency
  + personal_interest
  + novelty
  - cognitive_overload
  - repetition_fatigue
  - frustration_risk
```

Le poids de chaque facteur varie selon l’utilisateur.

Exemple :

Pour un utilisateur anxieux avant une réunion, la pertinence réelle et la confiance prennent le dessus sur la nouveauté.

---

## 10. Règles comportementales du coach

Le coach doit être :

- chaleureux ;
- précis ;
- encourageant ;
- adulte ;
- naturel ;
- honnête ;
- attentif ;
- adaptable.

Le coach ne doit pas être :

- infantilisant ;
- excessivement enthousiaste ;
- bavard ;
- mécanique ;
- moralisateur ;
- scolaire ;
- intrusif ;
- flatteur sans raison.

### Règles de langage

- phrases courtes ;
- vocabulaire adapté ;
- une consigne à la fois ;
- pas de jargon pédagogique inutile ;
- pas de longues listes pendant une interaction vocale ;
- pas de correction exhaustive ;
- pas de fausse empathie.

### Règle de vérité

Le coach ne doit jamais prétendre avoir compris une réponse s’il ne l’a pas comprise.

Il doit demander une clarification naturellement.

---

## 11. Personnalisation progressive

L’Odyssey Brain ne doit pas exiger un profil complet au départ.

Il doit construire la connaissance progressivement.

### Niveau 1 — Essentiel

- langue cible ;
- motivation principale ;
- contexte prioritaire ;
- niveau approximatif ;
- temps disponible.

### Niveau 2 — Usage

- situations fréquentes ;
- préférences de session ;
- centres d’intérêt ;
- difficultés ;
- rythme.

### Niveau 3 — Relation

- projets ;
- événements à venir ;
- réussites ;
- blocages ;
- habitudes ;
- sujets personnels volontairement partagés.

Chaque nouvelle question doit avoir une justification immédiate dans l’expérience.

---

## 12. Gestion de l’incertitude

Le Brain ne doit pas transformer une déduction en vérité.

Chaque inférence possède :

- une valeur ;
- une source ;
- un niveau de confiance ;
- une date ;
- une durée de validité ;
- un statut de confirmation.

Exemple :

```json
{
  "inference": "user_prefers_short_sessions",
  "confidence": 0.64,
  "evidence": [
    "three sessions under eight minutes",
    "user said they were busy"
  ],
  "needs_confirmation": true
}
```

Lorsqu’une déduction a un impact important, le Brain doit la vérifier.

---

## 13. Données minimales du User Model

Le modèle initial doit inclure les objets suivants :

```text
identity_profile
language_profile
goal_profile
confidence_profile
interest_profile
learning_preferences
capability_map
error_patterns
expression_memory
session_history
real_world_events
relationship_memory
consent_settings
```

Le schéma détaillé sera défini dans `user-model.md`.

---

## 14. Sorties attendues du Brain

À chaque tour important, le Brain doit pouvoir produire une sortie structurée.

Exemple :

```json
{
  "user_intent": "prepare_meeting",
  "session_goal": "answer_opinion_question",
  "coach_action": "launch_simulation",
  "difficulty": 0.54,
  "support_level": "medium",
  "target_capabilities": [
    "express_opinion",
    "justify_recommendation"
  ],
  "memory_to_use": [
    "user_works_in_marketing",
    "meeting_next_week"
  ],
  "correction_policy": {
    "max_interruptions": 1,
    "max_final_corrections": 3
  },
  "next_state": "simulation_active"
}
```

Les réponses conversationnelles ne doivent pas être les seules sorties du système.

Les décisions doivent être structurées, observables et testables.

---

## 15. Garde-fous produit

Le Brain doit empêcher :

- la surcharge de corrections ;
- les sessions trop difficiles ;
- les conversations sans objectif ;
- les recommandations répétitives ;
- la collecte excessive de données ;
- la personnalisation intrusive ;
- les affirmations non fondées sur le niveau ;
- la dépendance à une seule métrique ;
- les encouragements artificiels ;
- les scénarios incohérents.

---

## 16. Critères de qualité

Une session est considérée comme réussie lorsque :

- l’utilisateur a parlé suffisamment ;
- l’objectif était clair ;
- la difficulté était adaptée ;
- au moins une capacité a été travaillée ;
- le feedback était compréhensible ;
- l’utilisateur a pu réutiliser une correction ;
- la session a produit une donnée utile ;
- la prochaine étape est cohérente ;
- la confiance n’a pas été inutilement dégradée.

---

## 17. Indicateurs du Brain

### Indicateurs d’apprentissage

- progression par capacité ;
- taux de réutilisation des expressions ;
- réduction des erreurs récurrentes ;
- amélioration de la fluidité ;
- augmentation de la complexité des réponses ;
- réussite des simulations.

### Indicateurs de confiance

- réduction du temps de réponse ;
- augmentation de la longueur des réponses ;
- hausse de l’initiative ;
- diminution des abandons ;
- augmentation des sessions vocales ;
- auto-évaluation avant / après.

### Indicateurs d’expérience

- taux de fin de session ;
- taux de replay ;
- retour le lendemain ;
- satisfaction après session ;
- nombre de moments réels déclarés ;
- pertinence perçue des sessions.

---

## 18. Périmètre MVP

Le MVP ne doit pas chercher à implémenter toute la vision.

### Inclus

- profil utilisateur initial ;
- mémoire récente ;
- objectifs ;
- estimation simple du niveau ;
- simulations ;
- conversation vocale ou textuelle ;
- feedback limité ;
- suivi de quelques capacités ;
- personnalisation de base ;
- replay ;
- historique de sessions.

### Non inclus dans la première version

- mémoire relationnelle très profonde ;
- plusieurs coachs complexes ;
- monde narratif persistant ;
- analyse émotionnelle avancée ;
- toutes les langues ;
- programme complet CECRL ;
- marketplace de contenus ;
- fonctionnalités sociales ;
- scoring prédictif sophistiqué.

---

## 19. Première vertical slice à construire

La première version fonctionnelle doit couvrir un parcours complet.

### Cas d’usage

Un professionnel comprend l’anglais mais manque de fluidité à l’oral.

Il doit préparer une réunion.

### Parcours

1. L’utilisateur décrit la réunion.
2. Odyssey lui pose deux ou trois questions.
3. Le Brain estime son besoin.
4. Une simulation courte est générée.
5. L’utilisateur répond.
6. Odyssey détecte les difficultés principales.
7. Le feedback sélectionne deux corrections.
8. L’utilisateur rejoue la scène.
9. Odyssey montre une amélioration.
10. Le profil et la progression sont mis à jour.

### Critère de succès

L’utilisateur doit pouvoir ressentir une amélioration tangible en moins de dix minutes.

---

## 20. Contrat produit fondamental

Toute future fonctionnalité doit démontrer sa contribution à au moins un des objectifs suivants :

- parler davantage ;
- parler plus spontanément ;
- mieux réussir une situation réelle ;
- mieux mémoriser ;
- diminuer l’appréhension ;
- améliorer la pertinence de la personnalisation ;
- rendre la progression plus visible.

Dans le cas contraire, elle ne doit pas être prioritaire.

---

## 21. Prochains documents

Ce document doit être complété par :

1. `user-model.md`
2. `session-orchestrator.md`
3. `learning-engine.md`
4. `conversation-engine.md`
5. `feedback-engine.md`
6. `progress-engine.md`
7. `memory-engine.md`
8. `mvp-user-flows.md`
9. `api-spec.md`
10. `evaluation-framework.md`

---

## 22. Décisions à valider ultérieurement

Les sujets suivants restent ouverts :

- la place exacte du CECRL ;
- le niveau de visibilité du score de confiance ;
- le degré de liberté des conversations ;
- le nombre de corrections idéal ;
- le fonctionnement de la mémoire longue durée ;
- le choix d’un coach unique ou personnalisable ;
- le rôle de la gamification ;
- la politique de conservation des données vocales ;
- le périmètre linguistique du lancement ;
- la cible précise de la première version commerciale.

---

## 23. Définition finale

> L’Odyssey Brain est un système de décision pédagogique personnalisé qui transforme les objectifs, le contexte, les performances et l’histoire d’un utilisateur en expériences conversationnelles utiles, progressives et capables d’augmenter durablement sa confiance à l’oral.
