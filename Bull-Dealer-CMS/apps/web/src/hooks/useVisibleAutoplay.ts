import { useEffect, useRef } from "react";

export function useVisibleAutoplay(
  advance: () => void,
  delay: number,
  enabled: boolean,
) {
  const sectionRef = useRef<HTMLElement>(null);
  const advanceRef = useRef(advance);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || !enabled) return;
    if (!Number.isFinite(delay) || delay <= 0) return;

    const motion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    const sync = () => {
      stop();

      if (visible && !document.hidden && !motion.matches) {
        timer = setInterval(() => {
          advanceRef.current();
        }, delay);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });

    observer.observe(section);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, [delay, enabled]);

  return sectionRef;
}