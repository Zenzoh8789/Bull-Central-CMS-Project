import { ProductLaunchName } from "../ProductLaunch/ProductLaunchName";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const track = useRef<HTMLDivElement>(null);
  const lastInteraction = useRef(0);
  const [scrollable, setScrollable] = useState(false);
  const slide = useCallback((direction: number) => {
    const element = track.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>(".products-menu-card");
    const step = card?.getBoundingClientRect().width || element.clientWidth;
    const end = element.scrollWidth - element.clientWidth;
    const target =
      direction > 0
        ? element.scrollLeft >= end - 2
          ? 0
          : Math.min(end, element.scrollLeft + step)
        : element.scrollLeft <= 2
          ? end
          : Math.max(0, element.scrollLeft - step);
    element.scrollTo({
      left: target,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const location = useLocation();
  const { data, isLoading, isError, refetch } = useSiteQuery();
  const products = [...(data?.products ?? [])]
    .filter((product) => ["Backhoe loaders", "Skid steers"].includes(product.category))
    .sort((a, b) => Number(b.category === "Backhoe loaders" && Boolean(b.newStyle)) - Number(a.category === "Backhoe loaders" && Boolean(a.newStyle)) || a.menuOrder - b.menuOrder);
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

  useEffect(() => {
    const element = track.current;
    if (!element || mobile) return;
    const measure = () =>
      setScrollable(element.scrollWidth > element.clientWidth + 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mobile, products.length, open]);

  useEffect(() => {
    if (
      !open ||
      mobile ||
      !scrollable ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = setInterval(() => {
      const element = track.current;
      if (
        !element ||
        document.hidden ||
        element.contains(document.activeElement) ||
        element.querySelector(".products-menu-card:hover") ||
        Date.now() - lastInteraction.current < 4000
      )
        return;
      slide(1);
    }, 4000);
    return () => clearInterval(timer);
  }, [open, mobile, scrollable, slide]);

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
            if (panel.current?.contains(document.activeElement)) trigger.current?.focus({ preventScroll: true });
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
          <div className="products-menu-carousel">
            {!mobile && scrollable && (
              <button
                type="button"
                className="products-menu-arrow previous"
                aria-label="Previous products"
                aria-controls={panelId + "-track"}
                onClick={() => {
                  lastInteraction.current = Date.now();
                  slide(-1);
                }}
              >
                <ChevronLeft aria-hidden="true" size={30} strokeWidth={1.5} />
              </button>
            )}
            <div
              ref={track}
              id={panelId + "-track"}
              className="products-menu-grid"
              onWheel={() => {
                lastInteraction.current = Date.now();
              }}
              onTouchStart={() => {
                lastInteraction.current = Date.now();
              }}
            >
              {products.map((product) => {
                const external = /^https?:\/\//i.test(
                  product.url?.trim() ?? "",
                );
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
                    <img src={product.image} alt="" />
                    {product.category === "Backhoe loaders" && product.newStyle ? <div className="product-launch-copy"><b className="product-new-badge">NEW</b><ProductLaunchName name={product.name} />{product.productModel && <small className="product-launch-model">{product.productModel}</small>}</div> : <span>{product.name}</span>}
                  </a>
                );
              })}
            </div>
            {!mobile && scrollable && (
              <button
                type="button"
                className="products-menu-arrow next"
                aria-label="Next products"
                aria-controls={panelId + "-track"}
                onClick={() => {
                  lastInteraction.current = Date.now();
                  slide(1);
                }}
              >
                <ChevronRight aria-hidden="true" size={30} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
