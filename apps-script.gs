/**
 * Google Apps Script Backend for Expense Tracker
 * 
 * INSTALACE:
 * 1. Otevři Google tabulku
 * 2. Extensions → Apps Script
 * 3. Smaž vše a vlož tento kód
 * 4. Ulož (Ctrl+S)
 * 5. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Zkopíruj URL a vlož do aplikace
 */

// Main function - handles all requests
function doGet(e) {
  const params = e.parameter;
  
  if (params.action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Apps Script funguje!'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'Use POST for sync'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'sync') {
      return syncTransactions(data);
    }
    
    return createResponse(false, 'Unknown action');
    
  } catch (error) {
    Logger.log('Error: ' + error.message);
    return createResponse(false, error.message);
  }
}

// Sync transactions to Google Sheets
function syncTransactions(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const groupName = data.groupName || 'Výchozí skupina';
    
    // Get or create sheet for this group
    let sheet = ss.getSheetByName(groupName);
    if (!sheet) {
      sheet = ss.insertSheet(groupName);
      
      // Add header
      sheet.getRange(1, 1, 1, 11).setValues([[
        'Datum',
        'Typ',
        'Popis',
        'Částka',
        'Měna',
        'Částka CZK',
        'Kdo/Komu',
        'Rozdělení',
        'Kategorie',
        'Poznámka',
        'Uživatel'
      ]]);
      
      // Format header
      sheet.getRange(1, 1, 1, 11)
        .setBackground('#3b82f6')
        .setFontColor('white')
        .setFontWeight('bold');
      
      // Freeze header row
      sheet.setFrozenRows(1);
    }
    
    // Clear old data (keep header)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).clear();
    }
    
    // Prepare rows
    const rows = [];
    
    data.transactions.forEach(t => {
      const date = new Date(t.date);
      const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
      
      let whoPaid = '';
      let splitInfo = '';
      
      if (t.type === 'expense') {
        whoPaid = t.paidBy;
        if (t.splitMode === 'equal') {
          splitInfo = 'Rovnoměrně: ' + t.splitBetween.map(s => s.person).join(', ');
        } else {
          splitInfo = 'Vlastní: ' + t.splitBetween.map(s => s.person + '=' + s.amount).join(', ');
        }
      } else {
        whoPaid = t.recipient;
        splitInfo = '';
      }
      
      rows.push([
        dateStr,
        t.type === 'expense' ? 'Výdaj' : 'Příjem',
        t.description,
        t.amount,
        t.currency,
        Math.round(t.amountCZK),
        whoPaid,
        splitInfo,
        t.category || '',
        t.note || '',
        data.user ? data.user.email : ''
      ]);
    });
    
    // Write data
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 11).setValues(rows);
      
      // Auto-resize columns
      for (let i = 1; i <= 11; i++) {
        sheet.autoResizeColumn(i);
      }
    }
    
    return createResponse(true, 'Synchronizováno ' + rows.length + ' transakcí');
    
  } catch (error) {
    Logger.log('Sync error: ' + error.message);
    return createResponse(false, 'Chyba synchronizace: ' + error.message);
  }
}

// Helper function to create JSON response
function createResponse(success, message, data) {
  const response = {
    success: success,
    message: message
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POZNÁMKY K POUŽITÍ:
 * 
 * 1. Tento script běží v kontextu Google tabulky
 * 2. Každá skupina má vlastní list (sheet)
 * 3. Data se přepisují při každém syncu (ne append)
 * 4. Pro přidání členů skupiny - zatím jen v aplikaci
 * 
 * ROZŠÍŘENÍ (volitelné):
 * - Můžeš přidat funkce pro načítání dat zpět do aplikace
 * - Můžeš přidat email notifikace při novém výdaji
 * - Můžeš přidat kontrolu duplicit
 * - Můžeš přidat historii změn
 */
