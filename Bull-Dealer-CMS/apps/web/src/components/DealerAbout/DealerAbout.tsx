import { useContent } from "../../services/useContent";
import "./DealerAbout.css";
export function DealerAbout() {
  const { about: a } = useContent();
  if (!a.enabled) return null;
  return (
    <section id="innovation" className="dealer-about">
      <div className="content-width dealer-about-grid">
        <div>
          <h2>{a.heading}</h2>
          <p>{a.text}</p>
        </div>
        {a.image && (
          <img
            className="dealer-photo"
            src={a.image}
            alt={a.alt}
            loading="lazy"
          />
        )}
      </div>
    </section>
  );
}
