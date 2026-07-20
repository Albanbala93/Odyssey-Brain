# user-model.md
## Odyssey User Model v0.1

## Objectif
Le User Model est la source de vérité de l'utilisateur. Il décrit qui il est, ce qu'il veut accomplir, comment il apprend et comment il progresse.

## Modules
- identity_profile
- language_profile
- goal_profile
- context_profile
- confidence_profile
- learning_profile
- capability_map
- error_patterns
- expression_memory
- relationship_memory
- session_history
- consent_profile

## identity_profile
Informations déclarées : prénom, langue maternelle, langue cible, métier, secteur, fuseau horaire.

## language_profile
Chaque compétence est indépendante (0-100) :
- listening
- speaking
- reading
- writing
- pronunciation
- vocabulary
- grammar
- fluency

Le CECRL est calculé à partir de ces scores.

## goal_profile
Chaque objectif contient :
- type
- priorité
- échéance
- confiance
- statut

## context_profile
Situations prioritaires :
- réunions
- voyages
- entretien
- restaurant
- conférences
- vie quotidienne

## confidence_profile
Mesure de la confiance selon le contexte :
- face à une personne
- groupe
- téléphone
- visioconférence
- client
- inconnu

## learning_profile
Préférences observées :
- durée idéale
- voix ou texte
- fréquence
- style de feedback
- moments de la journée

## capability_map
Chaque capacité possède :
- état
- score
- dernière utilisation
- fréquence
- confiance

États :
- découverte
- acquisition
- fonctionnelle
- solide
- spontanée

## error_patterns
Pour chaque erreur :
- catégorie
- fréquence
- gravité
- contexte
- dernière apparition

## expression_memory
Expressions classées :
- découvertes
- en apprentissage
- maîtrisées
- fragiles

## relationship_memory
Souvenirs utiles :
- événements
- projets
- préférences
- réussites
- informations partagées volontairement

Chaque souvenir contient :
- source
- confiance
- consentement
- pertinence

## session_history
Historique :
- date
- durée
- objectif
- contexte
- corrections
- progression
- satisfaction

## consent_profile
Gestion des consentements :
- stockage voix
- mémoire personnelle
- analytics

## Règles
Chaque donnée possède :
- source
- date
- confiance
- possibilité de révision

Le profil est vivant et évolue après chaque session.

## MVP
Modules implémentés :
- identity_profile
- language_profile
- goal_profile
- confidence_profile
- capability_map
- error_patterns
- session_history

Les autres seront enrichis progressivement.

## Contrat
Le User Model est l'unique source de vérité de l'utilisateur.
Tous les moteurs du Brain le consultent.
Aucun moteur ne conserve une copie indépendante.
