import {
  Globe,
  Image,
  BarChart3,
  Info,
  Box,
  Video,
  Newspaper,
  MapPin,
  LayoutPanelTop,
  Images,
  Settings,
} from "lucide-react";
export const contentSections = [
  { key: "seo", label: "SEO", icon: Globe },
  { key: "branding", label: "Header", icon: Image },
  { key: "banners", label: "Banners", icon: Images },
  { key: "statistics", label: "Statistics", icon: BarChart3 },
  { key: "about", label: "About us", icon: Info },
  { key: "products", label: "Products", icon: Box },
  { key: "service", label: "Service", icon: Settings },
  { key: "testimonials", label: "Videos & testimonials", icon: Video },
  { key: "news", label: "News & updates", icon: Newspaper },
  { key: "contact", label: "Contact", icon: MapPin },
  { key: "footer", label: "Footer", icon: LayoutPanelTop },
] as const;
export const sectionLabel = (key: string) =>
  contentSections.find((s) => s.key === key)?.label ||
  (
    {
      dealerContact: "Contact us",
      social: "Follow us",
      locations: "Locations",
    } as Record<string, string>
  )[key] ||
  key;
export type EditorState = { dirty: boolean; busy: boolean };
export type { ContentLayer } from "@bull/content/cms";
