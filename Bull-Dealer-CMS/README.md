# BULL Dealer CMS 1.0.2 — Windows local development

Requires Node.js 22+ and a running MySQL 8.x server. The UI, CSS and BULL assets are unchanged.

## 1. Configure MySQL

Use your existing database for an upgrade. Do not delete it or overwrite existing dealer data.
For a fresh install, open MySQL as an administrator (replace the executable path if needed):

```powershell
& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -u root -p
```

Run these SQL statements inside MySQL, substituting your own password:

```sql
CREATE DATABASE bull_dealers CHARACTER SET utf8mb4;
CREATE USER 'bull'@'localhost' IDENTIFIED BY 'chooseDatabasePassword';
GRANT ALL PRIVILEGES ON bull_dealers.* TO 'bull'@'localhost';
exit
```

From the extracted project root:

```powershell
Copy-Item .env.example .env
notepad .env
npm.cmd ci
npm.cmd run db:setup
```

Skip Copy-Item when upgrading an existing configured .env. Set DATABASE_URL to your actual host, port, database, user and password. URL-encode password characters such as @, #, : and /. The example uses port 3306; use 3307 only if your own server actually listens there. Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters). Do not use VITE_ variables for database credentials. Explicit PowerShell environment variables override .env; remove stale DATABASE_URL or DEMO_MODE values if needed.

`db:setup` builds the API, runs the repeatable migration and seeds the first administrator plus published Tara content. Existing administrators and publications are preserved. Updating ADMIN_PASSWORD in .env does not reset an existing account. For an existing account, set ADMIN_EMAIL to that account's email, choose ADMIN_USERNAME and ADMIN_PASSWORD, then run `npm.cmd run admin:credentials` explicitly.

## 2. Start all apps

```powershell
npm.cmd run dev
```

Or use three PowerShell terminals, each in the extracted project root:

```powershell
# Terminal 1: API, port 3000
npm.cmd run dev -w apps/api
```
```powershell
# Terminal 2: admin, port 5174
npm.cmd run dev -w apps/admin
```
```powershell
# Terminal 3: dealer website, port 5173
npm.cmd run dev -w apps/web
```

Open http://localhost:5174/admin/login and sign in with your configured username/password.
Open http://localhost:5173/ for the dealer site.
Health: http://localhost:3000/api/health.

Both Vite apps proxy /api to 127.0.0.1:3000. Requests remain same-origin, so local CORS changes are unnecessary. Keep PORT=3000 with these proxy settings. Vite refuses occupied ports rather than silently choosing another port. Stop old development servers before starting these apps. The API loads the root .env even when started from its workspace. Database/schema failures stop API startup with an actionable error; demo mode is not a substitute for CMS setup.

Localhost, 127.0.0.1 and [::1] resolve to the seeded bulltaraautohub.com dealer in development. Unknown domains still return 404; inactive dealers remain unavailable. The seeded dealer must remain active and retain its domain mapping. No catch-all tenant fallback was introduced.

## 3. Check the installation

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:5173/api/site
npm.cmd run check
npm.cmd test
npm.cmd run build
```

The older docs/VERIFICATION.md and docs/TEST-RESULTS.json describe the previous package's machine. See docs/FIXES-20260922.md for this version's actual checks.

## Docker deployment

Configure the Docker MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD and ADMIN_* entries in .env, then run `docker compose up --build -d`. Open http://localhost:8080/ and /admin/. The API now runs repeatable migrations before seeding, including on existing volumes. Never delete volumes to apply schema changes. Docker execution is separate from the tested Windows development workflow.

## Optional regression checks

With all three apps running and ADMIN_PASSWORD set to the current account password:

```powershell
npm.cmd run test:local
```

For the 130-dealer integration suite, use a MySQL test account allowed to create/drop disposable databases:

```powershell
$env:TEST_DATABASE_URL='mysql://TEST_USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/mysql'
npm.cmd run test:integration
```

The suite creates a uniquely named bull_cms_test_* database and removes only that database when finished. It uses port 3002 and does not reset the configured CMS database.

## Requested local login (v1.0.2)

The supplied .env.example sets username `admin` and password `admin123`. Fresh `db:setup` uses these values after copying the example to .env. Existing accounts are preserved. To change an existing account, keep DATABASE_URL and ADMIN_EMAIL set to the real database/account and run:

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="admin123"
npm.cmd run admin:credentials
```
