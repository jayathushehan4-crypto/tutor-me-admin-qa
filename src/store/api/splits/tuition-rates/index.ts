import { CreateTuitionSchema } from "@/app/(admin)/tuition-rates/create-tuition-rate/schema";
import {
  FetchTuitionRatesRequest,
  UpdateTuitionRateRequest,
} from "@/types/request-types";
import { PaginatedResponse, TuitionRates } from "@/types/response-types";
import { baseApi } from "../..";
import { Endpoints } from "../../endpoints";

export const TuitionRatesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    fetchTuitionRates: build.query<
      PaginatedResponse<TuitionRates>,
      FetchTuitionRatesRequest
    >({
      query: (payload) => {
        const { ...rest } = payload;
        return {
          url: Endpoints.TuitionRates,
          method: "GET",
          params: rest,
        };
      },
      providesTags: ["TuitionRates"],
    }),

    fetchTuitionRateById: build.query<TuitionRates, string>({
      query: (id) => ({
        url: `${Endpoints.TuitionRates}/${id}`,
        method: "GET",
      }),
    }),

    createTuitionRate: build.mutation<TuitionRates, CreateTuitionSchema>({
      query: (payload) => ({
        url: Endpoints.TuitionRates,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["TuitionRates"],
    }),

    updateTuitionRate: build.mutation<TuitionRates, UpdateTuitionRateRequest>({
      query: ({ id, ...payload }) => ({
        url: `${Endpoints.TuitionRates}/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["TuitionRates"],
    }),

    deleteTuitionRate: build.mutation<void, string>({
      query: (id) => ({
        url: `${Endpoints.TuitionRates}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TuitionRates"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchTuitionRatesQuery,
  useLazyFetchTuitionRatesQuery,
  useFetchTuitionRateByIdQuery,
  useLazyFetchTuitionRateByIdQuery,
  useCreateTuitionRateMutation,
  useUpdateTuitionRateMutation,
  useDeleteTuitionRateMutation,
} = TuitionRatesApi;
