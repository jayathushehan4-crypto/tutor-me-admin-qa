import { z } from "zod";
import { normalizeTextSpaces } from "@/utils/form-normalizers";
import {
  FAQ_CATEGORY_VALUES,
  DEFAULT_FAQ_CATEGORY,
} from "@/lib/faq-categories";

const requiredText = (message: string) =>
  z
    .string()
    .transform((value) => normalizeTextSpaces(value) as string)
    .pipe(z.string().min(1, message));

export const createFaqSchema = z.object({
  category: z.enum(FAQ_CATEGORY_VALUES),
  question: requiredText("Question is required"),
  answer: requiredText("Answer is required"),
});

export type CreateFaqSchema = z.infer<typeof createFaqSchema>;

export const initialFaqFormValues: CreateFaqSchema = {
  category: DEFAULT_FAQ_CATEGORY,
  question: "",
  answer: "",
};
