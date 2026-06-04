"use client";

import DataTable from "@/components/tables/DataTable";
import { TABLE_CONFIG } from "@/configs/table";
import {
  useDeleteTagMutation,
  useFetchTagsQuery,
} from "@/store/api/splits/tags";
import { useState } from "react";
import { DeleteTag } from "./DeleteTag";
import { UpdateTag } from "./edit-tag/UpdateTag";
import { TagDetails } from "./TagDetails";

interface Tag {
  id: string;
  name?: string;
  description?: string;
  createdAt?: string;
}

export default function TagsList() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [deleteTag] = useDeleteTagMutation();
  const [limit, setLimit] = useState<number>(TABLE_CONFIG.DEFAULT_LIMIT);

  const { data, isLoading } = useFetchTagsQuery({
    page,
    limit,
    sortBy: "updatedAt:desc",
  });

  const tags = data?.results || [];
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

  const columns = [
    {
      key: "name",
      header: "Title",
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Tag) => {
        const safeTitle = getSafeValue(row.name, "No name provided");
        return (
          <span
            title={`Title: ${safeTitle}`}
            className={`truncate block ${!row.name ? "text-gray-400 italic" : ""}`}
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
      render: (row: Tag) => {
        const safeDescription = getSafeValue(
          row.description,
          "No description provided",
        );
        return (
          <span
            title={`Description: ${safeDescription}`}
            className={`truncate block ${!row.description ? "text-gray-400 italic" : ""}`}
          >
            {safeDescription}
          </span>
        );
      },
    },
    {
      key: "view",
      header: <div className="w-full text-center">View</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[160px] z-20 bg-white dark:bg-gray-900",
      render: (row: Tag) => (
        <div className="w-full flex justify-center items-center">
          <TagDetails
            name={getSafeValue(row.name, "No name provided")}
            description={getSafeValue(
              row.description,
              "No description provided",
            )}
          />
        </div>
      ),
    },
    {
      key: "edit",
      header: <div className="w-full text-center">Edit</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
      render: (row: Tag) => (
        <div className="w-full flex justify-center items-center">
          <UpdateTag
            id={row.id}
            name={getSafeValue(row.name, "")}
            description={getSafeValue(row.description, "")}
          />
        </div>
      ),
    },
    {
      key: "delete",
      header: <div className="w-full text-center">Delete</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Tag) => (
        <div className="w-full flex justify-center items-center">
          <DeleteTag tagId={row.id} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tags}
      page={page}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      totalResults={totalResults}
      limit={limit}
      onLimitChange={setLimit}
      isLoading={isLoading}
      bulkDelete={{
        entityName: "tag",
        deleteRow: (row) => deleteTag(String(row.id)).unwrap(),
      }}
    />
  );
}
