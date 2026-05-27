"use client";

import DataTable from "@/components/tables/DataTable";
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
  PREFERRED_LOCATION_OPTIONS,
  TUTOR_STATUS_BADGE_CLASSES,
  TUTOR_STATUS_FILTER_OPTIONS,
  TUTOR_TYPE_OPTIONS,
} from "@/configs/app-constants";
import { TABLE_CONFIG } from "@/configs/table";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useFetchGradeByIdQuery,
  useFetchGradesQuery,
} from "@/store/api/splits/grades";
import { useFetchSubjectsQuery } from "@/store/api/splits/subjects";
import {
  useFetchTutorsQuery,
  useUpdateTutorStatusMutation,
} from "@/store/api/splits/tutors";
import { getErrorInApiResult } from "@/utils/api";
import { getAdminId } from "@/utils/auth";
import { sortBySchoolGradeOrder } from "@/utils/grade-filter-order";
import {
  CheckCircle,
  Loader2,
  Search,
  ShieldOff,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DeleteTutor } from "./DeleteTutor";
import { EditTutor } from "./edit-tutor/EditTutor";
import { ResetPassword } from "./ResetPassword";
import { ViewTutor } from "./ViewTutor";

interface Tutor {
  id: string;
  fullName: string;
  contactNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  age: number;
  nationality: string;
  race: string;
  status: string;
  classType: string[];
  tutoringLevels: string[];
  preferredLocations: string[];
  tutorType: string[];
  yearsExperience: number;
  highestEducation: string;
  academicDetails?: string;
  teachingSummary: string;
  studentResults: string;
  sellingPoints: string;
  agreeTerms: boolean;
  agreeAssignmentInfo: boolean;
  certificatesAndQualifications: { id?: string; type: string; url: string }[];
  createdAt?: string;
}

type TutorStatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "suspended"
  | "rejected";

type FilterOption = {
  value: string;
  label: string;
};

function SearchableFilterSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  onChange,
}: {
  value: string;
  options: FilterOption[];
  placeholder: string;
  searchPlaceholder: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchText("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = searchText.trim()
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchText.trim().toLowerCase()),
      )
    : options;

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-800 shadow-xs outline-none transition-[color,box-shadow] focus:border-brand-300 focus:ring-[3px] focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
      >
        <span
          className={
            selectedOption?.value !== "all"
              ? "truncate"
              : "truncate text-gray-400 dark:text-white/30"
          }
        >
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[9999] mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-2 dark:border-gray-700">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-sm text-gray-800 outline-none focus:border-brand-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white/90"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchText("");
                  }}
                  className={`flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm ${
                    option.value === value
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                      : "text-gray-700 hover:bg-gray-50 dark:text-white/90 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <CheckCircle className="ml-2 h-4 w-4 shrink-0 text-brand-500" />
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                No results found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls =
    TUTOR_STATUS_BADGE_CLASSES[status] ?? TUTOR_STATUS_BADGE_CLASSES["pending"];
  return (
    <span
      className={`inline-block text-xs font-semibold capitalize rounded-full px-2.5 py-0.5 border ${cls}`}
    >
      {status}
    </span>
  );
}

// ─── Shared modal wrapper ─────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Reject dialog ────────────────────────────────────────────────────────────

function RejectDialog({
  tutor,
  onClose,
}: {
  tutor: Tutor;
  onClose: () => void;
}) {
  const [updateTutorStatus, { isLoading }] = useUpdateTutorStatusMutation();
  const [message, setMessage] = useState("");

  const handleReject = async () => {
    const adminId = getAdminId();
    const result = await updateTutorStatus({
      id: tutor.id,
      status: "rejected",
      adminId,
      rejectionMessage: message.trim(),
    });
    const error = getErrorInApiResult(result);
    if (error) {
      toast.error(`Failed to reject: ${error}`);
      return;
    }
    toast.success(
      `"${tutor.fullName}" has been rejected and notified by email.`,
    );
    onClose();
  };

  return (
    <Modal open onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <XCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Reject Registration
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {tutor.fullName} · {tutor.email}
          </p>
        </div>
      </div>

      {/* Message */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Reason / Message{" "}
        <span className="text-gray-400 font-normal">
          (optional — sent in the email)
        </span>
      </label>
      <textarea
        rows={4}
        maxLength={1000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. Your submitted documents were incomplete. Please re-apply with the correct credentials."
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                   text-sm text-gray-900 dark:text-gray-100 p-3 resize-none
                   focus:outline-none focus:ring-2 focus:ring-red-400 transition"
      />
      <p className="text-xs text-gray-400 text-right mt-1">
        {message.length}/1000
      </p>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-5">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                     disabled:opacity-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleReject}
          disabled={isLoading}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold
                     disabled:opacity-50 transition flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Reject
        </button>
      </div>
    </Modal>
  );
}

// ─── Suspend dialog ───────────────────────────────────────────────────────────

function SuspendDialog({
  tutor,
  onClose,
}: {
  tutor: Tutor;
  onClose: () => void;
}) {
  const [updateTutorStatus, { isLoading }] = useUpdateTutorStatusMutation();

  const handleSuspend = async () => {
    const adminId = getAdminId();
    const result = await updateTutorStatus({
      id: tutor.id,
      status: "suspended",
      adminId,
    });
    const error = getErrorInApiResult(result);
    if (error) {
      toast.error(`Failed to suspend: ${error}`);
      return;
    }
    toast.success(
      `"${tutor.fullName}" has been suspended and notified by email.`,
    );
    onClose();
  };

  return (
    <Modal open onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <ShieldOff className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Suspend Tutor
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {tutor.fullName} · {tutor.email}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        Are you sure you want to suspend{" "}
        <strong className="text-gray-800 dark:text-gray-200">
          {tutor.fullName}
        </strong>
        ?
        <br />
        <span className="mt-1 block">
          They will receive an email notification and will no longer be able to
          log in or re-register with this email address.
        </span>
      </p>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                     disabled:opacity-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSuspend}
          disabled={isLoading}
          className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-semibold
                     disabled:opacity-50 transition flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Suspend
        </button>
      </div>
    </Modal>
  );
}

// ─── Main status actions cell ─────────────────────────────────────────────────

function TutorStatusActions({ tutor }: { tutor: Tutor }) {
  const [updateTutorStatus, { isLoading: isApproving }] =
    useUpdateTutorStatusMutation();

  const [showReject, setShowReject] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = React.useRef<HTMLButtonElement>(null);

  const status = (tutor.status || "pending").toLowerCase();

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setDropdownOpen((o) => !o);
  };

  const handleApprove = async () => {
    setDropdownOpen(false);
    const adminId = getAdminId();
    const result = await updateTutorStatus({
      id: tutor.id,
      status: "approved",
      adminId,
    });
    const error = getErrorInApiResult(result);
    if (error) {
      toast.error(`Failed to approve: ${error}`);
      return;
    }
    toast.success(
      `"${tutor.fullName}" approved. Linked tutor user was created or updated.`,
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Current status badge */}
        <StatusBadge status={status} />

        {/* Dropdown trigger */}
        <button
          ref={btnRef}
          title="Change status"
          disabled={isApproving}
          onClick={openDropdown}
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md
                     border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-700
                     disabled:opacity-50 transition shadow-sm"
        >
          {isApproving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
          Change
        </button>
      </div>

      {/* Fixed-position dropdown — rendered outside any overflow:hidden parent */}
      {dropdownOpen && (
        <>
          {/* Click-away overlay */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setDropdownOpen(false)}
          />

          {/* Menu — fixed so it escapes table overflow clipping */}
          <div
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed z-[9999] w-44 rounded-lg border border-gray-200
                       dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl
                       py-1 overflow-hidden"
          >
            {status !== "approved" && (
              <button
                onClick={handleApprove}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700
                           hover:bg-green-50 dark:hover:bg-green-950/40 transition"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                Approve
              </button>
            )}

            {status !== "rejected" && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setShowReject(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600
                           hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                Reject
              </button>
            )}

            {status !== "suspended" && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setShowSuspend(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600
                           dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <ShieldOff className="w-4 h-4 shrink-0" />
                Suspend
              </button>
            )}
          </div>
        </>
      )}

      {showReject && (
        <RejectDialog tutor={tutor} onClose={() => setShowReject(false)} />
      )}
      {showSuspend && (
        <SuspendDialog tutor={tutor} onClose={() => setShowSuspend(false)} />
      )}
    </>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────────

export default function TutorsList() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TutorStatusFilter>("all");
  const [tutorTypeFilter, setTutorTypeFilter] = useState("all");
  const [classTypeFilter, setClassTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  }, [
    debouncedSearchTerm,
    classTypeFilter,
    gradeFilter,
    locationFilter,
    statusFilter,
    subjectFilter,
    tutorTypeFilter,
  ]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      sortBy: "createdAt:desc",
      ...(debouncedSearchTerm.trim()
        ? { search: debouncedSearchTerm.trim() }
        : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(tutorTypeFilter !== "all" ? { tutorType: tutorTypeFilter } : {}),
      ...(classTypeFilter !== "all" ? { classType: classTypeFilter } : {}),
      ...(locationFilter !== "all"
        ? { preferredLocations: locationFilter }
        : {}),
      ...(gradeFilter !== "all" ? { gradeId: gradeFilter } : {}),
      ...(subjectFilter !== "all" ? { subjectId: subjectFilter } : {}),
    }),
    [
      classTypeFilter,
      debouncedSearchTerm,
      gradeFilter,
      limit,
      locationFilter,
      page,
      statusFilter,
      subjectFilter,
      tutorTypeFilter,
    ],
  );

  const { data, isFetching } = useFetchTutorsQuery(queryParams);
  const { data: gradesData } = useFetchGradesQuery({
    page: 1,
    limit: 1000,
    sortBy: "title:asc",
  });
  const { data: selectedGradeData } = useFetchGradeByIdQuery(gradeFilter, {
    skip: gradeFilter === "all",
  });
  const { data: subjectsData } = useFetchSubjectsQuery({
    page: 1,
    limit: 1000,
    sortBy: "title:asc",
  });

  const tutors = data?.results || [];
  const totalPages = data?.totalPages || 1;
  const totalResults = data?.totalResults || tutors.length;
  const locationOptions = useMemo(
    () => [
      { value: "all", label: "All locations" },
      ...PREFERRED_LOCATION_OPTIONS.map((option) => ({
        value: option.value,
        label: option.text,
      })),
    ],
    [],
  );
  const gradeOptions = useMemo(
    () => [
      { value: "all", label: "All grades" },
      ...sortBySchoolGradeOrder(gradesData?.results || []).map((grade) => ({
        value: grade.id,
        label: grade.title,
      })),
    ],
    [gradesData],
  );
  const subjectOptions = useMemo(
    () => [
      { value: "all", label: "All subjects" },
      ...(
        gradeFilter !== "all"
          ? selectedGradeData?.subjects || []
          : subjectsData?.results || []
      ).map((subject) => ({
        value: subject.id,
        label: subject.title,
      })),
    ],
    [gradeFilter, selectedGradeData?.subjects, subjectsData?.results],
  );
  const hasFilters = Boolean(
    searchTerm ||
      statusFilter !== "all" ||
      tutorTypeFilter !== "all" ||
      classTypeFilter !== "all" ||
      locationFilter !== "all" ||
      gradeFilter !== "all" ||
      subjectFilter !== "all",
  );

  const handlePageChange = (newPage: number) => setPage(newPage);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTutorTypeFilter("all");
    setClassTypeFilter("all");
    setLocationFilter("all");
    setGradeFilter("all");
    setSubjectFilter("all");
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  };

  const getSafeValue = (
    value: string | number | undefined | null,
    fallback = "N/A",
  ) => {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    )
      return fallback;
    return value;
  };

  const columns = useMemo(
    () => [
      {
        key: "fullName",
        header: "Full Name",
        className:
          "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
        render: (row: Tutor) => (
          <span
            title={row.fullName || "No name provided"}
            className={`truncate block ${!row.fullName ? "text-gray-400 italic" : ""}`}
            style={{ width: "inherit" }}
          >
            {getSafeValue(row.fullName, "No name provided")}
          </span>
        ),
      },
      {
        key: "email",
        header: "Email",
        className:
          "min-w-[150px] max-w-[250px] truncate overflow-hidden cursor-default",
        render: (row: Tutor) => (
          <span
            title={row.email || "No email provided"}
            className={`truncate block ${!row.email ? "text-gray-400 italic" : ""}`}
          >
            {getSafeValue(row.email, "No email provided")}
          </span>
        ),
      },
      {
        key: "contactNumber",
        header: "Contact Number",
        className:
          "min-w-[140px] max-w-[200px] truncate overflow-hidden cursor-default",
        render: (row: Tutor) => (
          <span
            title={row.contactNumber || "No contact provided"}
            className={`truncate block ${!row.contactNumber ? "text-gray-400 italic" : ""}`}
          >
            {getSafeValue(row.contactNumber, "No contact provided")}
          </span>
        ),
      },

      // Status + actions
      {
        key: "status",
        header: "Status / Actions",
        className: "min-w-[260px] overflow-visible",
        render: (row: Tutor) => <TutorStatusActions tutor={row} />,
      },

      // View button
      {
        key: "view",
        header: <div className="text-center w-full">View</div>,
        className:
          "min-w-[80px] max-w-[80px] sticky right-[240px] z-20 bg-white dark:bg-gray-900",
        render: (row: Tutor) => (
          <div className="flex justify-center items-center w-full">
            <ViewTutor tutor={row} />
          </div>
        ),
      },

      // Edit button
      {
        key: "edit",
        header: <div className="text-center w-full">Edit</div>,
        className:
          "min-w-[80px] max-w-[80px] sticky right-[160px] z-20 bg-white dark:bg-gray-900",
        render: (row: Tutor) => (
          <div className="flex justify-center items-center w-full">
            <EditTutor id={row.id} />
          </div>
        ),
      },

      // Reset Password
      {
        key: "resetPassword",
        header: (
          <span
            className="truncate w-full text-center block max-w-[100px]"
            title="Reset Password"
          >
            Reset Password
          </span>
        ),
        className:
          "min-w-[80px] max-w-[80px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
        render: (row: Tutor) => {
          const isApproved = row.status?.toLowerCase() === "approved";

          return (
            <div className="flex justify-center items-center w-full">
              <div
                className={!isApproved ? "cursor-not-allowed opacity-50" : ""}
                title={
                  !isApproved
                    ? "Password reset is only available for approved tutors"
                    : ""
                }
              >
                <ResetPassword userId={row.id} disabled={!isApproved} />
              </div>
            </div>
          );
        },
      },

      // Delete button
      {
        key: "delete",
        header: <div className="text-center w-full">Delete</div>,
        className:
          "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
        render: (row: Tutor) => (
          <div className="flex justify-center items-center w-full">
            <DeleteTutor
              tutorId={row.id}
              tutorName={row.fullName}
              tutorEmail={row.email}
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
              Tutor filters
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/60">
              Search by name, email, or contact number, then narrow results by
              status, tutor type, class type, location, grade, and subject.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 lg:w-auto"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
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
                className="h-11 w-full pl-10 pr-10"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as TutorStatusFilter)
              }
            >
              <SelectTrigger className="h-11 min-h-11 w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {TUTOR_STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tutor type
            </label>
            <Select value={tutorTypeFilter} onValueChange={setTutorTypeFilter}>
              <SelectTrigger className="h-11 min-h-11 w-full">
                <SelectValue placeholder="Filter by tutor type" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All tutor types</SelectItem>
                {TUTOR_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Class type
            </label>
            <Select value={classTypeFilter} onValueChange={setClassTypeFilter}>
              <SelectTrigger className="h-11 min-h-11 w-full">
                <SelectValue placeholder="Filter by class type" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All class types</SelectItem>
                {CLASS_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preferred location
            </label>
            <SearchableFilterSelect
              value={locationFilter}
              options={locationOptions}
              placeholder="Filter by location"
              searchPlaceholder="Search locations..."
              onChange={setLocationFilter}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Grade
            </label>
            <SearchableFilterSelect
              value={gradeFilter}
              options={gradeOptions}
              placeholder="Filter by grade"
              searchPlaceholder="Search grades..."
              onChange={(value) => {
                setGradeFilter(value);
                setSubjectFilter("all");
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Subject
            </label>
            <SearchableFilterSelect
              value={subjectFilter}
              options={subjectOptions}
              placeholder="Filter by subject"
              searchPlaceholder="Search subjects..."
              onChange={setSubjectFilter}
            />
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
        isLoading={isFetching}
        emptyMessage="No tutors found for the current search or status filter."
      />
    </div>
  );
}
