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
            {n.utilityLinks.map((l: any, i: number) => (
              <Fragment key={i}>
                {i > 0 && <i />}
                <a
                  href={l.url}
                  className={isActive(l.url) ? "is-active" : undefined}
                  aria-current={isActive(l.url) ? "page" : undefined}
                  target={/^https?:\/\//i.test(l.url) ? "_blank" : undefined}
                  rel={
                    /^https?:\/\//i.test(l.url)
                      ? "noopener noreferrer"
                      : undefined
                  }
                >
                  {l.label}
                </a>
              </Fragment>
            ))}
          </nav>
          <nav className="primary-nav" aria-label="Main navigation">
            <Link to="/" className={`header-home ${isActive("/") ? "is-active" : ""}`} aria-current={isActive("/") ? "page" : undefined}>{n.homeLabel}</Link>
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
              <Link to="/" className={`header-home ${isActive("/") ? "is-active" : ""}`} aria-current={isActive("/") ? "page" : undefined} onClick={() => dispatch(actions.closeMenu())}>
                {n.homeLabel}
              </Link>
              <ProductsMenu mobile />
              <Link to="/contact" className={`header-contact ${isActive("/contact") ? "is-active" : ""}`} aria-current={isActive("/contact") ? "page" : undefined} onClick={() => dispatch(actions.closeMenu())}>
                {n.contactLabel}
              </Link>
              {n.utilityLinks.map((l: any, i: number) => (
                <a
                  key={i}
                  href={l.url}
                  className={isActive(l.url) ? "is-active" : undefined}
                  aria-current={isActive(l.url) ? "page" : undefined}
                  target={/^https?:\/\//i.test(l.url) ? "_blank" : undefined}
                  rel={
                    /^https?:\/\//i.test(l.url)
                      ? "noopener noreferrer"
                      : undefined
                  }
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}
        </>
      )}
    </header>
  );
}
