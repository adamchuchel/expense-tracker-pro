// Application State
let state = {
    scriptUrl: localStorage.getItem('scriptUrl') || '',
    groups: [],
    currentGroupId: null,
    invitations: [],
    organizationMembers: [],
    categories: [
        { name: 'Jídlo', icon: '🍕' },
        { name: 'Doprava', icon: '🚗' },
        { name: 'Ubytování', icon: '🏠' },
        { name: 'Zábava', icon: '🎉' },
        { name: 'Nákupy', icon: '🛒' },
        { name: 'Ostatní', icon: '📦' }
    ],
    exchangeRates: {
        CZK: 1, EUR: 25.0, USD: 23.0,
        GBP: 29.0, THB: 0.65, PLN: 5.8
    },
    isOnline: navigator.onLine
};

let charts = { category: null, timeline: null };

// === UTILITY FUNCTIONS ===

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// === INITIALIZATION ===

async function initializeApp() {
    console.log('🚀 Initializing FAMILY app...');
    
    // Load script URL
    const scriptUrlInput = document.getElementById('scriptUrl');
    if (scriptUrlInput) {
        scriptUrlInput.value = state.scriptUrl;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch exchange rates
    fetchExchangeRates();
    
    // Load data from backend OR local
    if (state.scriptUrl) {
        if (isOnlineGlobal) {
            try {
                await loadOrganizationData();
                await loadGroupsFromBackend();
                await loadInvitations();
            } catch (error) {
                console.error('Backend load failed, using local:', error);
                await loadFromLocal();
            }
        } else {
            console.log('⚠️ Offline mode - loading from local');
            await loadFromLocal();
            updateAllViews();
            showToast('⚠️ Offline režim', 'warning');
        }
    }
    
    // Initialize UI
    updateCategorySelects();
    setDateTimeInputs(new Date());
    await updateUnsyncedCount();
    
    // Update sidebar user info
    if (typeof updateSidebarUser === 'function') {
        setTimeout(updateSidebarUser, 500);
        setTimeout(updateSidebarUser, 1500);
    }
    
    console.log('✅ FAMILY app initialized');
}

function setupEventListeners() {
    // Navigation - bottom nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Transaction type toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleTransactionType(btn.dataset.type));
    });

    // Forms
    const expenseForm = document.getElementById('expenseForm');
    const incomeForm = document.getElementById('incomeForm');
    if (expenseForm) expenseForm.addEventListener('submit', addExpense);
    if (incomeForm) incomeForm.addEventListener('submit', addIncome);

    // Currency updates
    const expenseCurrency = document.getElementById('expenseCurrency');
    const expenseAmount = document.getElementById('expenseAmount');
    const incomeCurrency = document.getElementById('incomeCurrency');
    const incomeAmount = document.getElementById('incomeAmount');
    
    if (expenseCurrency) expenseCurrency.addEventListener('change', updateExpenseCurrencyConversion);
    if (expenseAmount) expenseAmount.addEventListener('input', updateExpenseCurrencyConversion);
    if (incomeCurrency) incomeCurrency.addEventListener('change', updateIncomeCurrencyConversion);
    if (incomeAmount) incomeAmount.addEventListener('input', updateIncomeCurrencyConversion);

    // Split mode
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleSplitMode(btn.dataset.mode));
    });

    // Group management
    const currentGroup = document.getElementById('currentGroup');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const saveGroup = document.getElementById('saveGroup');
    const cancelGroup = document.getElementById('cancelGroup');
    
    if (currentGroup) currentGroup.addEventListener('click', toggleGroupDropdown);
    if (addGroupBtn) addGroupBtn.addEventListener('click', showAddGroupModal);
    if (saveGroup) saveGroup.addEventListener('click', saveNewGroup);
    if (cancelGroup) cancelGroup.addEventListener('click', hideGroupModal);

    // Categories
    const addCategory = document.getElementById('addCategory');
    if (addCategory) addCategory.addEventListener('click', addCategoryHandler);

    // Settings
    const saveScriptUrlBtn = document.getElementById('saveScriptUrl');
    const testScriptBtn = document.getElementById('testScript');
    const clearGroupDataBtn = document.getElementById('clearGroupData');
    const clearAllDataBtn = document.getElementById('clearAllData');
    
    if (saveScriptUrlBtn) saveScriptUrlBtn.addEventListener('click', saveScriptUrl);
    if (testScriptBtn) testScriptBtn.addEventListener('click', testScriptConnection);
    if (clearGroupDataBtn) clearGroupDataBtn.addEventListener('click', clearGroupData);
    if (clearAllDataBtn) clearAllDataBtn.addEventListener('click', clearAllDataHandler);

    // Sync
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) syncBtn.addEventListener('click', syncWithBackend);

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnSettings = document.getElementById('logoutBtnSettings');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnSettings) logoutBtnSettings.addEventListener('click', handleLogout);

    // Filters
    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    const statsTimeRange = document.getElementById('statsTimeRange');
    
    if (filterType) filterType.addEventListener('change', updateExpensesList);
    if (filterCategory) filterCategory.addEventListener('change', updateExpensesList);
    if (statsTimeRange) statsTimeRange.addEventListener('change', updateStatistics);

    // Online/offline
    window.addEventListener('online', () => {
        state.isOnline = true;
        showToast('🟢 Online', 'success');
        syncWithBackend();
    });
    
    window.addEventListener('offline', () => {
        state.isOnline = false;
        showToast('🔴 Offline', 'warning');
    });

    // Click outside dropdown
    document.addEventListener('click', e => {
        if (!e.target.closest('.group-selector')) {
            const dropdown = document.getElementById('groupDropdown');
            const button = document.getElementById('currentGroup');
            if (dropdown) dropdown.classList.add('hidden');
            if (button) button.classList.remove('active');
        }
    });
}

function setDateTimeInputs(date) {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);
    
    const expenseDate = document.getElementById('expenseDate');
    const expenseTime = document.getElementById('expenseTime');
    const incomeDate = document.getElementById('incomeDate');
    const incomeTime = document.getElementById('incomeTime');
    
    if (expenseDate) expenseDate.value = dateStr;
    if (expenseTime) expenseTime.value = timeStr;
    if (incomeDate) incomeDate.value = dateStr;
    if (incomeTime) incomeTime.value = timeStr;
}

// === LOGOUT HANDLER ===

function handleLogout() {
    if (typeof logout === 'function') {
        logout();
    } else {
        console.error('❌ logout function not found');
    }
}

// === TAB SWITCHING ===

function switchTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    // Update bottom nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update sidebar nav items
    document.querySelectorAll('.settle-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetTab = document.getElementById(`${tabName}Tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Trigger specific view updates
    if (tabName === 'expenses') updateExpensesList();
    if (tabName === 'balance') updateBalance();
    if (tabName === 'stats') updateStatistics();
    if (tabName === 'invitations') updateInvitationsList();
    if (tabName === 'settings') {
        updateCategoriesList();
        updateGroupManagement();
    }
    
    console.log('✅ Tab switched to:', tabName);
}

// Export globally for sidebar access
window.switchTab = switchTab;

// === BACKEND COMMUNICATION ===

function getScriptUrl() {
    return state.scriptUrl;
}

async function apiCall(action, data = {}) {
    if (!state.scriptUrl) {
        throw new Error('Script URL not set');
    }
    
    const url = new URL(state.scriptUrl);
    url.searchParams.set('action', action);
    
    const params = new URLSearchParams();
    params.set('data', JSON.stringify(data));
    
    const response = await fetch(url + '&' + params.toString(), {
        method: 'GET',
        redirect: 'follow'
    });
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.message);
    }
    
    return result.data;
}

// === GROUPS ===

async function loadGroupsFromBackend() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const data = await apiCall('get_groups', {
            user_email: user.email
        });
        
        state.groups = data.groups;
        
        // Save to local storage
        await saveGroupsLocal(data.groups);
        
        if (state.groups.length > 0 && !state.currentGroupId) {
            state.currentGroupId = state.groups[0].group_id;
        }
        
        updateGroupSelector();
        await loadCurrentGroupData();
        
        console.log('✅ Groups loaded:', state.groups.length);
        
    } catch (error) {
        console.error('Load groups error:', error);
        showToast('❌ Chyba načítání skupin', 'error');
    }
}

async function loadCurrentGroupData() {
    const currentGroup = getCurrentGroup();
    if (!currentGroup) return;
    
    try {
        const data = await apiCall('get_transactions', {
            group_id: currentGroup.group_id
        });
        
        currentGroup.transactions = data.transactions;
        
        // Save to local storage
        await saveTransactionsLocal(currentGroup.group_id, data.transactions);
        
        updateMemberSelects();
        updateAllViews();
        
    } catch (error) {
        console.error('Load transactions error:', error);
    }
}

function getCurrentGroup() {
    return state.groups.find(g => g.group_id === state.currentGroupId);
}

function updateGroupSelector() {
    const currentGroup = getCurrentGroup();
    if (!currentGroup) return;
    
    const currentGroupName = document.getElementById('currentGroupName');
    if (currentGroupName) {
        currentGroupName.textContent = currentGroup.name;
    }
    
    const groupList = document.getElementById('groupList');
    if (!groupList) return;
    
    groupList.innerHTML = '';
    
    state.groups.forEach(group => {
        const div = document.createElement('div');
        div.className = 'group-item';
        if (group.group_id === state.currentGroupId) {
            div.classList.add('active');
        }
        
        div.innerHTML = `<span>${group.name}</span>`;
        
        div.addEventListener('click', () => {
            state.currentGroupId = group.group_id;
            updateGroupSelector();
            loadCurrentGroupData();
            updateGroupManagement();
            toggleGroupDropdown();
            showToast(`Přepnuto: ${group.name}`);
        });
        
        groupList.appendChild(div);
    });
}

function toggleGroupDropdown() {
    const dropdown = document.getElementById('groupDropdown');
    const button = document.getElementById('currentGroup');
    if (dropdown) dropdown.classList.toggle('hidden');
    if (button) button.classList.toggle('active');
}

function showAddGroupModal() {
    const modal = document.getElementById('groupModal');
    const input = document.getElementById('groupName');
    if (modal) modal.classList.remove('hidden');
    if (input) {
        input.value = '';
        input.focus();
    }
}

function hideGroupModal() {
    const modal = document.getElementById('groupModal');
    if (modal) modal.classList.add('hidden');
}

async function saveNewGroup() {
    const input = document.getElementById('groupName');
    const name = input ? input.value.trim() : '';
    
    if (!name) {
        alert('Zadej název skupiny');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const data = await apiCall('create_group', {
            name: name,
            owner_email: user.email,
            owner_name: user.name
        });
        
        await loadGroupsFromBackend();
        state.currentGroupId = data.group_id;
        
        hideGroupModal();
        showToast(`✅ Skupina "${name}" vytvořena`);
        
    } catch (error) {
        console.error('Create group error:', error);
        showToast('❌ Chyba vytvoření skupiny', 'error');
    }
}
// === MEMBERS ===

function updateMemberSelects() {
    const group = getCurrentGroup();
    const user = getCurrentUser();
    if (!group || !group.members) return;
    
    const selects = ['expensePaidBy', 'incomeRecipient'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '';
        
        group.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.email;
            option.textContent = member.name;
            
            // Auto-select current user
            if (user && member.email === user.email) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
    });
    
    // Update split with only current user pre-checked
    updateSplitBetween('equal', true);
}

function updateSplitBetween(mode = 'equal', autoSelectCurrentUser = false) {
    const container = document.getElementById('expenseSplitBetween');
    const group = getCurrentGroup();
    const user = getCurrentUser();
    if (!container || !group || !group.members) return;
    
    container.innerHTML = '';
    
    group.members.forEach(member => {
        const div = document.createElement('div');
        
        // Auto-check only current user by default
        const isCurrentUser = user && member.email === user.email;
        const shouldBeChecked = autoSelectCurrentUser ? isCurrentUser : true;
        
        div.className = shouldBeChecked ? 'split-item checked' : 'split-item';
        
        // Get first letter for avatar if no picture
        const initial = member.name.charAt(0).toUpperCase();
        const avatarStyle = member.picture 
            ? `background-image: url('${member.picture}'); background-size: cover;`
            : '';
        
        if (mode === 'equal') {
            div.innerHTML = `
                <input type="checkbox" id="split-${member.email}" value="${member.email}" ${shouldBeChecked ? 'checked' : ''}>
                <label for="split-${member.email}" class="split-label">
                    <div class="split-avatar" style="${avatarStyle}">
                        ${member.picture ? '' : initial}
                    </div>
                    <div class="split-info">
                        <span class="split-name">${member.name}</span>
                        ${isCurrentUser ? '<span class="split-badge">Ty</span>' : ''}
                    </div>
                </label>
            `;
        } else {
            div.innerHTML = `
                <input type="checkbox" id="split-${member.email}" value="${member.email}" ${shouldBeChecked ? 'checked' : ''}>
                <label for="split-${member.email}" class="split-label">
                    <div class="split-avatar" style="${avatarStyle}">
                        ${member.picture ? '' : initial}
                    </div>
                    <div class="split-info">
                        <span class="split-name">${member.name}</span>
                        ${isCurrentUser ? '<span class="split-badge">Ty</span>' : ''}
                    </div>
                </label>
                <div class="split-amount-wrapper">
                    <input type="number" id="amount-${member.email}" placeholder="0" pattern="[0-9]*" inputmode="numeric" min="0" class="split-amount-input">
                    <span class="split-currency">Kč</span>
                </div>
            `;
        }
        
        container.appendChild(div);
        
        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            div.classList.toggle('checked', checkbox.checked);
        });
    });
}

function toggleSplitMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    const modeBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (modeBtn) modeBtn.classList.add('active');
    updateSplitBetween(mode, false);
}

// === CATEGORIES ===

function updateCategorySelects() {
    const categorySelect = document.getElementById('expenseCategory');
    const filterCategory = document.getElementById('filterCategory');
    
    if (categorySelect) {
        categorySelect.innerHTML = '';
        state.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = `${cat.icon} ${cat.name}`;
            categorySelect.appendChild(option);
        });
    }
    
    if (filterCategory) {
        filterCategory.innerHTML = '<option value="all">Všechny kategorie</option>';
        state.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = `${cat.icon} ${cat.name}`;
            filterCategory.appendChild(option);
        });
    }
}

function updateCategoriesList() {
    const list = document.getElementById('categoriesList');
    if (!list) return;
    
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
    
    // Attach event listeners
    document.querySelectorAll('.category-remove').forEach(btn => {
        btn.addEventListener('click', e => {
            const index = parseInt(e.target.dataset.index);
            if (state.categories.length > 1) {
                state.categories.splice(index, 1);
                updateCategorySelects();
                updateCategoriesList();
                showToast('✅ Kategorie odebrána');
            } else {
                showToast('⚠️ Musí zůstat alespoň jedna kategorie', 'warning');
            }
        });
    });
}

function addCategoryHandler() {
    const nameInput = document.getElementById('newCategoryName');
    const iconInput = document.getElementById('newCategoryIcon');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const icon = iconInput ? iconInput.value.trim() || '📦' : '📦';
    
    if (!name) {
        alert('Zadej název kategorie');
        return;
    }
    
    state.categories.push({ name, icon });
    
    if (nameInput) nameInput.value = '';
    if (iconInput) iconInput.value = '';
    
    updateCategorySelects();
    updateCategoriesList();
    showToast('✅ Kategorie přidána');
}

// === CURRENCY ===

function convertToCZK(amount, currency) {
    if (currency === 'CZK') return amount;
    const rate = state.exchangeRates[currency] || 1;
    return Math.round(amount * rate);
}

function updateExpenseCurrencyConversion() {
    const amountInput = document.getElementById('expenseAmount');
    const currencySelect = document.getElementById('expenseCurrency');
    const note = document.getElementById('expenseCurrencyNote');
    const conversion = document.getElementById('expenseCurrencyConversion');
    
    if (!amountInput || !currencySelect || !note || !conversion) return;
    
    const amount = parseInt(amountInput.value) || 0;
    const currency = currencySelect.value;
    
    if (currency === 'CZK' || amount === 0) {
        note.classList.add('hidden');
        return;
    }
    
    const czk = convertToCZK(amount, currency);
    const rate = state.exchangeRates[currency] || 0;
    conversion.textContent = `≈ ${czk.toLocaleString('cs-CZ')} Kč (kurz: ${rate.toFixed(2)} Kč/${currency})`;
    note.classList.remove('hidden');
}

function updateIncomeCurrencyConversion() {
    const amountInput = document.getElementById('incomeAmount');
    const currencySelect = document.getElementById('incomeCurrency');
    const note = document.getElementById('incomeCurrencyNote');
    const conversion = document.getElementById('incomeCurrencyConversion');
    
    if (!amountInput || !currencySelect || !note || !conversion) return;
    
    const amount = parseInt(amountInput.value) || 0;
    const currency = currencySelect.value;
    
    if (currency === 'CZK' || amount === 0) {
        note.classList.add('hidden');
        return;
    }
    
    const czk = convertToCZK(amount, currency);
    const rate = state.exchangeRates[currency] || 0;
    conversion.textContent = `≈ ${czk.toLocaleString('cs-CZ')} Kč (kurz: ${rate.toFixed(2)} Kč/${currency})`;
    note.classList.remove('hidden');
}

async function fetchExchangeRates() {
    if (!state.isOnline) return;
    
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/CZK');
        
        if (!response.ok) throw new Error('Failed to fetch rates');
        
        const data = await response.json();
        
        const rates = {
            CZK: 1,
            EUR: 1 / data.rates.EUR,
            USD: 1 / data.rates.USD,
            GBP: 1 / data.rates.GBP,
            THB: 1 / data.rates.THB,
            PLN: 1 / data.rates.PLN
        };
        
        state.exchangeRates = rates;
        console.log('✅ Exchange rates updated');
        
    } catch (error) {
        console.log('Using fallback rates:', error.message);
    }
}

// === UI UPDATES ===

function toggleTransactionType(type) {
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    const typeBtn = document.querySelector(`[data-type="${type}"]`);
    if (typeBtn) typeBtn.classList.add('active');
    
    const expenseForm = document.getElementById('expenseForm');
    const incomeForm = document.getElementById('incomeForm');
    
    if (type === 'expense') {
        if (expenseForm) expenseForm.classList.remove('hidden');
        if (incomeForm) incomeForm.classList.add('hidden');
    } else {
        if (expenseForm) expenseForm.classList.add('hidden');
        if (incomeForm) incomeForm.classList.remove('hidden');
    }
}

function updateExpensesList() {
    const group = getCurrentGroup();
    const list = document.getElementById('expensesList');
    
    if (!list) return;
    
    if (!group || !group.transactions) {
        list.innerHTML = '<p class="empty-state">Žádné transakce</p>';
        return;
    }
    
    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    
    const filterTypeValue = filterType ? filterType.value : 'all';
    const filterCategoryValue = filterCategory ? filterCategory.value : 'all';
    
    let transactions = group.transactions.filter(t => {
        if (filterTypeValue !== 'all' && t.type !== filterTypeValue) return false;
        if (filterCategoryValue !== 'all' && t.type === 'expense' && t.category !== filterCategoryValue) return false;
        return true;
    });
    
    if (transactions.length === 0) {
        list.innerHTML = '<p class="empty-state">Žádné transakce neodpovídají filtrům</p>';
        return;
    }
    
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = '';
    transactions.forEach(t => {
        const div = document.createElement('div');
        div.className = `expense-item ${t.type}`;
        
        const date = new Date(t.date);
        const dateStr = date.toLocaleDateString('cs-CZ', { 
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        const displayAmount = t.currency === 'CZK' 
            ? `${t.amount.toLocaleString('cs-CZ')} Kč`
            : `${t.amount.toLocaleString('cs-CZ')} ${t.currency} (${Math.round(t.amount_czk)} Kč)`;
        
        let meta = '';
        if (t.type === 'expense') {
            const member = group.members.find(m => m.email === t.paid_by);
            meta = `${member ? member.name : t.paid_by} zaplatil • ${dateStr}`;
        } else {
            const member = group.members.find(m => m.email === t.recipient);
            meta = `Příjem pro: ${member ? member.name : t.recipient} • ${dateStr}`;
        }
        
        div.innerHTML = `
            <div class="expense-header">
                <div class="expense-description">
                    ${t.type === 'expense' ? t.category : '💵'} - ${t.description}
                </div>
                <div class="expense-amount">${displayAmount}</div>
            </div>
            <div class="expense-meta">${meta}</div>
            ${t.note ? `<div class="expense-note">${t.note}</div>` : ''}
            <div class="expense-actions">
                <button class="btn-edit" data-transaction-id="${t.transaction_id}">
                    ✏️ Upravit
                </button>
                <button class="btn-delete" data-transaction-id="${t.transaction_id}">
                    🗑️ Smazat
                </button>
            </div>
        `;
        
        list.appendChild(div);
        
        // Attach event listeners
        const editBtn = div.querySelector('.btn-edit');
        const deleteBtn = div.querySelector('.btn-delete');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => editTransaction(t.transaction_id));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteTransaction(t.transaction_id));
        }
    });
}

function updateBalance() {
    const group = getCurrentGroup();
    if (!group || !group.transactions) return;
    
    const balances = {};
    group.members.forEach(m => balances[m.email] = 0);
    
    group.transactions.forEach(t => {
        if (t.type === 'expense') {
            balances[t.paid_by] += t.amount_czk;
            
            const sharePerPerson = t.amount_czk / t.split_between.length;
            t.split_between.forEach(split => {
                if (balances[split.person] !== undefined) {
                    balances[split.person] -= sharePerPerson;
                }
            });
        } else if (t.type === 'income') {
            balances[t.recipient] += t.amount_czk;
        }
    });
    
    const list = document.getElementById('balanceList');
    if (!list) return;
    
    list.innerHTML = '';
    
    Object.entries(balances).forEach(([email, balance]) => {
        const member = group.members.find(m => m.email === email);
        const div = document.createElement('div');
        div.className = 'balance-item';
        
        const isPositive = balance > 0.01;
        const isNegative = balance < -0.01;
        
        div.innerHTML = `
            <div class="balance-name">${member ? member.name : email}</div>
            <div class="balance-amount ${isPositive ? 'positive' : isNegative ? 'negative' : ''}">
                ${isPositive ? '+' : ''}${Math.round(balance).toLocaleString('cs-CZ')} Kč
            </div>
        `;
        
        list.appendChild(div);
    });
}

function updateStatistics() {
    const group = getCurrentGroup();
    if (!group || !group.transactions) return;
    
    const expenses = group.transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + t.amount_czk, 0);
    const avg = expenses.length > 0 ? total / expenses.length : 0;
    
    const avgExpense = document.getElementById('avgExpense');
    const expenseCount = document.getElementById('expenseCount');
    
    if (avgExpense) avgExpense.textContent = Math.round(avg).toLocaleString('cs-CZ') + ' Kč';
    if (expenseCount) expenseCount.textContent = expenses.length;
}

function updateAllViews() {
    updateExpensesList();
    updateBalance();
    updateStatistics();
}

// === SYNC & SETTINGS ===

async function syncWithBackend() {
    if (!state.scriptUrl) {
        showToast('Nejprve nastav Script URL', 'warning');
        return;
    }
    
    if (!isOnlineGlobal) {
        showToast('⚠️ Offline - nelze synchronizovat', 'warning');
        return;
    }
    
    await syncAllData();
}

function saveScriptUrl() {
    const input = document.getElementById('scriptUrl');
    if (!input) return;
    
    state.scriptUrl = input.value.trim();
    localStorage.setItem('scriptUrl', state.scriptUrl);
    showToast('✅ URL uloženo');
}

async function testScriptConnection() {
    if (!state.scriptUrl) {
        alert('Vlož Script URL');
        return;
    }
    
    try {
        const response = await fetch(state.scriptUrl);
        const data = await response.json();
        showToast('✅ ' + (data.message || 'Připojení OK'), 'success');
    } catch (error) {
        showToast('❌ Chyba připojení', 'error');
    }
}

function clearGroupData() {
    if (!confirm('Opravdu smazat data této skupiny?')) return;
    
    const group = getCurrentGroup();
    if (group) {
        group.transactions = [];
        updateAllViews();
        showToast('✅ Data skupiny smazána');
    }
}

function clearAllDataHandler() {
    if (!confirm('Opravdu smazat VŠ ECHNA data?\n\nTato akce je NEVRATNÁ!')) return;
    if (!confirm('Jsi si naprosto jistý?')) return;
    
    clearAllData().then(() => {
        state.groups = [];
        state.currentGroupId = null;
        state.invitations = [];
        showToast('✅ Všechna data smazána');
        updateAllViews();
    });
}

// === TOAST ===

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');
    
    if (!toast || !text) return;
    
    toast.className = `toast ${type}`;
    text.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

console.log('✅ FAMILY App script loaded (part 2/3)');
// === TRANSACTIONS ===

async function addExpense(e) {
    e.preventDefault();
    
    const group = getCurrentGroup();
    const user = getCurrentUser();
    if (!group || !user) return;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    const originalText = submitBtn.innerHTML;
    const isEditing = e.target.dataset.editingId;
    
    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? '⏳ Ukládám...' : '⏳ Přidávám...';
    
    const description = document.getElementById('expenseDescription').value.trim();
    const amount = parseInt(document.getElementById('expenseAmount').value);
    const currency = document.getElementById('expenseCurrency').value;
    const date = document.getElementById('expenseDate').value;
    const time = document.getElementById('expenseTime').value;
    const paidBy = document.getElementById('expensePaidBy').value;
    const category = document.getElementById('expenseCategory').value;
    const note = document.getElementById('expenseNote').value.trim();
    
    const mode = document.querySelector('.mode-btn.active')?.dataset.mode || 'equal';
    const splitBetween = [];
    
    if (mode === 'equal') {
        const checkboxes = document.querySelectorAll('#expenseSplitBetween input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            splitBetween.push({ person: cb.value, amount: null });
        });
    } else {
        const checkboxes = document.querySelectorAll('#expenseSplitBetween input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            const customAmount = parseInt(document.getElementById(`amount-${cb.value}`)?.value) || 0;
            if (customAmount > 0) {
                splitBetween.push({ person: cb.value, amount: customAmount });
            }
        });
    }
    
    if (!description || !amount || !paidBy || splitBetween.length === 0) {
        alert('Vyplň všechna pole');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    const amountCZK = convertToCZK(amount, currency);
    
    const transaction = {
        transaction_id: generateId(),
        group_id: group.group_id,
        type: 'expense',
        description,
        amount,
        currency,
        amount_czk: amountCZK,
        paid_by: paidBy,
        split_between: splitBetween,
        category,
        note,
        date: `${date}T${time}`,
        created_by: user.email,
        created_at: new Date().toISOString()
    };
    
    try {
        if (isEditing) {
            if (isOnlineGlobal) {
                await apiCall('delete_transaction', {
                    transaction_id: isEditing,
                    user_email: user.email
                });
            } else {
                await deleteTransactionLocal(isEditing);
            }
        }
        
        if (isOnlineGlobal) {
            await apiCall('add_transaction', {
                transaction: transaction,
                user_email: user.email
            });
            await loadCurrentGroupData();
        } else {
            await addTransactionOffline(transaction, user.email);
            updateAllViews();
            await updateUnsyncedCount();
            showToast('⚠️ Uloženo lokálně - synchronizuje se při připojení', 'warning');
        }
        
        document.getElementById('expenseForm').reset();
        delete e.target.dataset.editingId;
        setDateTimeInputs(new Date());
        updateSplitBetween('equal', true);
        
        submitBtn.innerHTML = '<span class="btn-icon">💸</span> Přidat výdaj';
        
        switchTab('expenses');
        
        if (isOnlineGlobal) {
            showToast(isEditing ? '✅ Výdaj upraven' : '✅ Výdaj přidán');
        }
        
    } catch (error) {
        console.error('Add/edit expense error:', error);
        showToast('❌ Chyba', 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

async function addIncome(e) {
    e.preventDefault();
    
    const group = getCurrentGroup();
    const user = getCurrentUser();
    if (!group || !user) return;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    const originalText = submitBtn.innerHTML;
    const isEditing = e.target.dataset.editingId;
    
    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? '⏳ Ukládám...' : '⏳ Přidávám...';
    
    const description = document.getElementById('incomeDescription').value.trim();
    const amount = parseInt(document.getElementById('incomeAmount').value);
    const currency = document.getElementById('incomeCurrency').value;
    const date = document.getElementById('incomeDate').value;
    const time = document.getElementById('incomeTime').value;
    const recipient = document.getElementById('incomeRecipient').value;
    const note = document.getElementById('incomeNote').value.trim();
    
    if (!description || !amount || !recipient) {
        alert('Vyplň všechna pole');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    const amountCZK = convertToCZK(amount, currency);
    
    const transaction = {
        transaction_id: generateId(),
        group_id: group.group_id,
        type: 'income',
        description,
        amount,
        currency,
        amount_czk: amountCZK,
        recipient,
        note,
        date: `${date}T${time}`,
        created_by: user.email,
        created_at: new Date().toISOString()
    };
    
    try {
        if (isEditing) {
            if (isOnlineGlobal) {
                await apiCall('delete_transaction', {
                    transaction_id: isEditing,
                    user_email: user.email
                });
            } else {
                await deleteTransactionLocal(isEditing);
            }
        }
        
        if (isOnlineGlobal) {
            await apiCall('add_transaction', {
                transaction: transaction,
                user_email: user.email
            });
            await loadCurrentGroupData();
        } else {
            await addTransactionOffline(transaction, user.email);
            updateAllViews();
            await updateUnsyncedCount();
            showToast('⚠️ Uloženo lokálně - synchronizuje se při připojení', 'warning');
        }
        
        document.getElementById('incomeForm').reset();
        delete e.target.dataset.editingId;
        setDateTimeInputs(new Date());
        
        submitBtn.innerHTML = '<span class="btn-icon">💵</span> Přidat příjem';
        
        switchTab('expenses');
        
        if (isOnlineGlobal) {
            showToast(isEditing ? '✅ Příjem upraven' : '✅ Příjem přidán');
        }
        
    } catch (error) {
        console.error('Add/edit income error:', error);
        showToast('❌ Chyba', 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

async function deleteTransaction(transactionId) {
    const user = getCurrentUser();
    const group = getCurrentGroup();
    if (!user || !group) return;
    
    const transaction = group.transactions.find(t => t.transaction_id === transactionId);
    if (!transaction) return;
    
    if (transaction.created_by !== user.email) {
        alert('Můžeš smazat pouze své vlastní výdaje');
        return;
    }
    
    if (!confirm(`Opravdu smazat: ${transaction.description}?`)) return;
    
    try {
        showToast('⏳ Mažu...', 'warning');
        
        await apiCall('delete_transaction', {
            transaction_id: transactionId,
            user_email: user.email
        });
        
        await loadCurrentGroupData();
        showToast('✅ Výdaj smazán');
        
    } catch (error) {
        console.error('Delete transaction error:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

async function editTransaction(transactionId) {
    const group = getCurrentGroup();
    const user = getCurrentUser();
    if (!group || !user) return;
    
    const transaction = group.transactions.find(t => t.transaction_id === transactionId);
    if (!transaction) return;
    
    if (transaction.created_by !== user.email) {
        alert('Můžeš upravit pouze své vlastní výdaje');
        return;
    }
    
    switchTab('add');
    
    if (transaction.type === 'expense') {
        const expenseTypeBtn = document.querySelector('[data-type="expense"]');
        if (expenseTypeBtn) expenseTypeBtn.click();
        
        document.getElementById('expenseDescription').value = transaction.description;
        document.getElementById('expenseAmount').value = transaction.amount;
        document.getElementById('expenseCurrency').value = transaction.currency;
        
        const date = new Date(transaction.date);
        document.getElementById('expenseDate').value = date.toISOString().split('T')[0];
        document.getElementById('expenseTime').value = date.toTimeString().slice(0, 5);
        
        document.getElementById('expensePaidBy').value = transaction.paid_by;
        document.getElementById('expenseCategory').value = transaction.category || '';
        document.getElementById('expenseNote').value = transaction.note || '';
        
        if (transaction.split_between && transaction.split_between.length > 0) {
            const hasCustomAmounts = transaction.split_between.some(s => s.amount !== null);
            const mode = hasCustomAmounts ? 'custom' : 'equal';
            
            const modeBtn = document.querySelector(`[data-mode="${mode}"]`);
            if (modeBtn) modeBtn.click();
            
            setTimeout(() => {
                transaction.split_between.forEach(split => {
                    const checkbox = document.getElementById(`split-${split.person}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.closest('.split-item')?.classList.add('checked');
                        
                        if (split.amount !== null) {
                            const amountInput = document.getElementById(`amount-${split.person}`);
                            if (amountInput) amountInput.value = split.amount;
                        }
                    }
                });
            }, 100);
        }
        
        document.getElementById('expenseForm').dataset.editingId = transactionId;
        
        const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '💾 Uložit změny';
        
        showToast('📝 Editace výdaje - uprav a ulož změny', 'warning');
    } else {
        const incomeTypeBtn = document.querySelector('[data-type="income"]');
        if (incomeTypeBtn) incomeTypeBtn.click();
        
        document.getElementById('incomeDescription').value = transaction.description;
        document.getElementById('incomeAmount').value = transaction.amount;
        document.getElementById('incomeCurrency').value = transaction.currency;
        
        const date = new Date(transaction.date);
        document.getElementById('incomeDate').value = date.toISOString().split('T')[0];
        document.getElementById('incomeTime').value = date.toTimeString().slice(0, 5);
        
        document.getElementById('incomeRecipient').value = transaction.recipient || transaction.paid_by;
        document.getElementById('incomeNote').value = transaction.note || '';
        
        document.getElementById('incomeForm').dataset.editingId = transactionId;
        
        const submitBtn = document.querySelector('#incomeForm button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '💾 Uložit změny';
        
        showToast('📝 Editace příjmu - uprav a ulož změny', 'warning');
    }
}

// === ORGANIZATION ===

async function loadOrganizationData() {
    try {
        const data = await apiCall('get_organization', {});
        state.organizationMembers = data.members || [];
        
        const count = state.organizationMembers.length;
        const label = count === 1 ? 'člen' : (count >= 2 && count <= 4) ? 'členové' : 'členů';
        
        const orgMembersCount = document.getElementById('orgMembersCount');
        if (orgMembersCount) {
            orgMembersCount.textContent = `${count} ${label}`;
        }
        
        console.log('✅ Organization loaded:', data.name, '-', count, label);
    } catch (error) {
        console.error('Load organization error:', error);
        const orgMembersCount = document.getElementById('orgMembersCount');
        if (orgMembersCount) orgMembersCount.textContent = '0 členů';
    }
}

// === INVITATIONS ===

async function loadInvitations() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const data = await apiCall('get_invitations', {
            user_email: user.email
        });
        
        state.invitations = data.invitations;
        updateInvitationsList();
        
        if (data.invitations.length > 0) {
            showToast(`📬 Máš ${data.invitations.length} nových pozvánek!`, 'success');
        }
        
    } catch (error) {
        console.error('Load invitations error:', error);
    }
}

function updateInvitationsList() {
    const list = document.getElementById('invitationsList');
    if (!list) return;
    
    if (state.invitations.length === 0) {
        list.innerHTML = '<p class="empty-state">Žádné čekající pozvánky</p>';
        return;
    }
    
    list.innerHTML = '';
    
    state.invitations.forEach(inv => {
        const div = document.createElement('div');
        div.className = 'invitation-item';
        
        const date = new Date(inv.created_at);
        const dateStr = date.toLocaleDateString('cs-CZ');
        
        div.innerHTML = `
            <div class="invitation-header">
                <div class="invitation-title">
                    <strong>${inv.group_name}</strong>
                </div>
                <div class="invitation-date">${dateStr}</div>
            </div>
            <div class="invitation-from">
                Pozvánka od: ${inv.invited_by_name}
            </div>
            <div class="invitation-actions">
                <button class="btn-success" data-invitation-id="${inv.invitation_id}">
                    ✓ Přijmout
                </button>
                <button class="btn-secondary" data-invitation-id="${inv.invitation_id}">
                    ✗ Odmítnout
                </button>
            </div>
        `;
        
        list.appendChild(div);
        
        // Attach event listeners
        const acceptBtn = div.querySelector('.btn-success');
        const declineBtn = div.querySelector('.btn-secondary');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => acceptInvitation(inv.invitation_id));
        }
        if (declineBtn) {
            declineBtn.addEventListener('click', () => declineInvitation(inv.invitation_id));
        }
    });
}

async function acceptInvitation(invitationId) {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const data = await apiCall('accept_invitation', {
            invitation_id: invitationId,
            user_email: user.email,
            user_name: user.name
        });
        
        await loadGroupsFromBackend();
        await loadInvitations();
        
        showToast(`✅ Přijato! Vítej ve skupině ${data.group_name}`, 'success');
        switchTab('expenses');
        
    } catch (error) {
        console.error('Accept invitation error:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

async function declineInvitation(invitationId) {
    const user = getCurrentUser();
    if (!user) return;
    
    if (!confirm('Opravdu odmítnout pozvánku?')) return;
    
    try {
        await apiCall('decline_invitation', {
            invitation_id: invitationId,
            user_email: user.email
        });
        
        await loadInvitations();
        showToast('Pozvánka odmítnuta', 'success');
        
    } catch (error) {
        console.error('Decline invitation error:', error);
        showToast('❌ Chyba při odmítnutí', 'error');
    }
}

// === GROUP MANAGEMENT ===

function updateGroupManagement() {
    const container = document.getElementById('currentGroupManagement');
    if (!container) return;
    
    const group = getCurrentGroup();
    
    if (!group) {
        container.innerHTML = '<p class="empty-state">Vyber skupinu</p>';
        return;
    }
    
    const user = getCurrentUser();
    const isOwner = group.is_owner;
    
    let html = `
        <div class="group-info-card">
            <h4>${group.name}</h4>
            <div class="group-meta">Vytvořeno: ${new Date(group.created_at).toLocaleDateString('cs-CZ')}</div>
        </div>
        
        <div class="members-section">
            <h4>👥 Členové skupiny (${group.members.length})</h4>
            <div class="members-grid">
    `;
    
    group.members.forEach(member => {
        const isMe = member.email === user.email;
        const canRemove = isOwner && !isMe && member.role !== 'owner';
        
        html += `
            <div class="member-card">
                <div class="member-info">
                    <div class="member-name">
                        ${member.name} ${isMe ? '(ty)' : ''}
                    </div>
                    <div class="member-email">${member.email}</div>
                    <div class="member-role">${member.role === 'owner' ? '👑 Vlastník' : '👤 Člen'}</div>
                </div>
                ${canRemove ? `
                    <button class="btn-danger-small" data-member-email="${member.email}">
                        Odebrat
                    </button>
                ` : ''}
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    if (isOwner) {
        html += `
            <div class="invite-section">
                <h4>➕ Pozvat člena</h4>
                <p class="help-text">Pozvi kohokoli z organizace FAMILY</p>
                <div class="invite-form">
                    <input type="email" id="inviteEmail" placeholder="Email člena" class="invite-input">
                    <button id="inviteMemberBtn" class="btn-primary">Poslat pozvánku</button>
                </div>
            </div>
            
            <div class="danger-zone">
                <h4>🗑️ Nebezpečná zóna</h4>
                <p class="help-text">Smazání skupiny je nevratné!</p>
                <button id="deleteCurrentGroupBtn" class="btn-danger">
                    Smazat skupinu
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Attach event listeners
    const inviteBtn = document.getElementById('inviteMemberBtn');
    if (inviteBtn) inviteBtn.addEventListener('click', inviteMember);
    
    const deleteGroupBtn = document.getElementById('deleteCurrentGroupBtn');
    if (deleteGroupBtn) deleteGroupBtn.addEventListener('click', deleteCurrentGroup);
    
    document.querySelectorAll('.btn-danger-small').forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.dataset.memberEmail;
            if (email) removeMember(email);
        });
    });
}

async function inviteMember() {
    const input = document.getElementById('inviteEmail');
    const email = input ? input.value.trim() : '';
    
    if (!email) {
        alert('Zadej email');
        return;
    }
    
    if (!email.includes('@')) {
        alert('Neplatný email');
        return;
    }
    
    const group = getCurrentGroup();
    const user = getCurrentUser();
    
    if (!group || !user) return;
    
    if (group.members.some(m => m.email === email)) {
        alert('Tento člověk už je ve skupině');
        return;
    }
    
    try {
        await apiCall('invite_member', {
            group_id: group.group_id,
            invited_email: email,
            invited_by: user.email,
            invited_by_name: user.name
        });
        
        if (input) input.value = '';
        showToast(`✅ Pozvánka odeslána na ${email}`, 'success');
        
    } catch (error) {
        console.error('Invite error:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

async function removeMember(memberEmail) {
    const group = getCurrentGroup();
    const user = getCurrentUser();
    
    if (!group || !user) return;
    
    const member = group.members.find(m => m.email === memberEmail);
    if (!member) return;
    
    if (!confirm(`Opravdu odebrat ${member.name} ze skupiny?`)) return;
    
    try {
        await apiCall('remove_member', {
            group_id: group.group_id,
            member_email: memberEmail,
            user_email: user.email
        });
        
        await loadGroupsFromBackend();
        await loadCurrentGroupData();
        updateGroupManagement();
        
        showToast(`✅ ${member.name} odebrán ze skupiny`, 'success');
        
    } catch (error) {
        console.error('Remove member error:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

async function deleteCurrentGroup() {
    const group = getCurrentGroup();
    const user = getCurrentUser();
    
    if (!group || !user) return;
    
    if (!group.is_owner) {
        alert('Pouze vlastník může smazat skupinu');
        return;
    }
    
    if (!confirm(`OPRAVDU smazat skupinu "${group.name}"?\n\nTato akce je NEVRATNÁ!\nVšechny výdaje budou smazány!`)) {
        return;
    }
    
    if (!confirm('Jsi si naprosto jistý? Nelze vrátit zpět!')) {
        return;
    }
    
    try {
        await apiCall('delete_group', {
            group_id: group.group_id,
            user_email: user.email
        });
        
        await loadGroupsFromBackend();
        showToast('✅ Skupina smazána', 'success');
        
    } catch (error) {
        console.error('Delete group error:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

console.log('✅ FAMILY App script loaded - COMPLETE!');
