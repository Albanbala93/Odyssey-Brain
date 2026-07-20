import type { CapabilityDefinition } from "./types";

/**
 * The fixed MVP capability catalogue (ODYSSEY_MASTER_PROMPT_CODEX.md §5.10).
 * Missions reference these by slug; the decision engine and debrief engine
 * update per-user progress against them.
 */
export const CAPABILITIES: CapabilityDefinition[] = [
  {
    id: "cap-introduce-yourself",
    slug: "introduce_yourself",
    labelFr: "Se présenter avec aisance",
    descriptionFr: "Se présenter de façon claire et naturelle face à un interlocuteur.",
  },
  {
    id: "cap-describe-role",
    slug: "describe_role",
    labelFr: "Décrire son rôle",
    descriptionFr: "Expliquer ce que l'on fait professionnellement de façon concise.",
  },
  {
    id: "cap-present-idea",
    slug: "present_idea",
    labelFr: "Présenter une idée",
    descriptionFr: "Exposer une idée ou une recommandation avec une structure claire.",
  },
  {
    id: "cap-give-opinion",
    slug: "give_opinion",
    labelFr: "Donner son avis",
    descriptionFr: "Exprimer et justifier un point de vue.",
  },
  {
    id: "cap-ask-clarification",
    slug: "ask_clarification",
    labelFr: "Demander une clarification",
    descriptionFr: "Demander poliment une précision quand on n'a pas compris.",
  },
  {
    id: "cap-participate-meeting",
    slug: "participate_meeting",
    labelFr: "Prendre la parole en réunion",
    descriptionFr: "Intervenir de façon pertinente pendant une réunion.",
  },
  {
    id: "cap-disagree-politely",
    slug: "disagree_politely",
    labelFr: "Exprimer un désaccord poliment",
    descriptionFr: "Contester une idée sans être conflictuel.",
  },
  {
    id: "cap-handle-objections",
    slug: "handle_objections",
    labelFr: "Gérer une objection",
    descriptionFr: "Répondre calmement à une objection ou une critique.",
  },
  {
    id: "cap-network-informally",
    slug: "network_informally",
    labelFr: "Réseauter de façon informelle",
    descriptionFr: "Engager une conversation informelle avec un inconnu.",
  },
  {
    id: "cap-present-with-structure",
    slug: "present_with_structure",
    labelFr: "Présenter son travail avec structure",
    descriptionFr: "Structurer une présentation de son travail ou d'un projet.",
  },
  {
    id: "cap-answer-interview",
    slug: "answer_interview_questions",
    labelFr: "Répondre à des questions d'entretien",
    descriptionFr: "Répondre de façon structurée à une question d'entretien d'embauche.",
  },
  {
    id: "cap-solve-travel-problem",
    slug: "solve_travel_problem",
    labelFr: "Résoudre un problème en voyage",
    descriptionFr: "Gérer un imprévu pratique (hôtel, transport, restaurant) en anglais.",
  },
];

export function getCapabilityBySlug(slug: string): CapabilityDefinition | undefined {
  return CAPABILITIES.find((c) => c.slug === slug);
}
