import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
} from "lucide-react";
import { useNews, NewsCard } from "../../components/News/News";
import "./NewsPage.css";
import { ArticleContent } from "./ArticleContent";
export function BlogPage() {
  const { slug } = useParams();
  const n = useNews();
  const [offset, setOffset] = useState(0);
  const [message, setMessage] = useState("");
  const a = n.items.find((x: any) => x.slug === slug);
  if (!n.enabled || !a)
    return (
      <div className="news-wrap news-empty route-page">
        <h1>Article not found</h1>
        <Link to="/blog">Back to News and Updates</Link>
      </div>
    );
  const related = n.items.filter((x: any) => x.slug !== slug);
  const start = Math.min(offset, Math.max(related.length - 4, 0));
  const url = encodeURIComponent(window.location.href);
  return (
    <div className="news-page route-page">
      <div className="news-wrap news-crumb">
        <Link to="/">Home</Link> / <Link to="/blog">News and Updates</Link> /{" "}
        {a.title}
      </div>
      <article className="news-wrap news-detail">
        <ArticleContent body={a.body} image={a.image} title={a.title}>
          <h1>{a.title}</h1>
          <div className="news-meta">
            <time dateTime={a.date}>
              <CalendarDays size={21} />
              {new Date(a.date + "T00:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>
        </ArticleContent>
        <div className="news-share">
          <span>Share this news:</span>
          <a
            aria-label="Share on Facebook"
            target="_blank"
            rel="noopener noreferrer"
            href={"https://www.facebook.com/sharer/sharer.php?u=" + url}
          >
            f
          </a>
          <a
            aria-label="Share on LinkedIn"
            target="_blank"
            rel="noopener noreferrer"
            href={"https://www.linkedin.com/sharing/share-offsite/?url=" + url}
          >
            in
          </a>
          <a
            aria-label="Share on WhatsApp"
            target="_blank"
            rel="noopener noreferrer"
            href={
              "https://wa.me/?text=" +
              encodeURIComponent(a.title + " " + window.location.href)
            }
          >
            WA
          </a>
          <button
            aria-label="Copy article link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                setMessage("Link copied");
              } catch {
                setMessage("Copy the link from your address bar.");
              }
            }}
          >
            <LinkIcon size={17} />
          </button>
          <Link className="news-back" to="/blog">
            <ArrowLeft size={18} /> Back to News and Updates
          </Link>
        </div>
        <span className="news-share-status" role="status">
          {message}
        </span>
      </article>
      {related.length > 0 && (
        <section className="news-wrap news-related">
          <div className="news-related-heading">
            <h2>Related News and Updates</h2>
            <div>
              <button
                aria-label="Previous related news"
                disabled={!start}
                onClick={() => setOffset(Math.max(0, start - 4))}
              >
                <ChevronLeft />
              </button>
              <button
                aria-label="Next related news"
                disabled={start + 4 >= related.length}
                onClick={() => setOffset(start + 4)}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className="news-grid">
            {related.slice(start, start + 4).map((x: any) => (
              <NewsCard key={x.slug} article={x} />
            ))}
          </div>
        </section>
      )}
      <Link className="news-more" to="/blog">
        More News <ArrowRight />
      </Link>
    </div>
  );
}
