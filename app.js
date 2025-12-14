// Application State
let state = {
    currentGroup: 'default',
    groups: {
        'default': {
            id: 'default',
            name: 'Výchozí skupina',
            members: ['Adam', 'Osoba 2', 'Osoba 3'],
            transactions: [], // expenses + incomes
            settlements: [] // settled debts
        }
    },
    categories: [
        { name: 'Jídlo', icon: '🍕' },
        { name: 'Doprava', icon: '🚗' },
        { name: 'Ubytování', icon: '🏠' },
        { name: 'Zábava', icon: '🎉' },
        { name: 'Nákupy', icon: '🛒' },
        { name: 'Ostatní', icon: '📦' }
    ],
    exchangeRates: {},
    lastRateUpdate: null,
    sheetId: '',
    apiKey: '',
    isOnline: navigator.onLine
};

let charts = {
    category: null,
    timeline: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initializeUI();
    setupEventListeners();
    updateAllViews();
    fetchExchangeRates();
    registerServiceWorker();
    
    // Set current date/time
    const now = new Date();
    document.getElementById('date').valueAsDate = now;
    document.getElementById('time').value = now.toTimeString().slice(0,5);
    document.getElementById('incomeDate').valueAsDate = now;
    document.getElementById('incomeTime').value = now.toTimeString().slice(0,5);
});

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    }
}

// Load State from LocalStorage
function loadState() {
    const saved = localStorage.getItem('expenseTrackerProState');
    if (saved) {
        const savedState = JSON.parse(saved);
        state = { ...state, ...savedState };
    }
}

// Save State to LocalStorage
function saveState() {
    localStorage.setItem('expenseTrackerProState', JSON.stringify(state));
}

// Get Current Group
function getCurrentGroup() {
    return state.groups[state.currentGroup];
}

// Initialize UI
function initializeUI() {
    updateGroupSelector();
    updateMemberSelects();
    updateCategorySelects();
    updateCategoriesList();
    updateMembersList();
    
    // Load connection settings
    document.getElementById('sheetId').value = state.sheetId || '';
    document.getElementById('apiKey').value = state.apiKey || '';
}

// Setup Event Listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Transaction type toggle
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleTransactionType(btn.dataset.type));
    });

    // Forms
    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('incomeForm').addEventListener('submit', addIncome);

    // Currency change
    document.getElementById('currency').addEventListener('change', updateCurrencyConversion);
    document.getElementById('amount').addEventListener('input', updateCurrencyConversion);
    document.getElementById('incomeCurrency').addEventListener('change', updateIncomeCurrencyConversion);
    document.getElementById('incomeAmount').addEventListener('input', updateIncomeCurrencyConversion);

    // Split mode toggle
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleSplitMode(btn.dataset.mode));
    });

    // Group management
    document.getElementById('currentGroup').addEventListener('click', toggleGroupDropdown);
    document.getElementById('addGroupBtn').addEventListener('click', showAddGroupModal);
    document.getElementById('saveGroup').addEventListener('click', saveNewGroup);
    document.getElementById('cancelGroup').addEventListener('click', hideGroupModal);

    // Categories
    document.getElementById('addCategory').addEventListener('click', addCategory);

    // Members
    document.getElementById('addMember').addEventListener('click', addMember);

    // Settings
    document.getElementById('saveConnection').addEventListener('click', saveConnection);
    document.getElementById('testConnection').addEventListener('click', testConnection);
    document.getElementById('clearGroupData').addEventListener('click', clearGroupData);
    document.getElementById('clearAllData').addEventListener('click', clearAllData);
    
    // Sync button
    document.getElementById('syncBtn').addEventListener('click', syncWithSheets);

    // Filters
    document.getElementById('filterType').addEventListener('change', updateExpensesList);
    document.getElementById('filterCategory').addEventListener('change', updateExpensesList);
    document.getElementById('statsTimeRange').addEventListener('change', updateStatistics);

    // Online/Offline detection
    window.addEventListener('online', () => {
        state.isOnline = true;
        updateConnectionStatus('Připojeno k internetu', 'success');
        fetchExchangeRates();
    });
    
    window.addEventListener('offline', () => {
        state.isOnline = false;
        updateConnectionStatus('Offline režim', 'warning');
    });

    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.group-selector')) {
            document.getElementById('groupDropdown').classList.add('hidden');
            document.getElementById('currentGroup').classList.remove('active');
        }
    });
}

// Fetch Exchange Rates from CNB
async function fetchExchangeRates() {
    if (!state.isOnline) return;
    
    try {
        // CNB provides rates in format: date|CZK|amount|code|rate
        const response = await fetch('https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt');
        const text = await response.text();
        
        const lines = text.split('\n');
        const rates = { CZK: 1 };
        
        // Parse rates (skip first 2 header lines)
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split('|');
            if (parts.length >= 5) {
                const currency = parts[3];
                const amount = parseFloat(parts[2]);
                const rate = parseFloat(parts[4].replace(',', '.'));
                rates[currency] = rate / amount; // Rate per 1 unit
            }
        }
        
        state.exchangeRates = rates;
        state.lastRateUpdate = new Date().toISOString();
        saveState();
        
        console.log('Exchange rates updated from CNB:', rates);
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Use fallback rates if available
        if (!state.exchangeRates.EUR) {
            state.exchangeRates = {
                CZK: 1,
                EUR: 25.0,
                USD: 23.0,
                GBP: 29.0,
                THB: 0.65,
                PLN: 5.8
            };
        }
    }
}

// Convert currency to CZK
function convertToCZK(amount, currency) {
    if (currency === 'CZK') return amount;
    const rate = state.exchangeRates[currency] || 1;
    return amount * rate;
}

// Update Currency Conversion Display
function updateCurrencyConversion() {
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const currency = document.getElementById('currency').value;
    const note = document.getElementById('currencyNote');
    const conversion = document.getElementById('currencyConversion');
    
    if (currency === 'CZK' || amount === 0) {
        note.classList.add('hidden');
        return;
    }
    
    const czk = convertToCZK(amount, currency);
    const rate = state.exchangeRates[currency] || 0;
    conversion.textContent = `≈ ${czk.toLocaleString('cs-CZ', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Kč (kurz: ${rate.toFixed(2)} Kč/${currency})`;
    note.classList.remove('hidden');
}

function updateIncomeCurrencyConversion() {
    const amount = parseFloat(document.getElementById('incomeAmount').value) || 0;
    const currency = document.getElementById('incomeCurrency').value;
    const note = document.getElementById('incomeCurrencyNote');
    const conversion = document.getElementById('incomeCurrencyConversion');
    
    if (currency === 'CZK' || amount === 0) {
        note.classList.add('hidden');
        return;
    }
    
    const czk = convertToCZK(amount, currency);
    const rate = state.exchangeRates[currency] || 0;
    conversion.textContent = `≈ ${czk.toLocaleString('cs-CZ', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Kč (kurz: ${rate.toFixed(2)} Kč/${currency})`;
    note.classList.remove('hidden');
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Update views
    if (tabName === 'expenses') updateExpensesList();
    if (tabName === 'balance') updateBalance();
    if (tabName === 'stats') updateStatistics();
}

// Toggle Transaction Type
function toggleTransactionType(type) {
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    if (type === 'expense') {
        document.getElementById('expenseForm').classList.remove('hidden');
        document.getElementById('incomeForm').classList.add('hidden');
    } else {
        document.getElementById('expenseForm').classList.add('hidden');
        document.getElementById('incomeForm').classList.remove('hidden');
    }
}

// Toggle Split Mode
function toggleSplitMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    updateSplitBetween(mode);
}

// Update Split Between
function updateSplitBetween(mode = 'equal') {
    const container = document.getElementById('splitBetween');
    const group = getCurrentGroup();
    
    container.innerHTML = '';
    
    group.members.forEach(member => {
        const div = document.createElement('div');
        div.className = 'split-item';
        
        if (mode === 'equal') {
            div.innerHTML = `
                <input type="checkbox" id="split-${member}" value="${member}" checked>
                <label for="split-${member}">${member}</label>
            `;
        } else {
            div.innerHTML = `
                <input type="checkbox" id="split-${member}" value="${member}" checked>
                <label for="split-${member}">${member}</label>
                <input type="number" id="amount-${member}" placeholder="Částka" step="0.01" min="0">
            `;
        }
        
        container.appendChild(div);
        
        // Update checked state visually
        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            div.classList.toggle('checked', checkbox.checked);
        });
        div.classList.add('checked');
    });
}

// Group Management
function toggleGroupDropdown() {
    const dropdown = document.getElementById('groupDropdown');
    const button = document.getElementById('currentGroup');
    dropdown.classList.toggle('hidden');
    button.classList.toggle('active');
}

function updateGroupSelector() {
    const currentBtn = document.getElementById('currentGroup');
    const groupName = document.getElementById('currentGroupName');
    const groupList = document.getElementById('groupList');
    
    const current = getCurrentGroup();
    groupName.textContent = current.name;
    
    groupList.innerHTML = '';
    Object.values(state.groups).forEach(group => {
        const div = document.createElement('div');
        div.className = 'group-item';
        if (group.id === state.currentGroup) {
            div.classList.add('active');
        }
        
        div.innerHTML = `
            <span>${group.name}</span>
            ${Object.keys(state.groups).length > 1 ? 
                `<button class="group-delete" data-id="${group.id}">🗑️</button>` : ''}
        `;
        
        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('group-delete')) {
                switchGroup(group.id);
            }
        });
        
        const deleteBtn = div.querySelector('.group-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteGroup(group.id);
            });
        }
        
        groupList.appendChild(div);
    });
}

function switchGroup(groupId) {
    state.currentGroup = groupId;
    saveState();
    updateGroupSelector();
    updateMemberSelects();
    updateAllViews();
    toggleGroupDropdown();
    showNotification(`Přepnuto na: ${state.groups[groupId].name}`);
}

function showAddGroupModal() {
    document.getElementById('groupModal').classList.remove('hidden');
    document.getElementById('groupName').value = '';
    document.getElementById('groupName').focus();
}

function hideGroupModal() {
    document.getElementById('groupModal').classList.add('hidden');
}

function saveNewGroup() {
    const name = document.getElementById('groupName').value.trim();
    if (!name) {
        alert('Zadej název skupiny');
        return;
    }
    
    const id = 'group_' + Date.now();
    state.groups[id] = {
        id: id,
        name: name,
        members: [...getCurrentGroup().members], // Copy members from current group
        transactions: [],
        settlements: []
    };
    
    state.currentGroup = id;
    saveState();
    updateGroupSelector();
    updateMemberSelects();
    updateAllViews();
    hideGroupModal();
    showNotification(`Skupina "${name}" vytvořena`);
}

function deleteGroup(groupId) {
    if (Object.keys(state.groups).length <= 1) {
        alert('Musí zůstat alespoň jedna skupina');
        return;
    }
    
    const group = state.groups[groupId];
    if (!confirm(`Opravdu smazat skupinu "${group.name}"? Všechna data budou ztracena.`)) {
        return;
    }
    
    delete state.groups[groupId];
    
    if (state.currentGroup === groupId) {
        state.currentGroup = Object.keys(state.groups)[0];
    }
    
    saveState();
    updateGroupSelector();
    updateMemberSelects();
    updateAllViews();
    showNotification(`Skupina "${group.name}" smazána`);
}

// Categories Management
function updateCategorySelects() {
    const categorySelect = document.getElementById('category');
    const filterCategory = document.getElementById('filterCategory');
    
    categorySelect.innerHTML = '';
    filterCategory.innerHTML = '<option value="all">Všechny kategorie</option>';
    
    state.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.icon} ${cat.name}`;
        categorySelect.appendChild(option);
        
        const filterOption = document.createElement('option');
        filterOption.value = cat.name;
        filterOption.textContent = `${cat.icon} ${cat.name}`;
        filterCategory.appendChild(filterOption);
    });
}

function updateCategoriesList() {
    const list = document.getElementById('categoriesList');
    list.innerHTML = '';
    
    state.categories.forEach((cat, index) => {
        const div = document.createElement('div');
        div.className = 'category-item';
        div.innerHTML = `
            <span>${cat.icon} ${cat.name}</span>
            <button class="category-remove" data-index="${index}">Odebrat</button>
        `;
        list.appendChild(div);
    });
    
    document.querySelectorAll('.category-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeCategory(index);
        });
    });
}

function addCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const icon = document.getElementById('newCategoryIcon').value.trim() || '📦';
    
    if (!name) {
        alert('Zadej název kategorie');
        return;
    }
    
    if (state.categories.some(c => c.name === name)) {
        alert('Tato kategorie už existuje');
        return;
    }
    
    state.categories.push({ name, icon });
    document.getElementById('newCategoryName').value = '';
    document.getElementById('newCategoryIcon').value = '';
    
    saveState();
    updateCategorySelects();
    updateCategoriesList();
    showNotification('Kategorie přidána');
}

function removeCategory(index) {
    if (state.categories.length <= 1) {
        alert('Musí zůstat alespoň jedna kategorie');
        return;
    }
    
    const cat = state.categories[index];
    if (!confirm(`Opravdu odebrat kategorii "${cat.name}"?`)) {
        return;
    }
    
    state.categories.splice(index, 1);
    saveState();
    updateCategorySelects();
    updateCategoriesList();
    showNotification('Kategorie odebrána');
}

// Members Management
function updateMemberSelects() {
    const group = getCurrentGroup();
    const selects = ['paidBy', 'incomeRecipient'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Vyber osobu</option>';
        
        group.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            select.appendChild(option);
        });
    });
    
    updateSplitBetween();
}

function updateMembersList() {
    const group = getCurrentGroup();
    const list = document.getElementById('membersList');
    list.innerHTML = '';
    
    group.members.forEach((member, index) => {
        const div = document.createElement('div');
        div.className = 'member-item';
        div.innerHTML = `
            <span>${member}</span>
            ${group.members.length > 2 ? 
                `<button class="member-remove" data-index="${index}">Odebrat</button>` : ''}
        `;
        list.appendChild(div);
    });
    
    document.querySelectorAll('.member-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeMember(index);
        });
    });
}

function addMember() {
    const group = getCurrentGroup();
    const input = document.getElementById('newMember');
    const name = input.value.trim();
    
    if (!name) {
        alert('Zadej jméno');
        return;
    }
    
    if (group.members.includes(name)) {
        alert('Tento účastník už existuje');
        return;
    }
    
    group.members.push(name);
    input.value = '';
    saveState();
    updateMemberSelects();
    updateMembersList();
    showNotification('Člen přidán');
}

function removeMember(index) {
    const group = getCurrentGroup();
    
    if (group.members.length <= 2) {
        alert('Musí zůstat alespoň 2 účastníci');
        return;
    }
    
    const member = group.members[index];
    const hasTransactions = group.transactions.some(t => 
        t.paidBy === member || (t.splitBetween && t.splitBetween.some(s => s.person === member))
    );
    
    if (hasTransactions) {
        if (!confirm(`${member} má transakce. Opravdu odebrat?`)) {
            return;
        }
    }
    
    group.members.splice(index, 1);
    saveState();
    updateMemberSelects();
    updateMembersList();
    updateAllViews();
    showNotification('Člen odebrán');
}

// Add Expense
function addExpense(e) {
    e.preventDefault();
    const group = getCurrentGroup();
    
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const currency = document.getElementById('currency').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const paidBy = document.getElementById('paidBy').value;
    const category = document.getElementById('category').value;
    const note = document.getElementById('note').value.trim();
    
    // Get split mode
    const mode = document.querySelector('.mode-btn.active').dataset.mode;
    const splitBetween = [];
    
    if (mode === 'equal') {
        const checkboxes = document.querySelectorAll('#splitBetween input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            splitBetween.push({
                person: cb.value,
                amount: null // Will be calculated equally
            });
        });
    } else {
        const checkboxes = document.querySelectorAll('#splitBetween input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            const customAmount = parseFloat(document.getElementById(`amount-${cb.value}`).value) || 0;
            if (customAmount > 0) {
                splitBetween.push({
                    person: cb.value,
                    amount: customAmount
                });
            }
        });
    }
    
    if (!description || !amount || !paidBy || splitBetween.length === 0) {
        alert('Vyplň všechna pole a vyber alespoň jednoho člena');
        return;
    }
    
    // Validate custom amounts
    if (mode === 'custom') {
        const totalCustom = splitBetween.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(totalCustom - amount) > 0.01) {
            if (!confirm(`Součet vlastních částek (${totalCustom}) neodpovídá celkové částce (${amount}). Pokračovat?`)) {
                return;
            }
        }
    }
    
    const amountCZK = convertToCZK(amount, currency);
    
    const transaction = {
        id: Date.now(),
        type: 'expense',
        description,
        amount,
        amountCZK,
        currency,
        paidBy,
        splitBetween,
        splitMode: mode,
        category,
        note,
        date: `${date}T${time}`,
        synced: false
    };
    
    group.transactions.push(transaction);
    saveState();
    
    // Reset form
    document.getElementById('expenseForm').reset();
    const now = new Date();
    document.getElementById('date').valueAsDate = now;
    document.getElementById('time').value = now.toTimeString().slice(0,5);
    document.getElementById('currency').value = 'CZK';
    updateSplitBetween('equal');
    document.querySelector('[data-mode="equal"]').classList.add('active');
    document.querySelector('[data-mode="custom"]').classList.remove('active');
    
    switchTab('expenses');
    
    if (state.isOnline && state.sheetId && state.apiKey) {
        syncWithSheets();
    }
    
    showNotification('Výdaj přidán ✅');
}

// Add Income
function addIncome(e) {
    e.preventDefault();
    const group = getCurrentGroup();
    
    const description = document.getElementById('incomeDescription').value.trim();
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const currency = document.getElementById('incomeCurrency').value;
    const date = document.getElementById('incomeDate').value;
    const time = document.getElementById('incomeTime').value;
    const recipient = document.getElementById('incomeRecipient').value;
    const note = document.getElementById('incomeNote').value.trim();
    
    if (!description || !amount || !recipient) {
        alert('Vyplň všechna pole');
        return;
    }
    
    const amountCZK = convertToCZK(amount, currency);
    
    const transaction = {
        id: Date.now(),
        type: 'income',
        description,
        amount,
        amountCZK,
        currency,
        recipient,
        note,
        date: `${date}T${time}`,
        synced: false
    };
    
    group.transactions.push(transaction);
    saveState();
    
    // Reset form
    document.getElementById('incomeForm').reset();
    const now = new Date();
    document.getElementById('incomeDate').valueAsDate = now;
    document.getElementById('incomeTime').value = now.toTimeString().slice(0,5);
    document.getElementById('incomeCurrency').value = 'CZK';
    
    switchTab('expenses');
    
    if (state.isOnline && state.sheetId && state.apiKey) {
        syncWithSheets();
    }
    
    showNotification('Příjem přidán ✅');
}

// Update Expenses List
function updateExpensesList() {
    const group = getCurrentGroup();
    const list = document.getElementById('expensesList');
    
    const filterType = document.getElementById('filterType').value;
    const filterCategory = document.getElementById('filterCategory').value;
    
    let transactions = group.transactions.filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterCategory !== 'all' && t.type === 'expense' && t.category !== filterCategory) return false;
        return true;
    });
    
    if (transactions.length === 0) {
        list.innerHTML = '<p class="empty-state">Žádné transakce neodpovídají filtrům</p>';
        return;
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = '';
    transactions.forEach(transaction => {
        const div = document.createElement('div');
        div.className = `expense-item ${transaction.type}`;
        
        const date = new Date(transaction.date);
        const dateStr = date.toLocaleDateString('cs-CZ', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let metaInfo = '';
        if (transaction.type === 'expense') {
            const splitInfo = transaction.splitMode === 'equal' 
                ? `Rozděleno rovnoměrně mezi: ${transaction.splitBetween.map(s => s.person).join(', ')}`
                : `Vlastní rozdělení mezi: ${transaction.splitBetween.map(s => `${s.person} (${s.amount} ${transaction.currency})`).join(', ')}`;
            metaInfo = `${transaction.paidBy} zaplatil • ${dateStr}<br>${splitInfo}`;
        } else {
            metaInfo = `Příjem pro: ${transaction.recipient} • ${dateStr}`;
        }
        
        const displayAmount = transaction.currency === 'CZK' 
            ? `${transaction.amount.toLocaleString('cs-CZ')} Kč`
            : `${transaction.amount.toLocaleString('cs-CZ')} ${transaction.currency} (${transaction.amountCZK.toLocaleString('cs-CZ')} Kč)`;
        
        div.innerHTML = `
            <div class="expense-header">
                <div class="expense-description">
                    ${transaction.type === 'expense' ? transaction.category : '💵'} - ${transaction.description}
                </div>
                <div class="expense-amount">${displayAmount}</div>
            </div>
            <div class="expense-meta">${metaInfo}</div>
            ${transaction.note ? `<div class="expense-note">${transaction.note}</div>` : ''}
            <div class="expense-actions">
                <button class="expense-delete" data-id="${transaction.id}">🗑️ Smazat</button>
            </div>
        `;
        
        list.appendChild(div);
    });
    
    document.querySelectorAll('.expense-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteTransaction(id);
        });
    });
}

function deleteTransaction(id) {
    if (!confirm('Opravdu smazat tuto transakci?')) return;
    
    const group = getCurrentGroup();
    group.transactions = group.transactions.filter(t => t.id !== id);
    saveState();
    updateExpensesList();
    updateBalance();
    updateStatistics();
    showNotification('Transakce smazána');
}

// Calculate Balance
function calculateBalance() {
    const group = getCurrentGroup();
    const balances = {};
    
    group.members.forEach(member => {
        balances[member] = 0;
    });
    
    group.transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            // Add full amount to payer
            balances[transaction.paidBy] += transaction.amountCZK;
            
            // Subtract shares from each person
            if (transaction.splitMode === 'equal') {
                const sharePerPerson = transaction.amountCZK / transaction.splitBetween.length;
                transaction.splitBetween.forEach(split => {
                    if (balances[split.person] !== undefined) {
                        balances[split.person] -= sharePerPerson;
                    }
                });
            } else {
                transaction.splitBetween.forEach(split => {
                    if (balances[split.person] !== undefined) {
                        const shareCZK = convertToCZK(split.amount, transaction.currency);
                        balances[split.person] -= shareCZK;
                    }
                });
            }
        } else if (transaction.type === 'income') {
            // Income increases recipient's balance
            balances[transaction.recipient] += transaction.amountCZK;
        }
    });
    
    return balances;
}

// Calculate Settlements
function calculateSettlements(balances) {
    const settlements = [];
    const debtors = [];
    const creditors = [];
    
    Object.entries(balances).forEach(([person, balance]) => {
        if (balance < -0.01) {
            debtors.push({ person, amount: Math.abs(balance) });
        } else if (balance > 0.01) {
            creditors.push({ person, amount: balance });
        }
    });
    
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(debtor.amount, creditor.amount);
        
        settlements.push({
            from: debtor.person,
            to: creditor.person,
            amount: amount
        });
        
        debtor.amount -= amount;
        creditor.amount -= amount;
        
        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }
    
    return settlements;
}

// Update Balance View
function updateBalance() {
    const group = getCurrentGroup();
    const balances = calculateBalance();
    
    const totalExpenses = group.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amountCZK, 0);
    
    const totalIncomes = group.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amountCZK, 0);
    
    document.getElementById('totalExpenses').textContent = 
        totalExpenses.toLocaleString('cs-CZ') + ' Kč';
    document.getElementById('totalIncomes').textContent = 
        totalIncomes.toLocaleString('cs-CZ') + ' Kč';
    
    // Update balance list
    const list = document.getElementById('balanceList');
    list.innerHTML = '';
    
    Object.entries(balances).forEach(([person, balance]) => {
        const div = document.createElement('div');
        div.className = 'balance-item';
        
        const isPositive = balance > 0.01;
        const isNegative = balance < -0.01;
        
        div.innerHTML = `
            <div class="balance-name">${person}</div>
            <div class="balance-amount ${isPositive ? 'positive' : isNegative ? 'negative' : ''}">
                ${isPositive ? '+' : ''}${balance.toLocaleString('cs-CZ', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })} Kč
            </div>
        `;
        
        list.appendChild(div);
    });
    
    // Update settlements
    const settlements = calculateSettlements(balances);
    const settlementsDiv = document.getElementById('settlementList');
    
    if (settlements.length === 0) {
        settlementsDiv.innerHTML = '<p class="empty-state">Všechno je vyrovnané! 🎉</p>';
    } else {
        settlementsDiv.innerHTML = '';
        settlements.forEach((settlement, index) => {
            const isSettled = group.settlements.some(s => 
                s.from === settlement.from && 
                s.to === settlement.to && 
                Math.abs(s.amount - settlement.amount) < 0.01
            );
            
            const div = document.createElement('div');
            div.className = `settlement-item ${isSettled ? 'settled' : ''}`;
            div.innerHTML = `
                <div class="settlement-text">
                    <strong>${settlement.from}</strong> → 
                    <strong>${settlement.to}</strong>: 
                    ${settlement.amount.toLocaleString('cs-CZ', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })} Kč
                </div>
                ${!isSettled ? `<button class="settlement-action" data-index="${index}">✓ Vyrovnáno</button>` : ''}
            `;
            settlementsDiv.appendChild(div);
        });
        
        document.querySelectorAll('.settlement-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                markSettlementAsPaid(settlements[index]);
            });
        });
    }
}

function markSettlementAsPaid(settlement) {
    const group = getCurrentGroup();
    
    if (confirm(`Označit jako vyrovnáno:\n${settlement.from} → ${settlement.to}: ${settlement.amount.toFixed(2)} Kč?`)) {
        group.settlements.push({
            ...settlement,
            date: new Date().toISOString()
        });
        saveState();
        updateBalance();
        showNotification('Dluh označen jako vyrovnán ✅');
    }
}

// Update Statistics
function updateStatistics() {
    const group = getCurrentGroup();
    const timeRange = document.getElementById('statsTimeRange').value;
    
    // Filter transactions by time range
    let transactions = [...group.transactions].filter(t => t.type === 'expense');
    
    if (timeRange !== 'all') {
        const now = new Date();
        const cutoff = new Date();
        
        if (timeRange === 'week') {
            cutoff.setDate(now.getDate() - 7);
        } else if (timeRange === 'month') {
            cutoff.setMonth(now.getMonth() - 1);
        }
        
        transactions = transactions.filter(t => new Date(t.date) >= cutoff);
    }
    
    if (transactions.length === 0) {
        document.getElementById('avgExpense').textContent = '0 Kč';
        document.getElementById('topCategory').textContent = '-';
        document.getElementById('topSpender').textContent = '-';
        document.getElementById('expenseCount').textContent = '0';
        destroyCharts();
        return;
    }
    
    // Calculate stats
    const total = transactions.reduce((sum, t) => sum + t.amountCZK, 0);
    const avg = total / transactions.length;
    
    document.getElementById('avgExpense').textContent = 
        avg.toLocaleString('cs-CZ', {minimumFractionDigits: 0, maximumFractionDigits: 0}) + ' Kč';
    document.getElementById('expenseCount').textContent = transactions.length;
    
    // Top category
    const categoryTotals = {};
    transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amountCZK;
    });
    const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('topCategory').textContent = topCat ? topCat[0] : '-';
    
    // Top spender
    const spenderTotals = {};
    transactions.forEach(t => {
        spenderTotals[t.paidBy] = (spenderTotals[t.paidBy] || 0) + t.amountCZK;
    });
    const topSpender = Object.entries(spenderTotals).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('topSpender').textContent = topSpender ? topSpender[0] : '-';
    
    // Update charts
    updateCategoryChart(categoryTotals);
    updateTimelineChart(transactions);
}

function destroyCharts() {
    if (charts.category) {
        charts.category.destroy();
        charts.category = null;
    }
    if (charts.timeline) {
        charts.timeline.destroy();
        charts.timeline = null;
    }
}

function updateCategoryChart(categoryTotals) {
    const ctx = document.getElementById('categoryChart');
    
    if (charts.category) {
        charts.category.destroy();
    }
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    // Find matching icons
    const icons = labels.map(label => {
        const cat = state.categories.find(c => c.name === label);
        return cat ? cat.icon : '📦';
    });
    
    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map((l, i) => `${icons[i]} ${l}`),
            datasets: [{
                data: data,
                backgroundColor: [
                    '#3b82f6',
                    '#8b5cf6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#06b6d4',
                    '#ec4899',
                    '#84cc16'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f1f5f9',
                        font: {
                            family: "'Work Sans', sans-serif",
                            size: 12
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return ` ${value.toLocaleString('cs-CZ')} Kč (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateTimelineChart(transactions) {
    const ctx = document.getElementById('timelineChart');
    
    if (charts.timeline) {
        charts.timeline.destroy();
    }
    
    // Group by date
    const dailyTotals = {};
    transactions.forEach(t => {
        const date = new Date(t.date).toLocaleDateString('cs-CZ');
        dailyTotals[date] = (dailyTotals[date] || 0) + t.amountCZK;
    });
    
    const dates = Object.keys(dailyTotals).sort((a, b) => {
        return new Date(a.split('.').reverse().join('-')) - new Date(b.split('.').reverse().join('-'));
    });
    const amounts = dates.map(d => dailyTotals[d]);
    
    charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Výdaje',
                data: amounts,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#1e293b',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return ` ${context.parsed.y.toLocaleString('cs-CZ')} Kč`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            family: "'Work Sans', sans-serif"
                        },
                        callback: function(value) {
                            return value.toLocaleString('cs-CZ') + ' Kč';
                        }
                    },
                    grid: {
                        color: '#334155'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            family: "'Work Sans', sans-serif"
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: '#334155'
                    }
                }
            }
        }
    });
}

// Update All Views
function updateAllViews() {
    updateMembersList();
    updateExpensesList();
    updateBalance();
    updateStatistics();
}

// Google Sheets Sync
function saveConnection() {
    state.sheetId = document.getElementById('sheetId').value.trim();
    state.apiKey = document.getElementById('apiKey').value.trim();
    saveState();
    showNotification('Nastavení uloženo ✅');
}

async function testConnection() {
    if (!state.sheetId || !state.apiKey) {
        alert('Vyplň ID tabulky a API klíč');
        return;
    }
    
    updateConnectionStatus('Testuji připojení...', 'warning');
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${state.sheetId}?key=${state.apiKey}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            updateConnectionStatus(`✅ Připojeno k: ${data.properties.title}`, 'success');
            setTimeout(() => {
                document.getElementById('connectionStatus').classList.add('hidden');
            }, 3000);
        } else {
            throw new Error('Neplatné přihlášení');
        }
    } catch (error) {
        updateConnectionStatus('❌ Chyba připojení', 'error');
        console.error(error);
    }
}

async function syncWithSheets() {
    if (!state.sheetId || !state.apiKey) {
        alert('Nejprve nastav Google Sheets připojení v Nastavení');
        return;
    }
    
    if (!state.isOnline) {
        showNotification('Není připojení k internetu');
        return;
    }
    
    const syncBtn = document.getElementById('syncBtn');
    syncBtn.classList.add('syncing');
    updateConnectionStatus('Synchronizuji...', 'warning');
    
    try {
        const group = getCurrentGroup();
        
        // Prepare data
        const rows = group.transactions.map(t => {
            if (t.type === 'expense') {
                const splitInfo = t.splitMode === 'equal'
                    ? `Rovnoměrně: ${t.splitBetween.map(s => s.person).join(', ')}`
                    : `Vlastní: ${t.splitBetween.map(s => `${s.person}=${s.amount}`).join(', ')}`;
                
                return [
                    new Date(t.date).toLocaleString('cs-CZ'),
                    'Výdaj',
                    t.description,
                    t.amount,
                    t.currency,
                    t.amountCZK.toFixed(2),
                    t.paidBy,
                    splitInfo,
                    t.category,
                    t.note || ''
                ];
            } else {
                return [
                    new Date(t.date).toLocaleString('cs-CZ'),
                    'Příjem',
                    t.description,
                    t.amount,
                    t.currency,
                    t.amountCZK.toFixed(2),
                    t.recipient,
                    '',
                    '',
                    t.note || ''
                ];
            }
        });
        
        const header = [['Datum', 'Typ', 'Popis', 'Částka', 'Měna', 'Částka CZK', 'Kdo/Komu', 'Rozdělení', 'Kategorie', 'Poznámka']];
        const allRows = [...header, ...rows];
        
        // Clear and update sheet
        const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${state.sheetId}/values/${group.name}!A1:Z1000:clear?key=${state.apiKey}`;
        await fetch(clearUrl, { method: 'POST' });
        
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${state.sheetId}/values/${group.name}!A1?valueInputOption=RAW&key=${state.apiKey}`;
        const response = await fetch(updateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: allRows })
        });
        
        if (response.ok) {
            group.transactions.forEach(t => t.synced = true);
            saveState();
            updateConnectionStatus('✅ Synchronizováno', 'success');
            setTimeout(() => {
                document.getElementById('connectionStatus').classList.add('hidden');
            }, 3000);
        } else {
            throw new Error('Sync failed');
        }
    } catch (error) {
        updateConnectionStatus('❌ Chyba synchronizace', 'error');
        console.error(error);
    } finally {
        syncBtn.classList.remove('syncing');
    }
}

function updateConnectionStatus(message, type) {
    const status = document.getElementById('connectionStatus');
    const text = document.getElementById('statusText');
    
    status.className = 'connection-status ' + type;
    text.textContent = message;
    status.classList.remove('hidden');
}

function showNotification(message) {
    updateConnectionStatus(message, 'success');
    setTimeout(() => {
        document.getElementById('connectionStatus').classList.add('hidden');
    }, 2000);
}

// Clear Data
function clearGroupData() {
    const group = getCurrentGroup();
    if (!confirm(`Opravdu smazat všechna data skupiny "${group.name}"? Tato akce je nevratná!`)) return;
    
    group.transactions = [];
    group.settlements = [];
    saveState();
    updateAllViews();
    showNotification('Data skupiny smazána');
}

function clearAllData() {
    if (!confirm('Opravdu smazat VŠECHNA data ze VŠECH skupin? Tato akce je nevratná!')) return;
    if (!confirm('Jsi si opravdu jistý? Všechna data budou ztracena navždy.')) return;
    
    Object.values(state.groups).forEach(group => {
        group.transactions = [];
        group.settlements = [];
        group.members = ['Adam', 'Osoba 2', 'Osoba 3'];
    });
    
    state.categories = [
        { name: 'Jídlo', icon: '🍕' },
        { name: 'Doprava', icon: '🚗' },
        { name: 'Ubytování', icon: '🏠' },
        { name: 'Zábava', icon: '🎉' },
        { name: 'Nákupy', icon: '🛒' },
        { name: 'Ostatní', icon: '📦' }
    ];
    
    saveState();
    updateMemberSelects();
    updateCategorySelects();
    updateCategoriesList();
    updateMembersList();
    updateAllViews();
    
    showNotification('Všechna data smazána');
}
