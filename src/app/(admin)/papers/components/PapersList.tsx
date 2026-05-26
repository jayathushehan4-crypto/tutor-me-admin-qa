"use client";

import DataTable from "@/components/tables/DataTable";
import TablePagination from "@/components/tables/Pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TABLE_CONFIG } from "@/configs/table";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useFetchGradeByIdQuery,
  useFetchGradesQuery,
} from "@/store/api/splits/grades";
import { useFetchPapersQuery } from "@/store/api/splits/papers";
import { useFetchSubjectsQuery } from "@/store/api/splits/subjects";
import { escapeRegex } from "@/utils/form";
import { Copy, FileText, RotateCcw, Search, X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DeletePaper } from "./DeletePaper";
import { EditPaper } from "./edit-paper/EditPaper";
import { PaperDetails } from "./ViewDetails";

interface Grade {
  id: string;
  title: string;
  subjects?: Subject[];
}

interface Subject {
  id: string;
  title: string;
}

interface MediumOption {
  label?: string;
  value?: string;
  title?: string;
}

interface Paper {
  id: string;
  title?: string;
  medium?: string | MediumOption;
  grade?: Grade;
  subject?: Subject;
  year?: string;
  url?: string;
  createdAt?: string;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const normalizeGradeTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const GRADE_FILTER_ORDER_MATCHERS: Array<(title: string) => boolean> = [
  (title) => title.includes("primary") || /grades? 1 4/.test(title),
  (title) => title.includes("scholarship") || /grade 5/.test(title),
  (title) => title.includes("junior secondary") || /grades? 6 9/.test(title),
  (title) =>
    title.includes("ordinary level") &&
    !title.includes("cambridge") &&
    !title.includes("edexcel"),
  (title) =>
    title.includes("advanced level") && title.includes("physical science"),
  (title) =>
    title.includes("advanced level") && title.includes("biological science"),
  (title) => title.includes("advanced level") && title.includes("commerce"),
  (title) => title.includes("advanced level") && /\barts?\b/.test(title),
  (title) => title.includes("advanced level") && title.includes("technology"),
  (title) => title.includes("sports") && title.includes("fitness"),
  (title) => title.includes("communication") && title.includes("speaking"),
  (title) => title.includes("computing"),
  (title) => title.includes("multimedia") && title.includes("design"),
  (title) => title.includes("languages"),
  (title) => title.includes("diploma"),
  (title) => title.includes("cambridge") && title.includes("ordinary level"),
  (title) => title.includes("cambridge") && title.includes("advanced level"),
  (title) => title.includes("edexcel") && title.includes("ordinary level"),
  (title) => title.includes("edexcel") && title.includes("advanced level"),
];

const getGradeFilterRank = (title: string) => {
  const normalizedTitle = normalizeGradeTitle(title);
  const matchedIndex = GRADE_FILTER_ORDER_MATCHERS.findIndex((matcher) =>
    matcher(normalizedTitle),
  );

  return matchedIndex === -1
    ? GRADE_FILTER_ORDER_MATCHERS.length
    : matchedIndex;
};

export default function PapersTable() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [titleFilter, setTitleFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;
  const debouncedTitleFilter = useDebounce(titleFilter, 400);

  const papersQuery = useMemo(
    () => ({
      page,
      limit,
      sortBy: "createdAt:desc",
      ...(debouncedTitleFilter.trim()
        ? { title: escapeRegex(debouncedTitleFilter.trim()) }
        : {}),
      ...(gradeFilter ? { grade: gradeFilter } : {}),
      ...(subjectFilter ? { subject: subjectFilter } : {}),
    }),
    [debouncedTitleFilter, gradeFilter, limit, page, subjectFilter],
  );

  const { data, isFetching } = useFetchPapersQuery(papersQuery);
  const { data: gradesData } = useFetchGradesQuery({
    page: 1,
    limit: 1000,
    sortBy: "title:asc",
  });
  const { data: selectedGradeData, isLoading: isGradeSubjectsLoading } =
    useFetchGradeByIdQuery(gradeFilter, {
      skip: !gradeFilter,
    });
  const { data: subjectsData } = useFetchSubjectsQuery({
    page: 1,
    limit: 1000,
    sortBy: "title:asc",
  });

  const subjectOptions = useMemo(
    () =>
      gradeFilter
        ? selectedGradeData?.subjects || []
        : subjectsData?.results || [],
    [gradeFilter, selectedGradeData?.subjects, subjectsData?.results],
  );
  const gradeOptions = useMemo(
    () =>
      [...(gradesData?.results || [])].sort((gradeA, gradeB) => {
        const rankDifference =
          getGradeFilterRank(gradeA.title) - getGradeFilterRank(gradeB.title);

        return (
          rankDifference || gradeA.title.localeCompare(gradeB.title, "en")
        );
      }),
    [gradesData?.results],
  );

  const papers = data?.results || [];
  const totalResults = data?.totalResults || 0;
  const totalPages = data?.totalPages || 1;
  const hasFilters = Boolean(titleFilter || gradeFilter || subjectFilter);

  const getSafeValue = (value: unknown, fallback = "N/A"): string => {
    if (value === undefined || value === null) {
      return fallback;
    }

    if (typeof value === "object") {
      return fallback;
    }

    const stringValue = String(value);

    if (stringValue.trim() === "") {
      return fallback;
    }

    return stringValue;
  };

  const getSafeNestedValue = (
    obj: { title?: string; id?: string } | undefined | null,
    property: "title" | "id",
    fallback = "N/A",
  ): string => {
    if (!obj || !obj[property]) {
      return fallback;
    }
    return obj[property] || fallback;
  };

  const getSafeMedium = (
    medium: string | MediumOption | undefined | null,
    fallback = "No medium provided",
  ): string => {
    if (!medium) return fallback;

    if (typeof medium === "string") {
      return medium.trim() ? medium : fallback;
    }

    if (typeof medium === "object") {
      const resolved = medium.label || medium.value || medium.title || "";
      return resolved.trim() ? resolved : fallback;
    }

    return fallback;
  };

  const getMediumValueForEdit = (
    medium: string | MediumOption | undefined | null,
  ): string => {
    if (!medium) return "";

    if (typeof medium === "string") {
      return medium;
    }

    return medium.value || medium.label || medium.title || "";
  };

  const isValidUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const copyToClipboard = async (url: string | undefined | null) => {
    const safeUrl = getSafeValue(url, "");
    if (!safeUrl || safeUrl === "N/A") {
      toast.error("No URL to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(safeUrl);
      toast.success("Paper URL copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const resetFilters = () => {
    setTitleFilter("");
    setGradeFilter("");
    setSubjectFilter("");
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Paper) => {
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
      key: "subject",
      header: "Subject",
      className:
        "min-w-[120px] max-w-[180px] truncate overflow-hidden cursor-default",
      render: (row: Paper) => {
        const safeSubjectTitle = getSafeNestedValue(
          row.subject,
          "title",
          "No subject",
        );
        return (
          <span
            title={`Subject: ${safeSubjectTitle}`}
            className={`block truncate ${!row.subject?.title ? "italic text-gray-400" : ""}`}
          >
            {safeSubjectTitle}
          </span>
        );
      },
    },
    {
      key: "grade",
      header: "Grade",
      className:
        "min-w-[100px] max-w-[150px] truncate overflow-hidden cursor-default",
      render: (row: Paper) => {
        const safeGradeTitle = getSafeNestedValue(
          row.grade,
          "title",
          "No grade",
        );
        return (
          <span
            title={`Grade: ${safeGradeTitle}`}
            className={`block truncate ${!row.grade?.title ? "italic text-gray-400" : ""}`}
          >
            {safeGradeTitle}
          </span>
        );
      },
    },
    {
      key: "year",
      header: "Year",
      className: "min-w-[80px] max-w-[100px] cursor-default",
      render: (row: Paper) => {
        const safeYear = getSafeValue(row.year, "No year");
        return (
          <span
            title={`Year: ${safeYear}`}
            className={`${!row.year ? "italic text-gray-400" : ""}`}
          >
            {safeYear}
          </span>
        );
      },
    },
    {
      key: "url",
      header: "URL",
      className:
        "min-w-[200px] max-w-[250px] truncate overflow-hidden cursor-default",
      render: (row: Paper) => {
        const safeUrl = getSafeValue(row.url, "");
        const hasValidUrl = isValidUrl(row.url);

        if (!hasValidUrl) {
          return (
            <span
              className="italic text-gray-400"
              title="No valid URL available"
            >
              No URL provided
            </span>
          );
        }

        return (
          <span
            onClick={() => copyToClipboard(row.url)}
            title="Click to copy URL"
            className="group relative flex max-w-full cursor-pointer items-center gap-1 truncate hover:text-blue-700 hover:underline dark:hover:text-blue-400"
          >
            <span className="truncate">{safeUrl}</span>
            <Copy className="w-4 flex-shrink-0 opacity-0 text-blue-700 transition-opacity group-hover:opacity-100 dark:text-blue-400" />
          </span>
        );
      },
    },
    {
      key: "view",
      header: <div className="w-full text-center">View</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[160px] z-20 bg-white dark:bg-gray-900",
      render: (row: Paper) => (
        <div className="flex w-full items-center justify-center">
          <PaperDetails
            title={getSafeValue(row.title, "No title provided")}
            medium={getSafeMedium(row.medium)}
            grade={getSafeNestedValue(row.grade, "title", "No grade specified")}
            subject={getSafeNestedValue(
              row.subject,
              "title",
              "No subject specified",
            )}
            year={getSafeValue(row.year, "No year specified")}
            url={getSafeValue(row.url, "")}
          />
        </div>
      ),
    },
    {
      key: "edit",
      header: <div className="w-full text-center">Edit</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
      render: (row: Paper) => (
        <div className="flex w-full items-center justify-center">
          <EditPaper
            id={row.id}
            title={getSafeValue(row.title, "")}
            medium={getMediumValueForEdit(row.medium)}
            grade={getSafeNestedValue(row.grade, "id", "")}
            subject={getSafeNestedValue(row.subject, "id", "")}
            year={getSafeValue(row.year, "")}
            url={getSafeValue(row.url, "")}
          />
        </div>
      ),
    },
    {
      key: "delete",
      header: <div className="w-full text-center">Delete</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Paper) => (
        <div className="flex w-full items-center justify-center">
          <DeletePaper paperId={row.id} />
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
        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Papers
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Filter papers across the full dataset and manage them across desktop
            and mobile.
          </p>
        </div>

        <motion.div
          layout
          className="grid w-full gap-3 sm:max-w-3xl sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={titleFilter}
              onChange={(e) => {
                setTitleFilter(e.target.value);
                setPage(TABLE_CONFIG.DEFAULT_PAGE);
              }}
              placeholder="Filter by title"
              className="h-11 w-full pl-10 pr-10"
            />
            {titleFilter && (
              <button
                type="button"
                onClick={() => {
                  setTitleFilter("");
                  setPage(TABLE_CONFIG.DEFAULT_PAGE);
                }}
                aria-label="Clear title filter"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select
            value={gradeFilter || "all"}
            onValueChange={(value) => {
              setGradeFilter(value === "all" ? "" : value);
              setSubjectFilter("");
              setPage(TABLE_CONFIG.DEFAULT_PAGE);
            }}
          >
            <SelectTrigger className="h-11 min-h-11 w-full">
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
            disabled={Boolean(gradeFilter && isGradeSubjectsLoading)}
            onValueChange={(value) => {
              setSubjectFilter(value === "all" ? "" : value);
              setPage(TABLE_CONFIG.DEFAULT_PAGE);
            }}
          >
            <SelectTrigger
              isLoading={Boolean(gradeFilter && isGradeSubjectsLoading)}
              className="h-11 min-h-11 w-full"
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
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp} className="hidden md:block">
        <motion.div layout className="overflow-hidden rounded-2xl">
          <DataTable
            columns={columns}
            data={papers}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalResults={totalResults}
            limit={limit}
            isLoading={isFetching}
            emptyMessage="No papers found for the current filters."
          />
        </motion.div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:hidden"
      >
        {isFetching ? (
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
        ) : papers.length > 0 ? (
          papers.map((row) => {
            const safeTitle = getSafeValue(row.title, "No title provided");
            const safeMedium = getSafeMedium(row.medium);
            const safeSubject = getSafeNestedValue(
              row.subject,
              "title",
              "No subject",
            );
            const safeGrade = getSafeNestedValue(
              row.grade,
              "title",
              "No grade",
            );
            const safeYear = getSafeValue(row.year, "No year");
            const safeUrl = getSafeValue(row.url, "");
            const hasValidUrl = isValidUrl(row.url);

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
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {safeSubject} • {safeGrade}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Medium
                    </p>
                    <p className="mt-1 truncate text-gray-900 dark:text-white">
                      {safeMedium}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Year
                    </p>
                    <p className="mt-1 truncate text-gray-900 dark:text-white">
                      {safeYear}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    URL
                  </p>
                  {hasValidUrl ? (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(row.url)}
                      className="mt-1 flex w-full items-center gap-2 text-left text-sm text-blue-600 dark:text-blue-400"
                    >
                      <span className="truncate">{safeUrl}</span>
                      <Copy className="h-4 w-4 shrink-0" />
                    </button>
                  ) : (
                    <p className="mt-1 italic text-gray-400">No URL provided</p>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="flex justify-center rounded-xl border border-gray-200 p-2 dark:border-gray-700">
                    <PaperDetails
                      title={safeTitle}
                      medium={safeMedium}
                      grade={safeGrade}
                      subject={safeSubject}
                      year={safeYear}
                      url={safeUrl}
                    />
                  </div>
                  <div className="flex justify-center rounded-xl border border-gray-200 p-2 dark:border-gray-700">
                    <EditPaper
                      id={row.id}
                      title={getSafeValue(row.title, "")}
                      medium={getMediumValueForEdit(row.medium)}
                      grade={getSafeNestedValue(row.grade, "id", "")}
                      subject={getSafeNestedValue(row.subject, "id", "")}
                      year={getSafeValue(row.year, "")}
                      url={getSafeValue(row.url, "")}
                    />
                  </div>
                  <div className="flex justify-center rounded-xl border border-gray-200 p-2 dark:border-gray-700">
                    <DeletePaper paperId={row.id} />
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
                No papers found
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try a different filter value.
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {!isFetching && totalResults > limit && (
        <div className="flex justify-center md:hidden">
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {!isFetching && papers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900 md:block"
        >
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            No papers found
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try a different filter value.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
