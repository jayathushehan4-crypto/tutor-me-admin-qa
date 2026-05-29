"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useFetchInquiriesQuery } from "@/store/api/splits/inquiries";
import { useFetchRequestForTutorsQuery } from "@/store/api/splits/request-tutor";
import { useFetchTutorsQuery } from "@/store/api/splits/tutors";
import type { Inquiry, RequestTutors, Tutor } from "@/types/response-types";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  LucideIcon,
  Mail,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  timestamp: string;
  status?: string;
  icon: LucideIcon;
  tone: string;
};

const MAX_ACTIVITY_ITEMS = 8;

const getTimestamp = (value?: string | null) => {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatActivityTime = (value: string) => {
  const timestamp = getTimestamp(value);
  if (!timestamp) return "Unknown time";

  const now = Date.now();
  const diffInSeconds = Math.round((timestamp - now) / 1000);
  const absoluteDiff = Math.abs(diffInSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absoluteDiff < 60) {
    return formatter.format(diffInSeconds, "second");
  }

  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return formatter.format(diffInMinutes, "minute");
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return formatter.format(diffInHours, "hour");
  }

  const diffInDays = Math.round(diffInHours / 24);
  if (Math.abs(diffInDays) < 7) {
    return formatter.format(diffInDays, "day");
  }

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const capitalize = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const normalizeRequestStatus = (status: string) => {
  if (status === "Tutor Assigned" || status === "Assiged") return "Assigned";
  return status || "Pending";
};

const getTutorActivity = (tutor: Tutor): ActivityItem => ({
  id: `tutor-${tutor.id}`,
  title: tutor.fullName || tutor.name || "New tutor application",
  description: tutor.email
    ? `Tutor registration from ${tutor.email}`
    : "Tutor registration submitted.",
  href: "/tutors",
  timestamp: tutor.createdAt,
  status: capitalize(tutor.status || "pending"),
  icon: UserPlus,
  tone: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
});

const getTutorRequestActivity = (request: RequestTutors): ActivityItem => ({
  id: `request-${request.id}`,
  title: request.name || "New tutor request",
  description: [request.grade, request.medium].filter(Boolean).join(" - ")
    ? [request.grade, request.medium].filter(Boolean).join(" - ")
    : "Tutor request submitted.",
  href: "/request-tutor",
  timestamp: request.updatedAt || request.createdAt,
  status: normalizeRequestStatus(request.status),
  icon: ClipboardList,
  tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
});

const getInquiryActivity = (inquiry: Inquiry): ActivityItem => ({
  id: `inquiry-${inquiry.id}`,
  title: inquiry.sender?.name || "New contact inquiry",
  description: inquiry.sender?.email
    ? `Message from ${inquiry.sender.email}`
    : inquiry.message || "Contact inquiry received.",
  href: "/inquiries/contactus",
  timestamp: inquiry.createdAt,
  status: "Inquiry",
  icon: Mail,
  tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
});

export default function RecentActivityFeed() {
  const tutorsQuery = useFetchTutorsQuery({
    page: 1,
    limit: 5,
    sortBy: "createdAt:desc",
  });

  const tutorRequestsQuery = useFetchRequestForTutorsQuery({
    page: 1,
    limit: 5,
    sortBy: "updatedAt:desc",
  });

  const inquiriesQuery = useFetchInquiriesQuery({
    page: 1,
    limit: 5,
    sortBy: "createdAt:desc",
  });

  const activities = useMemo(
    () =>
      [
        ...(tutorsQuery.data?.results || []).map(getTutorActivity),
        ...(tutorRequestsQuery.data?.results || []).map(
          getTutorRequestActivity,
        ),
        ...(inquiriesQuery.data?.results || []).map(getInquiryActivity),
      ]
        .sort(
          (first, second) =>
            getTimestamp(second.timestamp) - getTimestamp(first.timestamp),
        )
        .slice(0, MAX_ACTIVITY_ITEMS),
    [
      inquiriesQuery.data?.results,
      tutorRequestsQuery.data?.results,
      tutorsQuery.data?.results,
    ],
  );

  const isLoading =
    tutorsQuery.isLoading ||
    tutorRequestsQuery.isLoading ||
    inquiriesQuery.isLoading;

  const isError =
    tutorsQuery.isError || tutorRequestsQuery.isError || inquiriesQuery.isError;

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="mt-5 divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 py-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3.5 w-64" />
                </div>
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-[3px] bg-emerald-500" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Latest tutor, request, and inquiry updates.
              </p>
            </div>
          </div>

          {isError && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              Some activity could not load
            </span>
          )}
        </div>

        {activities.length === 0 && !isError ? (
          <div className="mt-5 rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Recent activity will appear here once records are added.
          </div>
        ) : (
          <div className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {activities.map(
              ({
                id,
                title,
                description,
                href,
                timestamp,
                status,
                icon: Icon,
                tone,
              }) => (
                <Link
                  key={id}
                  href={href}
                  className="group flex items-center gap-3 p-4 outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-gray-800/50 dark:focus-visible:ring-blue-400"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {title}
                      </h3>
                      {status && (
                        <span className="w-fit rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {status}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                      {description}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 text-sm text-gray-400 dark:text-gray-500 sm:flex">
                    <span>{formatActivityTime(timestamp)}</span>
                    <ArrowUpRight className="h-4 w-4 transition group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                </Link>
              ),
            )}
          </div>
        )}
      </div>

      <div className="h-[3px] bg-emerald-500" />
    </div>
  );
}
