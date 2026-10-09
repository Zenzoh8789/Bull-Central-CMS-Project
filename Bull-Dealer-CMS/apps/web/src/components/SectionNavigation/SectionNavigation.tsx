import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useContent } from "../../services/useContent";
import "./SectionNavigation.css";

export function SectionNavigation() {
  const { pageLayout } = useContent();
  const { pathname } = useLocation();
  const [positions, setPositions] = useState<number[]>([0]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    let stops = [0];
    const updateActive = () => {
      const y = window.scrollY;
      let closest = 0;
      stops.forEach((stop, index) => {
        if (Math.abs(stop - y) < Math.abs(stops[closest] - y)) closest = index;
      });
      setActive(closest);
    };
    const measure = () => {
      const height = window.innerHeight;
      const header = document.querySelector("header")?.getBoundingClientRect().height || 0;
      const step = Math.max(1, height - header);
      const end = Math.max(0, document.documentElement.scrollHeight - height);
      const count = Math.ceil(end / step);
      stops = Array.from({ length: count + 1 }, (_, index) => Math.min(index * step, end));
      setPositions(stops);
      updateActive();
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    observer.observe(document.documentElement);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", updateActive, { passive: true });
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", updateActive);
    };
  }, [pathname]);

  if (!pageLayout.enabled || positions.length < 2) return null;
  return (
    <nav className="section-dots" aria-label="Page scroll navigation">
      {positions.map((top, index) => (
        <button type="button" key={index} className={"dot " + (active === index ? "active" : "")}
          aria-label={"Scroll to page " + (index + 1)} aria-current={active === index ? "location" : undefined}
          title={"Page " + (index + 1)}
          onClick={() => window.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>
          {index + 1}
        </button>
      ))}
    </nav>
  );
}
