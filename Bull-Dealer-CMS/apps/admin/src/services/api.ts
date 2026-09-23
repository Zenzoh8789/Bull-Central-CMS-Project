import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { signedOut } from "../store/authSlice";
const base = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (h, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token) h.set("Authorization", "Bearer " + token);
    return h;
  },
});
export const api = createApi({
  reducerPath: "cmsApi",
  baseQuery: async (args, ctx, extra) => {
    const result = await base(args, ctx, extra);
    if (result.error?.status === 401) ctx.dispatch(signedOut());
    return result;
  },
  tagTypes: ["CMS"],
  endpoints: (b) => ({
    read: b.query<any, string>({
      query: (path) => "/admin/" + path,
      providesTags: ["CMS"],
    }),
    write: b.mutation<any, { path: string; body?: any; method?: string }>({
      query: ({ path, body, method = "POST" }) => ({
        url: "/admin/" + path,
        method,
        body,
      }),
      invalidatesTags: (r, e, a) =>
        e || a.path === "publish/preview" ? [] : ["CMS"],
    }),
    login: b.mutation<any, { username: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    logout: b.mutation<any, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    me: b.query<any, void>({ query: () => "/auth/me" }),
  }),
});
export const {
  useReadQuery,
  useWriteMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} = api;
export function errorText(e: any) {
  const m = e?.data?.message;
  return Array.isArray(m)
    ? m.join(". ")
    : m || e?.error || "Request failed. Please try again.";
}
