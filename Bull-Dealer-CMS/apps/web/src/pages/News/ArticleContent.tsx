import type { ReactNode } from "react";

type ArticleContentProps = {
  body: string;
  image: string;
  title: string;
  children: ReactNode;
};

export function ArticleContent({
  body,
  image,
  title,
  children,
}: ArticleContentProps) {
  return (
    <div className="news-detail-content">
      {image && (
        <img
          className="news-detail-image"
          src={image}
          alt={title}
          decoding="async"
        />
      )}

      <div className="news-detail-copy">
        {children}

        <div className="news-body">
          <p>{body}</p>
        </div>
      </div>
    </div>
  );
}