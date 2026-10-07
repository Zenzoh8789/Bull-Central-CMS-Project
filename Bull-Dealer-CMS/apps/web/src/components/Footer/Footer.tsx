import { Instagram, Facebook, Youtube, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import defaults from "../../../../content/defaults.json";
import { useContent } from "../../services/useContent";
import "./Footer.css";

type FooterLink = { label: string; url: string };
type FooterGroup = { heading?: string; links?: FooterLink[] };
type FooterProduct = { id: string; name: string };
const socialLinks = [
  { key: "facebook", label: "Facebook", Icon: Facebook, url: "https://www.facebook.com/BULLMachinesIndia/" },
  { key: "youtube", label: "YouTube", Icon: Youtube, url: "https://www.youtube.com/c/BULLMachines" },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, url: "https://www.linkedin.com/company/bull-machines-pvt-ltd/" },
  { key: "instagram", label: "Instagram", Icon: Instagram, url: "https://www.instagram.com/bull_machines/" },
] as const;

export function Footer() {
  const { products: p } = useContent();
  const f = defaults.footer;
  const headings = ["ABOUT US", "CONSTRUCTION EQUIPMENTS", "MEDIA"];
  const groups: FooterGroup[] = (f.groups ?? []).map((group, index) => ({
    ...group, heading: headings[index] ?? group.heading,
    links: index === 2 ? group.links.filter(link => link.label.trim().toLowerCase() !== "media") : group.links,
  }));
  const products: FooterProduct[] = p?.items ?? [];
  const text = f.copyright || "All Rights Reserved Bull Machines";
  const copyright = text.includes("©") ? text : `© ${new Date().getFullYear()} ${text}`;
  return (
    <footer id="contact" className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {groups.map((group, index) => {
            const isProducts = /construction\s+equipments?/i.test(group.heading || "");
            return (
              <div key={index} className={`footer-column ${isProducts ? "footer-products" : ""}`}>
                {group.heading && <h3 className="footer-heading">{group.heading}</h3>}
                <ul className="footer-link-list">
                  {isProducts
                    ? p?.enabled && products.map(product => (
                        <li key={product.id}><Link to={`/products/${encodeURIComponent(product.id)}`}>{product.name}</Link></li>
                      ))
                    : (group.links ?? []).map((link, linkIndex) => (
                        <li key={linkIndex}><a href={link.url}>{link.label}</a></li>
                      ))}
                </ul>
              </div>
            );
          })}
          <div className="footer-column footer-contact">
            <h2 className="footer-contact-heading">CONTACT US</h2>
            <address className="footer-address">
              <span>Bull Machines Pvt Ltd.,</span>
              <span>Trichy Road, Coimbatore</span>
              <span>641103, INDIA.</span>
            </address>
            {socialLinks.length > 0 && (
              <div className="footer-social">
                <h3 className="footer-social-heading">Follow Us</h3>
                <p className="footer-social-description">We are socially Connected</p>
                <div className="footer-social-links">
                  {socialLinks.map(({ key, label, Icon, url }) => (
                    <a key={key} className="footer-social-button" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Visit our ${label} page`}>
                      <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-inner">
            <span className="footer-copyright">{copyright}</span>
            {f.image && <img className="footer-logo" src={f.image} alt={"Bull Machines"} loading="lazy" />}
          </div>
        </div>
      </div>
    </footer>
  );
}

