import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { actions } from "../store/uiSlice";

export function ScrollRestoration() {
  const { pathname, hash } = useLocation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(actions.closeMenu());
    dispatch(actions.closeEnquiry());

    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    let id: string;

    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }

    if (!id) return;

    let frame: number | undefined;
    let timeout: number | undefined;

    const stop = () => {
      if (frame !== undefined) {
        cancelAnimationFrame(frame);
      }

      frame = undefined;
      window.clearTimeout(timeout);
      observer.disconnect();
    };

    const scheduleScroll = () => {
      if (frame !== undefined) return;

      frame = requestAnimationFrame(() => {
        frame = undefined;

        const section = document.getElementById(id);

        if (section) {
          section.scrollIntoView();
          stop();
        }
      });
    };

    const observer = new MutationObserver(scheduleScroll);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    scheduleScroll();
    timeout = window.setTimeout(stop, 15000);

    return stop;
  }, [pathname, hash, dispatch]);

  return null;
}