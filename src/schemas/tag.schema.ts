import { z } from "zod";

const strictString = z
  .string()
  .min(1, "This field is required")
  .refine((val) => val === val.trim(), {
    message: "Leading or trailing spaces are not allowed",
  })
  .refine((val) => !/\s{2,}/.test(val), {
    message: "Multiple consecutive spaces are not allowed",
  });

const tagTitle = strictString.refine(
  (val) => /^[A-Za-z0-9 &\-/()]+$/.test(val),
  {
    message:
      "Title can only include letters, numbers, spaces, &, -, /, (, and )",
  },
);

export const tagSchema = z.object({
  name: tagTitle,
  description: strictString,
});

export type TagSchema = z.infer<typeof tagSchema>;

export const initialFormValues = {
  name: "",
  description: "",
};
