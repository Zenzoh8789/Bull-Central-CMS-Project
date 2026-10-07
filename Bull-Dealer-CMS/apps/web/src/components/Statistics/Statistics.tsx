import { useEffect, useRef, useState } from "react";
import { useContent } from "../../services/useContent";
import "./Statistics.css";

function AnimatedCount({ value }: { value: string | number }) {
  const text = String(value);
  const match = text.match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  const target = match ? Number(match[2].replace(/,/g, "")) : NaN;
  const decimals = match?.[2].split(".")[1]?.length ?? 0;
  const element = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    if (!Number.isFinite(target)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) {
      setProgress(1);
      return;
    }
    let frame = 0;
    let started = false;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const elapsed = Math.min((now - start) / 1800, 1);
      setProgress(1 - Math.pow(1 - elapsed, 3));
      if (elapsed < 1) frame = requestAnimationFrame(tick);
    };
    const begin = () => {
      if (started) return;
      started = true;
      frame = requestAnimationFrame(tick);
    };
    const observer = typeof IntersectionObserver === "undefined" ? null :
      new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          begin();
          observer?.disconnect();
        }
      }, { threshold: 0.2 });
    if (observer && element.current) observer.observe(element.current);
    else begin();
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, target]);

  let display = text;
  if (match && Number.isFinite(target) && progress < 1) {
    const number = (target * progress).toFixed(decimals);
    const formatted = match[2].includes(",")
      ? number.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : number;
    display = `${match[1]}${formatted}${match[3]}`;
  }
  return <strong ref={element} aria-label={text}><span aria-hidden="true" style={{ color: "inherit", fontSize: "inherit", lineHeight: "inherit" }}>{display}</span></strong>;
}

export function Statistics() {
  const { statistics: s } = useContent();
  if (!s.enabled) return null;
  return (
    <div className="statistics" aria-label="BULL statistics">
      {s.items.slice(0, 5).map((v: any, i: number) => (
        <div className="stat" key={i}>
          <img src={v.image} alt="" />
          <div>
            <AnimatedCount value={v.value} />
            <span>{v.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
