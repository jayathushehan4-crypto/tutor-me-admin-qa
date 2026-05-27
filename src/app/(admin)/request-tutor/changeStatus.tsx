"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateStatusMutation } from "@/store/api/splits/request-tutor";
import { Edit } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

interface ChangeStatusDialogProps {
  requestId: string;
  currentStatus: "Pending" | "Rejected";
  currentRejectionReason?: string;
  onStatusChange?: () => void;
}

export function ChangeStatusDialog({
  requestId,
  currentStatus,
  currentRejectionReason = "",
  onStatusChange,
}: ChangeStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationError, setValidationError] = useState("");
  const [updateStatus, { isLoading }] = useUpdateStatusMutation();
  const rejectionReasonRef = useRef<HTMLTextAreaElement | null>(null);

  const isRejected = status === "Rejected";
  const hasStatusChanged = status !== currentStatus;
  const isExistingRejectedStatus =
    currentStatus === "Rejected" && !hasStatusChanged;
  const isRejectionReasonMissing =
    status === "Rejected" && rejectionReason.trim().length === 0;
  const isSaveDisabled = useMemo(() => {
    if (!hasStatusChanged) {
      return true;
    }

    if (isRejectionReasonMissing) {
      return true;
    }

    return false;
  }, [hasStatusChanged, isRejectionReasonMissing]);

  useEffect(() => {
    if (open) {
      setStatus(currentStatus);
      setRejectionReason(
        currentStatus === "Rejected" ? currentRejectionReason : "",
      );
      setValidationError("");
    }
  }, [currentRejectionReason, currentStatus, open]);

  const handleSave = async () => {
    const nextRejectionReason =
      rejectionReasonRef.current?.value.trim() || rejectionReason.trim();

    if (!hasStatusChanged) {
      setValidationError("Change the request status before saving.");
      return;
    }

    if (status === "Rejected" && !nextRejectionReason) {
      setValidationError(
        "Rejection reason is required when rejecting a tutor request.",
      );
      return;
    }

    try {
      await updateStatus({
        requestId,
        status,
        ...(status === "Rejected"
          ? { rejectionReason: nextRejectionReason }
          : {}),
      }).unwrap();
      toast.success("Status updated successfully");
      setOpen(false);
      setRejectionReason("");
      setValidationError("");
      onStatusChange?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Change request status"
          className="inline-flex h-8 w-8 items-center justify-center text-blue-500 hover:text-blue-700"
        >
          <Edit className="h-5 w-5" />
        </button>
      </DialogTrigger>

      <DialogContent className="bg-white p-0 dark:bg-gray-800 dark:text-white/90 sm:max-w-[425px] overflow-hidden [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0">
        <DialogHeader className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <DialogTitle>Change Request Status</DialogTitle>
          <DialogDescription>
            Leave the request pending or reject it with a reason that will be
            emailed to the requester.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 scrollbar-thin">
          <div className="grid gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <Select
              value={status}
              onValueChange={(val) => {
                const nextStatus = val as "Pending" | "Rejected";
                setStatus(nextStatus);

                if (nextStatus === "Pending") {
                  setRejectionReason("");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isRejected && (
            <div className="mt-4 grid gap-3">
              <label
                htmlFor="rejectionReason"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Rejection reason
              </label>
              <textarea
                id="rejectionReason"
                ref={rejectionReasonRef}
                value={rejectionReason}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  if (validationError) {
                    setValidationError("");
                  }
                }}
                placeholder="Explain why this request was rejected"
                rows={4}
                required={status === "Rejected"}
                aria-invalid={
                  hasStatusChanged && isRejectionReasonMissing
                    ? "true"
                    : "false"
                }
                disabled={isExistingRejectedStatus}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 dark:disabled:border-gray-800 dark:disabled:bg-gray-800/60 dark:disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                {isExistingRejectedStatus
                  ? "Change the status before saving updates to this request."
                  : hasStatusChanged && isRejectionReasonMissing
                    ? "Rejection reason is required before saving."
                    : "This reason will be emailed to the requester."}
              </p>
            </div>
          )}

          {validationError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {validationError}
            </p>
          )}
        </div>

        <div className="shrink-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaveDisabled || isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
