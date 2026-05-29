"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useFetchInquiriesQuery } from "@/store/api/splits/inquiries";
import { useFetchRequestForTutorsQuery } from "@/store/api/splits/request-tutor";
import { useFetchTutorsQuery } from "@/store/api/splits/tutors";
import type { RequestTutors } from "@/types/response-types";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  LucideIcon,
  Mail,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const formatNumber = (value: number) => value.toLocaleString("en-US");

const hasAssignedTutor = (assigned: unknown) => {
  if (!assigned) return false;
  if (typeof assigned === "string") return assigned.trim() !== "";
  if (Array.isArray(assigned)) {
    return assigned.some((item) => {
      if (typeof item === "string") return item.trim() !== "";
      if (!item || typeof item !== "object") return false;

      return typeof (item as { id?: unknown }).id === "string";
    });
  }
  if (typeof assigned === "object") {
    return typeof (assigned as { id?: unknown }).id === "string";
  }

  return false;
};

const isRequestOpen = (request: RequestTutors) => {
  if (
    request.status === "Rejected" ||
    request.status === "Tutor Assigned" ||
    request.status === "Assiged" ||
    request.status === "Assigned"
  ) {
    return false;
  }

  const tutorBlocks = Array.isArray(request.tutors) ? request.tutors : [];
  if (tutorBlocks.length === 0) return true;

  return tutorBlocks.some(
    (tutorBlock) => !hasAssignedTutor(tutorBlock.assignedTutor),
  );
};

type AttentionItem = {
  title: string;
  description: string;
  count: number;
  href: string;
  icon: LucideIcon;
  tone: string;
};

export default function NeedsAttentionPanel() {
  const pendingTutorsQuery = useFetchTutorsQuery({
    page: 1,
    limit: 1,
    status: "pending",
    sortBy: "createdAt:desc",
  });

  const tutorRequestsQuery = useFetchRequestForTutorsQuery({
    page: 1,
    limit: 1000,
    sortBy: "updatedAt:desc",
  });

  const inquiriesQuery = useFetchInquiriesQuery({
    page: 1,
    limit: 3,
    sortBy: "createdAt:desc",
  });

  const openTutorRequests = useMemo(
    () =>
      (tutorRequestsQuery.data?.results || []).filter((request) =>
        isRequestOpen(request),
      ).length,
    [tutorRequestsQuery.data?.results],
  );

  const latestInquiry = inquiriesQuery.data?.results?.[0];

  const items: AttentionItem[] = [
    {
      title: "Pending tutor applications",
      description: "Review and approve new tutor registrations.",
      count: pendingTutorsQuery.data?.totalResults || 0,
      href: "/tutors",
      icon: UserPlus,
      tone: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    },
    {
      title: "Open tutor requests",
      description: "Assign tutors or update request status.",
      count: openTutorRequests,
      href: "/request-tutor",
      icon: ClipboardList,
      tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    {
      title: "Recent contact inquiries",
      description: latestInquiry?.sender?.name
        ? `Latest message from ${latestInquiry.sender.name}.`
        : "Check new messages from the contact form.",
      count: inquiriesQuery.data?.totalResults || 0,
      href: "/inquiries/contactus",
      icon: Mail,
      tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
  ];

  const isLoading =
    pendingTutorsQuery.isLoading ||
    tutorRequestsQuery.isLoading ||
    inquiriesQuery.isLoading;
  const isRefetching =
    pendingTutorsQuery.isFetching ||
    tutorRequestsQuery.isFetching ||
    inquiriesQuery.isFetching;

  const isError =
    pendingTutorsQuery.isError ||
    tutorRequestsQuery.isError ||
    inquiriesQuery.isError;

  const activeItems = items.filter((item) => item.count > 0);
  const refetchAttentionItems = () => {
    pendingTutorsQuery.refetch();
    tutorRequestsQuery.refetch();
    inquiriesQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="h-[3px] bg-blue-600" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Needs Attention
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Admin items that may need review or follow-up.
              </p>
            </div>
          </div>

          {isError && (
            <button
              type="button"
              onClick={refetchAttentionItems}
              disabled={isRefetching}
              className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:pointer-events-none disabled:opacity-60 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
              Retry
            </button>
          )}
        </div>

        {isError && activeItems.length === 0 ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
            <p className="font-medium">Could not load attention items.</p>
            <p className="mt-1 text-red-600/80 dark:text-red-300/80">
              Retry to check pending tutor applications, open tutor requests,
              and recent inquiries.
            </p>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                No urgent admin items right now.
              </p>
              <p className="mt-0.5">
                Pending applications, open tutor requests, and new inquiries
                will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 lg:grid-cols-3 lg:divide-x lg:divide-gray-200 lg:dark:divide-gray-800">
            {items.map(
              ({ title, description, count, href, icon: Icon, tone }) => (
                <Link
                  key={title}
                  href={href}
                  className="group border-b border-gray-200 p-4 outline-none transition last:border-b-0 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:border-gray-800 dark:hover:bg-gray-800/50 dark:focus-visible:ring-blue-400 lg:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {formatNumber(count)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {description}
                  </p>
                </Link>
              ),
            )}
          </div>
        )}
      </div>

      <div className="h-[3px] bg-amber-500" />
    </div>
  );
}
