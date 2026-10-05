export interface BannerItem {
  image: string;
  alt: string;
  url: string;
  title: string;
  images: string[];
  states: string[];
  enabled: boolean;
}
export interface BannerDocument {
  enabled: boolean;
  autoplay: boolean;
  interval: number;
  scrollLabel: string;
  items: BannerItem[];
}
export const indianStates: string[];
export const bannerTemplate: BannerDocument;
export function normalizeBanners(value: unknown): BannerDocument;
export function publishLabel(states: string[]): string;
export function bannerMatches(
  item: BannerItem,
  dealer: { state?: string; location?: string },
): boolean;
export function bannerSlides(config: unknown): { image: string; alt: string }[];
