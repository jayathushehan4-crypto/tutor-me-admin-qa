"use client";

import InputPassword from "@/components/shared/input-password";
import SubmitButton from "@/components/shared/submit-button";
import { useResetPasswordMutation } from "@/store/api/splits/auth";
import { getErrorInApiResult } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  initialFormValues,
  ResetPasswordSchema,
  resetPasswordSchema,
} from "./schema";

type Props = {
  token: string;
};

export default function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: initialFormValues,
    mode: "onChange",
  });

  const onSubmit = async (values: ResetPasswordSchema) => {
    setSuccessMessage(null);

    if (!token) {
      const message =
        "Reset token is missing. Please use the link from your email.";
      toast.error(message);
      return;
    }

    const result = await resetPassword({
      token,
      password: values.password,
    });

    const error = getErrorInApiResult(result);

    if (error) {
      toast.error(error);
      return;
    }

    setSuccessMessage("Password updated successfully. You can now sign in.");
    form.reset(initialFormValues);

    setTimeout(() => {
      router.push("/signin");
    }, 1800);
  };

  return (
    <div className="flex w-full flex-col justify-center lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
            Reset Password
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a new password for your admin account.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {!token ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                The reset link is missing its token. Please open the link from
                your email again.
              </div>

              <Link
                href="/signin"
                className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
                  Enter and Confirm your new password to continue
                </div>

                <InputPassword
                  label="New Password"
                  name="password"
                  placeholder="Enter new password"
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    form.setValue(
                      "password",
                      e.target.value.replace(/\s/g, ""),
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    );
                  }}
                />

                <InputPassword
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    form.setValue(
                      "confirmPassword",
                      e.target.value.replace(/\s/g, ""),
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    );
                  }}
                />

                {successMessage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                    {successMessage}
                  </div>
                )}

                <div className="space-y-3">
                  <SubmitButton
                    title="Update Password"
                    type="submit"
                    loading={isLoading}
                  />

                  <Link
                    href="/signin"
                    className="block text-center text-sm text-blue-700 hover:underline dark:text-blue-400"
                  >
                    Return to sign in
                  </Link>
                </div>
              </form>
            </FormProvider>
          )}
        </div>
      </div>
    </div>
  );
}
