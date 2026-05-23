import { normalizeTextSpaces } from "@/utils/form-normalizers";
import { z } from "zod";

const strictString = z
  .string()
  .transform((value) => normalizeTextSpaces(value) as string)
  .pipe(z.string().min(1, "This field is required"));

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
