import {
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

import { useContent } from "../../services/useContent";
import { EnquiryForm } from "../../components/EnquiryForm/EnquiryForm";

import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
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
  const {
    contact: c,
    dealerContact: d,
    locations: l,
    social: s,
  } = useContent();


  /* =========================================================
     SOCIAL ICON
  ========================================================= */

  const getSocialIcon = (
    label: string = "",
    url: string = ""
  ) => {
    const value = `${label} ${url}`.toLowerCase();

    if (
      value.includes("instagram") ||
      value.includes("instagr.am")
    ) {
      return <FaInstagram />;
    }

    if (
      value.includes("facebook") ||
      value.includes("fb.com") ||
      value.includes("fb.me")
    ) {
      return <FaFacebookF />;
    }

    if (
      value.includes("youtube") ||
      value.includes("youtu.be")
    ) {
      return <FaYoutube />;
    }

    return null;
  };


  /* =========================================================
     SOCIAL NAME
  ========================================================= */

  const getSocialName = (
    label: string = "",
    url: string = ""
  ) => {
    const value = `${label} ${url}`.toLowerCase();

    if (
      value.includes("instagram") ||
      value.includes("instagr.am")
    ) {
      return "Instagram";
    }

    if (
      value.includes("facebook") ||
      value.includes("fb.com") ||
      value.includes("fb.me")
    ) {
      return "Facebook";
    }

    if (
      value.includes("youtube") ||
      value.includes("youtu.be")
    ) {
      return "YouTube";
    }

    return label || "Social Media";
  };


  return (
    <section className="contact-page">

      {/* =====================================================
          CONTACT BANNER
      ====================================================== */}

      {c.enabled && c.banner && (
        <div className="contact-banner-wrap">
          <img
            src={c.banner}
            alt={c.heading || "Contact Us"}
            className="contact-banner-image"
          />
        </div>
      )}


      {/* =====================================================
          ENQUIRY + DEALER INFORMATION
      ====================================================== */}

      {(c.enabled || d.enabled) && (
        <section className="contact-main-section">

          <div className="content-width contact-page-content">

            {/* =================================================
                LEFT SIDE - ENQUIRY FORM
            ================================================= */}

            {c.enabled && (
              <div className="enquiry-column">

                <div className="section-heading">

                  {c.heading && (
                    <h1>
                      {c.heading}
                    </h1>
                  )}

                  {c.intro && (
                    <p className="section-intro">
                      {c.intro}
                    </p>
                  )}

                </div>


                <div className="enquiry-form-wrap">
                  <EnquiryForm />
                </div>

              </div>
            )}


            {/* =================================================
                RIGHT SIDE - DEALER INFORMATION
            ================================================= */}

            {d.enabled && (
              <aside className="contact-identity">

                {/* DEALER LOGO */}

                {d.logo && (
                  <div className="dealer-logo-wrap">

                    <img
                      src={d.logo}
                      alt={d.name || "Dealer"}
                      className="dealer-logo"
                    />

                  </div>
                )}


                {/* DEALER NAME */}

                {d.name && (
                  <h2 className="dealer-name">
                    {d.name}
                  </h2>
                )}


                {/* CAPTION */}

                {d.caption && (
                  <p className="dealer-caption">
                    {d.caption}
                  </p>
                )}


                {/* ADDRESS */}

                {d.address && (
                  <p className="dealer-address">
                    {d.address}
                  </p>
                )}


                {/* =================================================
                    PHONE + EMAIL
                ================================================= */}

                {(d.phone || d.email) && (
                  <div className="dealer-contact-list">

                    {d.phone && (
                      <a href={`tel:${d.phone}`}>

                        <span className="contact-icon">
                          ☎
                        </span>

                        <span>
                          {d.phone}
                        </span>

                      </a>
                    )}


                    {d.email && (
                      <a href={`mailto:${d.email}`}>

                        <span className="contact-icon">
                          ✉
                        </span>

                        <span>
                          {d.email}
                        </span>

                      </a>
                    )}

                  </div>
                )}


                {/* =================================================
                    SOCIAL MEDIA
                ================================================= */}

                {s?.enabled && (
                  <div className="dealer-social">

                    {s.heading && (
                      <h3>
                        {s.heading}
                      </h3>
                    )}

                    {s.description && (
                      <p>
                        {s.description}
                      </p>
                    )}


                    <div className="social-links">

                      {Array.isArray(s.items) &&
                        s.items.map(
                          (v: any, i: number) => {

                            const label = String(
                              v?.label ||
                              v?.name ||
                              v?.platform ||
                              v?.title ||
                              ""
                            );

                            const url = String(
                              v?.url ||
                              v?.link ||
                              v?.href ||
                              ""
                            );

                            const icon =
                              getSocialIcon(
                                label,
                                url
                              );

                            if (!icon) {
                              return null;
                            }

                            const socialName =
                              getSocialName(
                                label,
                                url
                              );

                            return (
                              <a
                                key={`${socialName}-${i}`}
                                href={url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={socialName}
                                title={socialName}
                                className={`social-link social-${socialName
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                              >
                                {icon}
                              </a>
                            );
                          }
                        )}

                    </div>

                  </div>
                )}

              </aside>
            )}

          </div>

        </section>
      )}


      {/* =====================================================
          OFFICE LOCATIONS
      ====================================================== */}

      {l?.enabled && (
        <section className="locations-section">

          <div className="locations">

            {Array.isArray(l.items) &&
              l.items
                .filter(
                  (v: any) =>
                    v &&
                    v.enabled !== false
                )
                .map(
                  (v: any, i: number) => {

                    const whiteLocation =
                      i % 2 === 1;

                    const locationTitle =
                      v.title ||
                      v.name ||
                      "Office";

                    return (
                      <article
                        key={
                          v.id ||
                          `${locationTitle}-${i}`
                        }
                        className={`location-row ${
                          whiteLocation
                            ? "location-row-white"
                            : "location-row-dark"
                        }`}
                      >

                        {/* =========================
                            GOOGLE MAP
                        ========================== */}

                        <GoogleMapEmbed
                          mapUrl={v.mapUrl}
                          title={locationTitle}
                        />


                        {/* =========================
                            LOCATION DETAILS
                        ========================== */}

                        <div className="location-details">

                          <div className="location-highlight">

                            {v.title && (
                              <span className="location-label">
                                {v.title}
                              </span>
                            )}


                            {v.name && (
                              <h2>
                                {v.name}
                              </h2>
                            )}


                            {v.address && (
                              <p className="location-address">
                                {v.address}
                              </p>
                            )}

                          </div>


                          {/* =========================
                              PHONE + EMAIL
                          ========================== */}

                          {(v.phone ||
                            v.email) && (
                            <div className="location-contact">

                              {v.phone && (
                                <p>

                                  <strong>
                                    Phone :
                                  </strong>{" "}

                                  <a
                                    href={`tel:${v.phone}`}
                                  >
                                    {v.phone}
                                  </a>

                                </p>
                              )}


                              {v.email && (
                                <p>

                                  <strong>
                                    E-mail :
                                  </strong>{" "}

                                  <a
                                    href={`mailto:${v.email}`}
                                  >
                                    {v.email}
                                  </a>

                                </p>
                              )}

                            </div>
                          )}

                        </div>

                      </article>
                    );
                  }
                )}

          </div>

        </section>
      )}

    </section>
  );
}