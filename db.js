/**
 * IndexedDB Manager for Offline Storage
 * Stores groups, transactions, members, invitations locally
 */

const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 1;

let db = null;

// Initialize Database
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('❌ IndexedDB error:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('✅ IndexedDB initialized');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores (tables)
            if (!db.objectStoreNames.contains('groups')) {
                const groupsStore = db.createObjectStore('groups', { keyPath: 'group_id' });
                groupsStore.createIndex('owner_email', 'owner_email', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('transactions')) {
                const transactionsStore = db.createObjectStore('transactions', { keyPath: 'transaction_id' });
                transactionsStore.createIndex('group_id', 'group_id', { unique: false });
                transactionsStore.createIndex('synced', 'synced', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('invitations')) {
                const invitationsStore = db.createObjectStore('invitations', { keyPath: 'invitation_id' });
                invitationsStore.createIndex('invited_email', 'invited_email', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('sync_queue')) {
                db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
            }
            
            console.log('✅ IndexedDB tables created');
        };
    });
}

// === GROUPS ===

async function saveGroupsLocal(groups) {
    if (!db) await initDB();
    
    const transaction = db.transaction(['groups'], 'readwrite');
    const store = transaction.objectStore('groups');
    
    // Clear old data
    await store.clear();
    
    // Add new data
    for (const group of groups) {
        await store.put(group);
    }
    
    console.log('✅ Groups saved locally:', groups.length);
}

async function getGroupsLocal() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['groups'], 'readonly');
        const store = transaction.objectStore('groups');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// === TRANSACTIONS ===

async function saveTransactionsLocal(groupId, transactions) {
    if (!db) await initDB();
    
    const transaction = db.transaction(['transactions'], 'readwrite');
    const store = transaction.objectStore('transactions');
    const index = store.index('group_id');
    
    // Remove old transactions for this group
    const oldTransactions = await new Promise((resolve) => {
        const request = index.getAll(groupId);
        request.onsuccess = () => resolve(request.result);
    });
    
    for (const old of oldTransactions) {
        if (old.synced !== false) { // Keep unsynced transactions
            await store.delete(old.transaction_id);
        }
    }
    
    // Add new transactions (mark as synced)
    for (const txn of transactions) {
        await store.put({ ...txn, synced: true });
    }
    
    console.log('✅ Transactions saved locally:', transactions.length);
}

async function getTransactionsLocal(groupId) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transactions'], 'readonly');
        const store = transaction.objectStore('transactions');
        const index = store.index('group_id');
        const request = index.getAll(groupId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addTransactionLocal(transaction) {
    if (!db) await initDB();
    
    const txn = db.transaction(['transactions'], 'readwrite');
    const store = txn.objectStore('transactions');
    
    // Mark as unsynced
    transaction.synced = false;
    transaction.added_locally = true;
    transaction.local_timestamp = new Date().toISOString();
    
    await store.put(transaction);
    
    console.log('✅ Transaction added locally (unsynced)');
    
    return transaction;
}

async function deleteTransactionLocal(transactionId) {
    if (!db) await initDB();
    
    const transaction = db.transaction(['transactions'], 'readwrite');
    const store = transaction.objectStore('transactions');
    
    await store.delete(transactionId);
    
    console.log('✅ Transaction deleted locally');
}

async function getUnsyncedTransactions() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transactions'], 'readonly');
        const store = transaction.objectStore('transactions');
        const index = store.index('synced');
        const request = index.getAll(false);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function markTransactionSynced(transactionId) {
    if (!db) await initDB();
    
    const transaction = db.transaction(['transactions'], 'readwrite');
    const store = transaction.objectStore('transactions');
    
    const txn = await new Promise((resolve) => {
        const request = store.get(transactionId);
        request.onsuccess = () => resolve(request.result);
    });
    
    if (txn) {
        txn.synced = true;
        await store.put(txn);
    }
}

// === INVITATIONS ===

async function saveInvitationsLocal(invitations) {
    if (!db) await initDB();
    
    const transaction = db.transaction(['invitations'], 'readwrite');
    const store = transaction.objectStore('invitations');
    
    // Clear old data
    await store.clear();
    
    // Add new data
    for (const invitation of invitations) {
        await store.put(invitation);
    }
    
    console.log('✅ Invitations saved locally:', invitations.length);
}

async function getInvitationsLocal() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['invitations'], 'readonly');
        const store = transaction.objectStore('invitations');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// === SYNC QUEUE ===

async function addToSyncQueue(action, data) {
    if (!db) await initDB();
    
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    
    await store.add({
        action: action,
        data: data,
        timestamp: new Date().toISOString()
    });
    
    console.log('✅ Added to sync queue:', action);
}

async function getSyncQueue() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sync_queue'], 'readonly');
        const store = transaction.objectStore('sync_queue');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function clearSyncQueue() {
    if (!db) await initDB();
    
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    
    await store.clear();
    
    console.log('✅ Sync queue cleared');
}

// === UTILITY ===

async function clearAllData() {
    if (!db) await initDB();
    
    const stores = ['groups', 'transactions', 'invitations', 'sync_queue'];
    
    for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();
    }
    
    console.log('✅ All local data cleared');
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDB);
} else {
    initDB();
}

console.log('✅ IndexedDB module loaded');
