/* eslint-disable @typescript-eslint/no-explicit-any */

import { cn } from "@/lib/utils";
import { TABLE_CONFIG } from "@/configs/table";
import { sortByLatestTimestampDesc } from "@/utils/table-sorting";
import { Trash2 } from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Checkbox } from "../ui/checkbox";
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

export interface BulkDeleteConfig<T> {
  entityName: string;
  deleteRow: (row: T) => Promise<unknown>;
  isRowSelectable?: (row: T) => boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalResults?: number;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  preserveDataOrder?: boolean;
  bulkDelete?: BulkDeleteConfig<T>;
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
  onLimitChange,
  isLoading = false,
  emptyMessage = "This is empty. Please create a new one.",
  className,
  preserveDataOrder = false,
  bulkDelete,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRowsById, setSelectedRowsById] = useState<Map<string, T>>(
    new Map(),
  );
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const showPagination = totalResults > limit;
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  const paginationRange = getPaginationRange({
    currentPage: page,
    totalPages,
    siblingCount: 1,
  });
  const latestSortedData = useMemo(
    () => (preserveDataOrder ? data : sortByLatestTimestampDesc(data)),
    [data, preserveDataOrder],
  );
  const selectableRows = useMemo(
    () =>
      bulkDelete
        ? latestSortedData.filter(
            (row) => bulkDelete.isRowSelectable?.(row) ?? true,
          )
        : [],
    [bulkDelete, latestSortedData],
  );
  const currentPageSelectedRows = useMemo(
    () => selectableRows.filter((row) => selectedIds.has(String(row.id))),
    [selectableRows, selectedIds],
  );
  const selectedRows = useMemo(
    () => [...selectedRowsById.values()],
    [selectedRowsById],
  );
  const allRowsSelected =
    selectableRows.length > 0 &&
    selectableRows.every((row) => selectedIds.has(String(row.id)));
  const someRowsSelected =
    currentPageSelectedRows.length > 0 && !allRowsSelected;

  useEffect(() => {
    if (!bulkDelete) {
      setSelectedIds(new Set());
      setSelectedRowsById(new Map());
      return;
    }

    setSelectedRowsById((current) => {
      let changed = false;
      const next = new Map(current);

      latestSortedData.forEach((row) => {
        const rowId = String(row.id);
        const isSelectable = bulkDelete.isRowSelectable?.(row) ?? true;

        if (!isSelectable) {
          if (next.delete(rowId)) {
            changed = true;
          }
          return;
        }

        if (selectedIds.has(rowId)) {
          next.set(rowId, row);
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [bulkDelete, latestSortedData, selectedIds]);

  useEffect(() => {
    setSelectedIds((current) => {
      const next = new Set(
        [...current].filter((selectedId) => selectedRowsById.has(selectedId)),
      );
      return next.size === current.size ? current : next;
    });
  }, [selectedRowsById]);

  const toggleAllRows = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      selectableRows.forEach((row) => {
        const rowId = String(row.id);
        if (checked) next.add(rowId);
        else next.delete(rowId);
      });
      return next;
    });
    setSelectedRowsById((current) => {
      const next = new Map(current);
      selectableRows.forEach((row) => {
        const rowId = String(row.id);
        if (checked) next.set(rowId, row);
        else next.delete(rowId);
      });
      return next;
    });
  };

  const toggleRow = (row: T, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const id = String(row.id);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setSelectedRowsById((current) => {
      const next = new Map(current);
      const id = String(row.id);
      if (checked) next.set(id, row);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectedRowsById(new Map());
  };

  const handleBulkDelete = async () => {
    if (!bulkDelete || selectedRows.length === 0) return;

    setIsBulkDeleting(true);
    const results = await Promise.allSettled(
      selectedRows.map((row) => bulkDelete.deleteRow(row)),
    );
    const succeededIds = results.flatMap((result, index) =>
      result.status === "fulfilled" ? [String(selectedRows[index].id)] : [],
    );
    const failedCount = results.length - succeededIds.length;

    setSelectedIds((current) => {
      const next = new Set(current);
      succeededIds.forEach((id) => next.delete(id));
      return next;
    });
    setSelectedRowsById((current) => {
      const next = new Map(current);
      succeededIds.forEach((id) => next.delete(id));
      return next;
    });
    setIsBulkDeleting(false);

    if (succeededIds.length > 0) {
      toast.success(
        `${succeededIds.length} ${bulkDelete.entityName}${succeededIds.length === 1 ? "" : "s"} deleted successfully`,
      );
    }
    if (failedCount > 0) {
      toast.error(
        `Failed to delete ${failedCount} ${bulkDelete.entityName}${failedCount === 1 ? "" : "s"}`,
      );
    }
  };

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
        "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-gray-900 dark:text-white/90 w-full",
        className,
      )}
    >
      {(bulkDelete || onLimitChange) && (
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-2 dark:border-white/5 dark:bg-white/3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Bulk actions
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {bulkDelete && selectedRows.length > 0
                ? `${selectedRows.length} row${selectedRows.length === 1 ? "" : "s"} selected`
                : `(${totalResults}) Records Found`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {onLimitChange && (
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="hidden whitespace-nowrap sm:inline">
                  Rows per page
                </span>
                <select
                  value={limit}
                  onChange={(event) => {
                    onPageChange?.(1);
                    onLimitChange(Number(event.target.value));
                  }}
                  aria-label="Rows per page"
                  className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {TABLE_CONFIG.PAGINATION_LIMITS.map((rowLimit) => (
                    <option key={rowLimit} value={rowLimit}>
                      {rowLimit}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {bulkDelete && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={selectedRows.length === 0 || isBulkDeleting}
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5 dark:disabled:text-gray-600 dark:disabled:hover:bg-transparent"
                >
                  Clear
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      disabled={selectedRows.length === 0 || isBulkDeleting}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10 dark:disabled:border-gray-700 dark:disabled:text-gray-600 dark:disabled:hover:bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete selected
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete {selectedRows.length} selected{" "}
                        {bulkDelete.entityName}
                        {selectedRows.length === 1 ? "" : "s"}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You are about to delete {selectedRows.length} selected{" "}
                        row{selectedRows.length === 1 ? "" : "s"}. This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isBulkDeleting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        {isBulkDeleting ? "Deleting..." : "Delete selected"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="min-w-[600px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/5 dark:text-white/90">
              <TableRow>
                {bulkDelete && (
                  <TableCell
                    isHeader
                    className="w-[52px] min-w-[52px] px-4 py-3"
                  >
                    <Checkbox
                      checked={
                        allRowsSelected
                          ? true
                          : someRowsSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(checked) =>
                        toggleAllRows(checked === true)
                      }
                      aria-label="Select all rows on this page"
                      disabled={selectableRows.length === 0}
                    />
                  </TableCell>
                )}
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
                  {bulkDelete && (
                    <TableCell className="w-[52px] min-w-[52px] px-4 py-3">
                      {isLoading ? (
                        <Skeleton className="h-4 w-4" />
                      ) : (
                        <Checkbox
                          checked={selectedIds.has(String(row.id))}
                          onCheckedChange={(checked) =>
                            toggleRow(row, checked === true)
                          }
                          aria-label={`Select row ${row.id}`}
                          disabled={
                            !(bulkDelete.isRowSelectable?.(row) ?? true)
                          }
                        />
                      )}
                    </TableCell>
                  )}
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
                    <span className="px-3 text-gray-400 select-none">...</span>
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
