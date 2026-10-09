import { useVisibleAutoplay } from "../../hooks/useVisibleAutoplay";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CalendarDays } from "lucide-react";
import { normalizeNews } from "@bull/content/news";
import { useContent } from "../../services/useContent";

import "./News.css";

export function useNews() {
  const { news } = useContent();

  return useMemo(() => {
    const normalized = normalizeNews(news);

    return {
      ...normalized,
      items: [...normalized.items].sort((a: any, b: any) =>
        b.date.localeCompare(a.date),
      ),
    };
  }, [news]);
}

export function NewsCard({ article: a }: { article: any }) {
  const date = new Date(a.date + "T00:00:00");

  return (
    <article className="news-card">
      <div className="news-photo">
        {a.image && (
          <img
            src={a.image}
            alt={a.title}
            loading="lazy"
            decoding="async"
          />
        )}

        <time className="news-date" dateTime={a.date}>
          <span>
            {date.toLocaleDateString("en-US", { month: "short" })}
          </span>
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
          View More <ChevronRight size={20} />

          <span className="sr-only">: {a.title}</span>
        </Link>
      </div>
    </article>
  );
}

export function News() {
  const n = useNews();
  const rail = useRef<HTMLDivElement>(null);
  const focused = useRef(false);

  const [size, setSize] = useState(3);
  const [reduced, setReduced] = useState(false);

  const looping = false;
  const [active, setActive] = useState(0);
  const lastManual = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const maxSlide = Math.max(0, n.items.length - size);
  const select = (index: number) => { lastManual.current = Date.now(); setActive((index + maxSlide + 1) % (maxSlide + 1)); };
  const sectionRef = useVisibleAutoplay(() => {
    if (!focused.current && Date.now() - lastManual.current >= 5000) setActive((index) => (index + 1) % (maxSlide + 1));
  }, 5000, n.enabled && maxSlide > 0 && !reduced);

  // Restart the carousel when the article order changes.
  const itemOrder = JSON.stringify(n.items.map((a: any) => a.slug));

  useEffect(() => {
    const mobileMedia = window.matchMedia("(max-width: 1000px)");
    const motionMedia = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const syncSize = () => {
      setSize(mobileMedia.matches ? 1 : 3);
    };

    const syncMotion = () => {
      setReduced(motionMedia.matches);
    };

    syncSize();
    syncMotion();

    mobileMedia.addEventListener("change", syncSize);
    motionMedia.addEventListener("change", syncMotion);

    return () => {
      mobileMedia.removeEventListener("change", syncSize);
      motionMedia.removeEventListener("change", syncMotion);
    };
  }, []);

  useEffect(() => { setActive(0); }, [itemOrder, size]);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const scroll = () => {
      const first = el.children[0] as HTMLElement | undefined;
      const second = el.children[1] as HTMLElement | undefined;
      const step = first && second ? second.offsetLeft - first.offsetLeft : el.clientWidth;
      el.scrollTo({ left: Math.min(active, maxSlide) * step, behavior: reduced ? "auto" : "smooth" });
    };
    scroll();
    const observer = new ResizeObserver(scroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, maxSlide, reduced, size]);

  if (!n.enabled) return null;

  return (
    <section ref={sectionRef} id="news" className="news" aria-label={n.heading}>
      <h2>{n.heading}</h2>

      <div className="news-wrap">
        <div
          className="news-carousel"
          onTouchStart={(event) => { const p = event.touches[0]; touchStart.current = { x: p.clientX, y: p.clientY }; swiped.current = false; lastManual.current = Date.now(); }}
          onTouchEnd={(event) => { const start = touchStart.current; touchStart.current = null; if (!start) return; const p = event.changedTouches[0]; const dx = p.clientX - start.x; const dy = p.clientY - start.y; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; select(active + (dx < 0 ? 1 : -1)); } }}
          onClickCapture={(event) => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}
          onFocusCapture={() => {
            focused.current = (document.activeElement as HTMLElement | null)?.matches(":focus-visible") || false;
          }}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              focused.current = false;
            }
          }}
        >
          <div
            ref={rail}
            className={
              "news-rail" + (looping ? " news-rail-continuous" : "")
            }
          >
            {(looping ? [0, 1, 2] : [0]).flatMap((copy) =>
              n.items.map((a: any) => (
                <article
                  className="news-home-card"
                  key={`${copy}-${a.slug}`}
                  aria-hidden={copy > 0 ? true : undefined}
                >
                  {a.image && (
                    <img
                      src={a.image}
                      alt={copy > 0 ? "" : a.title}
                      loading="lazy"
                      decoding="async"
                    />
                  )}

                  <div className="news-home-copy">
                    <h3>{a.title}</h3>

                    <time dateTime={a.date}>
                      <CalendarDays size={28} />

                      {new Date(a.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </time>

                    <Link
                      className="view-more"
                      tabIndex={copy > 0 ? -1 : undefined}
                      to={"/blog/" + encodeURIComponent(a.slug)}
                    >
                      View More
                      <span className="sr-only">: {a.title}</span>
                    </Link>
                  </div>
                </article>
              )),
            )}
          </div>
        </div>

        {maxSlide > 0 && <nav className="news-slide-dots" aria-label="News slides">
          {Array.from({ length: maxSlide + 1 }, (_, index) => <button type="button" key={index} aria-label={"Show news slide " + (index + 1)} aria-current={active === index ? "true" : undefined} onClick={() => select(index)}><span aria-hidden="true" /></button>)}
        </nav>}
        {!n.items.length && (
          <p>No news or updates yet. Check back soon.</p>
        )}
      </div>
    </section>
  );
}