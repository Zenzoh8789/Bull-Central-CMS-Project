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
    meta("keywords", seo.keywords || "");
    meta("robots", seo.robots || "index, follow");
    meta("author", seo.author || "");
    meta("theme-color", seo.themeColor || "#fbb120");
    meta("twitter:card", "summary_large_image");
    meta("twitter:title", seo.socialTitle || seo.title);
    meta("twitter:description", seo.socialDescription || seo.description);
    meta("twitter:image", seo.socialImage);
    meta("og:type", "website", true);
    meta("og:url", seo.canonical || window.location.href, true);
    meta("og:title", seo.socialTitle || seo.title, true);
    meta("og:site_name", seo.siteName || "", true);
    meta("og:locale", seo.locale || "en_IN", true);
    meta("og:description", seo.socialDescription || seo.description, true);
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
