import { ProductLaunchName } from "../ProductLaunch/ProductLaunchName";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useVisibleAutoplay } from "../../hooks/useVisibleAutoplay";
import type { Product } from "../../types/site";

import "./Equipment.css";

export function Equipment({
  id,
  title,
  category,
  description,
  subtitle,
  background,
  products,
}: {
  id: string;
  title: React.ReactNode;
  category: string;
  description: string;
  subtitle: string;
  background: string;
  products: Product[];
}) {
  const [selected, setSelected] = useState("");
  const [mobile, setMobile] = useState(false);
  const [paused, setPaused] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const lastClick = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    const media = matchMedia("(max-width: 1024px)");
    const sync = () => setMobile(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  const items = products.filter((p) => p.category === category).sort((a, b) => category === "Backhoe loaders" ? Number(Boolean(b.newStyle)) - Number(Boolean(a.newStyle)) : 0);

  const move = (direction: number) => {
    if (!items.length) return;
    if (mobile) {
      setSelected((selectedId) => {
        const index = Math.max(0, items.findIndex((p) => p.id === selectedId));
        return items[(index + direction + items.length) % items.length].id;
      });
      return;
    }
    const track = optionsRef.current;
    if (!track) return;
    const end = track.scrollWidth - track.clientWidth;
    const step = track.querySelector<HTMLElement>(".equipment-option")?.getBoundingClientRect().width || track.clientWidth;
    const left = direction > 0
      ? track.scrollLeft >= end - 2 ? 0 : Math.min(end, track.scrollLeft + step)
      : track.scrollLeft <= 2 ? end : Math.max(0, track.scrollLeft - step);
    track.scrollTo({ left, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const sectionRef = useVisibleAutoplay(
    () => { if (Date.now() - lastClick.current >= 4000) move(1); },
    4000,
    !paused && (items.length > 4 || (mobile && items.length > 1)),
  );

  const current = items.find((p) => p.id === selected) || items[0];

  return (
    <section
      ref={sectionRef}
      id={id}
      className="equipment-section"
      onFocusCapture={(event) => { if ((event.target as HTMLElement).matches(":focus-visible")) setPaused(true); }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div className="equipment-heading content-width">
        <div>
          <h2>{title}</h2>
          <h3>{subtitle}</h3>
        </div>
        <p>{description}</p>
      </div>

      {current && (
        <>
          <div
            className="equipment-stage"
            style={{
              backgroundImage: background
                ? `url("${background}")`
                : undefined,
            }}
          >
            <a
              href={current.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`View ${current.name} specifications`}
            >
              <img
                key={current.id}
                src={current.image}
                alt={current.name}
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>

          <div className={"equipment-strip" + (items.length > 4 ? " has-carousel" : "")} onMouseEnter={() => { if (!mobile) setPaused(true); }} onMouseLeave={() => setPaused(false)}>
            <div className="equipment-carousel">
            {!mobile && items.length > 1 && <button type="button" disabled={!mobile && items.length <= 4} className="equipment-arrow previous" aria-label={"Previous " + category} onClick={() => { lastClick.current = Date.now(); move(-1); }}><ChevronLeft size={30} strokeWidth={1.5} aria-hidden="true" /></button>}
            <div
              ref={optionsRef}
              className="equipment-options"
              onTouchStart={(event) => { const point = event.touches[0]; touchStart.current = { x: point.clientX, y: point.clientY }; swiped.current = false; }}
              onTouchEnd={(event) => {
                const start = touchStart.current;
                touchStart.current = null;
                if (!start || !mobile) return;
                const point = event.changedTouches[0];
                const dx = point.clientX - start.x;
                const dy = point.clientY - start.y;
                if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
                  swiped.current = true;
                  lastClick.current = Date.now();
                  move(dx < 0 ? 1 : -1);
                }
              }}
              onClickCapture={(event) => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}
              onMouseLeave={() => { if (!mobile) setSelected(""); }}
            >
              {items.map((p) => (
                <div
                  key={p.id}
                  className={
                    "equipment-option" + (category === "Backhoe loaders" && p.newStyle ? " new-product-style" : "") +
                    (current.id === p.id ? " selected" : "")
                  }
                >
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={p.name}
                    className="machine-select"
                    onMouseEnter={() => { if (!mobile) setSelected(p.id); }}
                    onFocus={() => setSelected(p.id)}
                    onClick={() => setSelected(p.id)}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                    />
                    {category === "Backhoe loaders" && p.newStyle ? <div className="product-launch-copy"><b className="product-new-badge">NEW</b><ProductLaunchName name={p.name} />{p.productModel && <small className="product-launch-model">{p.productModel}</small>}</div> : <span>{p.name}</span>}
                  </a>
                </div>
              ))}
            </div>
            {!mobile && items.length > 1 && <button type="button" disabled={!mobile && items.length <= 4} className="equipment-arrow next" aria-label={"Next " + category} onClick={() => { lastClick.current = Date.now(); move(1); }}><ChevronRight size={30} strokeWidth={1.5} aria-hidden="true" /></button>}
            </div>
            {items.length > 1 && <nav className="equipment-pagination" aria-label={category + " products"}>
              {items.map((product) => <button type="button" key={product.id}
                aria-label={"Show " + product.name} aria-current={current.id === product.id ? "true" : undefined}
                className={current.id === product.id ? "active" : ""}
                onClick={() => { lastClick.current = Date.now(); setSelected(product.id); }}>
                <span className="equipment-page-dot" aria-hidden="true" />
              </button>)}
            </nav>}
          </div>
        </>
      )}
    </section>
  );
}