const regions = {
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CG: "Chhattisgarh",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TS: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  WB: "West Bengal",
  AN: "Andaman and Nicobar Islands",
  CH: "Chandigarh",
  DH: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  JK: "Jammu and Kashmir",
  LA: "Ladakh",
  LD: "Lakshadweep",
  PY: "Puducherry",
};
function dealerState(location) {
  const value = (location || "").trim();
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  for (const name of Object.values(regions))
    if (normalized.includes(name.toLowerCase().replace(/[^a-z]/g, "")))
      return name;
  const suffix =
    value
      .split(/[,\s]+/)
      .filter(Boolean)
      .at(-1)
      ?.toUpperCase() || "";
  if (regions[suffix]) return regions[suffix];
  const aliases = {
    TG: "Telangana",
    OR: "Odisha",
    CT: "Chhattisgarh",
    UT: "Uttarakhand",
    orissa: "Odisha",
    pondicherry: "Puducherry",
    chennai: "Tamil Nadu",
    coimbatore: "Tamil Nadu",
    madurai: "Tamil Nadu",
    bengaluru: "Karnataka",
    bangalore: "Karnataka",
    hyderabad: "Telangana",
    patna: "Bihar",
    mumbai: "Maharashtra",
    pune: "Maharashtra",
    kochi: "Kerala",
    kolkata: "West Bengal",
    ahmedabad: "Gujarat",
    jaipur: "Rajasthan",
    lucknow: "Uttar Pradesh",
  };
  return (
    aliases[suffix] || aliases[value.toLowerCase()] || "Other / unspecified"
  );
}

export { dealerState };
