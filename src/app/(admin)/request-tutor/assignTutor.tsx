"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import {
  useUpdateAssignedTutorMutation,
  useUpdateStatusMutation,
} from "@/store/api/splits/request-tutor";
import { useFetchSubjectByIdQuery } from "@/store/api/splits/subjects";
import { useFetchTutorsQuery } from "@/store/api/splits/tutors";
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export interface TutorRequestBlock {
  _id: string;
  subject: string;
  classType?: string | string[];
  preferredClassType?: string | string[];
  assignedTutor?:
    | string
    | null
    | { id?: string; fullName?: string }
    | Array<{ id?: string; fullName?: string }>;
  preferredTutorType?: string;
  duration: string;
  frequency: string;
}

export interface AssignTutorRow {
  id: string;
  status?: string;
  grade?: string;
  district?: string;
  medium?: string;
  tutors?: TutorRequestBlock[];
}

interface Props {
  row: AssignTutorRow;
  onUpdated?: () => void;
}

const LARGE_LIMIT = 10000;

const getAssignedTutorId = (
  assignedTutor: TutorRequestBlock["assignedTutor"],
) => {
  if (!assignedTutor) {
    return "";
  }

  if (typeof assignedTutor === "string") {
    return assignedTutor;
  }

  if (Array.isArray(assignedTutor)) {
    return assignedTutor[0]?.id ?? "";
  }

  return assignedTutor.id ?? "";
};

const getSafeValue = (value: unknown, fallback = "N/A") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  const stringValue = String(value).trim();
  return stringValue === "" ? fallback : stringValue;
};

const getClassTypeDisplayValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => getSafeValue(item, "")).filter(Boolean);
  }

  const classType = getSafeValue(value, "");
  return classType ? [classType] : [];
};

function TutorBlockItem({
  tutorBlock,
  gradeId,
  district,
  medium,
  index,
  selectedTutorId,
  onSelect,
}: {
  tutorBlock: TutorRequestBlock;
  gradeId?: string;
  district?: string;
  medium?: string;
  index: number;
  selectedTutorId: string;
  onSelect: (index: number, tutorId: string) => void;
}) {
  const isObjectId = /^[a-f\d]{24}$/i.test(tutorBlock.subject || "");

  const { data: subjectData } = useFetchSubjectByIdQuery(tutorBlock.subject, {
    skip: !isObjectId,
  });

  const subjectDisplay = isObjectId
    ? (subjectData?.title ?? tutorBlock.subject)
    : tutorBlock.subject || "N/A";

  const { data, isLoading } = useFetchTutorsQuery({
    page: 1,
    limit: LARGE_LIMIT,
    status: "approved",
    gradeId: gradeId || undefined,
    subjectId: isObjectId ? tutorBlock.subject : undefined,
  });

  const tutors = (data?.results ?? []).filter((tutor) => {
    const statusMatch = tutor.status?.toLowerCase() === "approved";

    const mediumMatch =
      !medium ||
      tutor.tutorMediums.some((m) => m.toLowerCase() === medium.toLowerCase());

    const tutorTypeMatch =
      !tutorBlock.preferredTutorType ||
      tutor.tutorType.some(
        (t) =>
          t.toLowerCase() ===
          (tutorBlock.preferredTutorType ?? "").toLowerCase(),
      );

    const preferredClassTypes = Array.isArray(tutorBlock.preferredClassType)
      ? tutorBlock.preferredClassType.map((c) => c.toLowerCase())
      : tutorBlock.preferredClassType
        ? [tutorBlock.preferredClassType.toLowerCase()]
        : [];

    const isOnlineRequest = preferredClassTypes.some((c) =>
      c.includes("online"),
    );

    const locationPass =
      isOnlineRequest ||
      !district ||
      tutor.preferredLocations.some(
        (loc) => loc.toLowerCase() === district.toLowerCase(),
      );

    const classTypeMatch =
      preferredClassTypes.length === 0 ||
      preferredClassTypes.some((requested) =>
        tutor.classType.some((ct) => ct.toLowerCase() === requested),
      );

    return (
      statusMatch &&
      mediumMatch &&
      tutorTypeMatch &&
      locationPass &&
      classTypeMatch
    );
  });

  const noResults = !isLoading && tutors.length === 0;

  const currentValue =
    selectedTutorId && selectedTutorId !== "" ? selectedTutorId : "placeholder";

  // Display name for the currently selected tutor
  const selectedTutorName = tutors.find(
    (t) => t.id === selectedTutorId,
  )?.fullName;
  const classTypeLabels = getClassTypeDisplayValue(
    tutorBlock.classType ?? tutorBlock.preferredClassType,
  );

  return (
    <div key={tutorBlock._id} className="border rounded-md p-4 space-y-2">
      <p className="font-medium">Tutor Request #{index + 1}</p>
      <div className="text-sm text-gray-500 space-y-1">
        <div>
          Subject:{" "}
          <span className="font-medium text-gray-800 dark:text-white">
            {subjectDisplay}
          </span>
        </div>
        {tutorBlock.preferredTutorType && (
          <div>
            Preferred Type:{" "}
            <span className="font-medium text-gray-800 dark:text-white">
              {tutorBlock.preferredTutorType}
            </span>
          </div>
        )}
        <div>
          Class Type:{" "}
          {classTypeLabels.length ? (
            <span className="font-medium text-gray-800 dark:text-white">
              {classTypeLabels.join(", ")}
            </span>
          ) : (
            <span className="font-medium text-gray-800 dark:text-white">
              N/A
            </span>
          )}
        </div>
        <div>
          Duration:{" "}
          <span className="font-medium text-gray-800 dark:text-white">
            {tutorBlock.duration}
          </span>
        </div>
        <div>
          Frequency:{" "}
          <span className="font-medium text-gray-800 dark:text-white">
            {tutorBlock.frequency}
          </span>
        </div>
      </div>

      {selectedTutorName && (
        <p className="text-xs text-green-600 font-medium">
          Currently Assigned: {selectedTutorName}
        </p>
      )}

      {noResults ? (
        <p className="text-sm text-red-500 font-medium py-2">
          Cannot find matched tutors
        </p>
      ) : (
        <Select
          value={currentValue}
          onValueChange={(val) => onSelect(index, val)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a tutor" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="placeholder" disabled>
              {isLoading ? "Loading tutors..." : "Select a tutor"}
            </SelectItem>

            {tutors.map((tutor) => (
              <SelectItem key={tutor.id} value={tutor.id}>
                {tutor.fullName || tutor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function AssignTutorDialog({ row, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [updateAssignedTutor, { isLoading: isSubmittingTutor }] =
    useUpdateAssignedTutorMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateStatusMutation();

  const isSubmitting = isSubmittingTutor || isUpdatingStatus;

  // Local selection state: index → tutorId
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [initialSelections, setInitialSelections] = useState<
    Record<number, string>
  >({});

  // Initialise selections from existing assignments whenever the dialog opens
  useEffect(() => {
    if (open && row.tutors) {
      const initial: Record<number, string> = {};
      row.tutors.forEach((block, i) => {
        const assignedTutorId = getAssignedTutorId(block.assignedTutor);
        if (assignedTutorId) {
          initial[i] = assignedTutorId;
        }
      });
      setInitialSelections(initial);
      setSelections(initial);
    }
  }, [open, row.tutors]);

  const totalParts = row.tutors?.length ?? 0;

  // Enable Assign only if at least one block has changed from its initial assignment
  const hasChanges =
    totalParts > 0 &&
    Array.from({ length: totalParts }, (_, i) => i).some(
      (i) =>
        selections[i] &&
        selections[i] !== "" &&
        selections[i] !== initialSelections[i],
    );

  const handleSelect = (index: number, tutorId: string) => {
    if (!tutorId || tutorId === "placeholder") return;
    setSelections((prev) => ({ ...prev, [index]: tutorId }));
  };

  const handleAssign = async () => {
    if (!hasChanges || !row.tutors) return;

    // Only send blocks where the selection has changed from the initial assignment
    const blocksToAssign = row.tutors
      .map((block, i) => ({ block, tutorId: selections[i] }))
      .filter(
        ({ tutorId }, i) =>
          !!tutorId && tutorId !== "" && tutorId !== initialSelections[i],
      );

    try {
      for (const { block, tutorId } of blocksToAssign) {
        await updateAssignedTutor({
          requestId: row.id,
          tutorBlockId: block._id,
          assignedTutor: tutorId,
        }).unwrap();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign tutors");
      return;
    }

    // Assignments succeeded — try status update separately (non-critical)
    const finalAssignedCount = row.tutors.filter((t, i) => {
      const newlyAssignedId = selections[i];
      const isNowAssigned = newlyAssignedId && newlyAssignedId !== "";
      return isNowAssigned || getAssignedTutorId(t.assignedTutor);
    }).length;

    if (finalAssignedCount === row.tutors.length && finalAssignedCount > 0) {
      try {
        await updateStatus({
          requestId: row.id,
          status: "Tutor Assigned",
        }).unwrap();
      } catch (err) {
        console.error("Status update failed (non-critical):", err);
      }
    }

    toast.success("Tutors assigned successfully");
    onUpdated?.();
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const assignedCount =
    row.tutors?.filter((t) => Boolean(getAssignedTutorId(t.assignedTutor)))
      .length ?? 0;
  const totalCount = row.tutors?.length ?? 0;
  const isPartial = assignedCount > 0 && assignedCount < totalCount;
  const isFullyAssigned = assignedCount > 0 && assignedCount === totalCount;
  const isRejected = row.status === "Rejected";

  return (
    <div className="flex items-center gap-2">
      {isPartial && (
        <Button
          size="sm"
          className="bg-yellow-500 hover:bg-yellow-600 text-white cursor-default text-xs px-2"
        >
          {assignedCount}/{totalCount} Assigned
        </Button>
      )}
      {isFullyAssigned && (
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white cursor-default text-xs px-2"
        >
          {assignedCount}/{totalCount} Assigned
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {isPartial || isFullyAssigned ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={isRejected}
              title={
                isRejected
                  ? "Rejected tutor requests cannot be assigned"
                  : "Edit assigned tutors"
              }
            >
              <Edit size={16} />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
              disabled={isRejected}
              title={
                isRejected
                  ? "Rejected tutor requests cannot be assigned"
                  : "Assign tutors"
              }
            >
              <Edit size={16} />
              Assign Tutors
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-hidden p-0 [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0">
          <DialogHeader className="shrink-0 px-6 py-4 border-b">
            <DialogTitle>Assign Tutors</DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-6 py-6 flex flex-col gap-6">
            {(row.tutors ?? []).map((tutorBlock, index) => (
              <TutorBlockItem
                key={tutorBlock._id}
                tutorBlock={tutorBlock}
                gradeId={row.grade}
                district={row.district}
                medium={row.medium}
                index={index}
                selectedTutorId={selections[index] ?? ""}
                onSelect={handleSelect}
              />
            ))}
          </div>
          {/* Action Buttons */}
          <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!hasChanges || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
