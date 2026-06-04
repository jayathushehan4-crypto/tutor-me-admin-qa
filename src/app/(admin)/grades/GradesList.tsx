"use client";

import DataTable, { type Column } from "@/components/tables/DataTable";
import {
  SortableHeader,
  type SortDirection,
} from "@/components/tables/SortableHeader";
import { Input } from "@/components/ui/input";
import { TABLE_CONFIG } from "@/configs/table";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useDeleteGradeMutation,
  useFetchGradesQuery,
} from "@/store/api/splits/grades";
import { fadeUp, staggerContainer } from "@/types/animation-types";
import { escapeRegex } from "@/utils/form";
import { Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { DeleteGrade } from "./DeleteGrade";
import { GradeDetails } from "./ViewDetails";
import { UpdateGrade } from "./edit-grade/UpdateGrade";

interface Subject {
  id: string;
  title: string;
}

interface Grade {
  id: string;
  title?: string;
  description?: string;
  subjects?: Subject[];
  createdAt?: string;
}

export default function GradesTable() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [deleteGrade] = useDeleteGradeMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const [titleSortDirection, setTitleSortDirection] =
    useState<SortDirection | null>(null);
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const gradesQuery = useMemo(
    () => ({
      page,
      limit,
      sortBy: titleSortDirection
        ? `title:${titleSortDirection}`
        : "createdAt:desc",
      ...(debouncedSearchTerm.trim()
        ? { title: escapeRegex(debouncedSearchTerm.trim()) }
        : {}),
    }),
    [debouncedSearchTerm, limit, page, titleSortDirection],
  );

  const { data, isFetching } = useFetchGradesQuery(gradesQuery);

  const getSafeValue = (
    value: string | undefined | null,
    fallback = "N/A",
  ): string => {
    if (value === undefined || value === null || value.trim() === "") {
      return fallback;
    }
    return value;
  };

  const getSafeArray = (value: Subject[] | undefined | null): Subject[] => {
    if (!Array.isArray(value)) return [];
    return value;
  };

  const grades = data?.results || [];
  const totalResults = data?.totalResults || 0;
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleToggleTitleSort = useCallback(() => {
    setTitleSortDirection((current) => {
      if (!current) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  }, []);

  const columns: Column<Grade>[] = [
    {
      key: "title",
      header: (
        <SortableHeader
          label="Title"
          direction={titleSortDirection}
          onToggle={handleToggleTitleSort}
        />
      ),
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Grade) => {
        const safeTitle = getSafeValue(row.title, "No title provided");
        return (
          <span
            title={`Title: ${safeTitle}`}
            className={`truncate block ${
              !row.title ? "text-gray-400 italic" : ""
            }`}
          >
            {safeTitle}
          </span>
        );
      },
    },
    {
      key: "description",
      header: "Description",
      className:
        "min-w-[200px] max-w-[300px] truncate overflow-hidden cursor-default",
      render: (row: Grade) => {
        const safeDescription = getSafeValue(
          row.description,
          "No description provided",
        );
        return (
          <span
            title={`Description: ${safeDescription}`}
            className={`truncate block ${
              !row.description ? "text-gray-400 italic" : ""
            }`}
          >
            {safeDescription}
          </span>
        );
      },
    },
    {
      key: "subjects",
      header: "Subjects",
      className: "min-w-[120px]",
      render: (row: Grade) => {
        const safeSubjects = getSafeArray(row.subjects);
        const count = safeSubjects.length;

        return (
          <span
            className={
              count === 0
                ? "text-gray-400 italic"
                : "text-blue-600 dark:text-blue-400"
            }
          >
            {count === 0 ? "No subjects" : `${count} subjects`}
          </span>
        );
      },
    },
    {
      key: "view",
      header: <div className="text-center">View</div>,
      align: "center",
      render: (row: Grade) => (
        <div className="flex justify-center">
          <GradeDetails
            title={getSafeValue(row.title)}
            description={getSafeValue(row.description)}
            subjects={getSafeArray(row.subjects)}
          />
        </div>
      ),
    },
    {
      key: "edit",
      header: <div className="text-center">Edit</div>,
      align: "center",
      render: (row: Grade) => (
        <div className="flex justify-center">
          <UpdateGrade
            id={row.id}
            title={getSafeValue(row.title, "")}
            description={getSafeValue(row.description, "")}
            subjects={getSafeArray(row.subjects).map((s) => s.title)}
          />
        </div>
      ),
    },
    {
      key: "delete",
      header: <div className="text-center">Delete</div>,
      align: "center",
      render: (row: Grade) => (
        <div className="flex justify-center">
          <DeleteGrade gradeId={row.id} />
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="space-y-4"
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:flex-row sm:justify-between"
      >
        <div>
          <h2 className="font-semibold">Grades</h2>
          <p className="text-sm text-gray-500">Search grades by title</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title"
              className="h-11 w-full pl-10 pr-10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setPage(TABLE_CONFIG.DEFAULT_PAGE);
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <DataTable
        columns={columns}
        data={grades}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalResults={totalResults}
        limit={limit}
        isLoading={isFetching}
        emptyMessage="No grades found for the current search."
        preserveDataOrder={Boolean(titleSortDirection)}
        bulkDelete={{
          entityName: "grade",
          deleteRow: (row) => deleteGrade(String(row.id)).unwrap(),
        }}
      />
    </motion.div>
  );
}
