"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/context";
import { useFetchDashboardSummaryQuery } from "@/store/api/splits/dashboard";
import { useFetchUserByIdQuery } from "@/store/api/splits/users";
import { containerVariants } from "@/types/animation-types";
import { statCards } from "@/types/dashboard-types";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import NeedsAttentionPanel from "./NeedsAttentionPanel";
import TutorGrowthChart from "./TutorGrowthChart";

const formatNumber = (value: number) => value.toLocaleString("en-US");

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
  const showSummarySkeleton = isSummaryLoading;
  const isPositiveStatus = ["active", "approved"].includes(
    displayStatus.toLowerCase(),
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
            ) => (
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

                  <div
                    className={`absolute bottom-0 left-0 right-0 h-[3px] ${accent}`}
                  />
                </Link>
              </motion.div>
            ),
          )}
        </motion.div>
      )}

      <NeedsAttentionPanel />

      <TutorGrowthChart />
    </motion.div>
  );
}
