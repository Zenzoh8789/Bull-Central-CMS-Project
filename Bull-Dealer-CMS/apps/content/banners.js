const { dealerState } = require("./geography.js");
const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];
const bannerTemplate = {
  enabled: true,
  autoplay: true,
  interval: 5000,
  scrollLabel: "",
  items: [
    {
      image: "",
      alt: "",
      url: "",
      title: "",
      images: [""],
      states: ["ALL"],
      enabled: true,
    },
  ],
};
function normalizeBanners(value) {
  const doc = structuredClone(value);
  if (!doc || !Array.isArray(doc.items)) return doc;
  doc.items = doc.items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    return {
      ...item,
      image: item.image ?? item.images?.[0] ?? "",
      alt: item.alt ?? item.title ?? "",
      url: item.url ?? "",
      enabled: item.enabled === undefined ? true : item.enabled,
      title: item.title === undefined ? item.alt || "Banner" : item.title,
      images:
        item.images === undefined
          ? item.image
            ? [item.image]
            : []
          : item.images,
      states: item.states === undefined ? ["ALL"] : item.states,
    };
  });
  return doc;
}
function publishLabel(states) {
  return states.includes("ALL") || indianStates.every((s) => states.includes(s))
    ? "All States"
    : states.join(", ");
}
function bannerMatches(item, dealer) {
  const states = item.states || ["ALL"];
  if (states.includes("ALL")) return true;
  const key = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  const region = key(
    dealerState(dealer?.state?.trim() || dealer?.location || ""),
  );
  return states.some((s) => key(s) === region);
}
function bannerSlides(config) {
  return (normalizeBanners(config)?.items || [])
    .filter((item) => item.enabled !== false)
    .flatMap((item) =>
      item.images.map((image) => ({ image, alt: item.title || item.alt })),
    );
}
module.exports = {
  indianStates,
  bannerTemplate,
  normalizeBanners,
  publishLabel,
  bannerMatches,
  bannerSlides,
};
