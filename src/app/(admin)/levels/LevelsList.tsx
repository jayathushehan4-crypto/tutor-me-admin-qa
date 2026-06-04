"use client";

import DataTable from "@/components/tables/DataTable";
import { TABLE_CONFIG } from "@/configs/table";
import {
  useDeleteLevelMutation,
  useFetchLevelsQuery,
} from "@/store/api/splits/levels";
import { useState } from "react";
import { DeleteLevel } from "./DeleteLevel";
import { LevelDetails } from "./ViewDetails";
import { UpdateLevel } from "./edit-level/UpdateLevel";

interface Subject {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Level {
  id: string;
  title?: string;
  details?: string[];
  challanges?: string[];
  subjects?: Subject[];
  createdAt?: string;
}

export default function LevelsTable() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [deleteLevel] = useDeleteLevelMutation();
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;

  const { data, isLoading } = useFetchLevelsQuery({
    page,
    limit,
    sortBy: "updatedAt:desc",
  });

  const levels = data?.results || [];
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

  const getSafeArray = <T,>(value: T[] | undefined | null): T[] => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value;
  };

  const getSafeSubjectIds = (
    subjects: Subject[] | undefined | null,
  ): string[] => {
    const safeSubjects = getSafeArray(subjects);
    return safeSubjects
      .filter((subject) => subject && subject.id && subject.title)
      .map((subject) => subject.id);
  };

  const getSafeSubjects = (
    subjects: Subject[] | undefined | null,
  ): Subject[] => {
    const safeSubjects = getSafeArray(subjects);
    return safeSubjects.filter(
      (subject) => subject && subject.id && subject.title,
    );
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Level) => {
        const safeTitle = getSafeValue(row.title, "No title provided");
        return (
          <span
            title={`Title: ${safeTitle}`}
            className={`truncate block ${!row.title ? "text-gray-400 italic" : ""}`}
            style={{ width: "inherit" }}
          >
            {safeTitle}
          </span>
        );
      },
    },
    {
      key: "details",
      header: "Details",
      className:
        "min-w-[200px] max-w-[300px] truncate overflow-hidden cursor-default",
      render: (row: Level) => {
        const safeDetails = getSafeArray(row.details);

        if (safeDetails.length === 0) {
          return (
            <span className="text-gray-400 italic" title="No details available">
              No details provided
            </span>
          );
        }

        const displayDetails = safeDetails.slice(0, 2);
        const detailsText = displayDetails.join(", ");
        const hasMore = safeDetails.length > 2;
        const fullDetailsText = safeDetails.join(", ");

        return (
          <div className="truncate" title={`Details: ${fullDetailsText}`}>
            {detailsText}
            {hasMore && (
              <span className="text-gray-500 ml-1">
                +{safeDetails.length - 2} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "subjects",
      header: "Subjects",
      className: "min-w-[120px] max-w-[150px] cursor-default",
      render: (row: Level) => {
        const safeSubjects = getSafeSubjects(row.subjects);
        const subjectCount = safeSubjects.length;

        const subjectTitles = safeSubjects.map((s) => s.title).join(", ");
        const tooltipText =
          subjectCount > 0
            ? `${subjectCount} subject${subjectCount !== 1 ? "s" : ""}: ${subjectTitles}`
            : "No subjects assigned";

        return (
          <span
            title={tooltipText}
            className={`${subjectCount === 0 ? "text-gray-400 italic" : "text-blue-600 dark:text-blue-400"}`}
          >
            {subjectCount === 0
              ? "No subjects"
              : `${subjectCount} subject${subjectCount !== 1 ? "s" : ""}`}
          </span>
        );
      },
    },
    {
      key: "challenges",
      header: "Challenges",
      className: "min-w-[120px] max-w-[150px] cursor-default",
      render: (row: Level) => {
        const safeChallenges = getSafeArray(row.challanges);
        const challengeCount = safeChallenges.length;

        return (
          <span
            title={`${challengeCount} challenge${challengeCount !== 1 ? "s" : ""} available`}
            className={`${challengeCount === 0 ? "text-gray-400 italic" : "text-green-600 dark:text-green-400"}`}
          >
            {challengeCount === 0
              ? "No challenges"
              : `${challengeCount} challenge${challengeCount !== 1 ? "s" : ""}`}
          </span>
        );
      },
    },
    {
      key: "view",
      header: <div className="w-full text-center">View</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[160px] z-20 bg-white dark:bg-gray-900",
      render: (row: Level) => (
        <div className="w-full flex justify-center items-center">
          <LevelDetails
            title={getSafeValue(row.title, "No title provided")}
            details={getSafeArray(row.details)}
            challanges={getSafeArray(row.challanges)}
            subjects={getSafeSubjects(row.subjects)}
          />
        </div>
      ),
    },
    {
      key: "edit",
      header: <div className="w-full text-center">Edit</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
      render: (row: Level) => (
        <div className="w-full flex justify-center items-center">
          <UpdateLevel
            id={row.id}
            title={getSafeValue(row.title, "")}
            details={getSafeArray(row.details)}
            challanges={getSafeArray(row.challanges)}
            subjects={getSafeSubjectIds(row.subjects)}
          />
        </div>
      ),
    },
    {
      key: "delete",
      header: <div className="w-full text-center">Delete</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Level) => (
        <div className="w-full flex justify-center items-center">
          <DeleteLevel levelId={row.id} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={levels}
      page={page}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      totalResults={totalResults}
      limit={limit}
      isLoading={isLoading}
      bulkDelete={{
        entityName: "level",
        deleteRow: (row) => deleteLevel(String(row.id)).unwrap(),
      }}
    />
  );
}
