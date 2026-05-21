/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import FileUploadDropzone from "@/components/fileUploader";
import { Button } from "@/components/ui/button/Button";
import DatePicker from "@/components/ui/DatePicker";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUserMutation } from "@/store/api/splits/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { SquarePen, X } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  initialFormValues,
  updateUserSchema,
  UpdateUserSchema,
} from "./schema";

type UserRole = "tutor" | "admin";
type UserStatus = "pending" | "approved" | "rejected" | "suspended";

const EMAIL_IMMUTABLE_MESSAGE = "Email cannot be modified after user creation.";

const getMinimumAdultBirthDate = () => {
  const today = new Date();
  return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
};

interface UpdateUserProps {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phoneNumber?: string;
  birthday?: string;
  status: UserStatus;
  gender?: "male" | "female";
  avatar?: string;
}

const normalizeTextInput = (value: string) => {
  return value.trimStart().replace(/\s{2,}/g, " ");
};

const getFormValues = (props: UpdateUserProps): UpdateUserSchema => ({
  ...initialFormValues,
  ...props,
  birthday: props.birthday
    ? new Date(props.birthday).toISOString().substring(0, 10)
    : "",
  gender: props.gender || initialFormValues.gender,
  avatar: props.avatar || "",
});

export function UpdateUser(props: UpdateUserProps) {
  const [open, setOpen] = useState(false);
  const maxUserBirthday = getMinimumAdultBirthDate();
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    props.avatar || null,
  );

  const form = useForm<UpdateUserSchema>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: getFormValues(props),
    mode: "onChange",
  });

  const { formState, register, setValue, handleSubmit, reset } = form;

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof UpdateUserSchema,
  ) => {
    let value = e.target.value;

    if (field === "phoneNumber") {
      value = value.replace(/\D/g, "").slice(0, 10);
    } else {
      value = normalizeTextInput(value);
    }

    setValue(field, value as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleTextBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    field: keyof UpdateUserSchema,
  ) => {
    const value =
      field === "phoneNumber"
        ? e.target.value.replace(/\D/g, "").slice(0, 10)
        : normalizeTextInput(e.target.value).trim();

    setValue(field, value as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  useEffect(() => {
    if (open) {
      reset(getFormValues(props));
      setPreviewUrl(props.avatar || null);
    }
  }, [open, props, reset]);

  function handleSelect<T extends keyof UpdateUserSchema>(key: T, val: string) {
    setValue(key, val as UpdateUserSchema[T], {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  const onSubmit = async (data: UpdateUserSchema) => {
    try {
      const editableData = { ...data };
      Reflect.deleteProperty(editableData, "email");

      const payload = {
        id: props.id,
        role: editableData.role,
        name: editableData.name,
        status: editableData.status || "pending",
        phoneNumber: editableData.phoneNumber || "",
        birthday: editableData.birthday || "",
        gender: editableData.gender || "male",
        avatar: editableData.avatar || "",
      };

      await updateUser(payload).unwrap();

      toast.success("User updated successfully");
      setOpen(false);
    } catch (error) {
      console.error("Unexpected error during user update:", error);
      toast.error("An unexpected error occurred while updating the user.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SquarePen className="cursor-pointer text-blue-500 hover:text-blue-700" />
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[425px] bg-white z-50 dark:bg-gray-800 dark:text-white/90 p-0 overflow-hidden [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-col"
        >
          <DialogHeader className="shrink-0 flex-row items-start justify-between bg-white dark:bg-gray-800 px-6 py-4 border-b z-40">
            <div className="space-y-2 text-left">
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Edit the user details.</DialogDescription>
            </div>

            <DialogClose asChild>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  onChange={(e) => handleTextChange(e, "name")}
                  onBlur={(e) => handleTextBlur(e, "name")}
                />
                {formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {formState.errors.name.message}
                  </p>
                )}
              </div>

              <div
                className="grid cursor-not-allowed gap-3"
                title={EMAIL_IMMUTABLE_MESSAGE}
              >
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={props.email || ""}
                  className="cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>

              <div className="grid cursor-not-allowed gap-3">
                <Label htmlFor="role">Role *</Label>

                <Input
                  id="role"
                  value={
                    props.role
                      ? props.role.charAt(0).toUpperCase() + props.role.slice(1)
                      : ""
                  }
                  className="cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="phoneNumber">Contact Number *</Label>
                <Input
                  id="phoneNumber"
                  placeholder="ex: 0712345678"
                  inputMode="numeric"
                  maxLength={10}
                  {...register("phoneNumber")}
                  onChange={(e) => handleTextChange(e, "phoneNumber")}
                  onBlur={(e) => handleTextBlur(e, "phoneNumber")}
                />
                {formState.errors.phoneNumber && (
                  <p className="text-sm text-red-500">
                    {formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(val) => handleSelect("status", val)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DatePicker
                id="birthday"
                label="Date of Birth *"
                required
                value={form.watch("birthday")}
                onChange={(date) =>
                  setValue("birthday", date, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="Select birthday"
                error={formState.errors.birthday?.message}
                maxDate={maxUserBirthday}
              />

              <div className="grid gap-3">
                <Label htmlFor="gender">Gender *</Label>

                <Select
                  value={form.watch("gender")}
                  onValueChange={(val) => handleSelect("gender", val)}
                >
                  <SelectTrigger
                    id="gender"
                    aria-invalid={!!formState.errors.gender}
                  >
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>

                {formState.errors.gender && (
                  <p className="text-sm text-red-500">
                    {formState.errors.gender.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="avatar">Profile Picture *</Label>

                <FileUploadDropzone
                  imageOnly
                  onUploaded={(url) => {
                    setValue("avatar", url, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    setPreviewUrl(url);
                  }}
                />

                {formState.errors.avatar && (
                  <p className="text-sm text-red-500">
                    {formState.errors.avatar.message}
                  </p>
                )}
                {previewUrl && (
                  <NextImage
                    src={previewUrl}
                    alt="Avatar Preview"
                    width={96}
                    height={96}
                    className="mt-2 h-24 w-24 object-cover rounded-full mx-auto"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 bg-white dark:bg-gray-800 px-6 py-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="submit"
              className="bg-blue-700 text-white hover:bg-blue-500"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
