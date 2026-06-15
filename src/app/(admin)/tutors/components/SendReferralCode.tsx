"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSendReferralCodeMutation } from "@/store/api/splits/tutors";
import { CheckCircle, Mail } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface SendReferralCodeProps {
  tutorId: string;
  disabled?: boolean;
  sent?: boolean;
}

export function SendReferralCode({
  tutorId,
  disabled = false,
  sent = false,
}: SendReferralCodeProps) {
  const [open, setOpen] = useState(false);

  const [sendReferralCode, { isLoading }] = useSendReferralCodeMutation();

  const handleSend = async () => {
    if (disabled) return;

    try {
      await sendReferralCode(tutorId).unwrap();
      toast.success("Referral code sent to tutor's email!");
      setOpen(false);
    } catch {
      toast.error("Failed to send referral code email.");
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled || sent) return;
        setOpen(nextOpen);
      }}
    >
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={disabled || sent}
          title={
            sent
              ? "Referral code already sent"
              : disabled
              ? "Send code is only available for approved tutors"
              : "Send referral code to tutor"
          }
          className="disabled:cursor-not-allowed"
        >
          {sent ? (
            <CheckCircle className="text-green-500" />
          ) : (
            <Mail
              className={
                disabled
                  ? "text-gray-300 dark:text-gray-600"
                  : "cursor-pointer text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
              }
            />
          )}
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="z-50 bg-white dark:bg-gray-800 dark:text-white/90">
        <AlertDialogHeader>
          <AlertDialogTitle>Send Referral Code?</AlertDialogTitle>

          <AlertDialogDescription>
            This will email the tutor their unique referral code so they can
            share it with others.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleSend}
            disabled={isLoading || disabled}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Code"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
