"use client";

import FileUploadDropzone from "@/components/fileUploader";
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
import { StarRating } from "@/components/ui/StarRating";
import {
  initialFormValues,
  TestimonialSchema,
  testimonialSchema,
} from "@/schemas/testimonial.schema";
import { useCreateTestimonialMutation } from "@/store/api/splits/testimonials";
import { getErrorInApiResult } from "@/utils/api";
import { liveTextInputRegisterOptions } from "@/utils/form-normalizers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export function AddTestimonial() {
  const [open, setOpen] = useState(false);
  const [createTestimonial, { isLoading }] = useCreateTestimonialMutation();

  const createTestimonialForm = useForm<TestimonialSchema>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: initialFormValues,
    mode: "onChange",
  });

  const { formState, watch, setValue, handleSubmit, reset, register } =
    createTestimonialForm;

  const avatarUrl = watch("owner.avatar");

  const onSubmit = async (data: TestimonialSchema) => {
    try {
      const payload = {
        ...data,
        rating: Number(data.rating),
      };

      const result = await createTestimonial(payload);
      const error = getErrorInApiResult(result);

      if (error) {
        return toast.error(error);
      }

      if ("data" in result) {
        onRegisterSuccess();
      }
    } catch (error) {
      console.error("Unexpected error during testimonial creation:", error);
      toast.error(
        "An unexpected error occurred while creating the testimonial",
      );
    }
  };

  const onRegisterSuccess = () => {
    reset();
    toast.success("Testimonial created successfully");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          reset();
        }
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-blue-700 text-white hover:bg-blue-500"
          >
            Add Testimonial
          </Button>
        </DialogTrigger>

        <DialogContent className="z-50 bg-white dark:bg-gray-800 dark:text-white/90 sm:max-w-[425px] p-0 overflow-hidden [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0">
          <DialogHeader className="shrink-0 px-6 py-4 border-b bg-white dark:bg-gray-800">
            <DialogTitle>Add Testimonial</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new testimonial.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-6 py-4 grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="content">Content</Label>
              <Input
                id="content"
                placeholder="Content"
                {...register(
                  "content",
                  liveTextInputRegisterOptions(
                    "content",
                    setValue,
                    formState.isSubmitted,
                  ),
                )}
              />
              {formState.errors.content && (
                <p className="text-sm text-red-500">
                  {formState.errors.content.message}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex items-center space-x-2">
                <StarRating
                  value={watch("rating")}
                  onChange={(val) => setValue("rating", val)}
                />
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {watch("rating")}/5
                </span>
              </div>
              {formState.errors.rating && (
                <p className="text-sm text-red-500">
                  {formState.errors.rating.message}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="owner.name">Owner Name</Label>
              <Input
                id="owner.name"
                placeholder="Owner name"
                {...register(
                  "owner.name",
                  liveTextInputRegisterOptions(
                    "owner.name",
                    setValue,
                    formState.isSubmitted,
                  ),
                )}
              />
              {formState.errors.owner?.name && (
                <p className="text-sm text-red-500">
                  {formState.errors.owner.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="owner.role">Owner Role</Label>
              <Input
                id="owner.role"
                placeholder="Owner role"
                {...register(
                  "owner.role",
                  liveTextInputRegisterOptions(
                    "owner.role",
                    setValue,
                    formState.isSubmitted,
                  ),
                )}
              />
              {formState.errors.owner?.role && (
                <p className="text-sm text-red-500">
                  {formState.errors.owner.role.message}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label>Owner Avatar</Label>

              <FileUploadDropzone
                onUploaded={(url) => {
                  setValue("owner.avatar", url, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
              />

              {avatarUrl ? (
                <p className="break-all text-xs text-gray-500 dark:text-gray-400">
                  Uploaded URL: {avatarUrl}
                </p>
              ) : null}

              {formState.errors.owner?.avatar && (
                <p className="text-sm text-red-500">
                  {formState.errors.owner.avatar.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 px-6 py-4 border-t bg-white dark:bg-gray-800">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button
              type="submit"
              className="bg-blue-700 text-white hover:bg-blue-500"
              isLoading={isLoading}
              onClick={handleSubmit(onSubmit)}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
