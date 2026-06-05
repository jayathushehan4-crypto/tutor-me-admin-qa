import { baseApi } from "../..";
import { Endpoints } from "../../endpoints";

export type DashboardSummaryResponse = {
  registeredTutors: number;
  registeredStudents: number;
  requestTutorRequests: number;
  registerAsTutorRequests: number;
};

export type DashboardTrendEntry = {
  today: number;
  last7Days: number;
  prev7Days: number;
};

export type DashboardChartDay = {
  date: string;
  count: number;
};

export type DashboardRecentActivityItem =
  | {
      type: "tutor";
      id: string;
      name: string;
      email: string;
      status: string;
      timestamp: string;
    }
  | {
      type: "tutorRequest";
      id: string;
      name: string;
      grade:
        | string
        | {
            id?: string;
            title?: string;
            name?: string;
          }
        | null;
      medium: string;
      status: string;
      timestamp: string;
    }
  | {
      type: "inquiry";
      id: string;
      senderName: string;
      senderEmail: string;
      message: string;
      timestamp: string;
    };

export type DashboardFullResponse = {
  summary: DashboardSummaryResponse;
  trends: {
    registeredTutors: DashboardTrendEntry;
    requestTutorRequests: DashboardTrendEntry;
    registerAsTutorRequests: DashboardTrendEntry;
  };
  chart: {
    approvedTutors: DashboardChartDay[];
    tutorRequests: DashboardChartDay[];
    tutorApplications: DashboardChartDay[];
    totals: {
      approvedTutors: number;
      tutorRequests: number;
      tutorApplications: number;
    };
    daysIncluded: number;
  };
  attention: {
    pendingTutorApplicationsTotal: number;
    openTutorRequestsTotal: number;
    inquiriesTotal: number;
    latestInquirySenderName: string | null;
  };
  recentActivity: DashboardRecentActivityItem[];
};

export const DashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    fetchDashboardSummary: build.query<DashboardSummaryResponse, void>({
      query: () => ({
        url: Endpoints.DashboardSummary,
        method: "GET",
      }),
    }),
    fetchFullDashboard: build.query<DashboardFullResponse, void>({
      query: () => ({
        url: Endpoints.DashboardFull,
        method: "GET",
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useFetchDashboardSummaryQuery, useFetchFullDashboardQuery } =
  DashboardApi;
