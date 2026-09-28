# BULL Dealer CMS — updated project

## Changes

- One main sidebar with all 20 content sections; duplicate inner navigation and common/dealer subtitles removed.
- Improved forms, media previews, spacing, sticky save actions, sticky top header and responsive News grid/search.
- All image fields use local file selection, including logos, favicon, SEO and product images. Downloads use a PDF picker. Files persist in local `MEDIA_DIR`, served through `/uploads/`.
- Removed Cloudflare R2/AWS SDK storage and configuration. Docker preserves files in the `cms_uploads` volume.
- Administrator **Save & publish** updates the selected scope. Editors save drafts for administrator approval. Existing group/dealer/override precedence remains enforced.
- Fixed the mismatched News capability exports that disabled saving, and disabled save/navigation during uploads.
- Website content refreshes every 10 seconds and on focus/reconnect. Home **View More** opens `/blog/:slug`; article **More News** opens `/blog`. There are two News pages: listing and article detail. Old `/news` links redirect to `/blog`.
- Unique IDs for newly added products; protection for required contact/page-layout entries; actual dashboard dealer count; username/password-only administrator setup.

Navigation, social and Google Maps destinations remain editable links because these features need targets. Media URL text inputs are replaced by uploads. Existing remote images remain until replaced with a local upload; this update does not download them automatically.

## Latest UI update

- News banner image is editable; banner heading and description are fixed.
- Branding edits only the Dealer Logo. The BULL brand logo is fixed.
- Admin text uses 14, 15 and 16 px sizes and the header stays at the top while scrolling.
- File pickers show the selected filename or saved image filename; media-library selection dropdowns are removed.
- Main Banner Enabled and Autoplay controls are hidden; existing stored settings are retained.
- Add item starts with blank fields and expands the new item for banners/statistics, retaining existing items.
- Dealers have a trash action with confirmation. Deletion removes that dealer's domains, content and enquiries, and disables its users. Other dealers remain unchanged.
- Users & Access menu and page are removed.
- The duplicate All News page and unused news data module are removed. Blog detail uses image/text columns and related news cards.

Latest browser checks confirmed Dealer Logo-only editing, absence of Users & Access, sticky header, computed 14/15/16 px text, and blank expanded Statistics/Main Banner items. No blank test item was published.

## Local setup

Default administrator: username `admin`, password `admin123`. No administrator email is required.

Requires Node.js 22+ and MySQL 8.x. Create a MySQL database/user. For a fresh installation, copy `.env.example` to `.env`, and set `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `MEDIA_STORAGE=local`. URL-encode special characters in the database URL password.

```sh
npm ci
npm run db:setup
npm run dev
```

Admin: `http://localhost:5174/admin/`. Website: `http://localhost:5173/`. API health: `http://localhost:3000/api/health`.

For upgrades, preserve your existing `.env`, database and uploads. Bootstrap preserves existing users/publications. Changing credentials in `.env` does not reset an existing account; use `npm run admin:credentials` only when intentionally resetting that account.

## VPS deployment

Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` in `.env` to your real values, then run:

```sh
docker compose up -d --build
```

The site is exposed on port 8080; admin is `/admin/`. Register the dealer domain in Admin → Dealers. Configure your VPS reverse proxy/TLS to this port and preserve the Host header. MySQL/API ports are bound to localhost. The API container runs migration/bootstrap automatically.

For upgrades, back up MySQL and uploads, retain the same Compose project name and volumes, replace the source, and rebuild. Do not run `docker compose down -v`, which removes persistent data. Without Docker, configure an absolute writable `MEDIA_DIR` that survives releases and proxy `/api/` and `/uploads/` to the API; see `infra/nginx.conf`.

## Verification performed

Test environment: Windows, Node.js 24, isolated MySQL 8.0.46. Original ZIP and live database were not modified.

- TypeScript checks and production builds for admin, API and website.
- 21 API unit tests covering authentication, scopes, schemas, News capability detection and local media persistence/rollback.
- 20 CMS integration scenarios with 130 dealers, including publication, conflicts, permissions, enquiries, media and account operations.
- 12 News integration scenarios, including multipart image upload, API restart persistence, separate banner publication and administrator-only dealer deletion.
- 20 sections × initial save and update: 40 saves verified against published content.
- Browser: all 20 content editors opened with enabled save; real local PNG upload; article create/save/publish; View More → article → More News → listing (earlier browser run); existing article edit appeared on the already-open public listing.
- Inspected admin layout and mobile News layout; no browser console errors in checked flows.

Repeat checks:

```sh
npm run check
npm run build
npm test
```

For integration tests, set `TEST_DATABASE_URL` to a disposable MySQL test server whose account can create/drop test databases, then run `npm run test:integration` and `npm run test:news`.

This is a locally tested source delivery. Live VPS deployment, TLS/domain setup and Docker execution were not performed. Verify host permissions and deployment on your VPS.

The ZIP excludes real `.env` credentials, node_modules, compiled builds, temporary QA data, old embedded ZIPs, unused static News data and ad-hoc credential-reset scripts. Run `npm ci` and build from source.

## Run each app separately

Run these from the project root in three terminals after completing database setup:

```sh
npm run dev -w apps/api
npm run dev -w apps/admin
npm run dev -w apps/web
```

Alternatively, `npm run dev` starts all three. Rebuild all three apps when updating this package so API and admin News capabilities stay in sync.
