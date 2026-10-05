import { useContent } from "../../services/useContent";
import "./ExtraSections.css";
export function Service() {
  const { service: s } = useContent();
  if (!s.enabled) return null;
  return (
    <section id="customers" className="service-section">
      <h2 className="sr-only">{s.heading}</h2>
      <img src={s.image} alt={s.alt} loading="lazy" />
    </section>
  );
}
export function Gallery() {
  const { gallery: g } = useContent();
  if (!g.enabled) return null;
  return (
    <section className="content-width optional-section" id="gallery">
      <h2>{g.heading}</h2>
      <div className="gallery-grid">
        {g.items.map((v: any, i: number) => (
          <figure key={i}>
            <img src={v.image} alt={v.alt} loading="lazy" />
            <figcaption>{v.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
export function Downloads() {
  const { downloads: d } = useContent();
  if (!d.enabled) return null;
  return (
    <section className="content-width optional-section" id="downloads">
      <h2>{d.heading}</h2>
      {d.items.map((v: any, i: number) => (
        <p key={i}>
          <a href={v.url}>{v.title}</a> — {v.description}
        </p>
      ))}
    </section>
  );
}
