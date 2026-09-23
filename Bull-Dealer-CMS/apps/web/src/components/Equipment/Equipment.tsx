import type React from "react";
import { useEffect, useState } from "react";

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
  useEffect(() => {
    const media = matchMedia("(max-width: 599px)");
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const items = products.filter((p) => p.category === category);
  useEffect(() => {
    if (
      !items.length ||
      !mobile ||
      paused ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = setInterval(
      () =>
        setSelected(
          (id) =>
            items[
              (Math.max(
                0,
                items.findIndex((p) => p.id === id),
              ) +
                1) %
                items.length
            ].id,
        ),
      5000,
    );
    return () => clearInterval(timer);
  }, [products, category, mobile, paused]);
  const current = items.find((p) => p.id === selected) || items[0];
  return (
    <section
      id={id}
      className="equipment-section"
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
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
              backgroundImage: background ? `url("${background}")` : undefined,
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
              />
            </a>
          </div>
          <div className="equipment-strip">
            <div
              className="equipment-options"
              onMouseLeave={() => setSelected("")}
            >
              {items.map((p) => (
                <div
                  key={p.id}
                  className={
                    "equipment-option" +
                    (current.id === p.id ? " selected" : "")
                  }
                >
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={p.name}
                    className="machine-select"
                    onMouseEnter={() => setSelected(p.id)}
                    onFocus={() => setSelected(p.id)}
                    onClick={() => setSelected(p.id)}
                  >
                    <img src={p.image} alt={p.name} loading="lazy" />
                    <span>{p.name}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
