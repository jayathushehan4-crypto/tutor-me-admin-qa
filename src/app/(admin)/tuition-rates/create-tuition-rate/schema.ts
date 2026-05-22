import { trimText } from "@/utils/form-normalizers";
import { z } from "zod";

const numericString = z
  .string()
  .transform((value) => trimText(value) as string)
  .pipe(
    z
      .string()
      .min(1, "Rate is required")
      .refine(
        (s) => {
          const cleaned = s.replace(/,/g, "").trim();
          if (cleaned === "") return false;
          if (!/^\d+(\.\d+)?$/.test(cleaned)) return false;
          const n = Number(cleaned);
          return !Number.isNaN(n) && n >= 0;
        },
        {
          message:
            "Rate must be a non-negative number using digits and an optional decimal point",
        },
      ),
  );

const rateObject = z
  .object({
    minimumRate: numericString,
    maximumRate: numericString,
  })
  .refine(
    (data) => {
      const min = Number(data.minimumRate.replace(/,/g, ""));
      const max = Number(data.maximumRate.replace(/,/g, ""));
      return min < max;
    },
    {
      message: "Minimum rate must be less than maximum rate",
      path: ["maximumRate"],
    },
  );

export const createTuitionSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),

  universityStudentsRate: rateObject,
  partTimeTutorRate: rateObject,
  fullTimeTutorRate: rateObject,
  moeTeacherRate: rateObject,
});

export type CreateTuitionSchema = z.infer<typeof createTuitionSchema>;

export const initialFormValues: CreateTuitionSchema = {
  subject: "",
  grade: "",
  universityStudentsRate: { minimumRate: "", maximumRate: "" },
  partTimeTutorRate: { minimumRate: "", maximumRate: "" },
  fullTimeTutorRate: { minimumRate: "", maximumRate: "" },
  moeTeacherRate: { minimumRate: "", maximumRate: "" },
};
