"use client";

import { useFetchInquiriesQuery } from "@/store/api/splits/inquiries";
import { useFetchRequestForTutorsQuery } from "@/store/api/splits/request-tutor";
import { useFetchTutorsQuery } from "@/store/api/splits/tutors";
import type { Inquiry, RequestTutors, Tutor } from "@/types/response-types";
import { useCallback } from "react";

export type DashboardAnalytics = {
  approvedTutors: Tutor[];
  tutorApplications: Tutor[];
  tutorRequests: RequestTutors[];
  inquiries: Inquiry[];
  approvedTutorsTotal: number;
  tutorApplicationsTotal: number;
  tutorRequestsTotal: number;
  pendingTutorApplicationsTotal: number;
  inquiriesTotal: number;
  isCoreLoading: boolean;
  isCoreFetching: boolean;
  isCoreError: boolean;
  isAttentionLoading: boolean;
  isAttentionFetching: boolean;
  isAttentionError: boolean;
  isRecentLoading: boolean;
  isRecentFetching: boolean;
  isRecentError: boolean;
  refetchCore: () => void;
  refetchAttention: () => void;
  refetchRecent: () => void;
  refetchAll: () => void;
};

export const useDashboardAnalytics = (): DashboardAnalytics => {
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
    limit: 5,
    sortBy: "createdAt:desc",
  });

  const refetchCore = useCallback(() => {
    approvedTutorsQuery.refetch();
    tutorApplicationsQuery.refetch();
    tutorRequestsQuery.refetch();
  }, [approvedTutorsQuery, tutorApplicationsQuery, tutorRequestsQuery]);

  const refetchAttention = useCallback(() => {
    pendingTutorsQuery.refetch();
    tutorRequestsQuery.refetch();
    inquiriesQuery.refetch();
  }, [inquiriesQuery, pendingTutorsQuery, tutorRequestsQuery]);

  const refetchRecent = useCallback(() => {
    tutorApplicationsQuery.refetch();
    tutorRequestsQuery.refetch();
    inquiriesQuery.refetch();
  }, [inquiriesQuery, tutorApplicationsQuery, tutorRequestsQuery]);

  const refetchAll = useCallback(() => {
    refetchCore();
    pendingTutorsQuery.refetch();
    inquiriesQuery.refetch();
  }, [inquiriesQuery, pendingTutorsQuery, refetchCore]);

  return {
    approvedTutors: approvedTutorsQuery.data?.results || [],
    tutorApplications: tutorApplicationsQuery.data?.results || [],
    tutorRequests: tutorRequestsQuery.data?.results || [],
    inquiries: inquiriesQuery.data?.results || [],
    approvedTutorsTotal: approvedTutorsQuery.data?.totalResults || 0,
    tutorApplicationsTotal: tutorApplicationsQuery.data?.totalResults || 0,
    tutorRequestsTotal: tutorRequestsQuery.data?.totalResults || 0,
    pendingTutorApplicationsTotal: pendingTutorsQuery.data?.totalResults || 0,
    inquiriesTotal: inquiriesQuery.data?.totalResults || 0,
    isCoreLoading:
      approvedTutorsQuery.isLoading ||
      tutorApplicationsQuery.isLoading ||
      tutorRequestsQuery.isLoading,
    isCoreFetching:
      approvedTutorsQuery.isFetching ||
      tutorApplicationsQuery.isFetching ||
      tutorRequestsQuery.isFetching,
    isCoreError:
      approvedTutorsQuery.isError ||
      tutorApplicationsQuery.isError ||
      tutorRequestsQuery.isError,
    isAttentionLoading:
      pendingTutorsQuery.isLoading ||
      tutorRequestsQuery.isLoading ||
      inquiriesQuery.isLoading,
    isAttentionFetching:
      pendingTutorsQuery.isFetching ||
      tutorRequestsQuery.isFetching ||
      inquiriesQuery.isFetching,
    isAttentionError:
      pendingTutorsQuery.isError ||
      tutorRequestsQuery.isError ||
      inquiriesQuery.isError,
    isRecentLoading:
      tutorApplicationsQuery.isLoading ||
      tutorRequestsQuery.isLoading ||
      inquiriesQuery.isLoading,
    isRecentFetching:
      tutorApplicationsQuery.isFetching ||
      tutorRequestsQuery.isFetching ||
      inquiriesQuery.isFetching,
    isRecentError:
      tutorApplicationsQuery.isError ||
      tutorRequestsQuery.isError ||
      inquiriesQuery.isError,
    refetchCore,
    refetchAttention,
    refetchRecent,
    refetchAll,
  };
};
