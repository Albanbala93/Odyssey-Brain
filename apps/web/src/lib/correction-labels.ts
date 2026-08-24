/** French labels for CorrectionCategory (ai/schemas.ts) — kept here rather than imported since TurnCorrection/RecurringError.category are typed as a plain string at the domain layer. Falls back to "Grammaire" for anything unrecognized. */
export const CORRECTION_CATEGORY_LABEL_FR: Record<string, string> = {
  verb_tense: "Conjugaison",
  preposition: "Préposition",
  word_order: "Ordre des mots",
  article: "Article",
  subject_verb_agreement: "Accord sujet-verbe",
  vocabulary: "Vocabulaire",
  other: "Grammaire",
};

export function correctionCategoryLabelFr(category: string): string {
  return CORRECTION_CATEGORY_LABEL_FR[category] ?? "Grammaire";
}
