"use client";

import DataTable, { Column } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLASS_TYPE_OPTIONS,
  TUTOR_MEDIUM_OPTIONS,
  TUTOR_TYPE_OPTIONS,
} from "@/configs/app-constants";
import { TABLE_CONFIG } from "@/configs/table";
import { useDebounce } from "@/hooks/useDebounce";
import { useFetchGradesQuery } from "@/store/api/splits/grades";
import { useFetchRequestForTutorsQuery } from "@/store/api/splits/request-tutor";
import { useFetchSubjectsQuery } from "@/store/api/splits/subjects";
import { FetchRequestForTutor } from "@/types/request-types";
import { RequestTutors } from "@/types/response-types";
import { sortByLatestTimestampDesc } from "@/utils/table-sorting";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AssignTutorDialog } from "./assignTutor";
import { ChangeStatusDialog } from "./changeStatus";
import { DeleteTutorRequest } from "./DeleteTutor";
import { UnassignTutor, type UnassignTutorRow } from "./UnassignTutor";
import { ViewTutorRequests } from "./ViewTutor";

type RequestTutorStatusFilter =
  | "all"
  | "Pending"
  | "Rejected"
  | "Tutor Assigned";

type RequestTutorFilters = {
  status: RequestTutorStatusFilter;
  grade: string;
  medium: string;
  subject: string;
  preferredTutorType: string;
  preferredClassType: string;
  assignedTutor: string;
  duration: string;
  frequency: string;
};

const INITIAL_FILTERS: RequestTutorFilters = {
  status: "all",
  grade: "all",
  medium: "all",
  subject: "all",
  preferredTutorType: "all",
  preferredClassType: "all",
  assignedTutor: "",
  duration: "",
  frequency: "",
};

const REQUEST_TUTOR_STATUS_OPTIONS: Array<{
  value: RequestTutorStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Rejected", label: "Rejected" },
  { value: "Tutor Assigned", label: "Assigned" },
];

const REQUEST_TUTOR_STATUS_CLASSES: Record<string, string> = {
  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  Rejected:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
  Assigned:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200",
};

function RequestTutorStatusBadge({ status }: { status: string }) {
  const normalizedStatus =
    status === "Rejected"
      ? "Rejected"
      : status === "Tutor Assigned" ||
          status === "Assiged" ||
          status === "Assigned"
        ? "Assigned"
        : "Pending";
  const className =
    REQUEST_TUTOR_STATUS_CLASSES[normalizedStatus] ??
    REQUEST_TUTOR_STATUS_CLASSES.Pending;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {normalizedStatus}
    </span>
  );
}

export default function RequestForTutorsList() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<RequestTutorFilters>(INITIAL_FILTERS);
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;

  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const debouncedAssignedTutor = useDebounce(filters.assignedTutor, 400);
  const debouncedDuration = useDebounce(filters.duration, 400);
  const debouncedFrequency = useDebounce(filters.frequency, 400);
  const hasStatusFilter = filters.status !== "all";
  const requestPage = hasStatusFilter ? TABLE_CONFIG.DEFAULT_PAGE : page;
  const requestLimit = hasStatusFilter ? 10000 : limit;

  const { data, isLoading, refetch } = useFetchRequestForTutorsQuery(
    useMemo<FetchRequestForTutor>(
      () => ({
        page: requestPage,
        limit: requestLimit,
        sortBy: "updatedAt:desc",
        ...(debouncedSearchTerm.trim()
          ? { search: debouncedSearchTerm.trim() }
          : {}),
        ...(filters.grade !== "all" ? { grade: filters.grade } : {}),
        ...(filters.medium !== "all" ? { medium: filters.medium } : {}),
        ...(filters.subject !== "all" ? { subject: filters.subject } : {}),
        ...(filters.preferredTutorType !== "all"
          ? { preferredTutorType: filters.preferredTutorType }
          : {}),
        ...(filters.preferredClassType !== "all"
          ? { preferredClassType: filters.preferredClassType }
          : {}),
        ...(debouncedAssignedTutor.trim()
          ? { assignedTutor: debouncedAssignedTutor.trim() }
          : {}),
        ...(debouncedDuration.trim()
          ? { duration: debouncedDuration.trim() }
          : {}),
        ...(debouncedFrequency.trim()
          ? { frequency: debouncedFrequency.trim() }
          : {}),
      }),
      [
        debouncedAssignedTutor,
        debouncedDuration,
        debouncedFrequency,
        debouncedSearchTerm,
        filters.grade,
        filters.medium,
        filters.preferredClassType,
        filters.preferredTutorType,
        filters.subject,
        requestLimit,
        requestPage,
      ],
    ),
  );

  const { data: gradesData, isFetching: isFetchingGrades } =
    useFetchGradesQuery({
      page: 1,
      limit: 10000,
      sortBy: "title:asc",
    });
  const { data: subjectsData, isFetching: isFetchingSubjects } =
    useFetchSubjectsQuery({
      page: 1,
      limit: 10000,
      sortBy: "title:asc",
    });

  const rawTutors: RequestTutors[] = useMemo(
    () => data?.results || [],
    [data?.results],
  );

  const gradeOptions = useMemo(
    () =>
      (gradesData?.results || []).map((grade) => ({
        value: grade.id,
        label: grade.title,
      })),
    [gradesData?.results],
  );
  const selectedGrade = useMemo(
    () =>
      (gradesData?.results || []).find((grade) => grade.id === filters.grade),
    [gradesData?.results, filters.grade],
  );

  const subjectOptions = useMemo(() => {
    if (filters.grade === "all") {
      return (subjectsData?.results || []).map((subject) => ({
        value: subject.id,
        label: subject.title,
      }));
    }

    return (selectedGrade?.subjects || []).map((subject) => ({
      value: subject.id,
      label: subject.title,
    }));
  }, [filters.grade, selectedGrade?.subjects, subjectsData?.results]);

  useEffect(() => {
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  }, [
    debouncedAssignedTutor,
    debouncedDuration,
    debouncedFrequency,
    debouncedSearchTerm,
    filters.grade,
    filters.medium,
    filters.preferredClassType,
    filters.preferredTutorType,
    filters.status,
    filters.subject,
  ]);

  const handlePageChange = (newPage: number) => setPage(newPage);

  const updateFilter = <K extends keyof RequestTutorFilters>(
    key: K,
    value: RequestTutorFilters[K],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "grade" ? { subject: "all" } : {}),
    }));
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilters(INITIAL_FILTERS);
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  };

  const getSafeValue = (value: unknown, fallback = "N/A") => {
    if (value === undefined || value === null) {
      return fallback;
    }

    const stringValue = String(value).trim();
    return stringValue === "" ? fallback : stringValue;
  };

  const getSafeTutorBlocks = (value: RequestTutors["tutors"]) =>
    Array.isArray(value) ? value : [];

  const hasAssignedTutor = (assigned: unknown) => {
    if (!assigned) return false;
    if (typeof assigned === "string") return assigned.trim() !== "";
    if (Array.isArray(assigned)) {
      return assigned.some((item) => {
        if (typeof item === "string") return item.trim() !== "";
        if (!item || typeof item !== "object") return false;

        return typeof (item as { id?: unknown }).id === "string";
      });
    }
    if (typeof assigned === "object") {
      return typeof (assigned as { id?: unknown }).id === "string";
    }

    return false;
  };

  const isRequestFullyAssigned = useCallback((row: RequestTutors) => {
    const tutorBlocks = getSafeTutorBlocks(row.tutors);
    if (!tutorBlocks || tutorBlocks.length === 0) return false;
    const assignedCount = tutorBlocks.filter((t) =>
      hasAssignedTutor(t.assignedTutor),
    ).length;
    return assignedCount === tutorBlocks.length;
  }, []);

  const getEffectiveStatus = useCallback(
    (row: RequestTutors): "Pending" | "Rejected" | "Tutor Assigned" => {
      if (row.status === "Rejected") return "Rejected";
      if (
        row.status === "Tutor Assigned" ||
        row.status === "Assiged" ||
        row.status === "Assigned" ||
        isRequestFullyAssigned(row)
      ) {
        return "Tutor Assigned";
      }

      return "Pending";
    },
    [isRequestFullyAssigned],
  );

  const statusFilteredTutors = useMemo(
    () =>
      sortByLatestTimestampDesc(
        filters.status === "all"
          ? rawTutors
          : rawTutors.filter(
              (row) => getEffectiveStatus(row) === filters.status,
            ),
      ),
    [filters.status, getEffectiveStatus, rawTutors],
  );
  const tutors = hasStatusFilter
    ? statusFilteredTutors.slice((page - 1) * limit, page * limit)
    : statusFilteredTutors;
  const totalResults = hasStatusFilter
    ? statusFilteredTutors.length
    : data?.totalResults || tutors.length;
  const totalPages = hasStatusFilter
    ? Math.max(1, Math.ceil(totalResults / limit))
    : data?.totalPages || 1;

  const getGradeId = (grade: unknown): string => {
    if (grade && typeof grade === "object") {
      const gradeRecord = grade as { id?: string };
      const id = gradeRecord.id ?? "";
      return /^[a-f\d]{24}$/i.test(id) ? id : "";
    }
    if (typeof grade === "string" && /^[a-f\d]{24}$/i.test(grade)) {
      return grade;
    }
    return "";
  };

  const columns = useMemo<Column<RequestTutors>[]>(
    () => [
      {
        key: "name",
        header: "Full Name",
        className:
          "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
        render: (row: RequestTutors) => (
          <span
            title={row.name || "No name"}
            className={`truncate block ${!row.name ? "text-gray-400 italic" : ""}`}
            style={{ width: "inherit" }}
          >
            {getSafeValue(row.name, "No name")}
          </span>
        ),
      },
      {
        key: "email",
        header: "Email",
        className: "min-w-[150px] max-w-[250px] truncate overflow-hidden",
        render: (row: RequestTutors) => (
          <span
            title={row.email || "No email"}
            className={`truncate block ${!row.email ? "text-gray-400 italic" : ""}`}
          >
            {getSafeValue(row.email, "No email")}
          </span>
        ),
      },
      {
        key: "phoneNumber",
        header: "Contact Number",
        className: "min-w-[140px] max-w-[200px] truncate overflow-hidden",
        render: (row: RequestTutors) => (
          <span
            title={row.phoneNumber || "No contact"}
            className={`truncate block ${!row.phoneNumber ? "text-gray-400 italic" : ""}`}
          >
            {getSafeValue(row.phoneNumber, "No contact")}
          </span>
        ),
      },
      {
        key: "medium",
        header: "Medium",
        className: "min-w-[120px] max-w-[150px] truncate overflow-hidden",
        render: (row: RequestTutors) => (
          <span
            title={row.medium || "No medium"}
            className={`truncate block ${!row.medium ? "text-gray-400 italic" : ""}`}
          >
            {getSafeValue(row.medium, "No medium")}
          </span>
        ),
      },
      {
        key: "grade",
        header: "Grade",
        className: "min-w-[280px] max-w-[360px] whitespace-normal",
        render: (row: RequestTutors) => {
          const gradeName = getSafeValue(row.grade, "No grade");

          return gradeName !== "No grade" ? (
            <span
              title={gradeName}
              className="block whitespace-normal break-words leading-5"
            >
              {gradeName}
            </span>
          ) : (
            <span className="text-gray-400 italic">No grade</span>
          );
        },
      },
      {
        key: "view",
        header: "View",
        align: "center",
        className:
          "min-w-[80px] max-w-[80px] sticky right-[390px] z-20 bg-white dark:bg-gray-900",
        render: (row: RequestTutors) => <ViewTutorRequests tutorId={row.id} />,
      },
      {
        key: "status",
        header: "Change Status",
        align: "center",
        className:
          "min-w-[190px] max-w-[190px] sticky right-[250px] z-20 bg-white dark:bg-gray-900",
        render: (row: RequestTutors) => {
          const effectiveStatus = getEffectiveStatus(row);
          const isAssignedOrPartial =
            effectiveStatus !== "Rejected" &&
            getSafeTutorBlocks(row.tutors).some((t) =>
              hasAssignedTutor(t.assignedTutor),
            );

          const unassignRow: UnassignTutorRow = {
            id: row.id,
            tutors: getSafeTutorBlocks(row.tutors).map((t) => ({
              _id: t._id,
              subject: t.subject,
              assignedTutor: t.assignedTutor,
              classType: t.classType,
              preferredClassType: t.preferredClassType,
              preferredTutorType: t.preferredTutorType,
              duration: t.duration,
              frequency: t.frequency,
            })),
          };

          return (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2">
                <RequestTutorStatusBadge status={effectiveStatus} />
                {isAssignedOrPartial ? (
                  <UnassignTutor
                    row={unassignRow}
                    onUnassigned={() => refetch()}
                  />
                ) : (
                  <ChangeStatusDialog
                    requestId={row.id}
                    currentStatus={
                      effectiveStatus === "Rejected" ? "Rejected" : "Pending"
                    }
                    currentRejectionReason={row.rejectionReason}
                    onStatusChange={() => refetch()}
                  />
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: "assignTutor",
        header: "Assign Tutor",
        align: "center",
        className:
          "min-w-[170px] max-w-[170px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
        render: (row: RequestTutors) => (
          <AssignTutorDialog
            row={{
              id: row.id,
              status:
                getEffectiveStatus(row) === "Rejected"
                  ? "Rejected"
                  : row.status,
              grade: getGradeId(row.grade),
              district: getSafeValue(row.city, ""),
              medium: getSafeValue(row.medium, ""),
              tutors: getSafeTutorBlocks(row.tutors).map((t) => ({
                _id: t._id,
                subject: t.subject,
                assignedTutor: t.assignedTutor,
                classType: t.classType,
                preferredClassType: t.preferredClassType,
                preferredTutorType: t.preferredTutorType,
                duration: t.duration,
                frequency: t.frequency,
              })),
            }}
            onUpdated={() => refetch()}
          />
        ),
      },
      {
        key: "delete",
        header: "Delete",
        align: "center",
        className:
          "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
        render: (row: RequestTutors) => <DeleteTutorRequest tutorId={row.id} />,
      },
    ],
    [getEffectiveStatus, refetch],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
              Request filters
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/60">
              Search by name, email, or contact number, then narrow results by
              status, grade, medium, subject, tutor type, and class type.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
            className="w-full gap-2 lg:w-auto"
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-1.5 lg:col-span-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email, or contact number"
                className="h-11 w-full pl-10 pr-4"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                updateFilter("status", value as RequestTutorStatusFilter)
              }
            >
              <SelectTrigger className="h-11 min-h-11 w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TUTOR_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Grade
            </label>
            <Select
              value={filters.grade}
              onValueChange={(value) => updateFilter("grade", value)}
            >
              <SelectTrigger
                className="h-11 min-h-11 w-full"
                isLoading={isFetchingGrades}
              >
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                {gradeOptions.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Medium
            </label>
            <Select
              value={filters.medium}
              onValueChange={(value) => updateFilter("medium", value)}
            >
              <SelectTrigger className="h-11 min-h-11 w-full">
                <SelectValue placeholder="Filter by medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All mediums</SelectItem>
                {TUTOR_MEDIUM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Subject
            </label>
            <Select
              value={filters.subject}
              onValueChange={(value) => updateFilter("subject", value)}
            >
              <SelectTrigger
                className="h-11 min-h-11 w-full"
                isLoading={isFetchingSubjects}
              >
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjectOptions.map((subject) => (
                  <SelectItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preferred tutor type
            </label>
            <Select
              value={filters.preferredTutorType}
              onValueChange={(value) =>
                updateFilter("preferredTutorType", value)
              }
            >
              <SelectTrigger className="h-11 min-h-11 w-full">
                <SelectValue placeholder="Filter by tutor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tutor types</SelectItem>
                {TUTOR_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preferred class type
            </label>
            <Select
              value={filters.preferredClassType}
              onValueChange={(value) =>
                updateFilter("preferredClassType", value)
              }
            >
              <SelectTrigger className="h-11 min-h-11 w-full">
                <SelectValue placeholder="Filter by class type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All class types</SelectItem>
                {CLASS_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tutors}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalResults={totalResults}
        limit={limit}
        isLoading={isLoading}
        emptyMessage="No tutor requests found for the current filters."
      />
    </div>
  );
}
