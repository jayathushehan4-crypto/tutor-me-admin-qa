import { normalizeTextSpaces } from "@/utils/form-normalizers";
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

const emailText = z
  .string()
  .transform((value) => normalizeTextSpaces(value) as string)
  .pipe(
    z
      .string()
      .min(1, "Sender email is required")
      .email("Invalid email address"),
  );

export const createInquirySchema = z.object({
  senderName: alphabeticText(
    "Sender name is required",
    "Sender name can contain letters and spaces only",
  ),
  senderEmail: emailText,
  message: requiredText("Message is required"),
});

export type CreateInquirySchema = z.infer<typeof createInquirySchema>;

export const initialInquiryFormValues = {
  senderName: "",
  senderEmail: "",
  message: "",
};
