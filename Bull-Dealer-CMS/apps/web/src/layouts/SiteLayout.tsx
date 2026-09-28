import { useEffect } from "react";
import { useSiteQuery } from "../services/siteApi";
import { Outlet } from "react-router-dom";
import { Header } from "../components/Header/Header";
import { Footer } from "../components/Footer/Footer";
import { WhatsAppLink } from "../components/WhatsAppLink/WhatsAppLink";
import { EnquiryDialog } from "../components/EnquiryDialog/EnquiryDialog";
import { useAppSelector } from "../store/hooks";
import "./SiteLayout.css";
export function SiteLayout() {
  const enquiryOpen = useAppSelector((s) => s.ui.enquiryOpen);
  const { data, isLoading, isError, refetch } = useSiteQuery(undefined, {
    pollingInterval: 10000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  useEffect(() => {
    const seo = data?.content.seo;
    if (!seo?.enabled) return;
    document.title = seo.title;
    const meta = (name: string, value: string, property = false) => {
      let el = document.head.querySelector<HTMLMetaElement>(
        "meta[" + (property ? "property" : "name") + '="' + name + '"]',
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(property ? "property" : "name", name);
        document.head.append(el);
      }
      el.content = value;
    };
    meta("description", seo.description);
    meta("og:title", seo.title, true);
    meta("og:description", seo.description, true);
    meta("og:image", seo.socialImage, true);
    for (const [rel, href] of [
      ["canonical", seo.canonical],
      ["icon", seo.favicon],
    ]) {
      let el = document.head.querySelector<HTMLLinkElement>(
        'link[rel="' + rel + '"]',
      );
      if (!href) {
        el?.remove();
        continue;
      }
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.append(el);
      }
      el.href = href;
    }
  }, [data]);
  if (isLoading)
    return (
      <p className="api-message" role="status">
        Loading website…
      </p>
    );
  if (isError || !data)
    return (
      <div className="api-message" role="alert">
        This dealer website is unavailable.{" "}
        <button onClick={() => refetch()}>Try again</button>
      </div>
    );
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppLink />
      {enquiryOpen && <EnquiryDialog />}
    </>
  );
}
