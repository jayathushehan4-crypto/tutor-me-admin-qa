/* eslint-disable @typescript-eslint/no-unused-vars */
import { TagSchema } from "@/schemas/tag.schema";
import { FetchTagsRequest, UpdateTagRequest } from "@/types/request-types";
import { PaginatedResponse, Tag } from "@/types/response-types";
import { baseApi } from "../..";
import { Endpoints } from "../../endpoints";

export const TagsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    fetchTags: build.query<PaginatedResponse<Tag>, FetchTagsRequest>({
      query: (payload) => {
        const { tagId, ...rest } = payload;
        return {
          url: Endpoints.Tags,
          method: "GET",
          params: rest,
        };
      },
      providesTags: ["Tags"],
    }),

    fetchTagById: build.query<Tag, string>({
      query: (id) => ({
        url: `${Endpoints.Tags}/${id}`,
        method: "GET",
      }),
    }),

    createTag: build.mutation<Tag, TagSchema>({
      query: (payload) => {
        return {
          url: Endpoints.Tags,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["Tags"],
    }),

    updateTag: build.mutation<Tag, UpdateTagRequest>({
      query: ({ id, ...payload }) => {
        return {
          url: `${Endpoints.Tags}/${id}`,
          method: "PATCH",
          body: payload,
        };
      },
      invalidatesTags: ["Tags"],
    }),

    deleteTag: build.mutation<void, string>({
      query: (id) => ({
        url: `${Endpoints.Tags}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tags"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchTagsQuery,
  useLazyFetchTagsQuery,
  useFetchTagByIdQuery,
  useLazyFetchTagByIdQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = TagsApi;
