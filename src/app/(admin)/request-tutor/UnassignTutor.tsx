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
import { useUnassignTutorMutation } from "@/store/api/splits/request-tutor";
import { useFetchSubjectByIdQuery } from "@/store/api/splits/subjects";
import { useFetchTutorByIdQuery } from "@/store/api/splits/tutors";
import { UserMinus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { TutorRequestBlock } from "./assignTutor";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_REASONS = [
  "Tutor is no longer available",
  "Client requested a change",
  "Tutor did not meet requirements",
  "Scheduling conflict",
  "Other",
] as const;

type PresetReason = (typeof PRESET_REASONS)[number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getAssignedTutorId = (
  assignedTutor: TutorRequestBlock["assignedTutor"],
): string => {
  if (!assignedTutor) return "";
  if (typeof assignedTutor === "string") return assignedTutor;
  if (Array.isArray(assignedTutor)) return assignedTutor[0]?.id ?? "";
  return assignedTutor.id ?? "";
};

const getAssignedTutorName = (
  assignedTutor: TutorRequestBlock["assignedTutor"],
): string | null => {
  if (!assignedTutor) return null;
  if (Array.isArray(assignedTutor)) return assignedTutor[0]?.fullName ?? null;
  if (typeof assignedTutor === "object") return assignedTutor.fullName ?? null;
  return null;
};

const isAssigned = (assignedTutor: TutorRequestBlock["assignedTutor"]) => {
  if (!assignedTutor) return false;
  if (typeof assignedTutor === "string") return assignedTutor.trim() !== "";
  if (Array.isArray(assignedTutor))
    return assignedTutor.length > 0 && !!assignedTutor[0]?.id;
  return !!assignedTutor.id;
};

// ─── Block row ───────────────────────────────────────────────────────────────

function UnassignBlockRow({
  block,
  index,
  checked,
  onChange,
}: {
  block: TutorRequestBlock;
  index: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const isObjectId = /^[a-f\d]{24}$/i.test(block.subject || "");
  const { data: subjectData } = useFetchSubjectByIdQuery(block.subject, {
    skip: !isObjectId,
  });

  const subjectLabel = isObjectId
    ? (subjectData?.title ?? `Subject #${index + 1}`)
    : block.subject || `Subject #${index + 1}`;

  const nameFromObject = getAssignedTutorName(block.assignedTutor);
  const tutorId = getAssignedTutorId(block.assignedTutor);
  const { data: tutorData } = useFetchTutorByIdQuery(tutorId, {
    skip: !tutorId || !!nameFromObject,
  });
  const tutorName = nameFromObject ?? tutorData?.fullName ?? null;

  return (
    <label
      className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
        checked
          ? "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      } hover:bg-rose-50 dark:hover:bg-rose-950/20`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-300 accent-rose-600"
      />
      <div className="flex flex-col gap-1 text-sm flex-1">
        <span className="font-semibold text-gray-800 dark:text-white">
          {subjectLabel}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Assigned tutor:
          </span>
          {tutorName ? (
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
              {tutorName}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">Loading...</span>
          )}
        </div>
      </div>
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface UnassignTutorRow {
  id: string;
  tutors?: TutorRequestBlock[];
}

interface UnassignTutorProps {
  row: UnassignTutorRow;
  onUnassigned?: () => void;
}

export function UnassignTutor({ row, onUnassigned }: UnassignTutorProps) {
  const [open, setOpen] = useState(false);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedReason, setSelectedReason] = useState<PresetReason | "">("");
  const [customReason, setCustomReason] = useState("");
  const [validationError, setValidationError] = useState("");
  const [unassignTutor, { isLoading }] = useUnassignTutorMutation();

  const assignedBlocks = (row.tutors ?? []).filter((b) =>
    isAssigned(b.assignedTutor),
  );

  const isOther = selectedReason === "Other";
  const finalReason = isOther ? customReason.trim() : selectedReason;
  const isReasonValid = isOther
    ? customReason.trim().length > 0
    : selectedReason !== "";

  useEffect(() => {
    if (open) {
      setSelectedBlockIds(new Set(assignedBlocks.map((b) => b._id)));
      setSelectedReason("");
      setCustomReason("");
      setValidationError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleBlock = (blockId: string, checked: boolean) => {
    setSelectedBlockIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(blockId);
      else next.delete(blockId);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedBlockIds.size === 0) return;

    if (!isReasonValid) {
      setValidationError(
        isOther
          ? "Please describe the reason for unassignment."
          : "Please select a reason for unassignment.",
      );
      return;
    }

    try {
      await unassignTutor({
        requestId: row.id,
        tutorBlockIds: [...selectedBlockIds],
        unassignReason: finalReason,
      }).unwrap();
      toast.success("Tutor unassigned successfully");
      setOpen(false);
      onUnassigned?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to unassign tutor");
    }
  };

  if (assignedBlocks.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Unassign tutor from this request"
          className="inline-flex h-8 w-8 items-center justify-center rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <UserMinus className="h-5 w-5" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0">
        <DialogHeader className="shrink-0 px-6 py-4 border-b">
          <DialogTitle>Unassign Tutor</DialogTitle>
          <DialogDescription>
            Select which tutor requests to unassign. The request will revert to
            pending for the unassigned subjects.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-6 py-4 flex flex-col gap-3">
          {assignedBlocks.map((block, index) => (
            <UnassignBlockRow
              key={block._id}
              block={block}
              index={index}
              checked={selectedBlockIds.has(block._id)}
              onChange={(checked) => toggleBlock(block._id, checked)}
            />
          ))}

          {/* Reason */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason <span className="text-rose-500">*</span>
            </label>

            <Select
              value={selectedReason}
              onValueChange={(val) => {
                setSelectedReason(val as PresetReason);
                setCustomReason("");
                setValidationError("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isOther && (
              <textarea
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (validationError) setValidationError("");
                }}
                placeholder="Please describe the reason..."
                rows={3}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900"
              />
            )}

            {validationError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {validationError}
              </p>
            )}

            <p className="text-xs text-gray-500">
              This reason will be included in the email sent to the client.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || selectedBlockIds.size === 0}
            className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
          >
            {isLoading
              ? "Unassigning..."
              : `Unassign${selectedBlockIds.size > 0 ? ` (${selectedBlockIds.size})` : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
