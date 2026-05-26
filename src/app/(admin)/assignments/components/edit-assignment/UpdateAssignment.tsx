"use client";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetchGradesQuery } from "@/store/api/splits/grades";
import {
  useFetchAssignmentByIdQuery,
  useUpdateAssignmentMutation,
} from "@/store/api/splits/tuition-assignments";
import { useFetchTutorsQuery } from "@/store/api/splits/tutors";
import { Grade } from "@/types/response-types";
import { sortBySchoolGradeOrder } from "@/utils/grade-filter-order";
import { zodResolver } from "@hookform/resolvers/zod";
import { isRejectedWithValue } from "@reduxjs/toolkit";
import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { updateAssignmentSchema, UpdateAssignmentSchema } from "./schema";

interface UpdateAssignmentProps {
  id: string;
}

export function UpdateAssignment({ id }: UpdateAssignmentProps) {
  const [open, setOpen] = useState(false);
  const [dialogKey] = useState(0);

  const { data, isLoading } = useFetchAssignmentByIdQuery(id);

  const { data: gradesData, isLoading: gradesLoading } = useFetchGradesQuery(
    {},
  );
  const { data: tutorsData, isLoading: tutorsLoading } = useFetchTutorsQuery(
    {},
  );

  const form = useForm<UpdateAssignmentSchema>({
    resolver: zodResolver(updateAssignmentSchema),
    defaultValues: {
      title: "",
      assignmentNumber: "",
      address: "",
      duration: "",
      assignmentPrice: "",
      gradeId: "",
      tutorId: "",
    },
    mode: "onChange",
  });

  const { formState, reset, setValue, watch } = form;

  const [updateAssignment, { isLoading: isUpdating }] =
    useUpdateAssignmentMutation();

  useEffect(() => {
    if (data) {
      const gradeIdValue =
        typeof data.gradeId === "string"
          ? data.gradeId
          : ((data.gradeId as { id?: string })?.id ?? "");
      const tutorIdValue =
        typeof data.tutorId === "string"
          ? data.tutorId
          : ((data.tutorId as { id?: string })?.id ?? "");

      reset({
        title: data.title || "",
        assignmentNumber: data.assignmentNumber || "",
        address: data.address || "",
        duration: data.duration || "",
        assignmentPrice: data.assignmentPrice?.toString() || "",
        gradeId: gradeIdValue,
        tutorId: tutorIdValue,
      });
    }
  }, [data, reset]);

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && data) {
      const gradeIdValue =
        typeof data.gradeId === "string"
          ? data.gradeId
          : ((data.gradeId as { id?: string })?.id ?? "");
      const tutorIdValue =
        typeof data.tutorId === "string"
          ? data.tutorId
          : ((data.tutorId as { id?: string })?.id ?? "");

      reset({
        title: data.title || "",
        assignmentNumber: data.assignmentNumber || "",
        address: data.address || "",
        duration: data.duration || "",
        assignmentPrice: data.assignmentPrice?.toString() || "",
        gradeId: gradeIdValue,
        tutorId: tutorIdValue,
      });
    }
  };

  const handleCancel = () => {
    if (data) {
      const gradeIdValue =
        typeof data.gradeId === "string"
          ? data.gradeId
          : ((data.gradeId as { id?: string })?.id ?? "");
      const tutorIdValue =
        typeof data.tutorId === "string"
          ? data.tutorId
          : ((data.tutorId as { id?: string })?.id ?? "");

      reset({
        title: data.title || "",
        assignmentNumber: data.assignmentNumber || "",
        address: data.address || "",
        duration: data.duration || "",
        assignmentPrice: data.assignmentPrice?.toString() || "",
        gradeId: gradeIdValue,
        tutorId: tutorIdValue,
      });
    }
    setOpen(false);
  };

  const onSubmit = async (values: UpdateAssignmentSchema) => {
    try {
      await updateAssignment({
        id,
        ...values,
        assignmentPrice: String(values.assignmentPrice),
      }).unwrap();

      toast.success("Assignment updated successfully");
      setOpen(false);
      reset();
    } catch (error) {
      if (isRejectedWithValue(error)) {
        type ErrorPayload = {
          data?: { message?: string };
          payload?: { message?: string };
        };
        const err = error as ErrorPayload;
        const errorMessage =
          err.data?.message ||
          err.payload?.message ||
          "Failed to update assignment";
        toast.error(errorMessage);
      }
    }
  };
  const [currency, setCurrency] = useState<"Rs" | "$">("Rs");

  if (isLoading) return <p>Loading...</p>;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTrigger asChild>
          <SquarePen className="cursor-pointer text-blue-500 hover:text-blue-700" />
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px] bg-white z-50 dark:bg-gray-800 dark:text-white/90">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Update the assignment details</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Title */}
            <div className="grid gap-3">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
              {formState.errors.title && (
                <p className="text-sm text-red-500">
                  {formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Assignment Number */}
            <div className="grid gap-3">
              <Label htmlFor="assignmentNumber">Assignment Number</Label>
              <Input
                id="assignmentNumber"
                {...form.register("assignmentNumber")}
              />
              {formState.errors.assignmentNumber && (
                <p className="text-sm text-red-500">
                  {formState.errors.assignmentNumber.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="grid gap-3">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...form.register("address")} />
              {formState.errors.address && (
                <p className="text-sm text-red-500">
                  {formState.errors.address.message}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="grid gap-3">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" {...form.register("duration")} />
              {formState.errors.duration && (
                <p className="text-sm text-red-500">
                  {formState.errors.duration.message}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="grid gap-3">
              <Label htmlFor="assignmentPrice">Price</Label>

              <div className="flex">
                {/* Currency Selector */}
                <Select
                  value={currency}
                  onValueChange={(val) => setCurrency(val as "Rs" | "$")}
                >
                  <SelectTrigger className="w-[90px] rounded-r-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Currency</SelectLabel>
                      <SelectItem value="Rs">Rs</SelectItem>
                      <SelectItem value="$">$</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Price Input */}
                <Input
                  id="assignmentPrice"
                  type="number"
                  {...form.register("assignmentPrice")}
                  className="rounded-l-none"
                  placeholder={`Enter amount in ${currency}`}
                />
              </div>

              {formState.errors.assignmentPrice && (
                <p className="text-sm text-red-500">
                  {formState.errors.assignmentPrice.message}
                </p>
              )}
            </div>

            {/* Grade Select */}
            <div className="grid gap-3">
              <Label htmlFor="gradeId">Grade</Label>
              <Select
                key={`grade-${dialogKey}`}
                onValueChange={(value) =>
                  setValue("gradeId", value, { shouldDirty: true })
                }
                value={watch("gradeId") || ""}
                disabled={gradesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectGroup>
                    <SelectLabel>Grades</SelectLabel>
                    {sortBySchoolGradeOrder(
                      (gradesData?.results || []) as Grade[],
                    ).map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              {formState.errors.gradeId && (
                <p className="text-sm text-red-500">
                  {formState.errors.gradeId.message}
                </p>
              )}
            </div>

            {/* Tutor Select */}
            <div className="grid gap-3">
              <Label htmlFor="tutorId">Tutor</Label>
              <Select
                key={`tutor-${dialogKey}`}
                onValueChange={(value) => setValue("tutorId", value)}
                value={watch("tutorId")}
                disabled={tutorsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tutor" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectGroup>
                    <SelectLabel>Tutors</SelectLabel>
                    {tutorsData?.results?.map((tutor) => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {tutor.fullName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              {formState.errors.tutorId && (
                <p className="text-sm text-red-500">
                  {formState.errors.tutorId.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="bg-blue-700 text-white hover:bg-blue-500"
              isLoading={isUpdating}
              onClick={form.handleSubmit(onSubmit)}
              disabled={!formState.isDirty || isUpdating}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
