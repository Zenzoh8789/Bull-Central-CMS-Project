import { useSiteQuery } from "./siteApi";
/** The layout waits for tenant resolution before rendering any dealer content. */
export function useContent(): Record<string, any> {
  const { data } = useSiteQuery();
  if (!data) throw new Error("Dealer content must be loaded by SiteLayout");
  return data.content;
}
