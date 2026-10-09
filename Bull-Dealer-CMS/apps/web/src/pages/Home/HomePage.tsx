import { Hero } from "../../components/Hero/Hero";
import { Statistics } from "../../components/Statistics/Statistics";
import { DealerAbout } from "../../components/DealerAbout/DealerAbout";
import { EquipmentCatalogue } from "../../components/EquipmentCatalogue/EquipmentCatalogue";
import { Testimonials } from "../../components/Testimonials/Testimonials";
import { News } from "../../components/News/News";

import { useContent } from "../../services/useContent";
import {
  Service,
  Gallery,
  Downloads,
} from "../../components/ExtraSections/ExtraSections";
export function HomePage() {
  const { pageLayout } = useContent();

  const components: Record<string, React.ReactNode> = {
    banners: <Hero />,
    statistics: <Statistics />,
    about: <DealerAbout />,
    equipment: <EquipmentCatalogue />,
    service: <Service />,
    testimonials: <Testimonials />,
    news: <News />,
    gallery: <Gallery />,
    downloads: <Downloads />,
  };
  const p = pageLayout.enabled
    ? pageLayout
    : {
        sections: Object.keys(components).map((key) => ({
          key,
          visible: true,
        })),
      };
  return (
    <>
      
      {p.sections
        .filter((s: any) => s.visible)
        .map((s: any) => (
          <div key={s.key}>{components[s.key]}</div>
        ))}
    </>
  );
}
