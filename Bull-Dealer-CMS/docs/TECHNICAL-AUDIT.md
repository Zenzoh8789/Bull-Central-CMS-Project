# Technical audit — approved ZIP only

Base: `E:\Bull-Central-CMS-Project\Bull-Dealer-CMS.zip`.
SHA-256: `1D4059FBB097D2C7BACAB868849DE5D5673EB4F801510940A09CBEF8F736253C`.
All source changes were made in a new extraction of this ZIP. No previous project source was used. Original archive and production data were untouched.

## Findings and fixes

- Banner Add Item previously split its selected images into independent rows. It now stores up to three images in one item, retains them through view/edit, and replaces an edited item without duplicates.
- Banner status now persists as a boolean, defaults legacy records to active, updates the table, and prevents inactive images from rendering. The status control is the only intentional functional UI addition.
- Item saves/deletes previously left optimistic values behind after an API failure. They now restore the prior document, display the API error, retain selected images for retry, and use the returned saved document/revision. Cache invalidation follows successful writes.
- Banner deletion saves the revisioned section document and removes the corresponding entry from MySQL and public content. Banners are embedded items, not standalone database records; there is no invented banner-ID DELETE endpoint. Shared/history-referenced media files are retained.
- Common editor initialization previously could use defaults instead of published Common content. A permission-checked Common-only resolver now supplies the saved Common document. Dealer writes use their own owner and OVERRIDE layer. Empty saved sections remain empty.
- Three static fallback banners were removed. Existing database banners and uploaded images are preserved. Legitimate shared catalogue/configuration and the existing explicitly read-only demo feature remain.
- Backend state targeting now uses the same state/code/location aliases as dealer selection, including legacy city locations. Unknown locations do not match targeted states.
- Draft request validation now rejects invalid scope/owner/revision/document shapes with useful 400 messages. Draft row and audit entry writes are transactional; publication validates every section. Revision-checked draft deletion removes drafts without deleting published content.
- User password creation previously trimmed whitespace while login preserved it. Creation now preserves the password supplied.
- Startup checks detect missing dealer geography columns early. Local host mapping uses the actual requested domain unless an explicit development override is configured.
- Bootstrap now detects existing drafts/live records as well as publications before seeding. No bootstrap, migration or reset was run against production.
- News normalization preserves genuine customized articles that share an old sample URL; malformed numeric titles now reach validation rather than causing a TypeError.
- Footer fields, product menu and product detail content now follow published API data. The product menu/detail cache shares the existing site refresh cycle. The intentionally fixed BULL header logo remains unchanged.
- Hero respects autoplay and safely clamps its index when slides are deleted. Existing styling and default appearance are preserved.

## Cleanup and review

Removed duplicate backend banner template/normalizer code, unused imports/variables, a redundant News query subscription, and stale independent product queries. Shared CMS request/response and banner declarations now type the affected boundaries; dealer geography is shared between Common targeting and dealer selection.

Testimonials' finite layout transforms moved from JSX inline styles to CSS data-position rules with the same geometry. The CSS scan found no exact duplicate declarations within rules. Responsive/cascade rules and legitimate dynamic image URLs were retained; no unproven CSS or unrouted business pages were deleted. This is targeted cleanup, not a claim that every historical `any` or selector can safely be removed.

## Verification

Local Windows / Node 24.19.0 / MySQL 8.4.11 in an isolated Docker container. Test databases are disposable and separate from production.

- 40 unit tests passed; website/admin TypeScript checks passed; Admin, API and Website production builds passed.
- Existing CMS suite: 21 integration checks passed, covering 130 dealers, Common/group/dealer publication, overrides/removal, stale revisions, authorization, enquiries, media, accounts and logout.
- Existing News suite: 12 checks passed, including real multipart uploads, API restart persistence, scope separation, approval and dealer deletion.
- `AUDIT-RESULTS.json` records the additional API requests and browser check groups, with an explicit success flag. Desktop/mobile screenshots are in `docs/audit/`.
- Browser checks use real login, real multipart uploads and MySQL-backed draft/publication requests. They cover three-image create/view/edit, status, deletion, failed-save rollback/retry, Common and dealer scopes, and public content refresh.
- Security review retained parameterized SQL, authentication/scope checks, revision conflict checks, upload type/size/path protections. Existing permission and upload tests passed.

## API coverage and limits

See `AUDIT-RESULTS.json`, `TEST-RESULTS.json` and `NEWS-FIX-VERIFICATION.json` for exact request/status evidence. Tested families include auth login/enter/logout, health, site/products/product detail, admin registry/dashboard/Common resolver/dealers/groups/users/employees/drafts/history/enquiries/media/activity, draft save/preview/publish/delete, dealer/group/account operations, enquiry create/status and multipart uploads. Negative checks exercise 400/401/403/404/409 boundaries. No production credentials or data are in the reports.

External live domains, VPS reverse proxy/TLS, production database and production upload storage were not tested: no deployment or production access was supplied. The approved UI does not expose every retained API page; API approval/draft deletion were exercised directly. Real production data compatibility is supported by legacy fixtures and non-destructive code paths, not a claim of a production migration test.

`POST /api/admin/drafts`: valid real browser saves return 201, including three-image Common and Dealer banners. Invalid payloads still correctly return 400 with actionable feedback. The original reported 400 request/response was not supplied and could not be reproduced; its exact historical cause is unconfirmed. Do not interpret this audit as proving every possible 400 has been eliminated.

## Delivery and repeat checks

`MODIFIED-FILES.txt` lists changed approved files; additions include typed draft service, shared CMS/geography declarations, regression harness and this report. Source ZIP excludes `.env` secrets, dependencies, compiled output, old embedded ZIPs and temporary test files. Public assets and business feature source remain.

Run `npm ci`, `npm test`, `npm run check`, `npm run build`. Set `TEST_DATABASE_URL` to a disposable MySQL server with create/drop database permission for `npm run test:integration` and `npm run test:news`. The extra harness uses `node tests/audit-regression.cjs` with Playwright available through Node module resolution and Microsoft Edge installed. Do not point tests at a production database.
