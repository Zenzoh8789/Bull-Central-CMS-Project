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

    const scrollToSection = () => {
      const section = document.getElementById(id);
      if (!section) return false;
      section.scrollIntoView();
      return true;
    };
    // Product sections may arrive after their API request completes.
    const observer = new MutationObserver(() => {
      if (scrollToSection()) observer.disconnect();
    });
    const frame = requestAnimationFrame(() => {
      if (!scrollToSection())
        observer.observe(document.getElementById("main")!, {
          childList: true,
          subtree: true,
        });
    });
    const timeout = window.setTimeout(() => observer.disconnect(), 15000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [pathname, hash, dispatch]);
  return null;
}
