import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useNews, NewsCard } from "../../components/News/News";
import "./NewsPage.css";

export function NewsPage() {
  const navigate = useNavigate();
  const n = useNews();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = n.items.filter((article: { title: any; body: any; }) =>
    `${article.title ?? ""} ${article.body ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const pages = Math.ceil(filtered.length / 8);
  const current = Math.min(page, Math.max(pages, 1));

  return (
    <div className="news-page route-page">
      <div className="news-wrap news-crumb">
        <button
          type="button"
          className="news-back"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Back
        </button>

        <span aria-hidden="true">/</span>
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">News and Updates</span>
      </div>

      <header className="news-banner">
        <div className="news-wrap">
          <h1>LATEST NEWS &amp; UPDATES</h1>
          <p>
            Stay informed about BULL products, dealer network news, events and
            service updates.
          </p>
        </div>

        {n.enabled && n.bannerImage && (
          <img src={n.bannerImage} alt="" />
        )}
      </header>

      <div className="news-wrap">
        <div className="news-toolbar">
          <label className="news-search">
            <input
              type="search"
              aria-label="Search news"
              placeholder="Search news…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Search size={20} aria-hidden="true" />
          </label>
        </div>

        <div className="news-grid">
          {n.enabled &&
            filtered
              .slice((current - 1) * 8, current * 8)
              .map((article: any) => (
                <NewsCard key={article.slug} article={article} />
              ))}
        </div>

        {(!n.enabled || !filtered.length) && (
          <p className="news-empty">
            {n.enabled && search
              ? "No news matches your search."
              : "No news or updates yet. Check back soon."}
          </p>
        )}

        {n.enabled && pages > 1 && (
          <nav className="news-pagination" aria-label="News pages">
            <button
              type="button"
              disabled={current === 1}
              aria-label="Previous page"
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>

            {Array.from({ length: pages }, (_, i) => (
              <button
                type="button"
                key={i + 1}
                aria-label={`Page ${i + 1}`}
                aria-current={current === i + 1 ? "page" : undefined}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              type="button"
              disabled={current === pages}
              aria-label="Next page"
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}