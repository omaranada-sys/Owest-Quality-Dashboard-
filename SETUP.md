# Full Setup Guide

## Part 1 — Prepare the Google Sheet

1. Open the Google Sheet.
2. Confirm the dashboard source tab is named exactly `Quality Dashboard`.
3. Keep KPI names in column A and values in column B.
4. The script uses display values, so cells such as `92%` and `91 / 100` are returned exactly as displayed.

If your tab name is different:
- Change `PRIMARY_TAB` in `config.js`.
- Change `ALLOWED_TABS` in `Code.gs`.

## Part 2 — Create the Apps Script API

1. In Google Sheets, click **Extensions → Apps Script**.
2. Delete the default code in `Code.gs`.
3. Copy the contents of this package's `Code.gs` into the Apps Script editor.
4. Open **Project Settings** and verify the time zone is appropriate.
5. Save the project.
6. Optional: run `testRead()` once from the Apps Script editor.
7. Google will ask you to authorize access to the spreadsheet. Approve it.

## Part 3 — Deploy Apps Script as a Web App

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear icon and choose **Web app**.
3. Description: `OWEST Quality Dashboard API`.
4. Execute as: **Me**.
5. Who has access:
   - Choose **Anyone** if the dashboard will be hosted on public/static GitHub Pages.
   - Only use this mode if the exposed dashboard data is safe to make readable to anyone who obtains the URL.
6. Click **Deploy**.
7. Copy the Web App URL ending in `/exec`.

Test it in a browser:

`YOUR_WEB_APP_URL?tab=Quality%20Dashboard`

You should see JSON with `"ok":true`.

## Part 4 — Configure the GitHub package

1. Open `config.js`.
2. Replace:
   `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`
   with the `/exec` URL from Apps Script.
3. Verify:
   - `SPREADSHEET_ID`
   - `PRIMARY_TAB`
   - `REFRESH_MS`

The spreadsheet ID already included from your screenshot is:

`1HG8x4Ac3vHsGt6D5OxcN8Af3qikOsXo0Grm2gu1rBcI`

## Part 5 — Create the GitHub repository

1. Sign in to GitHub.
2. Click **New repository**.
3. Name it, for example:
   `owest-quality-dashboard`
4. Choose Public or Private.
5. Create the repository.
6. Upload all files from this package, or use Git:

```bash
git init
git add .
git commit -m "Initial OWEST Quality Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/owest-quality-dashboard.git
git push -u origin main
```

## Part 6 — Enable GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
4. Save.
5. GitHub will show the dashboard URL when deployment finishes.

## Part 7 — Verify live sync

1. Open the GitHub Pages dashboard.
2. Look at the bottom-right live status pill.
3. It should show `Live • synced HH:MM:SS`.
4. Change a KPI value in the Google Sheet.
5. Wait about 5 seconds.
6. The dashboard should update without a page refresh.

## Multiple tabs

The API already supports tab selection.

To expose another tab:
1. Add the exact tab name to `ALLOWED_TABS` in `Code.gs`.
2. Add it to `EXTRA_TABS` in `config.js` if you plan to use it in the frontend.
3. Call:
   `WEB_APP_URL?tab=Exact%20Tab%20Name`

Do not expose tabs containing private or confidential data when using an anonymous/public Web App deployment.

## Updating Apps Script after code changes

Apps Script Web App deployments do not automatically publish every edit to an existing deployment.

After changing `Code.gs`:
1. Click **Deploy → Manage deployments**.
2. Select the active deployment.
3. Click **Edit**.
4. Under Version, choose **New version**.
5. Click **Deploy**.

The `/exec` URL should remain the same.

## Updating the dashboard

Push changes to the `main` branch. GitHub Pages normally republishes the site shortly afterward.

## If sync fails

Check these in order:

1. Open the Apps Script `/exec` URL directly.
2. Confirm it returns `"ok":true`.
3. Confirm the sheet tab name exactly matches `PRIMARY_TAB`.
4. Confirm the Apps Script deployment access is compatible with GitHub Pages.
5. Check the browser console for errors.
6. Check Apps Script **Executions** for failed requests.
7. If the API was edited, redeploy a new version.
