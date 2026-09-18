const SPREADSHEET_ID = '1mtv8441lFAuhicmphz5QPPT8BOZS2qiC36TGqVDKv9M';

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  if (data.action !== 'request' || !data.email || !data.keyName || !data.requestId) return json({ ok:false });
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Requests');
  sheet.appendRow([new Date(), data.requestId, data.email, data.keyName, 'Check payment', 'Pending', '', '']);
  return json({ ok:true });
}

function doGet(e) {
  const requestId = e.parameter.requestId || '';
  const email = e.parameter.email || '';
  const rows = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Requests').getDataRange().getValues();
  const match = rows.slice(1).find(row => row[1] === requestId && row[2] === email);
  return json(match ? { ok:true, status:match[5], accessKey:match[6] || '' } : { ok:false });
}

function json(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
