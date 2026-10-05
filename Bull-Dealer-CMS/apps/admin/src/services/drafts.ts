import { api } from "./api";
import type { DraftSaveRequest, DraftSaveResponse } from "@bull/content/cms";
export const draftsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    saveDraft: builder.mutation<DraftSaveResponse, DraftSaveRequest>({
      query: (body) => ({ url: "/admin/drafts", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["CMS"]),
    }),
    deleteDraft: builder.mutation<
      { deleted: boolean },
      { id: number; expectedRevision: number }
    >({
      query: ({ id, expectedRevision }) => ({
        url: "/admin/drafts/" + id,
        method: "DELETE",
        body: { expectedRevision },
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CMS"]),
    }),
  }),
});
export const { useSaveDraftMutation, useDeleteDraftMutation } = draftsApi;
