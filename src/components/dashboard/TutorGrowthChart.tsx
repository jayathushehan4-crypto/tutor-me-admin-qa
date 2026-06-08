"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ApexOptions } from "apexcharts";
import { AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { DashboardAnalytics } from "./useDashboardAnalytics";

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

type ChartDayEntry = {
  date: string;
  count: number;
};

type MetricData = Record<
  Exclude<ChartMetric, "all">,
  {
    records: ChartDayEntry[];
    total: number;
  }
>;

type DateRange = 7 | 14 | 30;

type PeriodComparison = {
  currentPeriod: number;
  previousPeriod: number;
  label: string;
  className: string;
};

const DEFAULT_DAY_COUNT: DateRange = 14;

const dateRangeOptions: Array<{ value: DateRange; label: string }> = [
  { value: 7, label: "7D" },
  { value: 14, label: "14D" },
  { value: 30, label: "30D" },
];

const metricConfigs: MetricConfig[] = [
  {
    key: "tutors",
    label: "Approved Tutors",
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
    label: "Pending Tutor Applications",
    shortLabel: "Pending",
    color: "#F97316",
    activeClassName:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-500/10 dark:text-orange-300",
    mutedClassName:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
];

const formatNumber = (value: number) => value.toLocaleString("en-US");

const getDateLabelInterval = (dayCount: DateRange) => {
  if (dayCount === 30) return 5;
  if (dayCount === 14) return 2;
  return 1;
};

const buildPeriodComparison = (
  currentPeriod: number,
  previousPeriod: number,
  dayCount: DateRange,
): PeriodComparison => {
  if (previousPeriod === 0) {
    return {
      currentPeriod,
      previousPeriod,
      label:
        currentPeriod === 0
          ? `No change vs previous ${dayCount} days`
          : `+${formatNumber(currentPeriod)} vs previous ${dayCount} days`,
      className:
        currentPeriod === 0
          ? "text-gray-700 dark:text-gray-300"
          : "text-emerald-700 dark:text-emerald-400",
    };
  }

  const change = currentPeriod - previousPeriod;
  const percentageChange = Math.round((change / previousPeriod) * 100);
  const prefix = percentageChange > 0 ? "+" : "";

  return {
    currentPeriod,
    previousPeriod,
    label:
      percentageChange === 0
        ? `No change vs previous ${dayCount} days`
        : `${prefix}${percentageChange}% vs previous ${dayCount} days`,
    className:
      percentageChange > 0
        ? "text-emerald-700 dark:text-emerald-400"
        : percentageChange < 0
          ? "text-rose-700 dark:text-rose-400"
          : "text-gray-700 dark:text-gray-300",
  };
};

export default function TutorGrowthChart({
  analytics,
  className = "",
}: {
  analytics: DashboardAnalytics;
  className?: string;
}) {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("all");
  const [dayCount, setDayCount] = useState<DateRange>(DEFAULT_DAY_COUNT);

  const metricData = useMemo(
    (): MetricData => ({
      tutors: {
        records: analytics.approvedTutors,
        total: analytics.approvedTutorsTotal,
      },
      tutorRequests: {
        records: analytics.tutorRequests,
        total: analytics.tutorRequestsTotal,
      },
      tutorApplications: {
        records: analytics.tutorApplications,
        total: analytics.tutorApplicationsTotal,
      },
    }),
    [
      analytics.approvedTutors,
      analytics.approvedTutorsTotal,
      analytics.tutorApplications,
      analytics.tutorApplicationsTotal,
      analytics.tutorRequests,
      analytics.tutorRequestsTotal,
    ],
  );

  // Backend sends enough { date, count } history for current and previous windows.
  // Slice the last `dayCount` items for the visible chart.
  // and map to the GrowthBucket shape the chart internals expect.
  const dailyData = useMemo(
    () =>
      metricConfigs.reduce(
        (acc, metric) => {
          const allDays = metricData[metric.key].records;
          const sliced = allDays.slice(-dayCount);
          const buckets: GrowthBucket[] = sliced.map((d) => ({
            key: d.date,
            label: new Date(d.date + "T00:00:00Z").toLocaleString("en-US", {
              day: "numeric",
              month: "short",
            }),
            value: d.count,
          }));
          return { ...acc, [metric.key]: buckets };
        },
        {} as Record<Exclude<ChartMetric, "all">, GrowthBucket[]>,
      ),
    [dayCount, metricData],
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

  const currentPeriodTotal = visibleMetrics.reduce((total, metric) => {
    return (
      total +
      dailyData[metric.key].reduce((metricTotal, day) => {
        return metricTotal + day.value;
      }, 0)
    );
  }, 0);

  // For period comparison: sum the dayCount slice BEFORE the current window
  const previousPeriodTotal = visibleMetrics.reduce((total, metric) => {
    const allDays = metricData[metric.key].records;
    const prevSlice = allDays.slice(-(dayCount * 2), -dayCount);
    return total + prevSlice.reduce((s, d) => s + d.count, 0);
  }, 0);
  const periodComparison = buildPeriodComparison(
    currentPeriodTotal,
    previousPeriodTotal,
    dayCount,
  );

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

  const dateLabelInterval = getDateLabelInterval(dayCount);
  const categories = dailyData.tutors.map((day, index) => {
    const isFirst = index === 0;
    const isLast = index === dailyData.tutors.length - 1;

    return isFirst || isLast || index % dateLabelInterval === 0
      ? day.label
      : "";
  });

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
      parentHeightOffset: 0,
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
        bottom: 0,
        left: 4,
        right: 16,
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
      size: activeMetric === "all" ? 2.5 : 4,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 5,
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
      marker: {
        show: true,
      },
      style: {
        fontSize: "12px",
        fontFamily: "Outfit, sans-serif",
      },
      y: {
        formatter: (value: number) => formatNumber(value),
      },
    },
    xaxis: {
      categories,
      crosshairs: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        rotate: 0,
        hideOverlappingLabels: true,
        trim: false,
        style: {
          colors: "#667085",
          fontSize: "11px",
        },
      },
      tooltip: {
        enabled: false,
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

  const isLoading = analytics.isCoreLoading;
  const isRefetching = analytics.isCoreFetching;
  const isError = analytics.isCoreError;

  const hasChartData = metricConfigs.some(
    (metric) => metricData[metric.key].total > 0,
  );
  const refetchChartData = analytics.refetchCore;

  if (isLoading) {
    return (
      <div
        className={`h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-4 w-56" />
              </div>
            </div>
            <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700 sm:flex sm:w-fit">
              <Skeleton className="h-7 rounded-md sm:w-10" />
              <Skeleton className="h-7 rounded-md sm:w-10" />
              <Skeleton className="h-7 rounded-md sm:w-10" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-44 rounded-lg" />
          </div>
          <Skeleton className="mt-5 h-72 w-full rounded-xl" />
        </div>
        <div className="h-[3px] bg-blue-600" />
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="p-5 sm:p-6">
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
                Daily activity over the last {dayCount} days
              </p>
            </div>
          </div>

          <div
            className="grid w-full grid-cols-3 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800 sm:inline-flex sm:w-fit"
            role="group"
            aria-label="Select chart date range"
          >
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDayCount(option.value)}
                aria-pressed={dayCount === option.value}
                className={`h-8 rounded-md px-3 text-sm font-medium transition ${
                  dayCount === option.value
                    ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => setActiveMetric("all")}
            className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
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
              className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                activeMetric === metric.key
                  ? metric.activeClassName
                  : `${metric.mutedClassName} hover:border-gray-300 dark:hover:border-gray-600`
              }`}
            >
              {metric.shortLabel}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <span className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:justify-start sm:text-left">
            {selectedMetric ? selectedMetric.label : "Total"}:{" "}
            {formatNumber(totalResults)}
          </span>
          <span className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-center text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 sm:justify-start sm:text-left">
            Today: +{formatNumber(todayTotal)}
          </span>
          <span
            className={`inline-flex items-center justify-center whitespace-normal rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-sm font-medium dark:border-gray-700 dark:bg-gray-800 sm:justify-start sm:text-left ${periodComparison.className}`}
          >
            {periodComparison.label}
          </span>
          <span className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:justify-start sm:text-left">
            Peak Day: {formatNumber(peakDailyValue)}
          </span>
        </div>

        {isError ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium">Could not load activity data.</p>
                <p className="mt-1 text-red-600/80 dark:text-red-300/80">
                  Retry to refresh tutor registrations, tutor requests, and
                  application activity.
                </p>
              </div>
              <button
                type="button"
                onClick={refetchChartData}
                disabled={isRefetching}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:pointer-events-none disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/20 dark:hover:bg-red-950/40"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
                />
                Retry
              </button>
            </div>
          </div>
        ) : !hasChartData ? (
          <div className="mt-5 rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300">
              No dashboard activity yet.
            </p>
            <p className="mt-1">
              Tutor registrations, tutor requests, and tutor applications will
              appear here once records are added.
            </p>
          </div>
        ) : (
          <div className="mt-5 min-w-0 overflow-hidden">
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
