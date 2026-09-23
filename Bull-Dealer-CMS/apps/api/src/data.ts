export const dealer = {
  id: 1,
  name: "Tara Auto Hub Pvt. Ltd.",
  location: "Bihar",
  address:
    "E1-50 Block Jai Prakash Nagar, Digha Ashiana Road, Digha, Patna, Bihar 800011",
  about:
    "Established in 2016, Tara Auto Hub is a BULL channel partner serving Bihar. We bring local knowledge and a personal approach to equipment sales, service enquiries, and ownership support.",
};
export const products = [
  {
    id: "sd76",
    menuLabel: "SD76 - BS5 SUPER SMART",
    menuImage: "/Asset/Images/nav product/product-sd76-bs4.png",
    showInMenu: 1,
    menuOrder: 1,
    name: "SD76 Super Smart",
    category: "Backhoe loaders",
    image: "/images/backhoe.png",
    tag: "SUPER SMART",
    description:
      "A versatile backhoe loader for demanding digging and loading applications.",
    url: "https://www.bullindia.com/bull-sd76-bs5-super-smart.php",
  },
  {
    id: "hd76",
    menuLabel: "BULL LOADER HD76",
    menuImage: "/Asset/Images/nav product/bull-loader-hd76-sm.png",
    showInMenu: 1,
    menuOrder: 2,
    name: "HD76 Loader",
    category: "Backhoe loaders",
    image: "/images/loader.png",
    tag: "BUILT FOR THE LOAD",
    description:
      "A capable loading partner for material handling and everyday site work.",
    url: "https://www.bullindia.com/bull-hd-76-loader.php",
  },
  {
    id: "av490",
    menuLabel: "SKID STEER – AV490",
    menuImage: "/Asset/Images/nav product/skid-stree-sm.png",
    showInMenu: 1,
    menuOrder: 3,
    name: "AV490 Skid Steer",
    category: "Skid steers",
    image: "/images/skid.png",
    tag: "COMPACT & CAPABLE",
    description:
      "Compact equipment designed for versatile work in space-conscious environments.",
    url: "https://www.bullindia.com/bull-skid-steer-av490.php",
  },
  {
    id: "smartkid",
    menuLabel: "BULL SMART KID",
    menuImage: "",
    showInMenu: 0,
    menuOrder: 4,
    name: "Smart Kid",
    category: "Skid steers",
    image: "/images/smartkid.png",
    tag: "SMALL SIZE. BIG POSSIBILITIES.",
    description:
      "Explore the compact BULL range for your next specialised application.",
    url: "https://www.bullindia.com/",
  },
];
export const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
export function normaliseHost(host: string): string {
  return host.toLowerCase().trim().replace(/:\d+$/, "").replace(/\.$/, "");
}
