import { useLayoutEffect, useRef } from "react";
export function ContentTextarea({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const resize = () => {
      el.style.height = "auto";
      el.style.height = Math.min(480, Math.max(96, el.scrollHeight + 2)) + "px";
    };
    resize();
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        resize();
      }
    });
    let width = el.clientWidth;
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);
  return (
    <textarea
      ref={ref}
      id={id}
      rows={3}
      value={value}
      className="content-textarea"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
