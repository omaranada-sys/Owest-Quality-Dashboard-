# OWEST Quality Dashboard — GitHub + Google Sheets Live Sync

This package connects the OWEST Quality Dashboard to the Google Sheet shown in the supplied screenshot.

## Architecture

- **Google Sheet** = source of truth.
- **Google Apps Script Web App** = read-only API.
- **GitHub Pages** = hosts the dashboard.
- **sheet-sync.js** = polls the Apps Script endpoint every 5 seconds.
- The Apps Script endpoint supports **JSONP** so the GitHub-hosted dashboard can read the sheet without CORS errors.

## Files

- `index.html` — dashboard.
- `config.js` — Apps Script URL, spreadsheet ID, refresh interval.
- `sheet-sync.js` — live sync client.
- `Code.gs` — Apps Script API.
- `appsscript.json` — Apps Script manifest.
- `.gitignore`
- `LICENSE`

## Current sheet mapping

The Apps Script reads columns A:B from the `Quality Dashboard` tab and preserves the display format.

Expected KPI labels include:

- Units Released Readiness
- Client Notifications for Handover
- Units Successfully Handed Over
- Overall Quality Index
- Overall Readiness Rate
- Handover – Zero Snags
- Inspection Performance Trend
- Contractor Quality Performance Score
- Total Number of NCRs
- Total Opened NCRs
- NCR Closure Rate
- Areas of Concern

## Near-real-time refresh

The browser refreshes from the sheet every 5 seconds by default.

Change `REFRESH_MS` in `config.js` if required. Do not use an extremely short interval because Apps Script has execution quotas.

## Important security note

If the Apps Script deployment is set to **Anyone**, anybody who has the Web App URL can read the tabs listed in `ALLOWED_TABS`.

Keep `ALLOWED_TABS` restricted to dashboard-only / non-sensitive tabs.

For private company-only data, prefer hosting the dashboard from Apps Script itself or use an authenticated backend instead of public GitHub Pages.
