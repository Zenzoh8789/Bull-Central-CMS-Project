import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useContent } from "../../services/useContent";
import { actions } from "../../store/uiSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { ProductsMenu } from "../ProductsMenu/ProductsMenu";
import "./Header.css";
export function Header() {
  const { branding: b, navigation: n } = useContent();
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.menuOpen);
  return (
    <header className="original-header">
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
            <Link to="/">{n.homeLabel}</Link>
            <ProductsMenu />
            <Link to="/contact">{n.contactLabel}</Link>
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
              <Link to="/" onClick={() => dispatch(actions.closeMenu())}>
                {n.homeLabel}
              </Link>
              <ProductsMenu mobile />
              <Link to="/contact" onClick={() => dispatch(actions.closeMenu())}>
                {n.contactLabel}
              </Link>
              {n.utilityLinks.map((l: any, i: number) => (
                <a
                  key={i}
                  href={l.url}
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
