import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Dealer, Product, Enquiry } from "../types/site";
export const api = createApi({
  reducerPath: "dealerApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (b) => ({
    site: b.query<
      {
        dealer: Dealer;
        products: Product[];
        mode: string;
        content: Record<string, any>;
        sources: Record<string, string>;
      },
      void
    >({
      query: () => "/site",
    }),
    products: b.query<Product[], void>({ query: () => "/products" }),
    product: b.query<Product, string>({
      query: (id) => "/products/" + encodeURIComponent(id),
    }),
    enquiry: b.mutation<{ reference: string }, Enquiry>({
      query: (body) => ({ url: "/enquiries", method: "POST", body }),
    }),
  }),
});

export const {
  useSiteQuery,
  useProductsQuery,
  useProductQuery,
  useEnquiryMutation,
} = api;
