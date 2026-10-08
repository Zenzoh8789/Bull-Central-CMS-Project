import {
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

import defaults from "../../../../content/defaults.json";
import { useSiteQuery } from "../../services/siteApi";
import { useContent } from "../../services/useContent";
import { EnquiryForm } from "../../components/EnquiryForm/EnquiryForm";

import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";

import "./ContactPage.css";


/* =========================================================
   GOOGLE MAP
   Lazy mount the iframe only when map approaches viewport.
========================================================= */

type GoogleMapEmbedProps = {
  mapUrl?: string;
  title?: string;
};

const GoogleMapEmbed = memo(function GoogleMapEmbed({
  mapUrl,
  title = "Office",
}: GoogleMapEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element || !mapUrl) {
      return;
    }

    /* Fallback for browsers without IntersectionObserver */
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          setShouldLoad(true);

          observer.disconnect();
        }
      },
      {
        /* Start loading shortly before user reaches the map */
        root: null,
        rootMargin: "300px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [mapUrl]);

  return (
    <div
      ref={containerRef}
      className="location-map"
    >
      {!mapUrl ? (
        <div className="map-placeholder">
          Map not available
        </div>
      ) : shouldLoad ? (
        <iframe
          src={mapUrl}
          title={`${title} map`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div
          className="map-placeholder"
          aria-label={`${title} map loading`}
        >
          Loading map…
        </div>
      )}
    </div>
  );
});


/* =========================================================
   CONTACT PAGE
========================================================= */

export function ContactPage() {
  const { contact: c, dealerContact: d, locations: l, social: s, branding: b } = useContent();
  const { data } = useSiteQuery();
  const dealer = data?.dealer;
  const savedLocation = data?.sources?.locations;
  const first = l?.items?.[0] || {};
  const location = savedLocation ? first : {
    ...first, name: d.name || dealer?.name, address: d.address || dealer?.address,
    phone: d.phone, email: d.email,
  };
  const address = location.address || d.address || dealer?.address || "";
  const mapUrl = location.mapUrl || (address ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed` : "");
  const platforms = [
    { name: "Instagram", pattern: /instagram|instagr\.am/i, Icon: FaInstagram },
    { name: "Facebook", pattern: /facebook|fb\.com|fb\.me/i, Icon: FaFacebookF },
    { name: "YouTube", pattern: /youtube|youtu\.be/i, Icon: FaYoutube },
    { name: "LinkedIn", pattern: /linkedin/i, Icon: FaLinkedinIn },
  ];
  const socials = (Array.isArray(s?.items) ? s.items : []).flatMap((item: any) => {
    const url = String(item.url || "");
    const platform = platforms.find(p => p.pattern.test(`${item.label || ""} ${url}`));
    return platform && /^https?:\/\//i.test(url) ? [{ ...platform, url }] : [];
  });
  return (
    <section className="contact-page">
      {c.enabled && c.banner && <div className="contact-banner-wrap">
        <img src={c.banner} alt={c.bannerAlt ?? "Contact Us"} className="contact-banner-image" />
      </div>}
      {(c.enabled || d.enabled) && <section className="contact-main-section">
        <div className="content-width contact-page-content">
          {c.enabled && <div className="enquiry-column">
            <div className="section-heading">
              {c.heading && <h1>{c.heading}</h1>}
              {c.intro && <p className="section-intro">{c.intro}</p>}
            </div>
            <div className="enquiry-form-wrap"><EnquiryForm /></div>
          </div>}
          {d.enabled && <aside className="contact-identity">
            {b.dealerLogo && <div className="dealer-logo-wrap">
              <img src={b.dealerLogo} alt={b.dealerAlt || d.name || dealer?.name || "Dealer"} className="dealer-logo" />
            </div>}
            <p className="dealer-caption">Authorized Dealer for BULL Construction Equipments</p>
            {s?.enabled && <div className="dealer-social">
              <h3>{s.heading || "Follow us"}</h3>
              <p>{s.description || "We are socially Connected"}</p>
              <div className="social-links">
                {socials.map(({ name, Icon, url }: any, i: number) => <a key={name + i} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name} className={`social-link social-${name.toLowerCase()}`}><Icon /></a>)}
              </div>
            </div>}
          </aside>}
        </div>
      </section>}
      {l?.enabled && location.enabled !== false && <section className="locations-section">
        <div className="locations"><article className="location-row location-row-dark">
          <GoogleMapEmbed mapUrl={mapUrl} title={location.name || d.name || dealer?.name || "Dealer location"} />
          <div className="location-details">
            <div className="location-highlight">
              <span className="location-label">Dealer location</span>
              {(location.name || d.name || dealer?.name) && <h2>{location.name || d.name || dealer?.name}</h2>}
              {address && <p className="location-address">{address}</p>}
            </div>
            {(location.phone || d.phone || location.email || d.email) && <div className="location-contact">
              {(location.phone || d.phone) && <p><strong>Phone :</strong>{" "}<a href={`tel:${location.phone || d.phone}`}>{location.phone || d.phone}</a></p>}
              {(location.email || d.email) && <p><strong>E-mail :</strong>{" "}<a href={`mailto:${location.email || d.email}`}>{location.email || d.email}</a></p>}
            </div>}
          </div>
        </article></div>
      </section>}
      <section className="locations-section" aria-label="BULL office locations">
        <div className="locations">
          {defaults.locations.items.slice(1).map((office, index) => (
            <article key={office.title} className={`location-row ${index % 2 === 0 ? "location-row-white" : "location-row-dark"}`}>
              <GoogleMapEmbed mapUrl={office.mapUrl} title={office.title} />
              <div className="location-details">
                <div className="location-highlight">
                  <span className="location-label">{office.title}</span>
                  <h2>{office.name}</h2>
                  <p className="location-address">{office.address}</p>
                </div>
                <div className="location-contact">
                  <p><strong>Phone :</strong>{" "}<a href={`tel:${office.phone}`}>{office.phone}</a></p>
                  <p><strong>E-mail :</strong>{" "}<a href={`mailto:${office.email}`}>{office.email}</a></p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
