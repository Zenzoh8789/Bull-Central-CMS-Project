import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { asset } from "../../data/siteContent";
import { useContent } from "../../services/useContent";
import { VideoDialog } from "../VideoDialog/VideoDialog";
import "./Testimonials.css";

type OpenVideo = {
  id: string;
  description: string;
};

export function Testimonials() {
  const { testimonials: t } = useContent();

  const [active, setActive] = useState(0);
  const [video, setVideo] = useState<OpenVideo | null>(null);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const lastManual = useRef(0);
  const count = t.items.length;

  const move = (index: number) => {
    if (!count) return;

    lastManual.current = Date.now();
    setActive((index + count) % count);
  };

  useEffect(() => {
    if (!count || video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      if (Date.now() - lastManual.current >= 4000) setActive((current) => (current + 1) % count);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [count, video]);

  if (!t.enabled || !count) {
    return null;
  }

  return (
    <section
      id="customer"
      className="testimonials"
      aria-label={t.heading}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          move(active + 1);
        }

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          move(active - 1);
        }
      }}
    >
      {/* HEADING */}
      <h2>{t.heading}</h2>

      <div className="testimonial-carousel"
        onTouchStart={(event) => { const point = event.touches[0]; touchStart.current = { x: point.clientX, y: point.clientY }; swiped.current = false; lastManual.current = Date.now(); }}
        onTouchEnd={(event) => {
          const start = touchStart.current; touchStart.current = null;
          if (!start) return;
          const point = event.changedTouches[0]; const dx = point.clientX - start.x; const dy = point.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; move(active + (dx < 0 ? 1 : -1)); }
        }}
        onClickCapture={(event) => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}>
        {/* PREVIOUS */}
        <button
          type="button"
          className="carousel-arrow previous"
          aria-label="Previous customer videos"
          onClick={() => move(active - 1)}
        >
          <ChevronLeft size={32} />
        </button>

        {/* CAROUSEL */}
        <div className="testimonial-strip">
          {t.items.map((item: any, i: number) => {
            const { image, videoId: vid, alt, description } = item;

            const currentDescription =
              typeof description === "string" && description.trim()
                ? description.trim()
                : "";

            /*
             * Calculate position relative to active card.
             *
             * Possible visible positions:
             *
             * -2 = outer left
             * -1 = left
             *  0 = center
             * +1 = right
             * +2 = outer right
             */
            let offset = (i - active + count) % count;

            if (offset > count / 2) {
              offset -= count;
            }

            const absOffset = Math.abs(offset);

            /*
             * Card scale
             */

            return (
              <button
                type="button"
                key={vid || i}
                className={offset === 0 ? "testimonial active" : "testimonial"}
                data-position={offset}
                tabIndex={offset === 0 ? 0 : -1}
                aria-hidden={absOffset > 2 ? true : undefined}
                aria-label={alt || `Play customer testimonial ${i + 1}`}
                onClick={() => {
                  /*
                   * Clicking side card:
                   * first move it to center.
                   *
                   * Clicking center card:
                   * open video.
                   */
                  if (offset !== 0) {
                    move(i);
                    return;
                  }

                  setVideo({
                    id: vid,
                    description: currentDescription,
                  });
                }}
              >
                {/* VIDEO THUMBNAIL */}
                <img
                  className="testimonial-image"
                  src={image}
                  alt={alt || ""}
                  loading="lazy"
                />

                {/* YOUTUBE PLAY */}
                <img
                  className="youtube-play"
                  src={asset("customer/you-logo.png")}
                  alt=""
                  aria-hidden="true"
                />

                {/* DESCRIPTION */}
                <div className="testimonial-description">
                  {item.title && <h3>{item.title}</h3>}
                  {currentDescription && <p>{currentDescription}</p>}
                </div>
              </button>
            );
          })}
        </div>

        {/* NEXT */}
        <button
          type="button"
          className="carousel-arrow next"
          aria-label="Next customer videos"
          onClick={() => move(active + 1)}
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* DOTS */}
      <div className="carousel-dots">
        {t.items.map((_: any, i: number) => (
          <button
            type="button"
            key={i}
            aria-label={`Customer video ${i + 1}`}
            aria-current={i === active % count ? "true" : undefined}
            onClick={() => move(i)}
          />
        ))}
      </div>

      {/* VIDEO POPUP */}
      {video && (
        <VideoDialog
          video={video.id}
          description={video.description}
          onClose={() => setVideo(null)}
        />
      )}
    </section>
  );
}
