import type { TuitionRates } from "@/types/response-types";

export const DUPLICATE_TUITION_RATE_MESSAGE =
  "This subject and grade combination already has a rate configured. Please edit the existing entry to make changes";

export const hasDuplicateTuitionRateCombination = (
  tuitionRates: TuitionRates[],
  gradeId: string,
  subjectId: string,
  currentTuitionRateId?: string,
) =>
  tuitionRates.some(
    (rate) =>
      rate.id !== currentTuitionRateId &&
      String(rate.grade?.id) === gradeId &&
      String(rate.subject?.id) === subjectId,
  );

export const getTuitionRateErrorMessage = (error: string) => {
  const normalizedError = error.toLowerCase();

  if (
    normalizedError.includes("duplicate") ||
    normalizedError.includes("already exists") ||
    normalizedError.includes("already has") ||
    normalizedError.includes("combination")
  ) {
    return DUPLICATE_TUITION_RATE_MESSAGE;
  }

  return error;
};
