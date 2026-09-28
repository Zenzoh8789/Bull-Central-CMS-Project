const sampleUrls = [
  "https://www.bullindia.com/coimbatore-company-transports-machines-by-train-to-delhi.php",
  "https://www.bullindia.com/bull-machines-unveils.php",
  "https://www.bullindia.com/bull-machines-reveals-120cr.php",
];
const newsTemplate = {
  enabled: true,
  heading: "NEWS AND UPDATES",
  bannerImage: "",
  description:
    "Latest news, product launches, events and updates from BULL Machines.",
  items: [{ slug: "", title: "", date: "", image: "", body: "" }],
};
function normalizeNews(value) {
  if (!value || !Array.isArray(value.items)) return value;
  return {
    bannerImage: "",
    description: newsTemplate.description,
    ...value,
    items: value.items
      .filter(
        (x) =>
          !sampleUrls.includes(x?.url) &&
          !(
            /^demo-news-[1-9]$/.test(x?.slug || "") &&
            x?.title?.startsWith("Demo:") &&
            x?.body?.includes("Demo content for layout preview only.")
          ),
      )
      .map((x, i) => {
        if (!x || typeof x !== "object") return x;
        const { url, category, ...a } = x;
        return {
          ...a,
          slug:
            a.slug ||
            ((a.title || "article")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "") || "article") +
              "-" +
              (i + 1),
          body: a.body || "",
        };
      }),
  };
}
const newsCapabilities = { model: "articles", version: 2, legacyUrl: false };
function supportsNewsArticles(definition) {
  const item = definition?.template?.items?.[0];
  return (
    definition?.key === "news" &&
    definition?.capabilities?.model === newsCapabilities.model &&
    definition?.capabilities?.version >= newsCapabilities.version &&
    ["slug", "title", "date", "image", "body"].every(
      (key) => typeof item?.[key] === "string",
    )
  );
}

export { newsTemplate, normalizeNews, newsCapabilities, supportsNewsArticles };
