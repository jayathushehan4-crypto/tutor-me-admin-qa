"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/context";
import { useFetchDashboardSummaryQuery } from "@/store/api/splits/dashboard";
import { useFetchRequestForTutorsQuery } from "@/store/api/splits/request-tutor";
import { useFetchTutorsQuery } from "@/store/api/splits/tutors";
import { useFetchUserByIdQuery } from "@/store/api/splits/users";
import { containerVariants } from "@/types/animation-types";
import { statCards } from "@/types/dashboard-types";
import type { SummaryKey } from "@/types/dashboard-types";
import type { RequestTutors, Tutor } from "@/types/response-types";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NeedsAttentionPanel from "./NeedsAttentionPanel";
import RecentActivityFeed from "./RecentActivityFeed";
import TutorGrowthChart from "./TutorGrowthChart";

const formatNumber = (value: number) => value.toLocaleString("en-US");
const STAT_COMPARISON_DAYS = 7;

type TimestampedRecord = {
  createdAt?: string | null;
};

type StatTrend = {
  today: number;
  currentPeriod: number;
  previousPeriod: number;
  label: string;
  className: string;
};

const capitalize = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const getRecordTimestamp = (record: TimestampedRecord) => {
  if (!record.createdAt) return 0;

  const timestamp = new Date(record.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const countRecordsInRange = (
  records: TimestampedRecord[],
  start: Date,
  end: Date,
) => {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return records.filter((record) => {
    const timestamp = getRecordTimestamp(record);
    return timestamp >= startTime && timestamp < endTime;
  }).length;
};

const buildStatTrend = (records: TimestampedRecord[]): StatTrend => {
  const todayStart = getStartOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  const currentPeriodStart = addDays(todayStart, -(STAT_COMPARISON_DAYS - 1));
  const previousPeriodStart = addDays(
    currentPeriodStart,
    -STAT_COMPARISON_DAYS,
  );

  const today = countRecordsInRange(records, todayStart, tomorrowStart);
  const currentPeriod = countRecordsInRange(
    records,
    currentPeriodStart,
    tomorrowStart,
  );
  const previousPeriod = countRecordsInRange(
    records,
    previousPeriodStart,
    currentPeriodStart,
  );
  const change = currentPeriod - previousPeriod;

  if (previousPeriod === 0) {
    return {
      today,
      currentPeriod,
      previousPeriod,
      label:
        currentPeriod === 0
          ? "No change vs previous 7 days"
          : `+${formatNumber(currentPeriod)} vs previous 7 days`,
      className:
        currentPeriod === 0
          ? "text-gray-500 dark:text-gray-400"
          : "text-emerald-600 dark:text-emerald-400",
    };
  }

  const percentageChange = Math.round((change / previousPeriod) * 100);
  const prefix = percentageChange > 0 ? "+" : "";

  return {
    today,
    currentPeriod,
    previousPeriod,
    label:
      percentageChange === 0
        ? "No change vs previous 7 days"
        : `${prefix}${percentageChange}% vs previous 7 days`,
    className:
      percentageChange > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : percentageChange < 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-gray-500 dark:text-gray-400",
  };
};

export default function DashboardOverview() {
  const { user: authUser, isUserLoaded } = useAuthContext();

  const { data: user, isLoading: isUserLoading } = useFetchUserByIdQuery(
    authUser?.id || "",
    { skip: !authUser?.id },
  );

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useFetchDashboardSummaryQuery();

  const approvedTutorsQuery = useFetchTutorsQuery({
    page: 1,
    limit: 1000,
    status: "approved",
    sortBy: "createdAt:desc",
  });

  const tutorApplicationsQuery = useFetchTutorsQuery({
    page: 1,
    limit: 1000,
    sortBy: "createdAt:desc",
  });

  const tutorRequestsQuery = useFetchRequestForTutorsQuery({
    page: 1,
    limit: 1000,
    sortBy: "createdAt:desc",
  });

  const [isImageError, setIsImageError] = useState(false);

  useEffect(() => {
    setIsImageError(false);
  }, [user?.avatar]);

  const displayName = user?.name || authUser?.name || "Admin";
  const displayEmail = user?.email || authUser?.email || "";
  const displayRole = user?.role || authUser?.role || "admin";
  const displayStatus = user?.status || authUser?.status || "active";
  const avatarSrc = user?.avatar || authUser?.avatar || "";

  const showProfileSkeleton = !isUserLoaded || isUserLoading;
  const isStatTrendLoading =
    approvedTutorsQuery.isLoading ||
    tutorApplicationsQuery.isLoading ||
    tutorRequestsQuery.isLoading;
  const showSummarySkeleton = isSummaryLoading || isStatTrendLoading;
  const isPositiveStatus = ["active", "approved"].includes(
    displayStatus.toLowerCase(),
  );
  const statTrends = useMemo<Record<SummaryKey, StatTrend>>(
    () => ({
      registeredTutors: buildStatTrend(
        (approvedTutorsQuery.data?.results || []) as Tutor[],
      ),
      requestTutorRequests: buildStatTrend(
        (tutorRequestsQuery.data?.results || []) as RequestTutors[],
      ),
      registerAsTutorRequests: buildStatTrend(
        (tutorApplicationsQuery.data?.results || []) as Tutor[],
      ),
    }),
    [
      approvedTutorsQuery.data?.results,
      tutorApplicationsQuery.data?.results,
      tutorRequestsQuery.data?.results,
    ],
  );

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Profile card */}
      <motion.div
        layout
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="h-[3px] bg-blue-600" />

        <div className="p-6 md:p-8">
          {showProfileSkeleton ? (
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-7 w-44" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                  {avatarSrc && !isImageError ? (
                    <Image
                      width={64}
                      height={64}
                      src={avatarSrc}
                      alt={`${displayName} avatar`}
                      className="h-full w-full object-cover"
                      onError={() => setIsImageError(true)}
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                      {getInitials(displayName)}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Welcome back
                  </p>
                  <motion.h1
                    className="mt-0.5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-3xl"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {displayName}
                  </motion.h1>
                  {displayEmail && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {displayEmail}
                    </p>
                  )}
                </div>
              </div>

              <motion.div
                className="flex flex-wrap gap-2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  Role: {capitalize(displayRole)}
                </span>
                <span
                  className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isPositiveStatus
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                  }`}
                >
                  Status: {capitalize(displayStatus)}
                </span>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Error state */}
      <AnimatePresence mode="wait">
        {isSummaryError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300"
          >
            Could not load the dashboard summary right now.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats grid */}
      {showSummarySkeleton ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="mt-4 h-4 w-32" />
              <Skeleton className="mt-2 h-8 w-16" />
              <Skeleton className="mt-4 h-4 w-36" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {statCards.map(
            (
              { label, key, icon: Icon, iconBg, iconColor, accent, href },
              index,
            ) => {
              const trend = statTrends[key];

              return (
                <motion.div
                  key={key}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  layout
                  className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <Link
                    href={href}
                    aria-label={`View ${label}`}
                    className="group block h-full p-6 outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-gray-900"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {label}
                        </p>
                        <motion.p
                          className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                        >
                          {formatNumber(summary?.[key] ?? 0)}
                        </motion.p>
                      </div>
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition group-hover:border-blue-200 group-hover:text-blue-600 dark:border-gray-700 dark:text-gray-500 dark:group-hover:border-blue-800 dark:group-hover:text-blue-400"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        Today: +{formatNumber(trend.today)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium dark:border-gray-700 dark:bg-gray-800 ${trend.className}`}
                      >
                        {trend.label}
                      </span>
                    </div>

                    <div
                      className={`absolute bottom-0 left-0 right-0 h-[3px] ${accent}`}
                    />
                  </Link>
                </motion.div>
              );
            },
          )}
        </motion.div>
      )}

      <NeedsAttentionPanel />

      <TutorGrowthChart />

      <RecentActivityFeed />
    </motion.div>
  );
}
