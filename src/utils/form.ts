import { FieldError, FieldErrors } from "react-hook-form";

export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getNestedError = (errors: FieldErrors, path: string): string => {
  const result = path
    .split(".")
    .reduce<FieldErrors | FieldError | undefined>((obj, key) => {
      if (obj && typeof obj === "object" && key in obj) {
        return (obj as Record<string, unknown>)[key] as
          | FieldErrors
          | FieldError
          | undefined;
      }
      return undefined;
    }, errors);

  return (result as FieldError)?.message || "";
};
