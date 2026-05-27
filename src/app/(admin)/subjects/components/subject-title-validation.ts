import type { Subject } from "@/types/response-types";

export const DUPLICATE_SUBJECT_TITLE_MESSAGE = "Title already taken";

export const normalizeSubjectTitle = (title: string) =>
  title.trim().replace(/\s+/g, " ").toLowerCase();

export const hasDuplicateSubjectTitle = (
  subjects: Subject[],
  title: string,
  currentSubjectId?: string,
) => {
  const normalizedTitle = normalizeSubjectTitle(title);

  return subjects.some(
    (subject) =>
      subject.id !== currentSubjectId &&
      normalizeSubjectTitle(subject.title) === normalizedTitle,
  );
};

export const getSubjectTitleErrorMessage = (error: string) => {
  const normalizedError = error.toLowerCase();

  if (
    normalizedError.includes("duplicate") ||
    normalizedError.includes("already exists") ||
    normalizedError.includes("already taken")
  ) {
    return DUPLICATE_SUBJECT_TITLE_MESSAGE;
  }

  return error;
};
