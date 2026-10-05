import { bannerSlides } from "@bull/content/banners";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useContent } from "../../services/useContent";
import "./Hero.css";
export function Hero() {
  const { banners: config, seo } = useContent();
  const banners = bannerSlides(config);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (
      !config.enabled ||
      !config.autoplay ||
      banners.length < 2 ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = setInterval(
      () => setSlide((s) => (s + 1) % banners.length),
      config.interval,
    );
    return () => clearInterval(timer);
  }, [slide, banners.length, config.interval, config.enabled, config.autoplay]);
  useEffect(() => setSlide(0), [config]);
  if (!config.enabled || !banners.length) return null;
  return (
    <section
      id="banner"
      className="banner"
      aria-label="BULL equipment highlights"
      aria-roledescription="carousel"
    >
      <h1 className="sr-only">{seo.title}</h1>
      <div className="banner-slides">
        {banners.map((item: any, i: number) => (
          <img
            key={i}
            className={i === slide % banners.length ? "banner-image active" : "banner-image"}
            src={item.image}
            alt={item.alt}
            aria-hidden={i !== slide % banners.length}
            fetchPriority={i === 0 ? "high" : "auto"}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>
      <a className="scroll-down" href="#innovation">
        {config.scrollLabel} <ChevronDown size={17} />
      </a>
      <div className="banner-controls">
        {banners.map((_: any, i: number) => (
          <button
            key={i}
            className={"dot " + (slide === i ? "active" : "")}
            aria-label={`Show banner ${i + 1}`}
            aria-pressed={slide === i}
            onClick={() => {
              setSlide(i);
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </section>
  );
}
