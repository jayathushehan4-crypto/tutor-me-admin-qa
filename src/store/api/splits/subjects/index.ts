/* eslint-disable @typescript-eslint/no-unused-vars */
import { CreateSubjectSchema } from "@/app/(admin)/subjects/components/add-subject/schema";
import {
  FetchSubjectsRequest,
  UpdateSubjectRequest,
} from "@/types/request-types";
import { PaginatedResponse, Subject } from "@/types/response-types";
import { baseApi } from "../..";
import { Endpoints } from "../../endpoints";

export const SubjectsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    fetchSubjects: build.query<
      PaginatedResponse<Subject>,
      FetchSubjectsRequest
    >({
      query: (payload) => {
        const { subjectId, ...rest } = payload;
        return {
          url: Endpoints.Subjects,
          method: "GET",
          params: rest,
        };
      },
      providesTags: ["Subjects"],
    }),

    fetchSubjectById: build.query<Subject, string>({
      query: (id) => ({
        url: `${Endpoints.Subjects}/${id}`,
        method: "GET",
      }),
    }),

    createSubject: build.mutation<Subject, CreateSubjectSchema>({
      query: (payload) => {
        return {
          url: Endpoints.Subjects,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["Subjects"],
    }),

    updateSubject: build.mutation<Subject, UpdateSubjectRequest>({
      query: ({ id, ...payload }) => {
        return {
          url: `${Endpoints.Subjects}/${id}`,
          method: "PATCH",
          body: payload,
        };
      },
      invalidatesTags: ["Subjects"],
    }),

    deleteSubject: build.mutation<void, string>({
      query: (id) => ({
        url: `${Endpoints.Subjects}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subjects"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchSubjectsQuery,
  useLazyFetchSubjectsQuery,
  useFetchSubjectByIdQuery,
  useLazyFetchSubjectByIdQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} = SubjectsApi;
