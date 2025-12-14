// Application State
let state = {
    currentGroup: 'default',
    groups: {
        'default': {
            id: 'default',
            name: 'Výchozí skupina',
            members: ['Adam', 'Osoba 2', 'Osoba 3'],
            transactions: [],
            settlements: []
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
    exchangeRates: {
        CZK: 1,
        EUR: 25.0,
        USD: 23.0,
        GBP: 29.0,
        THB: 0.65,
        PLN: 5.8
    },
    lastRateUpdate: null,
    scriptUrl: '', // Google Apps Script URL
    isOnline: navigator.onLine
};

let charts = {
    category: null,
    timeline: null
};

// Initialize App (called after auth)
function initializeUI() {
    updateGroupSelector();
    updateMemberSelects();
    updateCategorySelects();
    updateCategoriesList();
    updateMembersList();
    
    // Set current date/time
    const now = new Date();
    setDateTimeInputs(now);
    
    // Load script URL
    document.getElementById('scriptUrl').value = state.scriptUrl || '';
    
    setupEventListeners();
    fetchExchangeRates();
}

function setDateTimeInputs(date) {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);
    
    document.getElementById('expenseDate').value = dateStr;
    document.getElementById('expenseTime').value = timeStr;
    document.getElementById('incomeDate').value = dateStr;
    document.getElementById('incomeTime').value = timeStr;
}

// Load State from LocalStorage
function loadState() {
    const saved = localStorage.getItem('expenseTrackerSecureState');
    if (saved) {
        try {
            const savedState = JSON.parse(saved);
            state = { ...state, ...savedState };
        } catch (e) {
            console.error('Error loading state:', e);
        }
    }
}

// Save State to LocalStorage
function saveState() {
    localStorage.setItem('expenseTrackerSecureState', JSON.stringify(state));
}

// Get Current Group
function getCurrentGroup() {
    return state.groups[state.currentGroup];
}

// Setup Event Listeners
function setupEventListeners() {
    // Bottom navigation tabs
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Transaction type toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleTransactionType(btn.dataset.type));
    });

    // Forms
    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('incomeForm').addEventListener('submit', addIncome);

    // Currency change - update conversion
    document.getElementById('expenseCurrency').addEventListener('change', updateExpenseCurrencyConversion);
    document.getElementById('expenseAmount').addEventListener('input', updateExpenseCurrencyConversion);
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
    document.getElementById('saveScriptUrl').addEventListener('click', saveScriptUrl);
    document.getElementById('testScript').addEventListener('click', testScriptConnection);
    document.getElementById('clearGroupData').addEventListener('click', clearGroupData);
    document.getElementById('clearAllData').addEventListener('click', clearAllData);
    
    // Sync button
    document.getElementById('syncBtn').addEventListener('click', syncWithScript);

    // Logout buttons
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('logoutBtnSettings').addEventListener('click', logout);

    // Filters
    document.getElementById('filterType').addEventListener('change', updateExpensesList);
    document.getElementById('filterCategory').addEventListener('change', updateExpensesList);
    document.getElementById('statsTimeRange').addEventListener('change', updateStatistics);

    // Online/Offline detection
    window.addEventListener('online', () => {
        state.isOnline = true;
        showToast('Připojeno k internetu', 'success');
        fetchExchangeRates();
    });
    
    window.addEventListener('offline', () => {
        state.isOnline = false;
        showToast('Offline režim', 'warning');
    });

    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.group-selector')) {
            document.getElementById('groupDropdown').classList.add('hidden');
            document.getElementById('currentGroup').classList.remove('active');
        }
    });
}

// Fetch Exchange Rates from ČNB
async function fetchExchangeRates() {
    if (!state.isOnline) return;
    
    try {
        const response = await fetch('https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt');
        const text = await response.text();
        
        const lines = text.split('\n');
        const rates = { CZK: 1 };
        
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split('|');
            if (parts.length >= 5) {
                const currency = parts[3];
                const amount = parseFloat(parts[2]);
                const rate = parseFloat(parts[4].replace(',', '.'));
                rates[currency] = rate / amount;
            }
        }
        
        state.exchangeRates = rates;
        state.lastRateUpdate = new Date().toISOString();
        saveState();
        
        console.log('Exchange rates updated from ČNB');
    } catch (error) {
        console.log('Using fallback exchange rates');
    }
}

// Convert currency to CZK
function convertToCZK(amount, currency) {
    if (currency === 'CZK') return amount;
    const rate = state.exchangeRates[currency] || 1;
    return amount * rate;
}

// Update Currency Conversion Display
function updateExpenseCurrencyConversion() {
    const amount = parseInt(document.getElementById('expenseAmount').value) || 0;
    const currency = document.getElementById('expenseCurrency').value;
    const note = document.getElementById('expenseCurrencyNote');
    const conversion = document.getElementById('expenseCurrencyConversion');
    
    if (currency === 'CZK' || amount === 0) {
        note.classList.add('hidden');
        return;
    }
    
    const czk = convertToCZK(amount, currency);
    const rate = state.exchangeRates[currency] || 0;
    conversion.textContent = `≈ ${Math.round(czk).toLocaleString('cs-CZ')} Kč (kurz: ${rate.toFixed(2)} Kč/${currency})`;
    note.classList.remove('hidden');
}

function updateIncomeCurrencyConversion() {
    const amount = parseInt(document.getElementById('incomeAmount').value) || 0;
    const currency = document.getElementById('incomeCurrency').value;
    const note = document.getElementById('incomeCurrencyNote');
    const conversion = document.getElementById('incomeCurrencyConversion');
    
    if (currency === 'CZK' || amount === 0) {
        note.classList.add('hidden');
        return;
    }
    
    const czk = convertToCZK(amount, currency);
    const rate = state.exchangeRates[currency] || 0;
    conversion.textContent = `≈ ${Math.round(czk).toLocaleString('cs-CZ')} Kč (kurz: ${rate.toFixed(2)} Kč/${currency})`;
    note.classList.remove('hidden');
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    if (tabName === 'expenses') updateExpensesList();
    if (tabName === 'balance') updateBalance();
    if (tabName === 'stats') updateStatistics();
}

// Toggle Transaction Type (Expense/Income)
function toggleTransactionType(type) {
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
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
    const container = document.getElementById('expenseSplitBetween');
    const group = getCurrentGroup();
    
    container.innerHTML = '';
    
    group.members.forEach(member => {
        const div = document.createElement('div');
        div.className = 'split-item checked';
        
        if (mode === 'equal') {
            div.innerHTML = `
                <input type="checkbox" id="split-${member}" value="${member}" checked>
                <label for="split-${member}">${member}</label>
            `;
        } else {
            div.innerHTML = `
                <input type="checkbox" id="split-${member}" value="${member}" checked>
                <label for="split-${member}">${member}</label>
                <input type="number" id="amount-${member}" placeholder="Částka" pattern="[0-9]*" inputmode="numeric" min="0">
            `;
        }
        
        container.appendChild(div);
        
        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            div.classList.toggle('checked', checkbox.checked);
        });
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
    showToast(`Přepnuto na: ${state.groups[groupId].name}`);
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
        members: [...getCurrentGroup().members],
        transactions: [],
        settlements: []
    };
    
    state.currentGroup = id;
    saveState();
    updateGroupSelector();
    updateMemberSelects();
    updateAllViews();
    hideGroupModal();
    showToast(`Skupina "${name}" vytvořena`);
}

function deleteGroup(groupId) {
    if (Object.keys(state.groups).length <= 1) {
        alert('Musí zůstat alespoň jedna skupina');
        return;
    }
    
    const group = state.groups[groupId];
    if (!confirm(`Opravdu smazat skupinu "${group.name}"?`)) return;
    
    delete state.groups[groupId];
    
    if (state.currentGroup === groupId) {
        state.currentGroup = Object.keys(state.groups)[0];
    }
    
    saveState();
    updateGroupSelector();
    updateMemberSelects();
    updateAllViews();
    showToast(`Skupina smazána`);
}

// Categories Management
function updateCategorySelects() {
    const categorySelect = document.getElementById('expenseCategory');
    const filterCategory = document.getElementById('filterCategory');
    
    categorySelect.innerHTML = '';
    filterCategory.innerHTML = '<option value="all">Všechny kategorie</option>';
    
    state.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.icon} ${cat.name}`;
        categorySelect.appendChild(option);
        
        const filterOption = option.cloneNode(true);
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
    showToast('Kategorie přidána');
}

function removeCategory(index) {
    if (state.categories.length <= 1) {
        alert('Musí zůstat alespoň jedna kategorie');
        return;
    }
    
    const cat = state.categories[index];
    if (!confirm(`Opravdu odebrat kategorii "${cat.name}"?`)) return;
    
    state.categories.splice(index, 1);
    saveState();
    updateCategorySelects();
    updateCategoriesList();
    showToast('Kategorie odebrána');
}

// Members Management
function updateMemberSelects() {
    const group = getCurrentGroup();
    const selects = ['expensePaidBy', 'incomeRecipient'];
    
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
    showToast('Člen přidán');
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
    
    if (hasTransactions && !confirm(`${member} má transakce. Opravdu odebrat?`)) return;
    
    group.members.splice(index, 1);
    saveState();
    updateMemberSelects();
    updateMembersList();
    updateAllViews();
    showToast('Člen odebrán');
}

// Add Expense
function addExpense(e) {
    e.preventDefault();
    const group = getCurrentGroup();
    
    const description = document.getElementById('expenseDescription').value.trim();
    const amount = parseInt(document.getElementById('expenseAmount').value);
    const currency = document.getElementById('expenseCurrency').value;
    const date = document.getElementById('expenseDate').value;
    const time = document.getElementById('expenseTime').value;
    const paidBy = document.getElementById('expensePaidBy').value;
    const category = document.getElementById('expenseCategory').value;
    const note = document.getElementById('expenseNote').value.trim();
    
    const mode = document.querySelector('.mode-btn.active').dataset.mode;
    const splitBetween = [];
    
    if (mode === 'equal') {
        const checkboxes = document.querySelectorAll('#expenseSplitBetween input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            splitBetween.push({ person: cb.value, amount: null });
        });
    } else {
        const checkboxes = document.querySelectorAll('#expenseSplitBetween input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            const customAmount = parseInt(document.getElementById(`amount-${cb.value}`).value) || 0;
            if (customAmount > 0) {
                splitBetween.push({ person: cb.value, amount: customAmount });
            }
        });
    }
    
    if (!description || !amount || !paidBy || splitBetween.length === 0) {
        alert('Vyplň všechna pole');
        return;
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
    
    document.getElementById('expenseForm').reset();
    setDateTimeInputs(new Date());
    updateSplitBetween('equal');
    document.querySelector('[data-mode="equal"]').classList.add('active');
    document.querySelector('[data-mode="custom"]').classList.remove('active');
    
    switchTab('expenses');
    
    showToast('Výdaj přidán ✅');
    
    if (state.isOnline && state.scriptUrl) {
        syncWithScript();
    }
}

// Add Income
function addIncome(e) {
    e.preventDefault();
    const group = getCurrentGroup();
    
    const description = document.getElementById('incomeDescription').value.trim();
    const amount = parseInt(document.getElementById('incomeAmount').value);
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
    
    document.getElementById('incomeForm').reset();
    setDateTimeInputs(new Date());
    
    switchTab('expenses');
    
    showToast('Příjem přidán ✅');
    
    if (state.isOnline && state.scriptUrl) {
        syncWithScript();
    }
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
                ? `Rovnoměrně: ${transaction.splitBetween.map(s => s.person).join(', ')}`
                : `Vlastní: ${transaction.splitBetween.map(s => `${s.person} (${s.amount})`).join(', ')}`;
            metaInfo = `${transaction.paidBy} zaplatil • ${dateStr}<br>${splitInfo}`;
        } else {
            metaInfo = `Příjem pro: ${transaction.recipient} • ${dateStr}`;
        }
        
        const displayAmount = transaction.currency === 'CZK' 
            ? `${transaction.amount.toLocaleString('cs-CZ')} Kč`
            : `${transaction.amount.toLocaleString('cs-CZ')} ${transaction.currency} (${Math.round(transaction.amountCZK)} Kč)`;
        
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
    if (!confirm('Opravdu smazat?')) return;
    
    const group = getCurrentGroup();
    group.transactions = group.transactions.filter(t => t.id !== id);
    saveState();
    updateExpensesList();
    updateBalance();
    updateStatistics();
    showToast('Transakce smazána');
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
            balances[transaction.paidBy] += transaction.amountCZK;
            
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
    
    document.getElementById('totalExpenses').textContent = Math.round(totalExpenses).toLocaleString('cs-CZ') + ' Kč';
    document.getElementById('totalIncomes').textContent = Math.round(totalIncomes).toLocaleString('cs-CZ') + ' Kč';
    
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
                ${isPositive ? '+' : ''}${Math.round(balance).toLocaleString('cs-CZ')} Kč
            </div>
        `;
        
        list.appendChild(div);
    });
    
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
                    ${Math.round(settlement.amount).toLocaleString('cs-CZ')} Kč
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
    
    if (confirm(`Označit jako vyrovnáno:\n${settlement.from} → ${settlement.to}: ${Math.round(settlement.amount)} Kč?`)) {
        group.settlements.push({
            ...settlement,
            date: new Date().toISOString()
        });
        saveState();
        updateBalance();
        showToast('Dluh označen jako vyrovnán ✅');
    }
}

// Update Statistics
function updateStatistics() {
    const group = getCurrentGroup();
    const timeRange = document.getElementById('statsTimeRange').value;
    
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
    
    const total = transactions.reduce((sum, t) => sum + t.amountCZK, 0);
    const avg = total / transactions.length;
    
    document.getElementById('avgExpense').textContent = Math.round(avg).toLocaleString('cs-CZ') + ' Kč';
    document.getElementById('expenseCount').textContent = transactions.length;
    
    const categoryTotals = {};
    transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amountCZK;
    });
    const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('topCategory').textContent = topCat ? topCat[0] : '-';
    
    const spenderTotals = {};
    transactions.forEach(t => {
        spenderTotals[t.paidBy] = (spenderTotals[t.paidBy] || 0) + t.amountCZK;
    });
    const topSpender = Object.entries(spenderTotals).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('topSpender').textContent = topSpender ? topSpender[0] : '-';
    
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
    
    if (charts.category) charts.category.destroy();
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
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
                    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
                    '#ef4444', '#06b6d4', '#ec4899', '#84cc16'
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
                        font: { family: "'Work Sans', sans-serif", size: 11 },
                        padding: 12
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return ` ${Math.round(value).toLocaleString('cs-CZ')} Kč (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateTimelineChart(transactions) {
    const ctx = document.getElementById('timelineChart');
    
    if (charts.timeline) charts.timeline.destroy();
    
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
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return ` ${Math.round(context.parsed.y).toLocaleString('cs-CZ')} Kč`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        font: { family: "'Work Sans', sans-serif", size: 10 },
                        callback: function(value) {
                            return Math.round(value).toLocaleString('cs-CZ') + ' Kč';
                        }
                    },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: {
                        color: '#94a3b8',
                        font: { family: "'Work Sans', sans-serif", size: 9 },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { color: '#334155' }
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

// Google Apps Script Sync
function saveScriptUrl() {
    state.scriptUrl = document.getElementById('scriptUrl').value.trim();
    saveState();
    showToast('URL uloženo ✅');
}

async function testScriptConnection() {
    if (!state.scriptUrl) {
        alert('Vlož URL Apps Scriptu');
        return;
    }
    
    showToast('Testuji připojení...', 'warning');
    
    try {
        const response = await fetch(state.scriptUrl + '?action=test', {
            method: 'GET'
        });
        
        if (response.ok) {
            const data = await response.json();
            showToast(`✅ Připojeno: ${data.message || 'OK'}`, 'success');
        } else {
            throw new Error('Chyba připojení');
        }
    } catch (error) {
        showToast('❌ Chyba připojení', 'error');
        console.error(error);
    }
}

async function syncWithScript() {
    if (!state.scriptUrl) {
        showToast('Nejprve nastav Apps Script URL');
        return;
    }
    
    if (!state.isOnline) {
        showToast('Není připojení k internetu');
        return;
    }
    
    const syncBtn = document.getElementById('syncBtn');
    syncBtn.classList.add('syncing');
    showToast('Synchronizuji...', 'warning');
    
    try {
        const group = getCurrentGroup();
        const user = getCurrentUser();
        
        const response = await fetch(state.scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync',
                groupId: group.id,
                groupName: group.name,
                transactions: group.transactions,
                user: user
            })
        });
        
        if (response.ok) {
            group.transactions.forEach(t => t.synced = true);
            saveState();
            showToast('✅ Synchronizováno', 'success');
        } else {
            throw new Error('Sync failed');
        }
    } catch (error) {
        showToast('❌ Chyba synchronizace', 'error');
        console.error(error);
    } finally {
        syncBtn.classList.remove('syncing');
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');
    
    toast.className = `toast ${type}`;
    text.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Clear Data
function clearGroupData() {
    const group = getCurrentGroup();
    if (!confirm(`Opravdu smazat všechna data skupiny "${group.name}"?`)) return;
    
    group.transactions = [];
    group.settlements = [];
    saveState();
    updateAllViews();
    showToast('Data skupiny smazána');
}

function clearAllData() {
    if (!confirm('Opravdu smazat VŠECHNA data?')) return;
    if (!confirm('Jsi si opravdu jistý?')) return;
    
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
    
    showToast('Všechna data smazána');
}

// Load state on start
loadState();
