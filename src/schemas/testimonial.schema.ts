import { normalizeTextSpaces, trimText } from "@/utils/form-normalizers";
import { z } from "zod";

const requiredText = (message: string) =>
  z
    .string()
    .transform((value) => normalizeTextSpaces(value) as string)
    .pipe(z.string().min(1, message));

const alphabeticText = (requiredMessage: string, invalidMessage: string) =>
  z
    .string()
    .transform((value) => normalizeTextSpaces(value) as string)
    .pipe(
      z
        .string()
        .min(1, requiredMessage)
        .regex(/^[A-Za-z]+(?: [A-Za-z]+)*$/, invalidMessage),
    );

export const testimonialSchema = z.object({
  content: requiredText("Content is required"),
  rating: z.number().min(1, "Rating is required"), // number instead of string
  owner: z.object({
    name: alphabeticText(
      "Owner name is required",
      "Owner name can contain letters and spaces only",
    ),
    role: requiredText("Owner role is required"),
    avatar: z
      .string()
      .transform((value) => trimText(value) as string)
      .pipe(z.string().url("Avatar is required.")),
  }),
});

export type TestimonialSchema = z.infer<typeof testimonialSchema>;

export const initialFormValues: TestimonialSchema = {
  content: "",
  rating: 0,
  owner: {
    name: "",
    role: "",
    avatar: "",
  },
};
