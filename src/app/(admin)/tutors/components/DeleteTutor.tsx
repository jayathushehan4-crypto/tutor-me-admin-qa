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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFetchGradesQuery } from "@/store/api/splits/grades";
import { useLazyFetchRequestForTutorsQuery } from "@/store/api/splits/request-tutor";
import { useFetchSubjectsQuery } from "@/store/api/splits/subjects";
import { useDeleteTutorMutation } from "@/store/api/splits/tutors";
import type { PaginatedResponse, RequestTutors } from "@/types/response-types";
import { getErrorInApiResult } from "@/utils/api";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type AssignedRequestRow = {
  id: string;
  requestEmail: string;
  grade: unknown;
  subject: unknown;
};

type AssignedTutorValue =
  | string
  | null
  | { id?: string; _id?: string; fullName?: string; name?: string }
  | Array<{ id?: string; _id?: string; fullName?: string; name?: string }>;

interface DeleteTutorProps {
  tutorId: string;
  tutorName?: string;
  tutorEmail?: string;
}

const LARGE_LIMIT = 10000;

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const assignedTutorMatches = (
  assignedTutor: AssignedTutorValue,
  tutorId: string,
  tutorName?: string,
  tutorEmail?: string,
): boolean => {
  const normalizedTutorId = tutorId.trim().toLowerCase();
  const normalizedTutorName = normalizeText(tutorName);
  const normalizedTutorEmail = normalizeText(tutorEmail);

  if (!assignedTutor) {
    return false;
  }

  if (typeof assignedTutor === "string") {
    const normalizedValue = assignedTutor.trim().toLowerCase();
    return (
      normalizedValue === normalizedTutorId ||
      normalizedValue === normalizedTutorName ||
      normalizedValue === normalizedTutorEmail
    );
  }

  if (Array.isArray(assignedTutor)) {
    return assignedTutor.some((item) =>
      assignedTutorMatches(item, tutorId, tutorName, tutorEmail),
    );
  }

  const tutorRecord = assignedTutor as {
    id?: string;
    _id?: string;
    fullName?: string;
    name?: string;
  };

  const normalizedId = normalizeText(tutorRecord.id || tutorRecord._id);
  const normalizedName = normalizeText(
    tutorRecord.fullName || tutorRecord.name,
  );

  return (
    normalizedId === normalizedTutorId ||
    normalizedName === normalizedTutorName ||
    normalizedName === normalizedTutorEmail ||
    normalizedId === normalizedTutorEmail
  );
};

const getSafeValue = (value: unknown, fallback = "N/A") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  const stringValue = String(value).trim();
  return stringValue === "" ? fallback : stringValue;
};

function AssignedRequestsModal({
  open,
  onOpenChange,
  tutorName,
  requestRows,
  isLoading,
  gradeTitleById,
  subjectTitleById,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorName?: string;
  requestRows: AssignedRequestRow[];
  isLoading: boolean;
  gradeTitleById: Map<string, string>;
  subjectTitleById: Map<string, string>;
}) {
  const getDisplayNameFromEntity = (
    value: unknown,
    lookup: Map<string, string>,
    unknownLabel: string,
  ) => {
    if (value && typeof value === "object") {
      const record = value as { title?: unknown; name?: unknown; id?: unknown };
      return getSafeValue(
        record.title || record.name || record.id,
        unknownLabel,
      );
    }

    const rawValue = getSafeValue(value, "");
    if (!rawValue) {
      return unknownLabel;
    }

    return lookup.get(rawValue) || rawValue;
  };

  const requestCountLabel = `${requestRows.length} assigned ${
    requestRows.length === 1 ? "request" : "requests"
  }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white p-0 dark:bg-gray-900 dark:text-white/90 sm:max-w-[680px]">
        <DialogHeader className="border-b border-gray-100 bg-white px-0 pb-5 pt-1 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start gap-4 border-l-4 border-error-500 pl-4 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-error-100 bg-error-50 text-error-500 dark:border-error-500/25 dark:bg-error-500/10 dark:text-error-400">
              <TriangleAlert className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1 text-left">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase text-error-500 dark:text-error-400">
                  Deletion blocked
                </span>
                {!isLoading && requestRows.length > 0 && (
                  <span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 ring-1 ring-success-200 dark:bg-success-500/10 dark:text-success-300 dark:ring-success-500/20">
                    {requestCountLabel}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl leading-7 text-gray-900 dark:text-white">
                Assigned Tutor Requests
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-[560px] text-sm leading-6 text-gray-600 dark:text-gray-300">
                {tutorName ? (
                  <>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {tutorName}
                    </span>{" "}
                    cannot be deleted because they are assigned to the request
                    blocks below. Unassign them first, then try deleting again.
                  </>
                ) : (
                  "This tutor cannot be deleted because they are assigned to the request blocks below. Unassign them first, then try deleting again."
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[52vh] overflow-y-auto py-5 scrollbar-thin">
          {isLoading ? (
            <div className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading assigned requests...
            </div>
          ) : requestRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No assigned requests found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <Table className="min-w-[600px]">
                <TableHeader className="border-b border-brand-100 bg-brand-50/70 dark:border-brand-500/20 dark:bg-brand-500/10">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-xs font-semibold uppercase text-brand-700 dark:text-brand-300"
                    >
                      Requests For Tutors Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-xs font-semibold uppercase text-brand-700 dark:text-brand-300"
                    >
                      Grade Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-xs font-semibold uppercase text-brand-700 dark:text-brand-300"
                    >
                      Subject Name
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {requestRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                        {row.requestEmail}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {getDisplayNameFromEntity(
                          row.grade,
                          gradeTitleById,
                          "Unknown grade",
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {getDisplayNameFromEntity(
                          row.subject,
                          subjectTitleById,
                          "Unknown subject",
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="mt-0 border-t border-gray-100 px-0 pb-1 pt-4 dark:border-gray-800">
          <DialogClose className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]">
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTutor({
  tutorId,
  tutorName,
  tutorEmail,
}: DeleteTutorProps) {
  const [deleteTutor, { isLoading: isDeleting }] = useDeleteTutorMutation();
  const [loadRequests] = useLazyFetchRequestForTutorsQuery();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assignedRequestsOpen, setAssignedRequestsOpen] = useState(false);
  const [assignedRequests, setAssignedRequests] = useState<
    AssignedRequestRow[]
  >([]);
  const [checkingAssignments, setCheckingAssignments] = useState(false);

  const { data: gradesData, isFetching: isFetchingGrades } =
    useFetchGradesQuery(
      {
        page: 1,
        limit: LARGE_LIMIT,
        sortBy: "title:asc",
      },
      {
        skip: !assignedRequestsOpen,
      },
    );

  const { data: subjectsData, isFetching: isFetchingSubjects } =
    useFetchSubjectsQuery(
      {
        page: 1,
        limit: LARGE_LIMIT,
        sortBy: "title:asc",
      },
      {
        skip: !assignedRequestsOpen,
      },
    );

  const gradeTitleById = useMemo(
    () =>
      new Map<string, string>(
        (gradesData?.results || []).map(
          (grade: { id: string; title?: string }) => [
            grade.id,
            grade.title || grade.id,
          ],
        ),
      ),
    [gradesData?.results],
  );

  const subjectTitleById = useMemo(
    () =>
      new Map<string, string>(
        (subjectsData?.results || []).map(
          (subject: { id: string; title?: string }) => [
            subject.id,
            subject.title || subject.id,
          ],
        ),
      ),
    [subjectsData?.results],
  );

  const normalizeRequestRows = (
    requestResponse: PaginatedResponse<RequestTutors>,
  ) => {
    const requestRows: AssignedRequestRow[] = [];

    for (const request of requestResponse?.results || []) {
      const requestEmail = getSafeValue(request.email, "");

      for (const block of request.tutors || []) {
        if (
          !assignedTutorMatches(
            block.assignedTutor,
            tutorId,
            tutorName,
            tutorEmail,
          )
        ) {
          continue;
        }

        requestRows.push({
          id: `${request.id}-${block._id}`,
          requestEmail,
          grade: request.grade,
          subject: block.subject,
        });
      }
    }

    return requestRows;
  };

  const handleDeleteClick = async () => {
    setCheckingAssignments(true);

    try {
      const requestResponse = (await loadRequests({
        page: 1,
        limit: LARGE_LIMIT,
        sortBy: "updatedAt:desc",
      }).unwrap()) as PaginatedResponse<RequestTutors>;

      const requestRows = normalizeRequestRows(requestResponse);
      setAssignedRequests(requestRows);

      if (requestRows.length > 0) {
        setAssignedRequestsOpen(true);
        return;
      }

      setDeleteConfirmOpen(true);
    } catch (error) {
      console.error("Failed to inspect tutor assignments:", error);
      toast.error("Failed to inspect tutor assignments before deleting.");
    } finally {
      setCheckingAssignments(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteTutor(tutorId);
      if ("error" in result && result.error) {
        const error = getErrorInApiResult({ error: result.error });
        toast.error(error);
        return;
      }

      toast.success("Tutor deleted successfully");
      setDeleteConfirmOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Failed to delete tutor");
      } else {
        toast.error("Failed to delete tutor");
      }
    }
  };

  const isModalLoading = isFetchingGrades || isFetchingSubjects;

  return (
    <>
      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={checkingAssignments || isDeleting}
        className="inline-flex items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
        title="Delete tutor"
      >
        {checkingAssignments ? (
          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
        ) : (
          <Trash2 className="cursor-pointer text-red-500 hover:text-red-600" />
        )}
      </button>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              tutor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssignedRequestsModal
        open={assignedRequestsOpen}
        onOpenChange={setAssignedRequestsOpen}
        tutorName={tutorName}
        requestRows={assignedRequests}
        isLoading={isModalLoading}
        gradeTitleById={gradeTitleById}
        subjectTitleById={subjectTitleById}
      />
    </>
  );
}
