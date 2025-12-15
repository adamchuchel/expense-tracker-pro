/**
 * EXPENSE TRACKER - APPS SCRIPT BACKEND
 * Verze 3.0 - Kompletní přepracování
 * 
 * INSTALACE:
 * 1. Vytvoř Google Sheet s listy: users, groups, group_members, transactions
 * 2. Extensions → Apps Script
 * 3. Vlož tento kód
 * 4. Ulož (Ctrl+S)
 * 5. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Zkopíruj Web App URL
 */

// === HELPER FUNCTIONS ===

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function generateId() {
  return Utilities.getUuid();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function findRowByColumn(sheet, columnIndex, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][columnIndex - 1] === value) {
      return i + 1;
    }
  }
  return -1;
}

function getAllRows(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = data[i][index];
    });
    rows.push(row);
  }
  
  return rows;
}

// === MAIN HANDLERS ===

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Expense Tracker API v3.0',
    endpoints: [
      'POST /auth/login',
      'POST /groups/create',
      'POST /groups/invite',
      'GET /groups/my',
      'POST /transactions/add',
      'GET /transactions/list'
    ]
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    
    let data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    Logger.log('Action: ' + action);
    Logger.log('Data: ' + JSON.stringify(data));
    
    switch(action) {
      case 'login':
        return handleLogin(data);
      case 'create_group':
        return handleCreateGroup(data);
      case 'invite_member':
        return handleInviteMember(data);
      case 'get_groups':
        return handleGetGroups(data);
      case 'add_transaction':
        return handleAddTransaction(data);
      case 'get_transactions':
        return handleGetTransactions(data);
      case 'sync_all':
        return handleSyncAll(data);
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
    
  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    Logger.log('STACK: ' + error.stack);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

// === AUTH ===

function handleLogin(data) {
  try {
    const { user } = data;
    
    if (!user || !user.email) {
      return createResponse(false, 'Invalid user data');
    }
    
    const usersSheet = getSheet('users');
    const existingRow = findRowByColumn(usersSheet, 2, user.email);
    
    if (existingRow === -1) {
      // New user - add to database
      usersSheet.appendRow([
        user.id || generateId(),
        user.email,
        user.name || '',
        user.picture || '',
        getCurrentTimestamp()
      ]);
    } else {
      // Update existing user
      usersSheet.getRange(existingRow, 3).setValue(user.name || '');
      usersSheet.getRange(existingRow, 4).setValue(user.picture || '');
    }
    
    return createResponse(true, 'Login successful', { user: user });
    
  } catch (error) {
    Logger.log('Login error: ' + error.message);
    return createResponse(false, 'Login failed: ' + error.message);
  }
}

// === GROUPS ===

function handleCreateGroup(data) {
  try {
    const { name, owner_email } = data;
    
    if (!name || !owner_email) {
      return createResponse(false, 'Missing group name or owner email');
    }
    
    const groupId = generateId();
    const groupsSheet = getSheet('groups');
    const membersSheet = getSheet('group_members');
    
    // Create group
    groupsSheet.appendRow([
      groupId,
      name,
      owner_email,
      getCurrentTimestamp()
    ]);
    
    // Add owner as member
    membersSheet.appendRow([
      groupId,
      owner_email,
      data.owner_name || owner_email,
      'owner',
      getCurrentTimestamp()
    ]);
    
    return createResponse(true, 'Group created', {
      group_id: groupId,
      name: name
    });
    
  } catch (error) {
    Logger.log('Create group error: ' + error.message);
    return createResponse(false, 'Failed to create group: ' + error.message);
  }
}

function handleInviteMember(data) {
  try {
    const { group_id, member_email, member_name } = data;
    
    if (!group_id || !member_email) {
      return createResponse(false, 'Missing group_id or member_email');
    }
    
    const membersSheet = getSheet('group_members');
    
    // Check if already member
    const members = getAllRows(membersSheet);
    const exists = members.some(m => 
      m.group_id === group_id && m.member_email === member_email
    );
    
    if (exists) {
      return createResponse(false, 'Member already in group');
    }
    
    // Add member
    membersSheet.appendRow([
      group_id,
      member_email,
      member_name || member_email,
      'member',
      getCurrentTimestamp()
    ]);
    
    return createResponse(true, 'Member invited');
    
  } catch (error) {
    Logger.log('Invite member error: ' + error.message);
    return createResponse(false, 'Failed to invite member: ' + error.message);
  }
}

function handleGetGroups(data) {
  try {
    const { user_email } = data;
    
    if (!user_email) {
      return createResponse(false, 'Missing user_email');
    }
    
    const groupsSheet = getSheet('groups');
    const membersSheet = getSheet('group_members');
    
    const allGroups = getAllRows(groupsSheet);
    const allMembers = getAllRows(membersSheet);
    
    // Find groups where user is member
    const userMemberships = allMembers.filter(m => m.member_email === user_email);
    
    const userGroups = userMemberships.map(membership => {
      const group = allGroups.find(g => g.group_id === membership.group_id);
      
      if (!group) return null;
      
      // Get all members of this group
      const groupMembers = allMembers
        .filter(m => m.group_id === membership.group_id)
        .map(m => ({
          email: m.member_email,
          name: m.member_name,
          role: m.role
        }));
      
      return {
        group_id: group.group_id,
        name: group.name,
        owner_email: group.owner_email,
        is_owner: group.owner_email === user_email,
        role: membership.role,
        members: groupMembers,
        created_at: group.created_at
      };
    }).filter(g => g !== null);
    
    return createResponse(true, 'Groups loaded', { groups: userGroups });
    
  } catch (error) {
    Logger.log('Get groups error: ' + error.message);
    return createResponse(false, 'Failed to get groups: ' + error.message);
  }
}

// === TRANSACTIONS ===

function handleAddTransaction(data) {
  try {
    const { transaction, user_email } = data;
    
    if (!transaction || !user_email) {
      return createResponse(false, 'Missing transaction data or user_email');
    }
    
    const transactionsSheet = getSheet('transactions');
    
    const transactionId = generateId();
    
    transactionsSheet.appendRow([
      transactionId,
      transaction.group_id,
      transaction.type,
      transaction.description,
      transaction.amount,
      transaction.currency,
      transaction.amount_czk,
      transaction.paid_by || transaction.recipient,
      JSON.stringify(transaction.split_between || []),
      transaction.category || '',
      transaction.note || '',
      transaction.date,
      user_email,
      getCurrentTimestamp()
    ]);
    
    return createResponse(true, 'Transaction added', {
      transaction_id: transactionId
    });
    
  } catch (error) {
    Logger.log('Add transaction error: ' + error.message);
    return createResponse(false, 'Failed to add transaction: ' + error.message);
  }
}

function handleGetTransactions(data) {
  try {
    const { group_id } = data;
    
    if (!group_id) {
      return createResponse(false, 'Missing group_id');
    }
    
    const transactionsSheet = getSheet('transactions');
    const allTransactions = getAllRows(transactionsSheet);
    
    const groupTransactions = allTransactions
      .filter(t => t.group_id === group_id)
      .map(t => ({
        transaction_id: t.transaction_id,
        type: t.type,
        description: t.description,
        amount: t.amount,
        currency: t.currency,
        amount_czk: t.amount_czk,
        paid_by: t.paid_by,
        split_between: t.split_between ? JSON.parse(t.split_between) : [],
        category: t.category,
        note: t.note,
        date: t.date,
        created_by: t.created_by,
        created_at: t.created_at
      }));
    
    return createResponse(true, 'Transactions loaded', {
      transactions: groupTransactions
    });
    
  } catch (error) {
    Logger.log('Get transactions error: ' + error.message);
    return createResponse(false, 'Failed to get transactions: ' + error.message);
  }
}

// === SYNC ALL (for batch operations) ===

function handleSyncAll(data) {
  try {
    const { groups, user_email } = data;
    
    if (!groups || !user_email) {
      return createResponse(false, 'Missing data');
    }
    
    let syncedCount = 0;
    
    groups.forEach(group => {
      if (group.transactions && group.transactions.length > 0) {
        group.transactions.forEach(transaction => {
          if (!transaction.synced) {
            handleAddTransaction({
              transaction: {
                group_id: group.group_id,
                ...transaction
              },
              user_email: user_email
            });
            syncedCount++;
          }
        });
      }
    });
    
    return createResponse(true, `Synchronized ${syncedCount} transactions`);
    
  } catch (error) {
    Logger.log('Sync all error: ' + error.message);
    return createResponse(false, 'Sync failed: ' + error.message);
  }
}

// === RESPONSE HELPER ===

function createResponse(success, message, data) {
  const response = {
    success: success,
    message: message,
    timestamp: getCurrentTimestamp()
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
