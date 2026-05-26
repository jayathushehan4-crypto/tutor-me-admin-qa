"use client";

/* eslint-disable @next/next/no-img-element */

import DataTable, { type Column } from "@/components/tables/DataTable";
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
import { useFetchTestimonialsQuery } from "@/store/api/splits/testimonials";
import { fadeUp, staggerContainer } from "@/types/animation-types";
import { RotateCcw, Search, Star, User, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DeleteTestimonial } from "./DeleteTestimonial";
import { UpdateTestimonial } from "./edit-testimonial/UpdateTestimonial";
import { TestimonialDetails } from "./ViewDetails";

interface Testimonial {
  id: string;
  content?: string;
  rating?: string | number;
  createdAt?: string;
  owner?: {
    name?: string;
    role?: string;
    avatar?: string;
  };
}

export default function TestimonialsTable() {
  const [page, setPage] = useState<number>(TABLE_CONFIG.DEFAULT_PAGE);
  const [nameSearch, setNameSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const limit = TABLE_CONFIG.DEFAULT_LIMIT;
  const debouncedNameSearch = useDebounce(nameSearch, 400);
  const debouncedRoleSearch = useDebounce(roleSearch, 400);
  const normalizedNameSearch = debouncedNameSearch.trim().toLowerCase();
  const normalizedRoleSearch = debouncedRoleSearch.trim().toLowerCase();
  const hasTextFilters = Boolean(normalizedNameSearch || normalizedRoleSearch);

  const testimonialsQuery = useMemo(
    () => ({
      page: hasTextFilters ? TABLE_CONFIG.DEFAULT_PAGE : page,
      limit: hasTextFilters ? 1000 : limit,
      sortBy: "createdAt:desc",
      ...(normalizedNameSearch ? { name: debouncedNameSearch.trim() } : {}),
      ...(normalizedRoleSearch ? { role: debouncedRoleSearch.trim() } : {}),
      ...(ratingFilter !== "all" ? { rating: Number(ratingFilter) } : {}),
    }),
    [
      debouncedNameSearch,
      debouncedRoleSearch,
      hasTextFilters,
      limit,
      normalizedNameSearch,
      normalizedRoleSearch,
      page,
      ratingFilter,
    ],
  );

  const { data, isFetching } = useFetchTestimonialsQuery(testimonialsQuery);

  const fetchedTestimonials = data?.results || [];
  const filteredTestimonials = useMemo(() => {
    if (!hasTextFilters) return fetchedTestimonials;

    return fetchedTestimonials.filter((testimonial) => {
      const ownerName = testimonial.owner?.name?.toLowerCase() || "";
      const ownerRole = testimonial.owner?.role?.toLowerCase() || "";
      const matchesName =
        !normalizedNameSearch || ownerName.includes(normalizedNameSearch);
      const matchesRole =
        !normalizedRoleSearch || ownerRole.includes(normalizedRoleSearch);

      return matchesName && matchesRole;
    });
  }, [
    fetchedTestimonials,
    hasTextFilters,
    normalizedNameSearch,
    normalizedRoleSearch,
  ]);
  const testimonials = hasTextFilters
    ? filteredTestimonials.slice((page - 1) * limit, page * limit)
    : fetchedTestimonials;
  const totalResults = hasTextFilters
    ? filteredTestimonials.length
    : data?.totalResults || 0;
  const totalPages = hasTextFilters
    ? Math.max(1, Math.ceil(filteredTestimonials.length / limit))
    : data?.totalPages || 1;
  const hasFilters = Boolean(nameSearch || roleSearch || ratingFilter !== "all");

  const getSafeValue = (value: unknown, fallback = "N/A"): string => {
    if (value === undefined || value === null) return fallback;
    const str = String(value);
    return str.trim() === "" ? fallback : str;
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const resetFilters = () => {
    setNameSearch("");
    setRoleSearch("");
    setRatingFilter("all");
    setPage(TABLE_CONFIG.DEFAULT_PAGE);
  };

  const columns: Column<Testimonial>[] = [
    {
      key: "owner",
      header: "Owner",
      className:
        "min-w-[200px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Testimonial) => (
        <div className="flex items-center gap-3">
          {row.owner?.avatar ? (
            <img
              src={row.owner?.avatar || "/images/user/user.png"}
              alt={getSafeValue(row.owner?.name, "User avatar")}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
              <User size={14} />
            </div>
          )}

          <div className="flex flex-col">
            <span className="font-medium">
              {getSafeValue(row.owner?.name, "Unknown")}
            </span>
            <span className="text-xs text-gray-500">
              {getSafeValue(row.owner?.role, "No role")}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "content",
      header: "Content",
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden cursor-default",
      render: (row: Testimonial) => {
        const safeContent = getSafeValue(row.content, "No content provided");
        return (
          <span
            className={`block truncate ${
              !row.content ? "italic text-gray-400" : ""
            }`}
          >
            {safeContent}
          </span>
        );
      },
    },
    {
      key: "rating",
      header: "Rating",
      className: "min-w-[120px] text-center",
      render: (row: Testimonial) => {
        const rating = Number(row.rating) || 0;
        return (
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-400"
                }
              />
            ))}
            <span className="text-xs text-gray-400">({rating || "N/A"})</span>
          </div>
        );
      },
    },
    {
      key: "view",
      header: "View",
      align: "center",
      className:
        "min-w-[80px] max-w-[80px] sticky right-[160px] z-20 bg-white dark:bg-gray-900",
      render: (row: Testimonial) => (
        <TestimonialDetails
          content={getSafeValue(row.content)}
          rating={getSafeValue(row.rating)}
          owner={row.owner}
        />
      ),
    },
    {
      key: "edit",
      header: "Edit",
      align: "center",
      className:
        "min-w-[80px] max-w-[80px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
      render: (row: Testimonial) => (
        <UpdateTestimonial
          id={row.id}
          content={getSafeValue(row.content, "")}
          rating={Number(row.rating) || 0}
          owner={{
            name: getSafeValue(row.owner?.name, ""),
            role: getSafeValue(row.owner?.role, ""),
            avatar: getSafeValue(row.owner?.avatar, ""),
          }}
        />
      ),
    },
    {
      key: "delete",
      header: "Delete",
      align: "center",
      className:
        "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
      render: (row: Testimonial) => (
        <DeleteTestimonial testimonialId={row.id} />
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
        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h2 className="font-semibold">Testimonials</h2>
          <p className="text-sm text-gray-500">
            Search testimonials by owner name or role, then narrow by rating.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:max-w-3xl sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(160px,0.65fr)_44px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={nameSearch}
              onChange={(event) => {
                setNameSearch(event.target.value);
                setPage(TABLE_CONFIG.DEFAULT_PAGE);
              }}
              placeholder="Search name"
              className="h-11 w-full pl-10 pr-10"
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
            <Input
              value={roleSearch}
              onChange={(event) => {
                setRoleSearch(event.target.value);
                setPage(TABLE_CONFIG.DEFAULT_PAGE);
              }}
              placeholder="Search role"
              className="h-11 w-full pl-10 pr-10"
            />
            {roleSearch && (
              <button
                type="button"
                onClick={() => {
                  setRoleSearch("");
                  setPage(TABLE_CONFIG.DEFAULT_PAGE);
                }}
                aria-label="Clear role search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select
            value={ratingFilter}
            onValueChange={(value) => {
              setRatingFilter(value);
              setPage(TABLE_CONFIG.DEFAULT_PAGE);
            }}
          >
            <SelectTrigger className="h-11 min-h-11 w-full">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((rating) => (
                <SelectItem key={rating} value={String(rating)}>
                  {rating} star{rating === 1 ? "" : "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
      </motion.div>

      <motion.div variants={fadeUp} className="hidden md:block">
        <DataTable
          columns={columns}
          data={testimonials}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalResults={totalResults}
          limit={limit}
          isLoading={isFetching}
          emptyMessage="No testimonials found for the current filters."
        />
      </motion.div>

      <motion.div className="grid gap-4 md:hidden">
        {isFetching ? (
          Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              className="rounded-2xl border bg-white p-4 dark:bg-gray-900"
            >
              <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </motion.div>
          ))
        ) : testimonials.length > 0 ? (
          testimonials.map((row) => (
            <motion.div
              key={row.id}
              variants={fadeUp}
              className="rounded-2xl border bg-white p-4 dark:bg-gray-900"
            >
              <div className="flex items-center gap-3">
                {row.owner?.avatar ? (
                  <img
                    src={row.owner?.avatar || "/images/user/user.png"}
                    alt={getSafeValue(row.owner?.name, "User avatar")}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                    <User size={14} />
                  </div>
                )}

                <div>
                  <p className="font-medium">{getSafeValue(row.owner?.name)}</p>
                  <p className="text-xs text-gray-500">
                    {getSafeValue(row.owner?.role)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600">
                {getSafeValue(row.content)}
              </p>

              <div className="mt-2 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Number(row.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-400"
                    }
                  />
                ))}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-gray-500 dark:bg-gray-900">
            No testimonials found for the current filters.
          </div>
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
    </motion.div>
  );
}
