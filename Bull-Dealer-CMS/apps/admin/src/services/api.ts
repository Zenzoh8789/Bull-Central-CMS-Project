import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { signedOut } from "../store/authSlice";
const base = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (h, { getState }) => {
    const token = (getState() as { auth: { token: string } }).auth.token;
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
      invalidatesTags: (_result, e, a) =>
        e || a.path === "publish/preview" ? [] : ["CMS"],
    }),
    login: b.mutation<any, { username: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    enter: b.mutation<any, { employeeId: number | null }>({
      query: (body) => ({ url: "/auth/enter", method: "POST", body }),
      invalidatesTags: ["CMS"],
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
  useEnterMutation,
  useMeQuery,
} = api;
export function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const value = error as {
      data?: { message?: string | string[] };
      error?: string;
    };
    const message = value.data?.message;
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string") return message;
    if (typeof value.error === "string") return value.error;
  }
  return "Request failed. Please try again.";
}
