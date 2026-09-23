# Dealer React frontend

All frontend source, configuration and assets live in this folder (`apps/web`). The NestJS backend remains in `apps/api`, inside the same project root.

## Folder structure

```text
apps/web/
├── public/                 Original BULL images and static assets
├── src/
│   ├── main.tsx            React entry point and Redux provider
│   ├── App.tsx             Browser router setup
│   ├── routes/
│   │   ├── AppRoutes.tsx   All route definitions
│   │   └── ScrollRestoration.tsx
│   ├── layouts/
│   │   ├── SiteLayout.tsx  Shared header, footer and enquiry dialog
│   │   └── SiteLayout.css
│   ├── pages/              One folder per routed page
│   │   ├── Home/
│   │   ├── About/
│   │   ├── Products/
│   │   ├── ProductDetails/
│   │   ├── Testimonials/
│   │   ├── News/
│   │   ├── Contact/
│   │   └── NotFound/
│   ├── components/         Reusable components with colocated CSS
│   │   ├── Header/         Header.tsx + Header.css
│   │   ├── Hero/
│   │   ├── Statistics/
│   │   ├── DealerAbout/
│   │   ├── Equipment/
│   │   ├── EquipmentCatalogue/
│   │   ├── Testimonials/
│   │   ├── VideoDialog/
│   │   ├── News/
│   │   ├── Footer/
│   │   ├── SectionNavigation/
│   │   ├── WhatsAppLink/
│   │   └── EnquiryDialog/
│   ├── store/              Redux configuration, typed hooks, UI slice
│   ├── services/           RTK Query API endpoints
│   ├── types/              Shared TypeScript data types
│   ├── data/               Banner, navigation, news and video content
│   └── styles/             Shared resets, tokens and utilities only
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Routes

| URL                    | Page                                   |
| ---------------------- | -------------------------------------- |
| `/`                    | Original complete home design          |
| `/about`               | Dealer information                     |
| `/products`            | All equipment                          |
| `/products/:productId` | Product details, e.g. `/products/sd76` |
| `/testimonials`        | Customer video carousel                |
| `/news`                | News and updates                       |
| `/contact`             | Dealer address and enquiry access      |
| Any unmatched URL      | Not-found page                         |

Internal navigation uses React Router links. Section links on the home page remain anchors. Shared header/footer and the global enquiry dialog render through `SiteLayout`. Component styles include their own responsive rules; page-only styles live beside the page.

## Run

Install from the project root with `npm ci`. Start the complete preview there with `DEMO_MODE=true` and `npm run dev` (PowerShell: `$env:DEMO_MODE='true'`). Alternatively run `npm run dev` here for just React; the API must be running on port 3000. Build here using `npm run build`.

Vite handles development route reloads. The Docker Nginx configuration already falls back to `index.html` for production browser routes. `/api` stays proxied to NestJS.

Keep new route definitions in `routes/AppRoutes.tsx`. Add a folder under `pages` for each new page, and reusable UI under `components`. No inline stylesheet blocks are needed.
