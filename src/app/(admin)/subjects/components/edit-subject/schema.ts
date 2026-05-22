import { z } from "zod";

const noExtraSpaces = (field: string) =>
  z
    .string()
    .min(1, `${field} is required`)
    .refine((val) => val.trim().length > 0, {
      message: `${field} cannot be empty`,
    })
    .refine((val) => !/^\s|\s$/.test(val), {
      message: "No leading or trailing spaces allowed",
    })
    .refine((val) => !/\s{2,}/.test(val), {
      message: "Only one space is allowed between words",
    });

const subjectTitle = () =>
  noExtraSpaces("Title")
    .refine((val) => /^[\p{L}\p{N} ().&-]+$/u.test(val), {
      message:
        "Title can only include letters, numbers, spaces, dots, parentheses, hyphens, and ampersands",
    })
    .refine((val) => /\p{L}/u.test(val), {
      message: "Title must include at least one letter",
    });

export const updateSubjectSchema = z.object({
  title: subjectTitle(),
  description: noExtraSpaces("Description"),
});

export type UpdateSubjectSchema = z.infer<typeof updateSubjectSchema>;

export const initialFormValues = {
  title: "",
  description: "",
};
