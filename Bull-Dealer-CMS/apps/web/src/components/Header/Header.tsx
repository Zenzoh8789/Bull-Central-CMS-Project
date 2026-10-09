import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useContent } from "../../services/useContent";
import { actions } from "../../store/uiSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { ProductsMenu } from "../ProductsMenu/ProductsMenu";
import "./Header.css";
export function Header() {
  const { branding: b, navigation: n } = useContent();
  const location = useLocation();
  const utilityLinks = n.utilityLinks
    .filter((link: any) => !/^delivery gallery$/i.test(link.label.trim()))
    .map((link: any) => /^media$/i.test(link.label.trim()) || /bullindia\.com\/media\.php(?:[?#]|$)/i.test(link.url)
      ? { ...link, label: "Media", url: "/delivery-media" } : link);
  const isActive = (url: string) => {
    try {
      const destination = new URL(url, window.location.origin);
      const path = destination.pathname.replace(/\/+$/, "") || "/";
      const current = location.pathname.replace(/\/+$/, "") || "/";
      return destination.origin === window.location.origin &&
        (path === "/" ? current === "/" : current === path || current.startsWith(path + "/"));
    } catch { return false; }
  };
  const productsActive = /^\/products(?:\/|$)/.test(location.pathname);
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.menuOpen);
  const utilityLink = (link: any, mobile = false) => {
    const props = {
      className: isActive(link.url) ? "is-active" : undefined,
      "aria-current": isActive(link.url) ? "page" as const : undefined,
      onClick: mobile ? () => dispatch(actions.closeMenu()) : undefined,
    };
    try {
      const destination = new URL(link.url, window.location.origin);
      if (destination.origin === window.location.origin)
        return <Link to={destination.pathname + destination.search + destination.hash} {...props}>{link.label}</Link>;
    } catch { /* Keep malformed or external destinations as ordinary links. */ }
    return <a href={link.url} {...props} target={/^https?:\/\//i.test(link.url) ? "_blank" : undefined} rel={/^https?:\/\//i.test(link.url) ? "noopener noreferrer" : undefined}>{link.label}</a>;
  };
  return (
    <header className={`original-header ${productsActive ? "products-page-active" : ""}`}>
      {(
        <Link to="/" className="bull-logo">
          <img src="/Asset/Images/bull-machine-logo.png" alt="BULL" />
        </Link>
      )}
      {n.enabled && (
        <div className="header-centre">
          <nav className="utility-nav" aria-label="Company navigation">
            {utilityLinks.map((l: any, i: number) => (
              <Fragment key={i}>
                {i > 0 && <i />}
                {utilityLink(l)}
              </Fragment>
            ))}
          </nav>
          <nav className="primary-nav" aria-label="Main navigation">
            <Link to="/" className="header-home" aria-current={isActive("/") ? "page" : undefined}>{n.homeLabel}</Link>
            <ProductsMenu />
            <Link to="/contact" className={`header-contact ${isActive("/contact") ? "is-active" : ""}`} aria-current={isActive("/contact") ? "page" : undefined}>{n.contactLabel}</Link>
          </nav>
        </div>
      )}
      {b.dealerLogo && (
        <Link className="dealer-logo" to="/about">
          <img src={b.dealerLogo} alt={b.dealerAlt} />
        </Link>
      )}
      {n.enabled && (
        <>
          <button
            className="mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => dispatch(actions.toggleMenu())}
          >
            {open ? <X /> : <Menu />}
          </button>
          {open && (
            <nav className="mobile-nav" aria-label="Mobile navigation">
              <Link to="/" className="header-home" aria-current={isActive("/") ? "page" : undefined} onClick={() => dispatch(actions.closeMenu())}>
                {n.homeLabel}
              </Link>
              <ProductsMenu mobile />
              <Link to="/contact" className={`header-contact ${isActive("/contact") ? "is-active" : ""}`} aria-current={isActive("/contact") ? "page" : undefined} onClick={() => dispatch(actions.closeMenu())}>
                {n.contactLabel}
              </Link>
              {utilityLinks.map((l: any, i: number) => (
                <Fragment key={i}>{utilityLink(l, true)}</Fragment>
              ))}
            </nav>
          )}
        </>
      )}
    </header>
  );
}
