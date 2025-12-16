/**
 * Offline Sync Manager
 * Handles online/offline state and background synchronization
 */

let isOnlineGlobal = navigator.onLine;
let syncInProgress = false;

// === ONLINE/OFFLINE DETECTION ===

function updateOnlineStatus() {
    isOnlineGlobal = navigator.onLine;
    
    const statusIndicator = document.getElementById('onlineStatus');
    if (statusIndicator) {
        if (isOnlineGlobal) {
            statusIndicator.textContent = '🌐 Online';
            statusIndicator.className = 'online-status online';
        } else {
            statusIndicator.textContent = '⚠️ Offline';
            statusIndicator.className = 'online-status offline';
        }
    }
    
    // Update unsynced count
    updateUnsyncedCount();
    
    console.log(isOnlineGlobal ? '🌐 Online' : '⚠️ Offline');
    
    return isOnlineGlobal;
}

async function updateUnsyncedCount() {
    try {
        const unsynced = await getUnsyncedTransactions();
        
        const badge = document.getElementById('unsyncedBadge');
        if (badge) {
            if (unsynced.length > 0) {
                badge.textContent = `${unsynced.length} neodeslané`;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        const statusIndicator = document.getElementById('onlineStatus');
        if (statusIndicator && !isOnlineGlobal && unsynced.length > 0) {
            statusIndicator.textContent = `⚠️ Offline (${unsynced.length} neodeslané)`;
        }
        
    } catch (error) {
        console.error('Update unsynced count error:', error);
    }
}

// === SYNC FUNCTIONS ===

async function syncAllData() {
    if (syncInProgress) {
        console.log('⏳ Sync already in progress');
        return;
    }
    
    if (!isOnlineGlobal) {
        console.log('⚠️ Offline - cannot sync');
        showToast('⚠️ Offline režim', 'warning');
        return;
    }
    
    syncInProgress = true;
    
    try {
        showToast('🔄 Synchronizuji...', 'info');
        
        // 1. Sync unsynced transactions to backend
        await syncUnsyncedTransactions();
        
        // 2. Fetch latest data from backend
        await syncFromBackend();
        
        showToast('✅ Synchronizováno', 'success');
        
    } catch (error) {
        console.error('Sync error:', error);
        showToast('❌ Chyba synchronizace', 'error');
    } finally {
        syncInProgress = false;
        await updateUnsyncedCount();
    }
}

async function syncUnsyncedTransactions() {
    const unsynced = await getUnsyncedTransactions();
    
    if (unsynced.length === 0) {
        console.log('✅ No unsynced transactions');
        return;
    }
    
    console.log(`📤 Syncing ${unsynced.length} transactions...`);
    
    const user = getCurrentUser();
    if (!user) return;
    
    for (const txn of unsynced) {
        try {
            // Remove local-only fields
            const cleanTxn = { ...txn };
            delete cleanTxn.synced;
            delete cleanTxn.added_locally;
            delete cleanTxn.local_timestamp;
            
            // Send to backend
            await apiCall('add_transaction', {
                transaction: cleanTxn,
                user_email: user.email
            });
            
            // Mark as synced
            await markTransactionSynced(txn.transaction_id);
            
            console.log('✅ Synced:', txn.description);
            
        } catch (error) {
            console.error('Failed to sync transaction:', txn.description, error);
            // Continue with other transactions
        }
    }
    
    console.log('✅ All transactions synced');
}

async function syncFromBackend() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        // Fetch groups
        const groupsData = await apiCall('get_groups', {
            user_email: user.email
        });
        
        state.groups = groupsData.groups;
        await saveGroupsLocal(groupsData.groups);
        
        // Fetch transactions for current group
        if (state.currentGroupId) {
            const txnData = await apiCall('get_transactions', {
                group_id: state.currentGroupId
            });
            
            const currentGroup = getCurrentGroup();
            if (currentGroup) {
                currentGroup.transactions = txnData.transactions;
                await saveTransactionsLocal(state.currentGroupId, txnData.transactions);
            }
        }
        
        // Fetch invitations
        const invData = await apiCall('get_invitations', {
            user_email: user.email
        });
        
        state.invitations = invData.invitations;
        await saveInvitationsLocal(invData.invitations);
        
        console.log('✅ Data synced from backend');
        
    } catch (error) {
        console.error('Sync from backend error:', error);
        throw error;
    }
}

async function loadFromLocal() {
    try {
        // Load groups
        const groups = await getGroupsLocal();
        if (groups && groups.length > 0) {
            state.groups = groups;
            console.log('✅ Loaded groups from local:', groups.length);
        }
        
        // Load transactions for current group
        if (state.currentGroupId) {
            const transactions = await getTransactionsLocal(state.currentGroupId);
            const currentGroup = getCurrentGroup();
            if (currentGroup) {
                currentGroup.transactions = transactions;
                console.log('✅ Loaded transactions from local:', transactions.length);
            }
        }
        
        // Load invitations
        const invitations = await getInvitationsLocal();
        if (invitations) {
            state.invitations = invitations;
            console.log('✅ Loaded invitations from local:', invitations.length);
        }
        
        return true;
        
    } catch (error) {
        console.error('Load from local error:', error);
        return false;
    }
}

// === OFFLINE TRANSACTION HANDLING ===

async function addTransactionOffline(transaction, user_email) {
    // Generate temporary ID
    if (!transaction.transaction_id) {
        transaction.transaction_id = 'local_' + generateId();
    }
    
    // Add metadata
    transaction.created_by = user_email;
    transaction.created_at = new Date().toISOString();
    
    // Save locally
    await addTransactionLocal(transaction);
    
    // Add to current group
    const currentGroup = getCurrentGroup();
    if (currentGroup) {
        if (!currentGroup.transactions) {
            currentGroup.transactions = [];
        }
        currentGroup.transactions.push(transaction);
    }
    
    await updateUnsyncedCount();
    
    console.log('✅ Transaction added offline');
    
    return transaction;
}

// === EVENT LISTENERS ===

window.addEventListener('online', async () => {
    console.log('🌐 Back online!');
    updateOnlineStatus();
    
    // Wait a bit for connection to stabilize
    setTimeout(async () => {
        await syncAllData();
    }, 1000);
});

window.addEventListener('offline', () => {
    console.log('⚠️ Gone offline');
    updateOnlineStatus();
});

// Check status on load
updateOnlineStatus();

// Periodic sync (every 30 seconds if online)
setInterval(async () => {
    if (isOnlineGlobal && !syncInProgress) {
        const unsynced = await getUnsyncedTransactions();
        if (unsynced.length > 0) {
            console.log('🔄 Auto-syncing unsynced transactions...');
            await syncAllData();
        }
    }
}, 30000);

console.log('✅ Offline sync module loaded');
