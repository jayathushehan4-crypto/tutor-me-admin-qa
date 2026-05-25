import { normalizeTextSpaces } from "@/utils/form-normalizers";
import { z } from "zod";

const requiredText = (message: string) =>
  z
    .string()
    .transform((value) => normalizeTextSpaces(value) as string)
    .pipe(z.string().min(1, message));

export const createInquirySchema = z.object({
  senderName: requiredText("Sender name is required"),
  senderEmail: requiredText("Sender email is required"),
  message: requiredText("Message is required"),
});

export type CreateInquirySchema = z.infer<typeof createInquirySchema>;

export const initialInquiryFormValues = {
  senderName: "",
  senderEmail: "",
  message: "",
};
