import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Link as LinkIcon,
} from "lucide-react";

import { useNews, NewsCard } from "../../components/News/News";
import { ArticleContent } from "./ArticleContent";

import "./NewsPage.css";

export function BlogPage() {
  const { slug } = useParams();
  const n = useNews();

  const [offset, setOffset] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setOffset(0);
    setMessage("");
  }, [slug]);

  const article = n.items.find((item: any) => item.slug === slug);

  if (!n.enabled || !article) {
    return (
      <div className="news-wrap news-empty route-page">
        <h1>Article not found</h1>
        <Link to="/blog">Back to News and Updates</Link>
      </div>
    );
  }

  const related = n.items.filter((item: any) => item.slug !== slug);
  const pageSize = 4;
  const lastPageStart =
    Math.max(0, Math.ceil(related.length / pageSize) - 1) * pageSize;
  const start = Math.min(offset, lastPageStart);

  const articleUrl = window.location.href;
  const encodedUrl = encodeURIComponent(articleUrl);
  const shareText = encodeURIComponent(`${article.title} ${articleUrl}`);

  const copyLink = async (instagram = false) => {
    try {
      await navigator.clipboard.writeText(articleUrl);

      setMessage(
        instagram
          ? "Link copied. Paste it in Instagram."
          : "Article link copied.",
      );
    } catch {
      setMessage("Please copy the article link from your address bar.");
    }
  };

  return (
    <div className="news-page route-page">
      <div className="news-wrap news-crumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/blog">News and Updates</Link>
        <span>/</span>
        <span>{article.title}</span>
      </div>

      <article className="news-wrap news-detail">
        <ArticleContent
          key={article.slug}
          body={article.body}
          image={article.image}
          title={article.title}
        >
          <h1>{article.title}</h1>

          <div className="news-meta">
            <time dateTime={article.date}>
              <CalendarDays size={21} aria-hidden="true" />

              {new Date(
                `${article.date}T00:00:00`,
              ).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>
        </ArticleContent>

        <div className="news-share">
          <span className="news-share-label">Share this news:</span>

          <div className="news-share-actions">
            <a
              className="news-social news-social-facebook"
              aria-label="Share on Facebook"
              title="Share on Facebook"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            >
              f
            </a>

            <a
              className="news-social news-social-linkedin"
              aria-label="Share on LinkedIn"
              title="Share on LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            >
              in
            </a>

            <a
              className="news-social news-social-whatsapp"
              aria-label="Share on WhatsApp"
              title="Share on WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/?text=${shareText}`}
            >
              WA
            </a>

            <a
              className="news-social news-social-instagram"
              aria-label="Copy article link and open Instagram"
              title="Copy link and open Instagram"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.instagram.com/"
              onClick={() => {
                void copyLink(true);
              }}
            >
              <Instagram size={20} aria-hidden="true" />
            </a>

            <button
              type="button"
              className="news-social news-social-copy"
              aria-label="Copy article link"
              title="Copy article link"
              onClick={() => {
                void copyLink();
              }}
            >
              <LinkIcon size={19} aria-hidden="true" />
            </button>
          </div>

          <Link className="news-back" to="/blog">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Back to News and Updates</span>
          </Link>
        </div>

        <p className="news-share-status" role="status">
          {message}
        </p>
      </article>

      {related.length > 0 && (
        <section className="news-wrap news-related">
          <div className="news-related-heading">
            <h2>Related News and Updates</h2>

            <div>
              <button
                type="button"
                aria-label="Previous related news"
                disabled={start === 0}
                onClick={() => {
                  setOffset(Math.max(0, start - pageSize));
                }}
              >
                <ChevronLeft aria-hidden="true" />
              </button>

              <button
                type="button"
                aria-label="Next related news"
                disabled={start + pageSize >= related.length}
                onClick={() => {
                  setOffset(start + pageSize);
                }}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="news-grid">
            {related
              .slice(start, start + pageSize)
              .map((item: any) => (
                <NewsCard key={item.slug} article={item} />
              ))}
          </div>
        </section>
      )}

      <Link className="news-more" to="/blog">
        More News <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}