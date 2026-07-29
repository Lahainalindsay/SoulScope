export type GuidedScanRoute =
  | `/scan/question/${number}`
  | "/scan/analyzing";

export function nextGuidedScanRoute(completedStep: number, totalSteps: number): GuidedScanRoute {
  if (!Number.isInteger(completedStep) || completedStep < 1) {
    throw new Error("A guided scan step must be a positive integer.");
  }
  if (!Number.isInteger(totalSteps) || totalSteps < 1 || completedStep > totalSteps) {
    throw new Error("The guided scan step is outside the configured workflow.");
  }

  return completedStep === totalSteps
    ? "/scan/analyzing"
    : `/scan/question/${completedStep + 1}`;
}

export function firstIncompleteGuidedScanStep(
  completedQuestionIds: readonly string[],
  orderedQuestionIds: readonly string[],
): number | null {
  const completed = new Set(completedQuestionIds);
  const missingIndex = orderedQuestionIds.findIndex((questionId) => !completed.has(questionId));
  return missingIndex === -1 ? null : missingIndex + 1;
}
