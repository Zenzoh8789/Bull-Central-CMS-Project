export type NewsItem = {
  id: number;
  slug: string;

  title: string;
  excerpt: string;
  content: string[];

  category: string;

  date: string;
  day: string;
  month: string;
  year: string;

  image: string;

  // Original Bull India source
  sourceUrl?: string;
};

export const newsData: NewsItem[] = [
  {
    id: 1,

    slug:
      "coimbatore-company-transports-machines-by-train-to-delhi",

    title:
      "Coimbatore company transports machines by train to Delhi",

    excerpt:
      "As many as 70 backhoe machines manufactured by Bull Machines in Coimbatore were despatched to its customer fulfilment centre in Delhi by train.",

    content: [
      "As many as 70 backhoe machines manufactured by Bull Machines in Coimbatore were despatched to its customer fulfilment centre in Delhi by train.",
    ],

    category: "Company Updates",

    date: "January 29, 2025",
    day: "29",
    month: "JAN",
    year: "2025",

    image: "/news/train-machines.jpg",

    sourceUrl:
      "https://bullindia.com/coimbatore-company-transports-machines-by-train-to-delhi.php",
  },

  {
    id: 2,

    slug:
      "bull-machines-unveils-supersmart-backhoe-loader",

    title:
      "BULL Machines Unveils SuperSmart Backhoe Loader",

    excerpt:
      "BULL Machines announced the launch of SuperSmart, a cutting-edge backhoe loader designed for superior efficiency and enhanced operator comfort.",

    content: [
      "BULL Machines announced the launch of SuperSmart, a cutting-edge backhoe loader designed for superior efficiency, enhanced operator comfort, and compliance with BS5-CEV Stage V norms.",

      "SuperSmart introduces powerful engine options together with BULL's patented APM technology to improve performance and fuel efficiency.",

      "The launch further strengthens BULL Machines' construction equipment portfolio.",
    ],

    category: "Product Launch",

    date: "March 27, 2025",
    day: "27",
    month: "MAR",
    year: "2025",

    image: "/news/supersmart.jpg",

    sourceUrl:
      "https://www.bullindia.com/bull-machines-unveils.php",
  },

  {
    id: 3,

    slug:
      "bull-machines-reveals-120cr-investment-plan",

    title:
      "Bull Machines reveals ₹120 Cr investment plan, 2x production soon",

    excerpt:
      "Bull Machines is investing ₹120 crore to expand manufacturing capacity and support its growing domestic and international business.",

    content: [
      "Bull Machines announced a major investment programme aimed at expanding its manufacturing capacity.",

      "The company plans to increase annual production capacity as demand grows across India and international markets.",

      "The expansion forms part of BULL Machines' broader growth strategy.",
    ],

    category: "Investments",

    date: "March 25, 2025",
    day: "25",
    month: "MAR",
    year: "2025",

    image: "/news/investment.jpg",

    sourceUrl:
      "https://www.bullindia.com/bull-machines-reveals-120cr.php",
  },
];