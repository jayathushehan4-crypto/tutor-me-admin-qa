/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";
import { sortByLatestTimestampDesc } from "@/utils/table-sorting";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  headClassName?: string;
  bodyClassName?: string;
  align?: "start" | "center" | "end";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalResults?: number;
  limit?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function getPaginationRange({
  currentPage,
  totalPages,
  siblingCount = 1,
}: {
  currentPage: number;
  totalPages: number;
  siblingCount?: number;
}) {
  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPageNumbers >= totalPages) {
    return Array.from(
      { length: totalPages },
      (_, currentPage) => currentPage + 1,
    );
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < totalPages - 1;

  const pages: (number | "dots")[] = [];

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, currentPage) => currentPage + 1,
    );
    pages.push(...leftRange, "dots", totalPages);
  } else if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, currentPage) => totalPages - (3 + siblingCount * 2) + currentPage + 1,
    );
    pages.push(1, "dots", ...rightRange);
  } else if (showLeftDots && showRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, currentPage) => leftSiblingIndex + currentPage,
    );
    pages.push(1, "dots", ...middleRange, "dots", totalPages);
  }

  return pages;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  page = 1,
  totalPages = 1,
  onPageChange,
  totalResults = 0,
  limit = 10,
  isLoading = false,
  emptyMessage = "This is empty. Please create a new one.",
  className,
}: DataTableProps<T>) {
  const showPagination = totalResults > limit;
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  const paginationRange = getPaginationRange({
    currentPage: page,
    totalPages,
    siblingCount: 1,
  });
  const latestSortedData = useMemo(
    () => sortByLatestTimestampDesc(data),
    [data],
  );

  const rowsToRender = isLoading
    ? Array.from({ length: limit }).map((_, currentPage) => ({
        id: `skeleton-${currentPage}`,
      }))
    : latestSortedData;

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <div className="flex justify-center items-center h-48 rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3 dark:text-white/90">
        <p className="text-gray-500 dark:text-white/70">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3 dark:text-white/90 max-w-[73.5vw]",
        className,
      )}
    >
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[600px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/5 dark:text-white/90">
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    isHeader
                    className={`px-5 py-3 font-medium text-gray-500 text-theme-xs dark:text-white/90 ${col.align ? `text-${col.align}` : "text-start"} ${col.className ?? ""} ${col.headClassName ?? ""}`}
                  >
                    {col.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {rowsToRender.map((row: any) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`px-4 py-3 text-gray-500 text-theme-sm dark:text-white/90 max-w-[15.5vw] ${col.align ? `text-${col.align}` : "text-start"} ${col.className ?? ""} ${col.bodyClassName ?? ""}`}
                    >
                      {isLoading ? (
                        <Skeleton className="h-4 w-[120px]" />
                      ) : col.render ? (
                        <div
                          className={`flex items-center ${col.align ? `justify-${col.align}` : "justify-start"}`}
                        >
                          {col.render(row)}
                        </div>
                      ) : (
                        <div className="overflow-hidden whitespace-nowrap overflow-ellipsis fade-out">
                          {(row as Record<string, string>)[col.key]}
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && showPagination && (
        <Pagination className="text-gray-500 mt-2 dark:text-white/90 mb-3">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={isFirstPage} // <-- Add this
                onClick={() =>
                  !isFirstPage && onPageChange && onPageChange(page - 1)
                }
              />
            </PaginationItem>
            {paginationRange.map((pageNumber, index) => {
              if (pageNumber === "dots") {
                return (
                  <PaginationItem key={`dots-${index}`}>
                    <span className="px-3 text-gray-400 select-none">…</span>
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={pageNumber === page}
                    onClick={() => onPageChange && onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                disabled={isLastPage} // <-- Add this
                onClick={() =>
                  !isLastPage && onPageChange && onPageChange(page + 1)
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
