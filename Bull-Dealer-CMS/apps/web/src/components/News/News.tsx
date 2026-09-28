import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, CalendarDays } from "lucide-react";
import { normalizeNews } from "@bull/content/news";
import { useSiteQuery } from "../../services/siteApi";
import { useContent } from "../../services/useContent";
import "./News.css";
export function useNews() {
  useSiteQuery(undefined, {
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const { news } = useContent();
  const n = normalizeNews(news);
  return {
    ...n,
    items: [...n.items].sort((a: any, b: any) => b.date.localeCompare(a.date)),
  };
}
export function NewsCard({ article: a }: { article: any }) {
  const date = new Date(a.date + "T00:00:00");
  return (
    <article className="news-card">
      <div className="news-photo">
        {a.image && <img src={a.image} alt={a.title} loading="lazy" />}
        <time className="news-date" dateTime={a.date}>
          <span>{date.toLocaleDateString("en-US", { month: "short" })}</span>
          <strong>{date.getDate()}</strong>
          <span>{date.getFullYear()}</span>
        </time>
      </div>
      <div className="news-copy">
        <h3>{a.title}</h3>
        <p>{a.body}</p>
        <Link
          className="news-action"
          to={"/blog/" + encodeURIComponent(a.slug)}
        >
          View More <ArrowRight size={20} />
          <span className="news-round">
            <ChevronRight size={20} />
          </span>
          <span className="sr-only">: {a.title}</span>
        </Link>
      </div>
    </article>
  );
}
export function News() {
  const n = useNews();
  const rail = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(3);
  const [reduced, setReduced] = useState(false);
  const focused = useRef(false);
  const looping = n.items.length > 1 && !reduced;
  useEffect(() => {
    const resize = () => setSize(window.innerWidth < 600 ? 1 : 3);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    resize();
    motion();
    window.addEventListener("resize", resize);
    media.addEventListener("change", motion);
    return () => {
      window.removeEventListener("resize", resize);
      media.removeEventListener("change", motion);
    };
  }, []);
  useEffect(() => {
    const el = rail.current;
    if (!el || !n.enabled || !looping) return;
    let frame = 0;
    let step = 0;
    el.scrollLeft = 0;
    const timer = window.setInterval(() => {
      if (document.hidden || focused.current) return;
      const first = el.children[0] as HTMLElement | undefined;
      const second = el.children[1] as HTMLElement | undefined;
      if (!first || !second) return;
      const width =
        second.getBoundingClientRect().left -
        first.getBoundingClientRect().left;
      const from = el.scrollLeft;
      const target = (step + 1) * width;
      const started = performance.now();
      const animate = (now: number) => {
        const progress = Math.min(1, (now - started) / 250);
        const eased = (1 - Math.cos(Math.PI * progress)) / 2;
        el.scrollLeft = from + (target - from) * eased;
        if (progress < 1) frame = requestAnimationFrame(animate);
        else {
          step = (step + 1) % n.items.length;
          if (step === 0) el.scrollLeft = 0;
        }
      };
      frame = requestAnimationFrame(animate);
    }, 5000);
    return () => {
      clearInterval(timer);
      cancelAnimationFrame(frame);
    };
  }, [n.enabled, n.items.length, looping, size]);
  if (!n.enabled) return null;
  return (
    <section id="news" className="news" aria-label={n.heading}>
      <div className="news-wrap">
        <h2>{n.heading}</h2>
        <div
          className="news-carousel"
          onFocusCapture={() => {
            focused.current = true;
          }}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
              focused.current = false;
          }}
        >
          <div
            className={"news-rail" + (looping ? " news-rail-continuous" : "")}
            ref={rail}
          >
            {(looping ? [0, 1, 2] : [0]).flatMap((copy) =>
              n.items.map((a: any) => (
                <article
                  className="news-home-card"
                  key={copy + "-" + a.slug}
                  aria-hidden={copy > 0 ? true : undefined}
                >
                  <img
                    src={a.image}
                    alt={copy > 0 ? "" : a.title}
                    loading="eager"
                  />
                  <div className="news-home-copy">
                    <h3>{a.title}</h3>
                    <time dateTime={a.date}>
                      <CalendarDays size={28} />
                      {new Date(a.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" },
                      )}
                    </time>
                    <Link
                      className="view-more"
                      tabIndex={copy > 0 ? -1 : undefined}
                      to={"/blog/" + encodeURIComponent(a.slug)}
                    >
                      View More<span className="sr-only">: {a.title}</span>
                    </Link>
                  </div>
                </article>
              )),
            )}
          </div>
        </div>
        {!n.items.length && <p>No news or updates yet. Check back soon.</p>}
      </div>
    </section>
  );
}
