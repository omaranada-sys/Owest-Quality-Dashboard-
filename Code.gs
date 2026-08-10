/**
 * OWEST Quality Dashboard - Google Apps Script API
 *
 * Deploy as a Web App and use the resulting /exec URL in config.js.
 *
 * SECURITY NOTE:
 * If you deploy with "Who has access: Anyone", anyone with the Web App URL
 * can read the tabs exposed below. Only expose non-sensitive dashboard data.
 */

const SPREADSHEET_ID = '1HG8x4Ac3vHsGt6D5OxcN8Af3qikOsXo0Grm2gu1rBcI';

// Only these tabs can be read through the public endpoint.
const ALLOWED_TABS = [
  'Quality Dashboard'
];

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const requestedTab = String(params.tab || 'Quality Dashboard').trim();
    const callback = sanitizeCallback_(params.callback || '');

    if (!ALLOWED_TABS.includes(requestedTab)) {
      return output_({ ok: false, error: 'Tab not allowed' }, callback);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(requestedTab);
    if (!sheet) {
      return output_({ ok: false, error: 'Sheet tab not found: ' + requestedTab }, callback);
    }

    // For the KPI table in the screenshot, A:B contains KPI + Example.
    // getDisplayValues() preserves "%" and "91 / 100" exactly as shown in the sheet.
    const lastRow = Math.max(sheet.getLastRow(), 1);
    const rows = sheet.getRange(1, 1, lastRow, 2).getDisplayValues();

    return output_({
      ok: true,
      spreadsheetId: SPREADSHEET_ID,
      tab: requestedTab,
      rows: rows,
      updatedAt: new Date().toISOString()
    }, callback);

  } catch (err) {
    return output_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    }, sanitizeCallback_((e && e.parameter && e.parameter.callback) || ''));
  }
}

function output_(payload, callback) {
  const text = JSON.stringify(payload);

  // JSONP mode for GitHub Pages / static sites. This avoids browser CORS issues.
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + text + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // Plain JSON is useful for direct testing in the browser.
  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeCallback_(name) {
  const value = String(name || '');
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(value) ? value : '';
}

/**
 * Optional helper for testing inside Apps Script.
 */
function testRead() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Quality Dashboard');
  Logger.log(sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 2).getDisplayValues());
}
