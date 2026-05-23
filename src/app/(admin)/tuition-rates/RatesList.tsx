"use client";

import DataTable from "@/components/tables/DataTable";
import { Input } from "@/components/ui/input";
import { TABLE_CONFIG } from "@/configs/table";
import { useDebounce } from "@/hooks/useDebounce";
import { useFetchTuitionRatesQuery } from "@/store/api/splits/tuition-rates";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteTuitionRate } from "./DeleteTuitionRate";
import { TuitionRateDetails } from "./ViewDetails";
import { UpdateTuitionRate } from "./edit-tuition-rates/UpdateTuitionRate";

interface RateDetail {
  id: string;
  title: string;
}

interface TuitionRateObject {
  _id?: string;
  minimumRate: string;
  maximumRate: string;
}

interface TuitionRateData {
  id: string;
  subject: RateDetail;
  grade: RateDetail | null;
  universityStudentsRate: TuitionRateObject;
  partTimeTutorRate: TuitionRateObject;
  fullTimeTutorRate: TuitionRateObject;
  moeTeacherRate: TuitionRateObject;
}

export default function TuitionRatesTable() {
  const [page, setPage] = useState(TABLE_CONFIG.DEFAULT_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const tuitionRatesQuery = useMemo(
    () => ({
      page,
      limit,
      sortBy: "createdAt:desc",
      ...(debouncedSearchTerm.trim()
        ? { search: debouncedSearchTerm.trim() }
        : {}),
    }),
    [debouncedSearchTerm, limit, page],
  );

  const { data, isFetching } = useFetchTuitionRatesQuery(tuitionRatesQuery);

  const tuitionRates = data?.results || [];
  const totalPages = data?.totalPages || 1;
  const totalResults = data?.totalResults || 0;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const columns = [
    {
      key: "grade",
      header: "Grade",
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
      render: (row: TuitionRateData) => (
        <span
          title={row.grade?.title || "N/A"}
          className="truncate block"
          style={{ width: "inherit" }}
        >
          {row.grade?.title || "N/A"}
        </span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden cursor-default",
      render: (row: TuitionRateData) => row.subject?.title || "N/A",
    },
    {
      key: "view",
      header: <div className="w-full text-center">View</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[160px] z-20 bg-white dark:bg-gray-900",
      render: (row: TuitionRateData) => (
        <div className="w-full flex justify-center items-center">
          <TuitionRateDetails
            grade={row.grade || { id: "", title: "N/A" }}
            subject={row.subject || { id: "", title: "N/A" }}
            universityStudentsRate={row.universityStudentsRate}
            partTimeTutorRate={row.partTimeTutorRate}
            fullTimeTutorRate={row.fullTimeTutorRate}
            moeTeacherRate={row.moeTeacherRate}
          />
        </div>
      ),
    },
    {
      key: "edit",
      header: <div className="w-full text-center">Edit</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
      render: (row: TuitionRateData) => (
        <div className="w-full flex justify-center items-center">
          <UpdateTuitionRate
            id={row.id}
            subject={row.subject?.id || ""}
            grade={row.grade?.id || ""}
            universityStudentsRate={row.universityStudentsRate}
            partTimeTutorRate={row.partTimeTutorRate}
            fullTimeTutorRate={row.fullTimeTutorRate}
            moeTeacherRate={row.moeTeacherRate}
          />
        </div>
      ),
    },
    {
      key: "delete",
      header: <div className="w-full text-center">Delete</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
      render: (row: TuitionRateData) => (
        <div className="w-full flex justify-center items-center">
          <DeleteTuitionRate gradeId={row.id || ""} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white/90">
            Tuition Rates
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            Search rates by grade or subject. Results load page by page.
          </p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Search grade or subject"
            className="h-11 w-full pl-10 pr-10"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setPage(1);
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tuitionRates}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalResults={totalResults}
        limit={limit}
        isLoading={isFetching}
        emptyMessage="No tuition rates found for the current search."
      />
    </div>
  );
}
