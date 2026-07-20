# decision-engine.md
# Odyssey Decision Engine
Version 0.1

## Mission

Le Decision Engine transforme chaque interaction utilisateur en une décision pédagogique optimale.

Il ne génère pas les conversations.
Il décide quelle est la meilleure prochaine action.

---

# Objectif d'optimisation

Chaque décision cherche à maximiser simultanément :

1. Progression réelle
2. Confiance
3. Pertinence par rapport à l'objectif
4. Mémorisation
5. Engagement

Aucune métrique ne peut être optimisée seule.

---

# Entrées

Le moteur reçoit :

- User Model
- Mémoire pertinente
- Historique récent
- Contexte actuel
- Objectif actif
- Temps disponible
- Performances de la session
- Intentions détectées

---

# Sorties

Le moteur produit :

- objectif de session
- type d'expérience
- niveau de difficulté
- niveau de soutien
- stratégie de correction
- stratégie de mémorisation
- prochaine mission

---

# Pipeline de décision

1. Comprendre l'intention
2. Évaluer le contexte
3. Identifier le besoin dominant
4. Prioriser les objectifs
5. Sélectionner une stratégie pédagogique
6. Générer le plan de session
7. Observer
8. Réévaluer en continu

---

# Priorités

Ordre de priorité :

1. Sécurité psychologique
2. Pertinence
3. Progression
4. Mémorisation
5. Variété
6. Gamification

---

# Matrice de décision

## Cas : confiance faible

Décisions :

- réduire la difficulté
- limiter les corrections
- augmenter les encouragements factuels
- proposer une victoire rapide

## Cas : utilisateur performant

Décisions :

- augmenter progressivement la difficulté
- ajouter de l'imprévu
- réduire les aides

## Cas : échéance proche

Exemple : réunion demain.

Décisions :

- abandonner le programme général
- créer une préparation ciblée
- favoriser les simulations

---

# Politique de correction

Le moteur choisit parmi :

- aucune correction
- reformulation implicite
- correction immédiate
- correction différée
- replay

Règle :

Ne jamais interrompre inutilement un utilisateur en pleine réussite.

---

# Politique de difficulté

La difficulté cible reste dans la zone de progression.

Trop facile :
→ ennui

Trop difficile :
→ perte de confiance

Objectif :
≈ 70 à 80 % de réussite.

---

# Détection de plateau

Signaux :

- mêmes erreurs depuis plusieurs sessions
- stagnation des capacités
- baisse d'engagement

Actions :

- changer le contexte
- changer le scénario
- changer le mode d'apprentissage

---

# Détection de surcharge

Si plusieurs signaux apparaissent :

- nombreuses hésitations
- réponses très courtes
- frustration exprimée

Alors :

- simplifier immédiatement
- diminuer les corrections
- terminer sur une réussite

---

# Détection de maîtrise

Une capacité est considérée maîtrisée lorsqu'elle est réussie dans plusieurs contextes différents.

Jamais après une seule réussite.

---

# Politique mémoire

Le moteur décide :

- ce qui doit être mémorisé
- ce qui doit être oublié
- ce qui nécessite confirmation

Principe :

La mémoire doit améliorer l'expérience, jamais devenir envahissante.

---

# Adaptation continue

Après chaque échange :

- recalcul du niveau de confiance
- recalcul des capacités
- recalcul de la difficulté optimale
- adaptation de la conversation

---

# Boucle de décision

Observer
→ Comprendre
→ Décider
→ Agir
→ Mesurer
→ Apprendre
→ Observer

Cette boucle est exécutée en continu pendant toute la session.

---

# Règles d'or

1. Une décision doit toujours être explicable.
2. Le Brain privilégie la réussite durable à la performance immédiate.
3. Le contexte réel prime sur le programme pédagogique.
4. La confiance n'est jamais sacrifiée pour gagner quelques points de progression.
5. Toute décision doit pouvoir être justifiée par des données observées.

---

# Décision finale

Chaque tour de décision retourne un objet structuré contenant :

- intention
- priorité
- stratégie
- activité choisie
- politique de feedback
- politique mémoire
- prochaine étape

Ce document définit la logique décisionnelle centrale d'Odyssey et constitue la propriété intellectuelle principale du moteur pédagogique.
