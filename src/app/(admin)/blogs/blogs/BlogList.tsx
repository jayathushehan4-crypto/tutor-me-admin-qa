"use client";

import DataTable from "@/components/tables/DataTable";
import { TABLE_CONFIG } from "@/configs/table";
import {
  useDeleteBlogMutation,
  useFetchBlogsQuery,
} from "@/store/api/splits/blogs";
import { BlogStatus } from "@/types/blogs-types";
import { Blogs } from "@/types/response-types";
import { useState } from "react";
import { DeleteBlog } from "./DeleteBlog";
import { BlogStatusDialog } from "./StatusChangeBlog";
import { BlogDetails } from "./ViewDetails";

const BLOG_STATUS_CLASSES: Record<string, string> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  approved:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200",
  rejected:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
};

function BlogStatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? "pending";
  const className =
    BLOG_STATUS_CLASSES[normalized] ?? BLOG_STATUS_CLASSES.pending;
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

type BlogAuthor = {
  id?: string | { $oid?: string };
  role?: string;
  name?: string;
  avatar?: string;
};

type BlogRow = Blogs & {
  author?: BlogAuthor;
};

const normalizeMongoId = (value?: string | { $oid?: string }) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.$oid || "";
};

export default function BlogsTable() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [deleteBlog] = useDeleteBlogMutation();
  const [limit, setLimit] = useState<number>(TABLE_CONFIG.DEFAULT_LIMIT);

  const { data, isLoading, refetch } = useFetchBlogsQuery({
    page,
    limit,
    sortBy: "updatedAt:desc",
  });

  const blogs: BlogRow[] = (data?.results || []) as BlogRow[];
  const totalPages = data?.totalPages || 0;
  const totalResults = data?.totalResults || 0;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getSafeValue = (value?: string | null, fallback = "N/A") =>
    value?.trim() ? value : fallback;

  const columns = [
    {
      key: "title",
      header: "Title",
      className:
        "truncate overflow-hidden min-w-[200px] sticky left-0 z-20 bg-white dark:bg-gray-900",
      bodyClassName: "!max-w-none",
      render: (row: BlogRow) => {
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
      key: "spacer",
      header: "",
      className: "w-full",
      bodyClassName: "!max-w-none",
      render: () => null,
    },
    {
      key: "view",
      header: (
        <span className="truncate text-center block w-full" title="View">
          View
        </span>
      ),
      className:
        "lg:min-w-[80px] lg:max-w-[80px] min-w-[80px] max-w-[80px] sticky right-[270px] z-20 bg-white dark:bg-gray-900",
      render: (row: BlogRow) => {
        const authorId = normalizeMongoId(row.author?.id);

        return (
          <div className="w-full flex items-center justify-center">
            <BlogDetails
              blog={{
                id: row.id,
                title: getSafeValue(row.title, "No Title"),
                author: {
                  id: authorId,
                  role: row.author?.role || "admin",
                  name: row.author?.name,
                  avatar: row.author?.avatar,
                },
                image: row.image || "",
                status:
                  (row.status as "pending" | "approved" | "rejected") ??
                  "pending",
                content: (row.content ?? []).map((block, index) => ({
                  _id: `${block.type}-${index}`,
                  ...block,
                })),
                relatedArticles: row.relatedArticles ?? [],
              }}
            />
          </div>
        );
      },
    },
    {
      key: "changeStatus",
      header: (
        <span className="truncate block w-full" title="Status">
          Status
        </span>
      ),
      className:
        "min-w-[190px] max-w-[190px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
      render: (row: BlogRow) => (
        <div className="flex items-center justify-center gap-2">
          <BlogStatusBadge status={row.status ?? "pending"} />
          <BlogStatusDialog
            id={row.id}
            currentStatus={row.status as "pending" | "approved" | "rejected"}
            onStatusChange={() => refetch()}
          />
        </div>
      ),
    },
    {
      key: "delete",
      header: (
        <span className="truncate text-center block w-full" title="Delete">
          Delete
        </span>
      ),
      className:
        "lg:min-w-[80px] lg:max-w-[80px] min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
      render: (row: BlogRow) => (
        <div className="w-full flex items-center justify-center">
          <DeleteBlog
            blogId={row.id}
            currentStatus={row.status as BlogStatus}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={blogs}
      page={page}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      totalResults={totalResults}
      limit={limit}
      onLimitChange={setLimit}
      isLoading={isLoading}
      bulkDelete={{
        entityName: "blog",
        deleteRow: (row) => deleteBlog(String(row.id)).unwrap(),
      }}
    />
  );
}
