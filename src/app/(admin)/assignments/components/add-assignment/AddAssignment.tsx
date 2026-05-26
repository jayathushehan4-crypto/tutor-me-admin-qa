"use client";

import { Button } from "@/components/ui/button/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { useCreateAssignmentMutation } from "@/store/api/splits/tuition-assignments";
import { useFetchTutorsQuery } from "@/store/api/splits/tutors";
import { getErrorInApiResult } from "@/utils/api";
import { sortBySchoolGradeOrder } from "@/utils/grade-filter-order";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  assignmentSchema,
  CreateAssignmentSchema,
  initialFormValues,
} from "./schema";

export function AddAssignment() {
  const [open, setOpen] = useState(false);
  const [createAssignment, { isLoading }] = useCreateAssignmentMutation();

  const { data: gradesData, isLoading: gradesLoading } = useFetchGradesQuery(
    {},
  );
  const { data: tutorsData, isLoading: tutorsLoading } = useFetchTutorsQuery(
    {},
  );

  const form = useForm<CreateAssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: initialFormValues,
    mode: "onChange",
  });

  const { formState, reset, setValue, watch } = form;

  const onSubmit = async (data: CreateAssignmentSchema) => {
    const result = await createAssignment({
      ...data,
      assignmentPrice: String(data.assignmentPrice),
    });

    const error = getErrorInApiResult(result);
    if (error) return toast.error(error);

    if ("data" in result) onSuccess();
  };

  const onSuccess = () => {
    reset(initialFormValues);
    toast.success("Assignment added successfully");
    setOpen(false);
  };
  const [currency, setCurrency] = useState<"Rs" | "$">("Rs");

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          reset(initialFormValues);
        }
      }}
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-blue-700 text-white hover:bg-blue-500"
          >
            Add Assignment
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px] bg-white z-50 dark:bg-gray-800 dark:text-white/90">
          <DialogHeader>
            <DialogTitle>Add Assignment</DialogTitle>
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
                    <SelectItem value="Rs">Rs</SelectItem>
                    <SelectItem value="$">$</SelectItem>
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
                onValueChange={(value) => setValue("gradeId", value)}
                value={watch("gradeId")}
                disabled={gradesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectGroup>
                    <SelectLabel>Grades</SelectLabel>
                    {sortBySchoolGradeOrder(gradesData?.results || []).map(
                      (grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.title}
                        </SelectItem>
                      ),
                    )}
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
              <Button
                variant="outline"
                onClick={() => {
                  reset(initialFormValues);
                }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-blue-700 text-white hover:bg-blue-500"
              isLoading={isLoading}
              onClick={form.handleSubmit(onSubmit)}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
