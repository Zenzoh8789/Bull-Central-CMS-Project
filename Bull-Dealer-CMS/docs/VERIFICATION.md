# Verification record

- MySQL: actual local MySQL 8.4.11, not an in-memory mock.
- Unit checks: 8 passed. schema coverage, URL safety, contact/layout coverage, inheritance, password verification, role boundaries, host normalization, catalogue integrity, local/R2 configuration.
- Integration: 20 checks passed. See TEST-RESULTS.json for the latest executed checks and timestamp. 130 dealers live only in a disposable test database.
- Browser: original angled navigation and hero visually checked; three-image product dropdown verified; internal product route verified; Admin login/dashboard/20-section editor rendered; a banner draft saved and unchanged banner content published through Single-dealer UI to local Tara. No external website was modified.
- Media assets: every local image URL in the Tara content seed resolved to a file in apps/web/public.
- Migration: run twice successfully against the existing CMS database without changing content.
- Not executed: Docker containers (Docker unavailable), live R2 upload (credentials absent), 130 actual production domains (roster/DNS unavailable).
- Additional handwritten requirements: unavailable; no claim that unseen requirements have been implemented.

- Responsive checks: 390-pixel mobile products menu and contact form have no horizontal overflow. All six original contact fields plus equipment/consent are present.
- Working API was restarted after final changes; published content remains in MySQL.
- Temporary browser-test administrator was deactivated, password randomized and sessions revoked.

- UI refresh (2026-09-20): see UI-UPDATE-20260920.md for the reference-based Admin/dealer changes and browser checks.
