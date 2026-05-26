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
  testimonialSchema,
  TestimonialSchema,
} from "@/schemas/testimonial.schema";
import { useUpdateTestimonialMutation } from "@/store/api/splits/testimonials";
import { getErrorInApiResult } from "@/utils/api";
import {
  alphabeticTextInputRegisterOptions,
  liveTextInputRegisterOptions,
  roleTextInputRegisterOptions,
} from "@/utils/form-normalizers";
import { zodResolver } from "@hookform/resolvers/zod";
import { SquarePen } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface UpdateTestimonialProps {
  id: string;
  content: string;
  rating: number;
  owner: {
    name: string;
    role: string;
    avatar: string;
  };
}

export function UpdateTestimonial({
  id,
  content,
  rating,
  owner,
}: UpdateTestimonialProps) {
  const [open, setOpen] = useState(false);

  const updateTestimonialForm = useForm<TestimonialSchema>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      content,
      rating,
      owner,
    },
    mode: "onChange",
  });

  const [updateTestimonial, { isLoading }] = useUpdateTestimonialMutation();

  const { formState, watch, setValue, handleSubmit, reset, register } =
    updateTestimonialForm;

  const avatarUrl = watch("owner.avatar");

  const onSubmit = async (data: TestimonialSchema) => {
    try {
      const payload = {
        id,
        ...data,
        rating: Number(data.rating),
      };

      const result = await updateTestimonial(payload);
      const error = getErrorInApiResult(result);

      if (error) {
        return toast.error(error);
      }

      if ("data" in result) {
        onUpdateSuccess();
      }
    } catch (error) {
      console.error("Unexpected error during testimonial update:", error);
      toast.error(
        "An unexpected error occurred while updating the testimonial",
      );
    }
  };

  const onUpdateSuccess = () => {
    const updatedValues = updateTestimonialForm.getValues();
    setOpen(false);
    reset(updatedValues);
    toast.success("Testimonial updated successfully");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          reset({ content, rating, owner });
        }
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTrigger asChild>
          <SquarePen className="cursor-pointer text-blue-500 hover:text-blue-700" />
        </DialogTrigger>

        <DialogContent className="z-50 bg-white dark:bg-gray-800 dark:text-white/90 sm:max-w-[425px] p-0 overflow-hidden [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0">
          <DialogHeader className="shrink-0 px-6 py-4 border-b bg-white dark:bg-gray-800">
            <DialogTitle>Edit Testimonial</DialogTitle>
            <DialogDescription>Edit the testimonial details.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto scrollbar-thin px-6 py-4 grid gap-4">
            {/* Content */}
            <div className="grid gap-3">
              <Label htmlFor="content">Content</Label>
              <Input
                id="content"
                placeholder="Content"
                {...register(
                  "content",
                  liveTextInputRegisterOptions("content", setValue),
                )}
              />
              {formState.errors.content && (
                <p className="text-sm text-red-500">
                  {formState.errors.content.message}
                </p>
              )}
            </div>

            {/* Rating */}
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

            {/* Owner Name */}
            <div className="grid gap-3">
              <Label htmlFor="owner.name">Owner Name</Label>
              <Input
                id="owner.name"
                placeholder="Owner name"
                {...register(
                  "owner.name",
                  alphabeticTextInputRegisterOptions("owner.name", setValue),
                )}
              />
              {formState.errors.owner?.name && (
                <p className="text-sm text-red-500">
                  {formState.errors.owner.name.message}
                </p>
              )}
            </div>

            {/* Owner Role */}
            <div className="grid gap-3">
              <Label htmlFor="owner.role">Owner Role</Label>
              <Input
                id="owner.role"
                placeholder="Owner role"
                {...register(
                  "owner.role",
                  roleTextInputRegisterOptions("owner.role", setValue),
                )}
              />
              {formState.errors.owner?.role && (
                <p className="text-sm text-red-500">
                  {formState.errors.owner.role.message}
                </p>
              )}
            </div>

            {/* Owner Avatar */}
            <div className="grid min-w-0 gap-3">
              <Label>Owner Avatar</Label>

              <div className="min-w-0 max-w-full overflow-hidden">
                <FileUploadDropzone
                  onUploaded={(url) => {
                    setValue("owner.avatar", url, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                />
              </div>

              {avatarUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    width={64}
                    height={64}
                    className="rounded-full border object-cover"
                  />
                </div>
              )}

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
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
