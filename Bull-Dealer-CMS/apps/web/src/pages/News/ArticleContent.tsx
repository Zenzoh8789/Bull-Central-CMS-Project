import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export function ArticleContent({
  body,
  image,
  title,
  children,
}: {
  body: string;
  image: string;
  title: string;
  children: ReactNode;
}) {
  const measure = useRef<HTMLParagraphElement>(null);
  const [split, setSplit] = useState(body.length);
  useLayoutEffect(() => {
    const element = measure.current;
    if (!element) return;
    let active = true;
    const update = () => {
      if (!active) return;
      if (window.matchMedia("(max-width: 700px)").matches) {
        setSplit(body.length);
        return;
      }
      const node = element.firstChild;
      if (!node) {
        setSplit(0);
        return;
      }
      const range = document.createRange();
      range.setStart(node, 0);
      const height = parseFloat(getComputedStyle(element).lineHeight) * 5;
      let low = 0,
        high = body.length;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        range.setEnd(node, mid);
        if (range.getBoundingClientRect().height <= height) low = mid;
        else high = mid - 1;
      }
      // Keep words together without dropping any article characters.
      if (low < body.length && low > 0 && !/\s/.test(body[low])) {
        const boundary = body.slice(0, low).search(/\s+\S*$/);
        if (boundary > 0) low = boundary;
      }
      setSplit(low);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    document.fonts.ready.then(update);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [body]);
  return (
    <div className="news-detail-content">
      <img className="news-detail-image" src={image} alt={title} />
      <div className="news-detail-copy">
        {children}
        <div className="news-body news-intro">
          <p ref={measure} className="news-measure" aria-hidden="true">
            {body}
          </p>
          <p>{body.slice(0, split)}</p>
        </div>
      </div>
      {split < body.length && (
        <div className="news-body news-continuation">
          <p>{body.slice(split)}</p>
        </div>
      )}
    </div>
  );
}
