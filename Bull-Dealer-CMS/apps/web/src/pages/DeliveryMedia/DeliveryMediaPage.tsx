import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Grid2X2,
  Image,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useContent } from "../../services/useContent";
import "./DeliveryMediaPage.css";
type Entry = {
  type: string;
  title: string;
  district: string;
  state: string;
  image: string;
  alt: string;
  videoId: string;
};
function MediaDialog({ item, onClose }: { item: Entry; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current!;
    const previous = document.activeElement as HTMLElement;
    node.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="delivery-lightbox"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={item.title}
    >
      <button
        autoFocus
        className="delivery-close"
        aria-label="Close media"
        onClick={onClose}
      >
        <X />
      </button>
      {item.type === "video" ? (
        <iframe
          title={item.title}
          src={
            "https://www.youtube-nocookie.com/embed/" +
            item.videoId +
            "?autoplay=1"
          }
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <img src={item.image} alt={item.alt || item.title} />
      )}
      <p>
        {item.title} — {item.district}, {item.state}
      </p>
    </dialog>
  );
}
export function DeliveryMediaPage() {
  const content = useContent();
  const gallery = content.deliveryMedia || { items: [] };
  const items: Entry[] = gallery.items || [];
  const [district, setDistrict] = useState(""),
    [type, setType] = useState("all"),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<Entry | null>(null);
  const districtKey = (item: Entry) =>
    item.district.trim().toLowerCase() + "|" + item.state.trim().toLowerCase();
  const districts = Array.from(
    new Map(
      items.map((item) => [
        districtKey(item),
        { district: item.district, state: item.state },
      ]),
    ).entries(),
  ).sort((a, b) => a[1].district.localeCompare(b[1].district));
  const local = items.filter(
    (item) => !district || districtKey(item) === district,
  );
  const filtered = local.filter((item) => type === "all" || item.type === type);
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * 6, current * 6);
  return (
    <main className="delivery-gallery">
      <div className="delivery-breadcrumb">
        <Link to="/">Home</Link> / Delivery gallery
      </div>
      {content.about?.image && (
        <section className="delivery-about">
          <img
            src={content.about.image}
            alt={content.about.alt || "About BULL"}
          />
          <div>
            <span>ABOUT BULL</span>
            <h2>{content.about.heading}</h2>
            <p>{content.about.text}</p>
          </div>
        </section>
      )}
      <h1>{gallery.heading || "Delivery media gallery"}</h1>
      <p className="delivery-subtitle">
        {gallery.description || "Customer handovers, photos and videos"}
      </p>
      <h2 className="delivery-browse">Browse by district</h2>
      <div className="delivery-districts" aria-label="Delivery districts">
        <button
          aria-pressed={!district}
          onClick={() => {
            setDistrict("");
            setPage(1);
          }}
        >
          All districts
        </button>
        {districts.map(([key, location]) => (
          <button
            key={key}
            title={location.state}
            aria-pressed={district === key}
            onClick={() => {
              setDistrict(key);
              setPage(1);
            }}
          >
            {location.district}
          </button>
        ))}
      </div>
      <div className="delivery-filters" aria-label="Media type">
        {[
          ["all", "All media", Grid2X2],
          ["photo", "Photos", Image],
          ["video", "Videos", Play],
        ].map(([key, label, Icon]: any) => (
          <button
            key={key}
            aria-pressed={type === key}
            onClick={() => {
              setType(key);
              setPage(1);
            }}
          >
            <Icon size={20} />
            {label}
            <span>
              {key === "all"
                ? local.length
                : local.filter((item) => item.type === key).length}
            </span>
          </button>
        ))}
      </div>
      <div className="delivery-cards">
        {visible.map((item, i) => (
          <button
            className="delivery-card"
            key={(current - 1) * 6 + i}
            onClick={() => setSelected(item)}
            aria-label={"Open " + item.title + " in " + item.district}
          >
            <img
              loading="lazy"
              src={
                item.image ||
                "https://i.ytimg.com/vi/" + item.videoId + "/hqdefault.jpg"
              }
              alt={item.alt || item.title}
            />
            {item.type === "video" ? (
              <span className="delivery-play">
                <Play fill="currentColor" />
              </span>
            ) : (
              <span className="delivery-photo">
                <Image size={22} />
              </span>
            )}
            <span className="delivery-caption">
              <strong>{item.title}</strong>
              <span>
                {item.district}, {item.state}
              </span>
            </span>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <p className="delivery-empty">
          No delivery media published{district ? " for this district" : " yet"}.
        </p>
      )}
      {filtered.length > 0 && (
        <div className="delivery-pagination">
          <span>
            Showing {(current - 1) * 6 + 1}–
            {Math.min(current * 6, filtered.length)} of {filtered.length}
          </span>
          <nav aria-label="Gallery pages">
            <button
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <span>
              Page {current} of {pages}
            </span>
            <button
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              Next
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      )}
      {selected && (
        <MediaDialog item={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
