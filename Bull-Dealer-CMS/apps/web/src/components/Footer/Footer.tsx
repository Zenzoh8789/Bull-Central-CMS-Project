import { Instagram, Facebook, Youtube, Linkedin, Globe } from "lucide-react";
import { useContent } from "../../services/useContent";
import "./Footer.css";
export function Footer() {
  const { footer: f, dealerContact: d, social: s } = useContent();
  if (!f.enabled) return null;
  return (
    <footer id="contact">
      <div className="content-width footer-grid">
        {f.groups.map((g: any, i: number) => (
          <div key={i}>
            {g.heading && <h3>{g.heading}</h3>}
            {g.links.map((l: any, j: number) => (
              <a key={j} href={l.url}>
                {l.label}
              </a>
            ))}
          </div>
        ))}
        <div className="footer-contact">
          {d.enabled && (
            <>
              <h2>{f.contactHeading}</h2>
              <strong>{d.name}</strong>
              <p>{d.address}</p>
              {d.phone && <a href={"tel:" + d.phone}>{d.phone}</a>}
              {d.email && <a href={"mailto:" + d.email}>{d.email}</a>}
            </>
          )}
          {s.enabled && (
            <>
              <h3>{s.heading}</h3>
              <span>{s.description}</span>
              {s.items.map((l: any, i: number) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer">
                  <span className="sr-only">{l.label}</span>
                  {/instagram/i.test(l.label) ? (
                    <Instagram size={32} />
                  ) : /facebook/i.test(l.label) ? (
                    <Facebook size={28} />
                  ) : /youtube/i.test(l.label) ? (
                    <Youtube size={30} />
                  ) : /linkedin/i.test(l.label) ? (
                    <Linkedin size={28} />
                  ) : (
                    <Globe size={28} />
                  )}
                </a>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          {f.copyright.includes("©")
            ? f.copyright
            : "© " + new Date().getFullYear() + " " + f.copyright}
        </span>
        <img src={f.image} alt={f.imageAlt} loading="lazy" />
      </div>
    </footer>
  );
}
