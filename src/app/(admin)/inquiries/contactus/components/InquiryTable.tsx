"use client";

import DataTable from "@/components/tables/DataTable";
import { TABLE_CONFIG } from "@/configs/table";
import { useDebounce } from "@/hooks/useDebounce";
import { useFetchInquiriesQuery } from "@/store/api/splits/inquiries";
import { Copy, RotateCcw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DeleteInquiry } from "./DeleteInquiry";
import { InquiryDetails } from "./ViewInquiries";

interface Sender {
  name?: string;
  email?: string;
}

interface Inquiry {
  id: string;
  message: string;
  createdAt: string;
  sender?: Sender;
}

export default function InquiryTable() {
  const [page, setPage] = useState(TABLE_CONFIG.DEFAULT_PAGE);
  const [nameSearch, setNameSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;
  const debouncedNameSearch = useDebounce(nameSearch, 400);
  const debouncedEmailSearch = useDebounce(emailSearch, 400);

  const inquiriesQuery = useMemo(
    () => ({
      page,
      limit,
      sortBy: "createdAt:desc",
      ...(debouncedNameSearch.trim()
        ? { name: debouncedNameSearch.trim() }
        : {}),
      ...(debouncedEmailSearch.trim()
        ? { email: debouncedEmailSearch.trim() }
        : {}),
    }),
    [debouncedEmailSearch, debouncedNameSearch, limit, page],
  );

  const { data, isFetching } = useFetchInquiriesQuery(inquiriesQuery);

  const inquiries =
    data?.results.map((inq: Inquiry) => ({
      ...inq,
      senderName: inq.sender?.name || "",
      senderEmail: inq.sender?.email || "",
    })) || [];
  const totalPages = data?.totalPages || 1;
  const totalResults = data?.totalResults || 0;
  const hasFilters = Boolean(nameSearch || emailSearch);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const resetFilters = () => {
    setNameSearch("");
    setEmailSearch("");
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  };

  const copyToClipboard = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Inquiry ID copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };
  const columns = [
    {
      key: "id",
      header: "ID",
      className:
        "min-w-[210px] max-w-[210px] sticky left-0 z-20 bg-white dark:bg-gray-900",
      bodyClassName: "text-[0.75rem] font-mono",
      render: (row: { id: string }) => (
        <span
          onClick={() => copyToClipboard(row.id)}
          title={"Click to copy"}
          className="cursor-pointer relative group truncate max-w-full flex items-center gap-1 hover:underline hover:text-blue-700 dark:hover:text-blue-400"
          style={{ width: "inherit" }}
        >
          {row.id}
          <Copy className="w-4 opacity-0 group-hover:opacity-100 transition-opacity text:text-blue-700 dark:text-blue-400 flex-shrink-0" />
        </span>
      ),
    },
    {
      key: "senderName",
      header: "Sender Name",
      className:
        "min-w-[100px] max-w-[150px] truncate overflow-hidden cursor-default",
      render: (row: { senderName: string }) => (
        <span
          title={`Sender Name: ${row.senderName}`}
          className="truncate block"
        >
          {row.senderName}
        </span>
      ),
    },
    {
      key: "senderEmail",
      header: "Sender Email",
      className:
        "min-w-[200px] max-w-[200px] truncate overflow-hidden cursor-default",
      render: (row: { senderEmail: string }) => (
        <span
          title={`Sender Email: ${row.senderEmail}`}
          className="truncate block"
        >
          {row.senderEmail}
        </span>
      ),
    },
    {
      key: "message",
      header: "Inquiry",
      className:
        "min-w-[200px] max-w-[300px] truncate overflow-hidden cursor-default",
      render: (row: { message: string }) => (
        <span title={`Message: ${row.message}`} className="truncate block">
          {row.message}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created At",
      className:
        "min-w-[140px] max-w-[140px] truncate overflow-hidden cursor-default",
      bodyClassName: "text-[0.75rem] font-mono",
      render: (row: { createdAt: string }) => {
        const date = new Date(row.createdAt);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      key: "delete",
      header: <div className="text-center w-full">Delete</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
      render: (row: { id: string }) => (
        <div className="w-full flex justify-center items-center">
          <DeleteInquiry inquiryId={row.id} />
        </div>
      ),
    },
    {
      key: "view",
      header: <div className="text-center w-full">View</div>,
      className:
        "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
      render: (row: {
        id: string;
        createdAt: string;
        senderName: string;
        senderEmail: string;
        message: string;
      }) => (
        <div className="w-full flex justify-center items-center">
          <InquiryDetails
            id={row.id}
            senderName={row.senderName}
            senderEmail={row.senderEmail}
            message={row.message}
            createdAt={row.createdAt}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white/90">
            Contact Inquiries
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            Search by sender name or email.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:max-w-2xl sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={nameSearch}
              onChange={(event) => {
                setNameSearch(event.target.value);
                setPage(TABLE_CONFIG.DEFAULT_PAGE);
              }}
              placeholder="Search name"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
            {nameSearch && (
              <button
                type="button"
                onClick={() => {
                  setNameSearch("");
                  setPage(TABLE_CONFIG.DEFAULT_PAGE);
                }}
                aria-label="Clear name search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={emailSearch}
              onChange={(event) => {
                setEmailSearch(event.target.value);
                setPage(TABLE_CONFIG.DEFAULT_PAGE);
              }}
              placeholder="Search email"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
            {emailSearch && (
              <button
                type="button"
                onClick={() => {
                  setEmailSearch("");
                  setPage(TABLE_CONFIG.DEFAULT_PAGE);
                }}
                aria-label="Clear email search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            aria-label="Reset filters"
            title="Reset filters"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-0 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={inquiries}
        page={page}
        totalPages={totalPages}
        totalResults={totalResults}
        limit={limit}
        onPageChange={handlePageChange}
        isLoading={isFetching}
        emptyMessage="No inquiries found for the current search."
      />
    </div>
  );
}
