/**
 * EXPENSE TRACKER V4 - FAMILY ORGANIZATION
 * Apps Script Backend
 * 
 * ORGANIZACE: Všichni přihlášení jsou členové "FAMILY"
 * SKUPINY: Každý vytváří vlastní + může být pozván do dalších
 * POZVÁNKY: Email invitation system
 * SPRÁVA: Owner může mazat skupiny a odebírat členy
 */

const ORGANIZATION_NAME = 'FAMILY';

// === HELPER FUNCTIONS ===

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  // Auto-create sheet if doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(name);
    
    // Add headers based on sheet name
    if (name === 'organization_members') {
      sheet.appendRow(['user_email', 'user_name', 'picture', 'joined_at']);
    } else if (name === 'groups') {
      sheet.appendRow(['group_id', 'name', 'owner_email', 'created_at']);
    } else if (name === 'group_members') {
      sheet.appendRow(['group_id', 'member_email', 'member_name', 'role', 'invited_by', 'joined_at']);
    } else if (name === 'transactions') {
      sheet.appendRow(['transaction_id', 'group_id', 'type', 'description', 'amount', 'currency', 'amount_czk', 'paid_by', 'split_between', 'category', 'note', 'date', 'created_by', 'created_at']);
    } else if (name === 'invitations') {
      sheet.appendRow(['invitation_id', 'group_id', 'group_name', 'invited_email', 'invited_by', 'invited_by_name', 'status', 'created_at']);
    }
    
    // Format header
    sheet.getRange(1, 1, 1, sheet.getLastColumn())
      .setBackground('#3b82f6')
      .setFontColor('white')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
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
  if (sheet.getLastRow() <= 1) return [];
  
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

function deleteRow(sheet, rowNumber) {
  if (rowNumber > 1) {
    sheet.deleteRow(rowNumber);
  }
}

// === MAIN HANDLERS ===

function doGet(e) {
  const params = e.parameter;
  const action = params.action;
  
  try {
    let data = {};
    if (params.data) {
      data = JSON.parse(params.data);
    }
    
    Logger.log('Action: ' + action);
    
    switch(action) {
      case 'test':
        return createResponse(true, 'Expense Tracker API v4.0 - FAMILY');
      case 'login':
        return handleLogin(data);
      case 'create_group':
        return handleCreateGroup(data);
      case 'delete_group':
        return handleDeleteGroup(data);
      case 'invite_member':
        return handleInviteMember(data);
      case 'remove_member':
        return handleRemoveMember(data);
      case 'get_groups':
        return handleGetGroups(data);
      case 'get_invitations':
        return handleGetInvitations(data);
      case 'accept_invitation':
        return handleAcceptInvitation(data);
      case 'decline_invitation':
        return handleDeclineInvitation(data);
      case 'add_transaction':
        return handleAddTransaction(data);
      case 'get_transactions':
        return handleGetTransactions(data);
      case 'delete_transaction':
        return handleDeleteTransaction(data);
      case 'get_organization':
        return handleGetOrganization(data);
      default:
        return createResponse(true, 'Expense Tracker API v4.0 - FAMILY', {
          organization: ORGANIZATION_NAME
        });
    }
    
  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    Logger.log('STACK: ' + error.stack);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

function doPost(e) {
  return doGet(e);
}

// === ORGANIZATION ===

function handleGetOrganization(data) {
  try {
    const orgSheet = getSheet('organization_members');
    const members = getAllRows(orgSheet);
    
    return createResponse(true, 'Organization loaded', {
      name: ORGANIZATION_NAME,
      members: members.map(m => ({
        email: m.user_email,
        name: m.user_name,
        picture: m.picture,
        joined_at: m.joined_at
      }))
    });
    
  } catch (error) {
    Logger.log('Get organization error: ' + error.message);
    return createResponse(false, 'Failed to get organization: ' + error.message);
  }
}

// === AUTH ===

function handleLogin(data) {
  try {
    const { user } = data;
    
    if (!user || !user.email) {
      return createResponse(false, 'Invalid user data');
    }
    
    const orgSheet = getSheet('organization_members');
    const existingRow = findRowByColumn(orgSheet, 1, user.email);
    
    if (existingRow === -1) {
      // New user - add to organization automatically
      orgSheet.appendRow([
        user.email,
        user.name || '',
        user.picture || '',
        getCurrentTimestamp()
      ]);
      
      Logger.log('New user added to FAMILY: ' + user.email);
    } else {
      // Update existing user
      orgSheet.getRange(existingRow, 2).setValue(user.name || '');
      orgSheet.getRange(existingRow, 3).setValue(user.picture || '');
    }
    
    return createResponse(true, 'Welcome to ' + ORGANIZATION_NAME, { 
      user: user,
      organization: ORGANIZATION_NAME
    });
    
  } catch (error) {
    Logger.log('Login error: ' + error.message);
    return createResponse(false, 'Login failed: ' + error.message);
  }
}

// === GROUPS ===

function handleCreateGroup(data) {
  try {
    const { name, owner_email, owner_name } = data;
    
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
      owner_name || owner_email,
      'owner',
      owner_email,
      getCurrentTimestamp()
    ]);
    
    Logger.log('Group created: ' + name + ' by ' + owner_email);
    
    return createResponse(true, 'Group created', {
      group_id: groupId,
      name: name
    });
    
  } catch (error) {
    Logger.log('Create group error: ' + error.message);
    return createResponse(false, 'Failed to create group: ' + error.message);
  }
}

function handleDeleteGroup(data) {
  try {
    const { group_id, user_email } = data;
    
    if (!group_id || !user_email) {
      return createResponse(false, 'Missing group_id or user_email');
    }
    
    const groupsSheet = getSheet('groups');
    const membersSheet = getSheet('group_members');
    const transactionsSheet = getSheet('transactions');
    
    // Check if user is owner
    const groups = getAllRows(groupsSheet);
    const group = groups.find(g => g.group_id === group_id);
    
    if (!group) {
      return createResponse(false, 'Group not found');
    }
    
    if (group.owner_email !== user_email) {
      return createResponse(false, 'Only owner can delete group');
    }
    
    // Delete group
    const groupRow = findRowByColumn(groupsSheet, 1, group_id);
    if (groupRow > 1) {
      deleteRow(groupsSheet, groupRow);
    }
    
    // Delete all members
    const members = getAllRows(membersSheet);
    for (let i = members.length - 1; i >= 0; i--) {
      if (members[i].group_id === group_id) {
        const rowNum = i + 2; // +2 because header + 0-indexed
        deleteRow(membersSheet, rowNum);
      }
    }
    
    // Delete all transactions
    const transactions = getAllRows(transactionsSheet);
    for (let i = transactions.length - 1; i >= 0; i--) {
      if (transactions[i].group_id === group_id) {
        const rowNum = i + 2;
        deleteRow(transactionsSheet, rowNum);
      }
    }
    
    Logger.log('Group deleted: ' + group_id);
    
    return createResponse(true, 'Group deleted');
    
  } catch (error) {
    Logger.log('Delete group error: ' + error.message);
    return createResponse(false, 'Failed to delete group: ' + error.message);
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
          role: m.role,
          invited_by: m.invited_by
        }));
      
      return {
        group_id: group.group_id,
        name: group.name,
        owner_email: group.owner_email,
        is_owner: group.owner_email === user_email,
        my_role: membership.role,
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

// === INVITATIONS ===

function handleInviteMember(data) {
  try {
    const { group_id, invited_email, invited_by, invited_by_name } = data;
    
    if (!group_id || !invited_email || !invited_by) {
      return createResponse(false, 'Missing required fields');
    }
    
    // Check if already member
    const membersSheet = getSheet('group_members');
    const members = getAllRows(membersSheet);
    const alreadyMember = members.some(m => 
      m.group_id === group_id && m.member_email === invited_email
    );
    
    if (alreadyMember) {
      return createResponse(false, 'User is already a member');
    }
    
    // Check if already invited
    const invitationsSheet = getSheet('invitations');
    const invitations = getAllRows(invitationsSheet);
    const alreadyInvited = invitations.some(inv => 
      inv.group_id === group_id && 
      inv.invited_email === invited_email && 
      inv.status === 'pending'
    );
    
    if (alreadyInvited) {
      return createResponse(false, 'User already has pending invitation');
    }
    
    // Get group name
    const groupsSheet = getSheet('groups');
    const groups = getAllRows(groupsSheet);
    const group = groups.find(g => g.group_id === group_id);
    
    if (!group) {
      return createResponse(false, 'Group not found');
    }
    
    // Create invitation
    const invitationId = generateId();
    invitationsSheet.appendRow([
      invitationId,
      group_id,
      group.name,
      invited_email,
      invited_by,
      invited_by_name || invited_by,
      'pending',
      getCurrentTimestamp()
    ]);
    
    Logger.log('Invitation sent: ' + invited_email + ' to ' + group.name);
    
    return createResponse(true, 'Invitation sent', {
      invitation_id: invitationId
    });
    
  } catch (error) {
    Logger.log('Invite member error: ' + error.message);
    return createResponse(false, 'Failed to invite member: ' + error.message);
  }
}

function handleRemoveMember(data) {
  try {
    const { group_id, member_email, user_email } = data;
    
    if (!group_id || !member_email || !user_email) {
      return createResponse(false, 'Missing required fields');
    }
    
    // Check if user is owner
    const groupsSheet = getSheet('groups');
    const groups = getAllRows(groupsSheet);
    const group = groups.find(g => g.group_id === group_id);
    
    if (!group || group.owner_email !== user_email) {
      return createResponse(false, 'Only owner can remove members');
    }
    
    if (member_email === user_email) {
      return createResponse(false, 'Owner cannot remove themselves');
    }
    
    // Remove member
    const membersSheet = getSheet('group_members');
    const members = getAllRows(membersSheet);
    
    for (let i = 0; i < members.length; i++) {
      if (members[i].group_id === group_id && members[i].member_email === member_email) {
        deleteRow(membersSheet, i + 2);
        break;
      }
    }
    
    Logger.log('Member removed: ' + member_email + ' from ' + group.name);
    
    return createResponse(true, 'Member removed');
    
  } catch (error) {
    Logger.log('Remove member error: ' + error.message);
    return createResponse(false, 'Failed to remove member: ' + error.message);
  }
}

function handleGetInvitations(data) {
  try {
    const { user_email } = data;
    
    if (!user_email) {
      return createResponse(false, 'Missing user_email');
    }
    
    const invitationsSheet = getSheet('invitations');
    const invitations = getAllRows(invitationsSheet);
    
    const userInvitations = invitations
      .filter(inv => inv.invited_email === user_email && inv.status === 'pending')
      .map(inv => ({
        invitation_id: inv.invitation_id,
        group_id: inv.group_id,
        group_name: inv.group_name,
        invited_by: inv.invited_by,
        invited_by_name: inv.invited_by_name,
        created_at: inv.created_at
      }));
    
    return createResponse(true, 'Invitations loaded', {
      invitations: userInvitations
    });
    
  } catch (error) {
    Logger.log('Get invitations error: ' + error.message);
    return createResponse(false, 'Failed to get invitations: ' + error.message);
  }
}

function handleAcceptInvitation(data) {
  try {
    const { invitation_id, user_email, user_name } = data;
    
    if (!invitation_id || !user_email) {
      return createResponse(false, 'Missing required fields');
    }
    
    const invitationsSheet = getSheet('invitations');
    const invitations = getAllRows(invitationsSheet);
    
    let invitation = null;
    let invitationRow = -1;
    
    for (let i = 0; i < invitations.length; i++) {
      if (invitations[i].invitation_id === invitation_id) {
        invitation = invitations[i];
        invitationRow = i + 2;
        break;
      }
    }
    
    if (!invitation || invitation.invited_email !== user_email) {
      return createResponse(false, 'Invitation not found');
    }
    
    // Check if already accepted
    if (invitation.status === 'accepted') {
      return createResponse(false, 'Invitation already accepted');
    }
    
    // Check if already member (prevent duplicates)
    const membersSheet = getSheet('group_members');
    const members = getAllRows(membersSheet);
    const alreadyMember = members.some(m => 
      m.group_id === invitation.group_id && m.member_email === user_email
    );
    
    if (alreadyMember) {
      // Update invitation status but don't add again
      invitationsSheet.getRange(invitationRow, 7).setValue('accepted');
      return createResponse(true, 'Already a member', {
        group_id: invitation.group_id,
        group_name: invitation.group_name
      });
    }
    
    // Add to group members
    membersSheet.appendRow([
      invitation.group_id,
      user_email,
      user_name || user_email,
      'member',
      invitation.invited_by,
      getCurrentTimestamp()
    ]);
    
    // Update invitation status
    invitationsSheet.getRange(invitationRow, 7).setValue('accepted');
    
    Logger.log('Invitation accepted: ' + user_email + ' joined ' + invitation.group_name);
    
    return createResponse(true, 'Invitation accepted', {
      group_id: invitation.group_id,
      group_name: invitation.group_name
    });
    
  } catch (error) {
    Logger.log('Accept invitation error: ' + error.message);
    return createResponse(false, 'Failed to accept invitation: ' + error.message);
  }
}

function handleDeclineInvitation(data) {
  try {
    const { invitation_id, user_email } = data;
    
    if (!invitation_id || !user_email) {
      return createResponse(false, 'Missing required fields');
    }
    
    const invitationsSheet = getSheet('invitations');
    const invitations = getAllRows(invitationsSheet);
    
    for (let i = 0; i < invitations.length; i++) {
      if (invitations[i].invitation_id === invitation_id && 
          invitations[i].invited_email === user_email) {
        invitationsSheet.getRange(i + 2, 7).setValue('declined');
        Logger.log('Invitation declined: ' + user_email);
        return createResponse(true, 'Invitation declined');
      }
    }
    
    return createResponse(false, 'Invitation not found');
    
  } catch (error) {
    Logger.log('Decline invitation error: ' + error.message);
    return createResponse(false, 'Failed to decline invitation: ' + error.message);
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

function handleDeleteTransaction(data) {
  try {
    const { transaction_id, user_email } = data;
    
    if (!transaction_id || !user_email) {
      return createResponse(false, 'Missing required fields');
    }
    
    const transactionsSheet = getSheet('transactions');
    const transactions = getAllRows(transactionsSheet);
    
    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i].transaction_id === transaction_id) {
        // Check if user created this transaction
        if (transactions[i].created_by !== user_email) {
          return createResponse(false, 'Only creator can delete transaction');
        }
        
        deleteRow(transactionsSheet, i + 2);
        Logger.log('Transaction deleted: ' + transaction_id);
        return createResponse(true, 'Transaction deleted');
      }
    }
    
    return createResponse(false, 'Transaction not found');
    
  } catch (error) {
    Logger.log('Delete transaction error: ' + error.message);
    return createResponse(false, 'Failed to delete transaction: ' + error.message);
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
