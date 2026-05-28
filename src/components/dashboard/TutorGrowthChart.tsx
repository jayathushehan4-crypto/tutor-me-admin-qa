"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useFetchRequestForTutorsQuery } from "@/store/api/splits/request-tutor";
import { useFetchTutorsQuery } from "@/store/api/splits/tutors";
import type { RequestTutors, Tutor } from "@/types/response-types";
import { ApexOptions } from "apexcharts";
import { TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type ChartMetric = "all" | "tutors" | "tutorRequests" | "tutorApplications";

type GrowthBucket = {
  key: string;
  label: string;
  value: number;
};

type MetricConfig = {
  key: Exclude<ChartMetric, "all">;
  label: string;
  shortLabel: string;
  color: string;
  activeClassName: string;
  mutedClassName: string;
};

type TimestampedRecord = {
  createdAt: string;
};

type MetricData = Record<
  Exclude<ChartMetric, "all">,
  {
    records: TimestampedRecord[];
    total: number;
  }
>;

const DAY_COUNT = 14;

const metricConfigs: MetricConfig[] = [
  {
    key: "tutors",
    label: "Registered Tutors",
    shortLabel: "Tutors",
    color: "#465FFF",
    activeClassName:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    mutedClassName:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    key: "tutorRequests",
    label: "Tutor Requests",
    shortLabel: "Requests",
    color: "#7C3AED",
    activeClassName:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-500/10 dark:text-violet-300",
    mutedClassName:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    key: "tutorApplications",
    label: "Register as Tutor Requests",
    shortLabel: "Applications",
    color: "#F97316",
    activeClassName:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-500/10 dark:text-orange-300",
    mutedClassName:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
];

const getDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const getDayLabel = (date: Date) =>
  date.toLocaleString("en-US", { day: "numeric", month: "short" });

const createEmptyDays = () => {
  const today = new Date();

  return Array.from({ length: DAY_COUNT }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (DAY_COUNT - 1 - index),
    );

    return {
      key: getDayKey(date),
      label: getDayLabel(date),
      value: 0,
    };
  });
};

const buildDailyGrowth = <T extends TimestampedRecord>(
  records: T[],
): GrowthBucket[] => {
  const days = createEmptyDays();
  const firstDay = days[0]?.key;
  const dailyTotals = new Map(days.map((day) => [day.key, 0]));

  records.forEach((record) => {
    const createdAt = new Date(record.createdAt);

    if (Number.isNaN(createdAt.getTime())) {
      return;
    }

    const dayKey = getDayKey(createdAt);

    if (firstDay && dayKey < firstDay) {
      return;
    }

    if (dailyTotals.has(dayKey)) {
      dailyTotals.set(dayKey, (dailyTotals.get(dayKey) || 0) + 1);
    }
  });

  return days.map((day) => ({
    ...day,
    value: dailyTotals.get(day.key) || 0,
  }));
};

const formatNumber = (value: number) => value.toLocaleString("en-US");

export default function TutorGrowthChart() {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("all");

  const approvedTutorsQuery = useFetchTutorsQuery({
    page: 1,
    limit: 1000,
    status: "approved",
    sortBy: "createdAt:asc",
  });

  const tutorApplicationsQuery = useFetchTutorsQuery({
    page: 1,
    limit: 1000,
    sortBy: "createdAt:asc",
  });

  const tutorRequestsQuery = useFetchRequestForTutorsQuery({
    page: 1,
    limit: 1000,
    sortBy: "createdAt:asc",
  });

  const metricData = useMemo(
    (): MetricData => ({
      tutors: {
        records: (approvedTutorsQuery.data?.results || []) as Tutor[],
        total: approvedTutorsQuery.data?.totalResults || 0,
      },
      tutorRequests: {
        records: (tutorRequestsQuery.data?.results || []) as RequestTutors[],
        total: tutorRequestsQuery.data?.totalResults || 0,
      },
      tutorApplications: {
        records: (tutorApplicationsQuery.data?.results || []) as Tutor[],
        total: tutorApplicationsQuery.data?.totalResults || 0,
      },
    }),
    [
      approvedTutorsQuery.data?.results,
      approvedTutorsQuery.data?.totalResults,
      tutorApplicationsQuery.data?.results,
      tutorApplicationsQuery.data?.totalResults,
      tutorRequestsQuery.data?.results,
      tutorRequestsQuery.data?.totalResults,
    ],
  );

  const dailyData = useMemo(
    () =>
      metricConfigs.reduce(
        (acc, metric) => ({
          ...acc,
          [metric.key]: buildDailyGrowth(metricData[metric.key].records),
        }),
        {} as Record<Exclude<ChartMetric, "all">, GrowthBucket[]>,
      ),
    [metricData],
  );

  const visibleMetrics =
    activeMetric === "all"
      ? metricConfigs
      : metricConfigs.filter((metric) => metric.key === activeMetric);

  const selectedMetric =
    activeMetric === "all"
      ? null
      : metricConfigs.find((metric) => metric.key === activeMetric) || null;

  const todayTotal = visibleMetrics.reduce((total, metric) => {
    return total + (dailyData[metric.key].at(-1)?.value || 0);
  }, 0);

  const totalResults = visibleMetrics.reduce((total, metric) => {
    return total + metricData[metric.key].total;
  }, 0);

  const peakDailyValue = Math.max(
    ...visibleMetrics.flatMap((metric) =>
      dailyData[metric.key].map((day) => day.value),
    ),
    0,
  );

  const maxDailyValue = Math.max(peakDailyValue, 1);

  const categories = dailyData.tutors.map((day) => day.label);

  const series = visibleMetrics.map((metric) => ({
    name: metric.label,
    data: dailyData[metric.key].map((day) => day.value),
  }));

  const options: ApexOptions = {
    colors: visibleMetrics.map((metric) => metric.color),
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 280,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: "#EAECF0",
      strokeDashArray: 4,
      padding: {
        left: 8,
        right: 8,
        top: 0,
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      show: activeMetric === "all",
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontWeight: 500,
      markers: {
        size: 6,
        strokeWidth: 0,
      },
    },
    markers: {
      size: activeMetric === "all" ? 3 : 4,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    states: {
      hover: {
        filter: {
          type: "darken",
        },
      },
    },
    stroke: {
      curve: "smooth",
      width: activeMetric === "all" ? 2.5 : 3,
    },
    tooltip: {
      shared: activeMetric === "all",
      intersect: false,
      y: {
        formatter: (value: number) => formatNumber(value),
      },
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        rotate: 0,
        hideOverlappingLabels: true,
        trim: true,
        style: {
          colors: "#667085",
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      min: 0,
      max: maxDailyValue + 1,
      forceNiceScale: true,
      labels: {
        formatter: (value) => Math.round(value).toString(),
        style: {
          colors: ["#667085"],
          fontSize: "11px",
        },
      },
    },
  };

  const isLoading =
    approvedTutorsQuery.isLoading ||
    tutorApplicationsQuery.isLoading ||
    tutorRequestsQuery.isLoading;

  const isError =
    approvedTutorsQuery.isError ||
    tutorApplicationsQuery.isError ||
    tutorRequestsQuery.isError;

  const hasChartData = metricConfigs.some(
    (metric) => metricData[metric.key].total > 0,
  );

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-4 w-56" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <Skeleton className="mt-5 h-72 w-full rounded-xl" />
        </div>
        <div className="h-[3px] bg-blue-600" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dashboard Activity
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Daily activity over the last {DAY_COUNT} days
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveMetric("all")}
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              activeMetric === "all"
                ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            All
          </button>

          {metricConfigs.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() => setActiveMetric(metric.key)}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                activeMetric === metric.key
                  ? metric.activeClassName
                  : `${metric.mutedClassName} hover:border-gray-300 dark:hover:border-gray-600`
              }`}
            >
              {metric.shortLabel}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {selectedMetric ? selectedMetric.label : "Total"}:{" "}
            {formatNumber(totalResults)}
          </span>
          <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            Today: +{formatNumber(todayTotal)}
          </span>
          <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Peak Day: {formatNumber(peakDailyValue)}
          </span>
        </div>

        {isError ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
            Could not load dashboard activity data right now.
          </div>
        ) : !hasChartData ? (
          <div className="mt-5 rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Dashboard activity will appear here once records are added.
          </div>
        ) : (
          <div className="mt-5 w-full">
            <ReactApexChart
              options={options}
              series={series}
              type="line"
              height={280}
            />
          </div>
        )}
      </div>

      <div className="h-[3px] bg-blue-600" />
    </div>
  );
}
