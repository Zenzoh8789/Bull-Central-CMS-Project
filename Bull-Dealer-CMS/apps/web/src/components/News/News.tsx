import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useContent } from "../../services/useContent";
import "./News.css";
export function News() {
  const { news: n } = useContent();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(3);

  useEffect(() => {
    const m = matchMedia("(max-width: 599px)");
    const sync = () => setSize(m.matches ? 1 : 3);
    sync();
    m.addEventListener("change", sync);
    return () => m.removeEventListener("change", sync);
  }, []);
  const pages = Math.ceil(n.items.length / size);
  useEffect(() => {
    if (
      n.items.length < 2 ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = setInterval(
      () => setPage((p) => (p + 1) % n.items.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [n.items.length, page]);
  if (!n.enabled) return null;
  return (
    <section id="news" className="news" aria-label={n.heading}>
      <h2>{n.heading}</h2>
      <div className="news-grid content-width">
        {Array.from(
          { length: Math.min(size, n.items.length) },
          (_, i) => n.items[(page + i) % n.items.length],
        ).map((a: any) => (
          <article className="news-card" key={a.url}>
            <img src={a.image} alt={a.title} loading="lazy" />
            <div className="news-copy">
              <h3>{a.title}</h3>
              <p>
                <CalendarDays size={30} />
                {a.date}
              </p>
              <div className="news-action">
                <a href={a.url} target="_blank" rel="noreferrer">
                  View More<span className="sr-only">: {a.title}</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="carousel-dots">
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            aria-label={"News page " + (i + 1)}
            aria-current={
              i === Math.floor((page % n.items.length) / size)
                ? "true"
                : undefined
            }
            onClick={() => setPage(i * size)}
          />
        ))}
      </div>
    </section>
  );
}
