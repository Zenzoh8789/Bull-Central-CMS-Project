import { useEffect, useState } from "react";
import { useContent } from "../../services/useContent";
import "./SectionNavigation.css";
export function SectionNavigation() {
  const content = useContent();
  const sections: [string, string][] = content.pageLayout.navigation
    .filter((n: any) => {
      const map: Record<string, string> = {
        banner: "banners",
        innovation: "about",
        construct: "equipment",
        "skid-steers": "equipment",
        customers: "service",
        customer: "testimonials",
        news: "news",
        contact: "footer",
      };
      const key = map[n.id];
      return (
        !key ||
        (content[key]?.enabled &&
          content.pageLayout.sections.find((s: any) => s.key === key)
            ?.visible !== false)
      );
    })
    .map((n: any) => [n.id, n.label]);
  const [activeSection, setActiveSection] = useState("banner");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -45% 0px", threshold: 0 },
    );
    sections.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [content]);
  if (!content.pageLayout.enabled) return null;
  return (
    <nav className="section-dots" aria-label="Page sections">
      {sections.map(([id, label], i) => (
        <a
          href={"#" + id}
          key={id}
          className={"dot " + (activeSection === id ? "active" : "")}
          aria-label={label}
          aria-current={activeSection === id ? "location" : undefined}
          title={label}
        >
          {i + 1}
        </a>
      ))}
    </nav>
  );
}
