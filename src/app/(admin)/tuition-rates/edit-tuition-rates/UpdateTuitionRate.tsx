"use client";

import Select from "@/components/form/Select";
import { Button } from "@/components/ui/button/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useFetchGradesQuery } from "@/store/api/splits/grades";
import { useFetchSubjectsQuery } from "@/store/api/splits/subjects";
import { useUpdateTuitionRateMutation } from "@/store/api/splits/tuition-rates";
import { getErrorInApiResult } from "@/utils/api";
import { noWhitespaceInputRegisterOptions } from "@/utils/form-normalizers";

import { zodResolver } from "@hookform/resolvers/zod";
import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { UpdateTuitionSchema, updateTuitionSchema } from "./schema";

interface UpdateTuitionRateProps {
  id: string;
  subject: string;
  grade: string;
  universityStudentsRate: { minimumRate: string; maximumRate: string };
  partTimeTutorRate: { minimumRate: string; maximumRate: string };
  fullTimeTutorRate: { minimumRate: string; maximumRate: string };
  moeTeacherRate: { minimumRate: string; maximumRate: string };
}

export function UpdateTuitionRate({
  id,
  subject,
  grade,
  universityStudentsRate,
  partTimeTutorRate,
  fullTimeTutorRate,
  moeTeacherRate,
}: UpdateTuitionRateProps) {
  const [open, setOpen] = useState(false);

  const {
    reset,
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateTuitionSchema>({
    resolver: zodResolver(updateTuitionSchema),
    defaultValues: {
      subject: "",
      grade: "",
      universityStudentsRate: { minimumRate: "", maximumRate: "" },
      partTimeTutorRate: { minimumRate: "", maximumRate: "" },
      fullTimeTutorRate: { minimumRate: "", maximumRate: "" },
      moeTeacherRate: { minimumRate: "", maximumRate: "" },
    },
    mode: "onChange",
  });

  const [updateTuition, { isLoading }] = useUpdateTuitionRateMutation();

  const { data: subjectsData, isLoading: isSubjectsLoading } =
    useFetchSubjectsQuery({ page: 1, limit: 50 });
  const { data: gradesData, isLoading: isGradesLoading } = useFetchGradesQuery({
    page: 1,
    limit: 50,
  });

  const subjectOptions =
    subjectsData?.results?.map((s) => ({ value: s.id, label: s.title })) || [];
  const gradeOptions =
    gradesData?.results?.map((g) => ({ value: g.id, label: g.title })) || [];

  const displayLoading = isSubjectsLoading || isGradesLoading;

  useEffect(() => {
    if (open) {
      reset({
        subject: subject || "",
        grade: grade || "",
        universityStudentsRate,
        partTimeTutorRate,
        fullTimeTutorRate,
        moeTeacherRate,
      });
    }
  }, [
    open,
    subject,
    grade,
    universityStudentsRate,
    partTimeTutorRate,
    fullTimeTutorRate,
    moeTeacherRate,
    reset,
  ]);

  const onSubmit = async (data: UpdateTuitionSchema) => {
    const payload = {
      id,
      subject: data.subject,
      grade: data.grade,
      universityStudentsRate: data.universityStudentsRate,
      partTimeTutorRate: data.partTimeTutorRate,
      fullTimeTutorRate: data.fullTimeTutorRate,
      moeTeacherRate: data.moeTeacherRate,
    };

    const result = await updateTuition(payload);
    const error = getErrorInApiResult(result);
    if (error) return toast.error(error);

    if ("data" in result) {
      toast.success("Tuition rate updated successfully");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SquarePen className="cursor-pointer text-blue-500 hover:text-blue-700" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] bg-white z-9999 dark:bg-gray-800 dark:text-white/90 p-0 overflow-hidden [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0">
        <DialogHeader className="shrink-0 px-6 py-4 border-b bg-white dark:bg-gray-800">
          <DialogTitle>Edit Tuition Rate</DialogTitle>
          <DialogDescription>
            Update the tuition rate information.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-6 py-6 grid gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid gap-1">
            <Label>Grade</Label>
            <Controller
              name="grade"
              control={control}
              render={({ field }) => (
                <Select
                  options={gradeOptions}
                  value={field.value || undefined}
                  onChange={field.onChange}
                  placeholder="Select grade"
                />
              )}
            />
            {errors.grade && (
              <p className="text-red-500 text-sm">{errors.grade.message}</p>
            )}
          </div>

          <div className="grid gap-1">
            <Label>Subject</Label>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <Select
                  options={subjectOptions}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select subject"
                  className="w-full"
                />
              )}
            />

            {errors.subject && (
              <p className="text-red-500 text-sm">{errors.subject.message}</p>
            )}
          </div>

          {(
            [
              "universityStudentsRate",
              "partTimeTutorRate",
              "fullTimeTutorRate",
              "moeTeacherRate",
            ] as const
          ).map((key) => (
            <div key={key} className="grid gap-2">
              <Label>
                {key === "universityStudentsRate"
                  ? "University Students Rate"
                  : key === "partTimeTutorRate"
                    ? "Part-Time Tutor Rate"
                    : key === "fullTimeTutorRate"
                      ? "Full-Time Tutor Rate"
                      : "Ex/Current MOE Teacher Rate"}
              </Label>

              <Input
                placeholder="Minimum Rate"
                {...register(
                  `${key}.minimumRate` as const,
                  noWhitespaceInputRegisterOptions(
                    `${key}.minimumRate` as const,
                    setValue,
                  ),
                )}
              />
              {errors[key]?.minimumRate && (
                <p className="text-red-500 text-sm">
                  {errors[key]?.minimumRate?.message}
                </p>
              )}

              <Input
                placeholder="Maximum Rate"
                {...register(
                  `${key}.maximumRate` as const,
                  noWhitespaceInputRegisterOptions(
                    `${key}.maximumRate` as const,
                    setValue,
                  ),
                )}
              />
              {errors[key]?.maximumRate && (
                <p className="text-red-500 text-sm">
                  {errors[key]?.maximumRate?.message}
                </p>
              )}
            </div>
          ))}

          <DialogFooter className="shrink-0 px-6 py-4 border-t bg-white dark:bg-gray-800">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-blue-700 text-white hover:bg-blue-500"
              isLoading={isLoading}
              disabled={displayLoading || !isDirty}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
