"use client";

import DataTable, { type Column } from "@/components/tables/DataTable";
import { TABLE_CONFIG } from "@/configs/table";
import { useDebounce } from "@/hooks/useDebounce";
import { useFetchSubjectsQuery } from "@/store/api/splits/subjects";
import { fadeUp, staggerContainer } from "@/types/animation-types";
import { Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DeleteSubject } from "./DeleteSubject";
import { UpdateSubject } from "./edit-subject/UpdateSubject";
import { SubjectDetails } from "./ViewDetails";

interface Subject {
  id: string;
  title?: string;
  description?: string;
  createdAt?: string;
}

export default function SubjectsTable() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const subjectsQuery = useMemo(
    () => ({
      page,
      limit,
      sortBy: "createdAt:desc",
      ...(debouncedSearchTerm.trim()
        ? { title: debouncedSearchTerm.trim() }
        : {}),
    }),
    [debouncedSearchTerm, limit, page],
  );

  const { data, isFetching } = useFetchSubjectsQuery(subjectsQuery);

  const subjects = data?.results || [];
  const totalResults = data?.totalResults || 0;
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getSafeValue = (
    value: string | undefined | null,
    fallback = "N/A",
  ): string => {
    if (value === undefined || value === null || value.trim() === "") {
      return fallback;
    }
    return value;
  };

  const columns: Column<Subject>[] = [
    {
      key: "title",
      header: "Title",
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Subject) => {
        const safeTitle = getSafeValue(row.title, "No title provided");
        return (
          <span
            title={`Title: ${safeTitle}`}
            className={`block truncate ${
              !row.title ? "italic text-gray-400" : ""
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
      className: "min-w-[200px] max-w-[300px] truncate overflow-hidden",
      render: (row: Subject) => {
        const safeDescription = getSafeValue(
          row.description,
          "No description provided",
        );
        return (
          <span
            title={`Description: ${safeDescription}`}
            className={`block truncate ${
              !row.description ? "italic text-gray-400" : ""
            }`}
          >
            {safeDescription}
          </span>
        );
      },
    },
    {
      key: "view",
      header: <div className="w-full text-center">View</div>,
      align: "center",
      render: (row: Subject) => (
        <div className="flex justify-center">
          <SubjectDetails
            title={getSafeValue(row.title)}
            description={getSafeValue(row.description)}
          />
        </div>
      ),
    },
    {
      key: "edit",
      header: <div className="w-full text-center">Edit</div>,
      align: "center",
      render: (row: Subject) => (
        <div className="flex justify-center">
          <UpdateSubject
            id={row.id}
            title={getSafeValue(row.title, "")}
            description={getSafeValue(row.description, "")}
          />
        </div>
      ),
    },
    {
      key: "delete",
      header: <div className="w-full text-center">Delete</div>,
      align: "center",
      render: (row: Subject) => (
        <div className="flex justify-center">
          <DeleteSubject subjectId={row.id} />
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
        className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:bg-gray-900 sm:flex-row sm:justify-between"
      >
        <div>
          <h2 className="font-semibold">Subjects</h2>
          <p className="text-sm text-gray-500">
            Search subjects by title. Results load page by page.
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(TABLE_CONFIG.DEFAULT_PAGE);
            }}
            placeholder="Search by title"
            className="h-11 w-full rounded-xl border pl-10 pr-10 text-sm"
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
      </motion.div>

      <DataTable
        columns={columns}
        data={subjects}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalResults={totalResults}
        limit={limit}
        isLoading={isFetching}
        emptyMessage="No subjects found for the current search."
      />
    </motion.div>
  );
}
