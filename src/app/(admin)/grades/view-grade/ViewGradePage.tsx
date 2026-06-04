"use client";

import DataTable from "@/components/tables/DataTable";
import { TABLE_CONFIG } from "@/configs/table";
import {
  useDeleteGradeMutation,
  useFetchGradesQuery,
} from "@/store/api/splits/grades";
import { fadeUp, staggerContainer } from "@/types/animation-types";
import { sortByLatestTimestampDesc } from "@/utils/table-sorting";

import { Grade, Subject } from "@/types/grade-types";
import { Layers3, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { DeleteGrade } from "../DeleteGrade";
import { GradeDetails } from "../ViewDetails";
import { UpdateGrade } from "../edit-grade/UpdateGrade";

export default function SubjectsTable() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [deleteGrade] = useDeleteGradeMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;

  const { data, isLoading } = useFetchGradesQuery({
    page,
    limit,
    sortBy: "updatedAt:desc",
  });

  const totalPages = data?.totalPages || 0;
  const totalResults = data?.totalResults || 0;

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

  const getSafeArray = (value: Subject[] | undefined | null): Subject[] => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value;
  };

  const filteredGrades = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const grades = data?.results || [];

    if (!query) return sortByLatestTimestampDesc(grades);

    return sortByLatestTimestampDesc(
      grades.filter((grade: Grade) =>
        getSafeValue(grade.title, "").toLowerCase().includes(query),
      ),
    );
  }, [data, searchTerm]);

  const columns = [
    {
      key: "title",
      header: "Title",
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Grade) => {
        const safeTitle = getSafeValue(row.title, "No title provided");
        return (
          <span
            title={`Title: ${safeTitle}`}
            className={`block truncate ${!row.title ? "italic text-gray-400" : ""}`}
            style={{ width: "inherit" }}
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
            className={`block truncate ${!row.description ? "italic text-gray-400" : ""}`}
          >
            {safeDescription}
          </span>
        );
      },
    },
    {
      key: "subjects",
      header: "Subjects",
      className: "min-w-[120px] max-w-[150px] cursor-default",
      render: (row: Grade) => {
        const safeSubjects = getSafeArray(row.subjects);
        const subjectCount = safeSubjects.length;

        return (
          <span
            title={`${subjectCount} subject${subjectCount !== 1 ? "s" : ""}`}
            className={
              subjectCount === 0
                ? "italic text-gray-400"
                : "text-blue-600 dark:text-blue-400"
            }
          >
            {subjectCount === 0
              ? "No subjects"
              : `${subjectCount} subject${subjectCount !== 1 ? "s" : ""}`}
          </span>
        );
      },
    },
    {
      key: "view",
      header: <div className="w-full text-center">View</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[160px] z-20 bg-white dark:bg-gray-900",
      render: (row: Grade) => (
        <div className="flex w-full items-center justify-center">
          <GradeDetails
            title={getSafeValue(row.title, "No title provided")}
            description={getSafeValue(
              row.description,
              "No description provided",
            )}
            subjects={getSafeArray(row.subjects)}
          />
        </div>
      ),
    },
    {
      key: "edit",
      header: <div className="w-full text-center">Edit</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
      render: (row: Grade) => (
        <div className="flex w-full items-center justify-center">
          <UpdateGrade
            id={row.id}
            title={getSafeValue(row.title, "")}
            description={getSafeValue(row.description, "")}
            subjects={getSafeArray(row.subjects).map(
              (subject) => subject.title,
            )}
          />
        </div>
      ),
    },
    {
      key: "delete",
      header: <div className="w-full text-center">Delete</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Grade) => (
        <div className="flex w-full items-center justify-center">
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
        className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Grades
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Filter grades by title and manage them across desktop and mobile.
          </p>
        </div>

        <motion.div layout className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(TABLE_CONFIG.DEFAULT_PAGE);
            }}
            placeholder="Filter by name..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
          />
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp} className="hidden md:block">
        <motion.div layout className="overflow-hidden rounded-2xl">
          <DataTable
            columns={columns}
            data={filteredGrades}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalResults={searchTerm ? filteredGrades.length : totalResults}
            limit={limit}
            isLoading={isLoading}
            bulkDelete={{
              entityName: "grade",
              deleteRow: (row) => deleteGrade(String(row.id)).unwrap(),
            }}
          />
        </motion.div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:hidden"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-4 h-9 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            </motion.div>
          ))
        ) : filteredGrades.length > 0 ? (
          filteredGrades.map((row) => {
            const safeTitle = getSafeValue(row.title, "No title provided");
            const safeDescription = getSafeValue(
              row.description,
              "No description provided",
            );
            const safeSubjects = getSafeArray(row.subjects);
            const subjectCount = safeSubjects.length;

            return (
              <motion.div
                key={row.id}
                variants={fadeUp}
                layout
                whileHover={{ y: -3 }}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className={`truncate text-sm font-semibold text-gray-900 dark:text-white ${
                        !row.title ? "italic text-gray-400" : ""
                      }`}
                    >
                      {safeTitle}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                      {safeDescription}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <Layers3 className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Subjects
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      subjectCount === 0
                        ? "italic text-gray-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {subjectCount === 0
                      ? "No subjects"
                      : `${subjectCount} subject${subjectCount !== 1 ? "s" : ""}`}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="flex justify-center rounded-xl border border-gray-200 p-2 dark:border-gray-700">
                    <GradeDetails
                      title={safeTitle}
                      description={safeDescription}
                      subjects={safeSubjects}
                    />
                  </div>
                  <div className="flex justify-center rounded-xl border border-gray-200 p-2 dark:border-gray-700">
                    <UpdateGrade
                      id={row.id}
                      title={getSafeValue(row.title, "")}
                      description={getSafeValue(row.description, "")}
                      subjects={safeSubjects.map((subject) => subject.title)}
                    />
                  </div>
                  <div className="flex justify-center rounded-xl border border-gray-200 p-2 dark:border-gray-700">
                    <DeleteGrade gradeId={row.id} />
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                No grades found
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try a different title in the filter input.
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {!isLoading && filteredGrades.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900 md:block"
        >
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            No grades found
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try a different title in the filter input.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
