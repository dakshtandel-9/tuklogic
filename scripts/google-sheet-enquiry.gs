/**
 * TUKlogic Enquiry form: Google Apps Script bound to the "TUKlogic Enquiry form" sheet.
 * Paste into Extensions > Apps Script, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). The site's /api/contact route posts each
 * contact-page enquiry here, and it is appended as a new row under the headers:
 * Services | FULL NAME | MAIL | PHONE NUMBER | REPRESENTATIVE COMPANY | QUICK SNAPSHOT | SUBMITTED AT
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (!sheet.getRange('G1').getValue()) {
      sheet.getRange('G1').setValue('SUBMITTED AT').setFontWeight('bold');
    }
    var clean = function (v) {
      v = String(v || '');
      // Stop entries starting with = + - @ from being run as spreadsheet formulas.
      return /^[=+\-@]/.test(v) ? "'" + v : v;
    };
    sheet.appendRow([
      clean(data.service),
      clean(data.name),
      clean(data.email),
      clean(data.phone),
      clean(data.company),
      clean(data.summary),
      new Date(),
    ]);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
