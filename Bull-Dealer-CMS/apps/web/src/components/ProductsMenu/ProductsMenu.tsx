import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useContent } from "../../services/useContent";
import { useSiteQuery } from "../../services/siteApi";
import "./ProductsMenu.css";

export function ProductsMenu({ mobile = false }: { mobile?: boolean }) {
  const { navigation, products: productContent } = useContent();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pointerType = useRef("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const location = useLocation();
  const { data, isLoading, isError, refetch } = useSiteQuery();
  const products = [...(data?.products ?? [])]
    .filter((product) => product.showInMenu)
    .sort((a, b) => a.menuOrder - b.menuOrder);
  const panelId = mobile ? "mobile-products-panel" : "products-panel";

  const close = () => {
    clearTimeout(closeTimer.current);
    setOpen(false);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    clearTimeout(closeTimer.current);
    setOpen(false);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        clearTimeout(closeTimer.current);
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  return (
    <div
      ref={root}
      className={`products-menu ${mobile ? "products-menu-mobile" : ""} ${open ? "is-open" : ""}`}
      onPointerEnter={(event) => {
        clearTimeout(closeTimer.current);
        if (!mobile && event.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (!mobile && event.pointerType === "mouse") {
          clearTimeout(closeTimer.current);
          closeTimer.current = setTimeout(() => {
            if (!panel.current?.contains(document.activeElement))
              setOpen(false);
          }, 180);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="products-menu-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onClick={(event) => {
          clearTimeout(closeTimer.current);
          const mouseClick =
            event.detail > 0 && pointerType.current === "mouse";
          setOpen((value) => (!mobile && mouseClick ? true : !value));
        }}
      >
        <span>{productContent.menuHeading || navigation.productsLabel}</span>
        <span className="products-menu-caret" aria-hidden="true" />
      </button>
      {/* Keep mounted so both opening and closing can transition. */}
      <div
        ref={panel}
        id={panelId}
        className="products-mega-panel"
        aria-label="Our products"
        aria-hidden={!open}
        inert={!open}
      >
        {isLoading ? (
          <p className="products-menu-status" role="status">
            Loading products…
          </p>
        ) : isError ? (
          <div className="products-menu-status" role="alert">
            Products are temporarily unavailable.{" "}
            <button type="button" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <p className="products-menu-status">No products are available yet.</p>
        ) : (
          <div className="products-menu-grid">
            {products.map((product) => {
              const external = /^https?:\/\//i.test(product.url?.trim() ?? "");
              return (
                <a
                  key={product.id}
                  className="products-menu-card"
                  href={
                    external
                      ? product.url.trim()
                      : `/products/${encodeURIComponent(product.id)}`
                  }
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  onClick={() => {
                    trigger.current?.focus();
                    close();
                  }}
                >
                  <img src={product.menuImage || product.image} alt="" />
                  <span>{product.menuLabel || product.name}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
