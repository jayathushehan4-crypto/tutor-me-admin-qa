import { z } from "zod";
import { normalizeTextSpaces } from "@/utils/form-normalizers";
import { FAQ_CATEGORY_VALUES } from "@/lib/faq-categories";

const requiredText = (message: string) =>
  z
    .string()
    .transform((value) => normalizeTextSpaces(value) as string)
    .pipe(z.string().min(1, message));

export const createFaqSchema = z.object({
  category: z
    .union([z.enum(FAQ_CATEGORY_VALUES), z.literal("")])
    .refine((value) => value !== "", "Category is required")
    .transform((value) => value as (typeof FAQ_CATEGORY_VALUES)[number]),
  question: requiredText("Question is required"),
  answer: requiredText("Answer is required"),
});

export type CreateFaqFormValues = z.input<typeof createFaqSchema>;
export type CreateFaqSchema = z.output<typeof createFaqSchema>;

export const initialFaqFormValues: CreateFaqFormValues = {
  category: "",
  question: "",
  answer: "",
};
