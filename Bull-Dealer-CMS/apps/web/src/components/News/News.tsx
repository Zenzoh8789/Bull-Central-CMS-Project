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

  const looping = n.items.length > 1 && !reduced;

  // Restart the carousel when the article order changes.
  const itemOrder = JSON.stringify(n.items.map((a: any) => a.slug));

  useEffect(() => {
    const mobileMedia = window.matchMedia("(max-width: 599px)");
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

  useEffect(() => {
    const el = rail.current;

    if (!el || !n.enabled || !looping) return;

    let frame: number | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let step = 0;
    let cardWidth = 0;
    let visible = false;
    let disposed = false;

    const cancelAnimation = () => {
      if (frame !== undefined) {
        cancelAnimationFrame(frame);
        frame = undefined;
      }
    };

    const stop = () => {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }

      cancelAnimation();

      // Restore the last completed slide after an interruption.
      el.scrollLeft = step * cardWidth;
    };

    const measure = () => {
      const first = el.children[0] as HTMLElement | undefined;
      const second = el.children[1] as HTMLElement | undefined;

      if (!first || !second) return;

      const width = second.offsetLeft - first.offsetLeft;

      if (width > 0 && width !== cardWidth) {
        cancelAnimation();
        cardWidth = width;
        el.scrollLeft = step * cardWidth;
      }
    };

    const advance = () => {
      if (
        disposed ||
        !visible ||
        document.hidden ||
        focused.current ||
        cardWidth <= 0 ||
        frame !== undefined
      ) {
        return;
      }

      const from = step * cardWidth;
      const target = (step + 1) * cardWidth;
      let started: number | undefined;

      const animate = (now: number) => {
        frame = undefined;

        if (
          disposed ||
          !visible ||
          document.hidden ||
          focused.current
        ) {
          el.scrollLeft = step * cardWidth;
          return;
        }

        started ??= now;

        const progress = Math.min(1, (now - started) / 250);
        const eased = (1 - Math.cos(Math.PI * progress)) / 2;

        el.scrollLeft = from + (target - from) * eased;

        if (progress < 1) {
          frame = requestAnimationFrame(animate);
        } else {
          step = (step + 1) % n.items.length;

          if (step === 0) {
            el.scrollLeft = 0;
          }
        }
      };

      frame = requestAnimationFrame(animate);
    };

    const sync = () => {
      stop();

      if (!disposed && visible && !document.hidden) {
        timer = setInterval(advance, 5000);
      }
    };

    el.scrollLeft = 0;
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
    );

    visibilityObserver.observe(el);
    document.addEventListener("visibilitychange", sync);

    return () => {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [n.enabled, n.items.length, itemOrder, looping, size]);

  if (!n.enabled) return null;

  return (
    <section id="news" className="news" aria-label={n.heading}>
      <h2>{n.heading}</h2>

      <div className="news-wrap">
        <div
          className="news-carousel"
          onFocusCapture={() => {
            focused.current = true;
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

        {!n.items.length && (
          <p>No news or updates yet. Check back soon.</p>
        )}
      </div>
    </section>
  );
}