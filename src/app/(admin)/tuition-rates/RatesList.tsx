"use client";

import DataTable from "@/components/tables/DataTable";
import {
  SortableHeader,
  type SortDirection,
} from "@/components/tables/SortableHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TABLE_CONFIG } from "@/configs/table";
import {
  useFetchGradeByIdQuery,
  useFetchGradesQuery,
} from "@/store/api/splits/grades";
import { useFetchSubjectsQuery } from "@/store/api/splits/subjects";
import { useFetchTuitionRatesQuery } from "@/store/api/splits/tuition-rates";
import { sortBySchoolGradeOrder } from "@/utils/grade-filter-order";
import { RotateCcw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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

type TuitionRateSortField = "subject" | "grade";
type TuitionRateSort = {
  field: TuitionRateSortField;
  direction: SortDirection;
} | null;

const SORT_FETCH_LIMIT = 10000;

export default function TuitionRatesTable() {
  const [page, setPage] = useState(TABLE_CONFIG.DEFAULT_PAGE);
  const [gradeFilter, setGradeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortCriteria, setSortCriteria] = useState<TuitionRateSort>(null);
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;

  const tuitionRatesQuery = useMemo(
    () => ({
      page: sortCriteria ? TABLE_CONFIG.DEFAULT_PAGE : page,
      limit: sortCriteria ? SORT_FETCH_LIMIT : limit,
      sortBy: "createdAt:desc",
      ...(gradeFilter ? { grade: gradeFilter } : {}),
      ...(subjectFilter ? { subject: subjectFilter } : {}),
    }),
    [gradeFilter, limit, page, sortCriteria, subjectFilter],
  );

  const { data, isFetching } = useFetchTuitionRatesQuery(tuitionRatesQuery);
  const { data: gradesData, isFetching: isFetchingGrades } =
    useFetchGradesQuery({
      page: 1,
      limit: 1000,
      sortBy: "title:asc",
    });
  const { data: selectedGradeData, isFetching: isFetchingGradeSubjects } =
    useFetchGradeByIdQuery(gradeFilter, {
      skip: !gradeFilter,
    });
  const { data: subjectsData, isFetching: isFetchingSubjects } =
    useFetchSubjectsQuery({
      page: 1,
      limit: 1000,
      sortBy: "title:asc",
    });

  const sortedTuitionRates = useMemo(() => {
    const rates = data?.results || [];
    if (!sortCriteria) return rates;

    return [...rates].sort((first, second) => {
      const firstValue = first[sortCriteria.field]?.title || "";
      const secondValue = second[sortCriteria.field]?.title || "";
      const comparison = firstValue.localeCompare(secondValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortCriteria.direction === "asc" ? comparison : -comparison;
    });
  }, [data?.results, sortCriteria]);
  const tuitionRates = useMemo(
    () =>
      sortCriteria
        ? sortedTuitionRates.slice((page - 1) * limit, page * limit)
        : sortedTuitionRates,
    [limit, page, sortCriteria, sortedTuitionRates],
  );
  const totalResults = sortCriteria
    ? sortedTuitionRates.length
    : data?.totalResults || 0;
  const totalPages = sortCriteria
    ? Math.max(1, Math.ceil(totalResults / limit))
    : data?.totalPages || 1;
  const gradeOptions = useMemo(
    () => sortBySchoolGradeOrder(gradesData?.results || []),
    [gradesData?.results],
  );
  const subjectOptions = gradeFilter
    ? selectedGradeData?.subjects || []
    : subjectsData?.results || [];
  const isSubjectLoading = gradeFilter
    ? isFetchingGradeSubjects
    : isFetchingSubjects;
  const hasFilters = Boolean(gradeFilter || subjectFilter);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleToggleSort = useCallback((field: TuitionRateSortField) => {
    setSortCriteria((current) => {
      if (current?.field !== field) return { field, direction: "asc" };
      if (current.direction === "asc") return { field, direction: "desc" };
      return null;
    });
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  }, []);

  const resetFilters = () => {
    setGradeFilter("");
    setSubjectFilter("");
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  };

  const columns = [
    {
      key: "grade",
      header: (
        <SortableHeader
          label="Grade"
          direction={
            sortCriteria?.field === "grade" ? sortCriteria.direction : null
          }
          onToggle={() => handleToggleSort("grade")}
        />
      ),
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
      header: (
        <SortableHeader
          label="Subject"
          direction={
            sortCriteria?.field === "subject" ? sortCriteria.direction : null
          }
          onToggle={() => handleToggleSort("subject")}
        />
      ),
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
            Filter rates by grade and subject. Results load page by page.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-center">
          <Select
            value={gradeFilter || "all"}
            onValueChange={(value) => {
              setGradeFilter(value === "all" ? "" : value);
              setSubjectFilter("");
              setPage(TABLE_CONFIG.DEFAULT_PAGE);
            }}
          >
            <SelectTrigger
              className="h-11 min-h-11 w-full sm:flex-1"
              isLoading={isFetchingGrades}
            >
              <SelectValue placeholder="All grades" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All grades</SelectItem>
              {gradeOptions.map((grade) => (
                <SelectItem key={grade.id} value={grade.id}>
                  {grade.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={subjectFilter || "all"}
            onValueChange={(value) => {
              setSubjectFilter(value === "all" ? "" : value);
              setPage(TABLE_CONFIG.DEFAULT_PAGE);
            }}
          >
            <SelectTrigger
              className="h-11 min-h-11 w-full sm:flex-1"
              isLoading={isSubjectLoading}
            >
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All subjects</SelectItem>
              {subjectOptions.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              aria-label="Reset filters"
              title="Reset filters"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4" />
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
        emptyMessage="No tuition rates found for the current filters."
        preserveDataOrder={Boolean(sortCriteria)}
      />
    </div>
  );
}
