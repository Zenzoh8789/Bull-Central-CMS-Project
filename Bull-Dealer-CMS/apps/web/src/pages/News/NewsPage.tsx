import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useNews, NewsCard } from "../../components/News/News";
import "./NewsPage.css";
export function NewsPage() {
  const n = useNews();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = n.items.filter((a: any) =>
    (a.title + " " + a.body).toLowerCase().includes(search.toLowerCase()),
  );
  const pages = Math.ceil(filtered.length / 8);
  const current = Math.min(page, Math.max(pages, 1));
  return (
    <div className="news-page route-page">
      <div className="news-wrap news-crumb">
        <Link to="/">Home</Link> / News and Updates
      </div>
      <header className="news-banner">
        <div className="news-wrap">
          <h1>NEWS AND UPDATES</h1>
          <p>
            Latest news, product launches, events and updates from BULL
            Machines.
          </p>
        </div>
        {n.enabled && n.bannerImage && <img src={n.bannerImage} alt="" />}
      </header>
      <div className="news-wrap">
        <div className="news-toolbar">
          <label className="news-search">
            <input
              aria-label="Search news"
              placeholder="Search news…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Search size={20} />
          </label>
        </div>
        <div className="news-grid">
          {n.enabled &&
            filtered
              .slice((current - 1) * 8, current * 8)
              .map((a: any) => <NewsCard key={a.slug} article={a} />)}
        </div>
        {(!n.enabled || !filtered.length) && (
          <p className="news-empty">
            {search
              ? "No news matches your search."
              : "No news or updates yet. Check back soon."}
          </p>
        )}
        {n.enabled && pages > 1 && (
          <nav className="news-pagination" aria-label="News pages">
            <button
              disabled={current === 1}
              aria-label="Previous page"
              onClick={() => setPage(current - 1)}
            >
              ←
            </button>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                aria-current={current === i + 1 ? "page" : undefined}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={current === pages}
              aria-label="Next page"
              onClick={() => setPage(current + 1)}
            >
              →
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
