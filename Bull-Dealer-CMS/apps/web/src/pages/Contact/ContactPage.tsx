import { useContent } from "../../services/useContent";
import { EnquiryForm } from "../../components/EnquiryForm/EnquiryForm";
import "./ContactPage.css";
export function ContactPage() {
  const {
    contact: c,
    dealerContact: d,
    locations: l,
    social: s,
  } = useContent();
  return (
    <section className="contact-page route-page">
      {c.enabled && (
        <img className="contact-banner-image" src={c.banner} alt={c.heading} />
      )}
      <div className="content-width contact-page-content">
        {c.enabled && (
          <div>
            <h1>{c.heading}</h1>
            <p>{c.intro}</p>
            <EnquiryForm />
          </div>
        )}
        {d.enabled && (
          <div className="contact-identity">
            {d.logo && <img src={d.logo} alt={d.name} />}
            <h2>{d.name}</h2>
            <p>{d.caption}</p>
            <p>{d.address}</p>
            {d.phone && (
              <p>
                <a href={"tel:" + d.phone}>{d.phone}</a>
              </p>
            )}
            {d.email && (
              <p>
                <a href={"mailto:" + d.email}>{d.email}</a>
              </p>
            )}
            <a href={d.directionsUrl}>Get directions</a>
            {s.enabled && (
              <>
                <h3>{s.heading}</h3>
                <p>{s.description}</p>
                {s.items.map((v: any, i: number) => (
                  <p key={i}>
                    <a href={v.url}>{v.label}</a>
                  </p>
                ))}
              </>
            )}
          </div>
        )}
      </div>
      {l.enabled && (
        <div className="content-width locations">
          {l.items
            .filter((v: any) => v.enabled)
            .map((v: any, i: number) => (
              <article key={i}>
                <h2>{v.title}</h2>
                <h3>{v.name}</h3>
                <p>{v.address}</p>
                {v.phone && (
                  <p>
                    <a href={"tel:" + v.phone}>{v.phone}</a>
                  </p>
                )}
                {v.email && (
                  <p>
                    <a href={"mailto:" + v.email}>{v.email}</a>
                  </p>
                )}
                {v.mapUrl && (
                  <iframe
                    src={v.mapUrl}
                    title={v.title + " map"}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                )}
              </article>
            ))}
        </div>
      )}
    </section>
  );
}
