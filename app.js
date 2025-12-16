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

// === INITIALIZATION ===

async function initializeApp() {
    console.log('🚀 Initializing FAMILY app...');
    
    // Load script URL
    document.getElementById('scriptUrl').value = state.scriptUrl;
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch exchange rates
    fetchExchangeRates();
    
    // Load data from backend OR local
    if (state.scriptUrl) {
        if (isOnlineGlobal) {
            // Online: try backend, fallback to local
            try {
                await loadOrganizationData();
                await loadGroupsFromBackend();
                await loadInvitations();
            } catch (error) {
                console.error('Backend load failed, using local:', error);
                await loadFromLocal();
            }
        } else {
            // Offline: load from local
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
    
    console.log('✅ FAMILY app initialized');
}

function setupEventListeners() {
    // Navigation
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

    // Currency updates
    document.getElementById('expenseCurrency').addEventListener('change', updateExpenseCurrencyConversion);
    document.getElementById('expenseAmount').addEventListener('input', updateExpenseCurrencyConversion);
    document.getElementById('incomeCurrency').addEventListener('change', updateIncomeCurrencyConversion);
    document.getElementById('incomeAmount').addEventListener('input', updateIncomeCurrencyConversion);

    // Split mode
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

    // Settings
    document.getElementById('saveScriptUrl').addEventListener('click', saveScriptUrl);
    document.getElementById('testScript').addEventListener('click', testScriptConnection);

    // Sync
    document.getElementById('syncBtn').addEventListener('click', syncWithBackend);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('logoutBtnSettings').addEventListener('click', logout);

    // Filters
    document.getElementById('filterType').addEventListener('change', updateExpensesList);
    document.getElementById('filterCategory').addEventListener('change', updateExpensesList);
    document.getElementById('statsTimeRange').addEventListener('change', updateStatistics);

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
            document.getElementById('groupDropdown')?.classList.add('hidden');
            document.getElementById('currentGroup')?.classList.remove('active');
        }
    });
}

function setDateTimeInputs(date) {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);
    
    document.getElementById('expenseDate').value = dateStr;
    document.getElementById('expenseTime').value = timeStr;
    document.getElementById('incomeDate').value = dateStr;
    document.getElementById('incomeTime').value = timeStr;
}

// === BACKEND COMMUNICATION ===

function getScriptUrl() {
    return state.scriptUrl;
}

async function apiCall(action, data = {}) {
    if (!state.scriptUrl) {
        throw new Error('Script URL not set');
    }
    
    // Apps Script requires special handling to avoid CORS preflight
    const url = new URL(state.scriptUrl);
    url.searchParams.set('action', action);
    
    // Add data as URL parameters for simple requests
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
    
    document.getElementById('currentGroupName').textContent = currentGroup.name;
    
    const groupList = document.getElementById('groupList');
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
    dropdown.classList.toggle('hidden');
    button.classList.toggle('active');
}

function showAddGroupModal() {
    document.getElementById('groupModal').classList.remove('hidden');
    document.getElementById('groupName').value = '';
    document.getElementById('groupName').focus();
}

function hideGroupModal() {
    document.getElementById('groupModal').classList.add('hidden');
}

async function saveNewGroup() {
    const name = document.getElementById('groupName').value.trim();
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
    if (!group || !group.members) return;
    
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
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    updateSplitBetween(mode, false); // Don't auto-select when manually switching modes
}

// === CATEGORIES ===

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
        btn.addEventListener('click', e => {
            const index = parseInt(e.target.dataset.index);
            if (state.categories.length > 1) {
                state.categories.splice(index, 1);
                updateCategorySelects();
                updateCategoriesList();
            }
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
    
    state.categories.push({ name, icon });
    document.getElementById('newCategoryName').value = '';
    document.getElementById('newCategoryIcon').value = '';
    
    updateCategorySelects();
    updateCategoriesList();
    showToast('✅ Kategorie přidána');
}

// === TRANSACTIONS ===

async function addExpense(e) {
    e.preventDefault();
    
    const group = getCurrentGroup();
    const user = getCurrentUser();
    if (!group || !user) return;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const isEditing = e.target.dataset.editingId;
    
    // Disable button and show loading
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
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }
    
    const amountCZK = convertToCZK(amount, currency);
    
    const transaction = {
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
        date: `${date}T${time}`
    };
    
    try {
        if (isEditing) {
            // Delete old, add new (simpler than update API)
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
            // Online: send to backend
            await apiCall('add_transaction', {
                transaction,
                user_email: user.email
            });
            
            await loadCurrentGroupData();
        } else {
            // Offline: save locally
            await addTransactionOffline(transaction, user.email);
            updateAllViews();
            await updateUnsyncedCount();
            showToast('⚠️ Uloženo lokálně - synchronizuje se při připojení', 'warning');
        }
        
        document.getElementById('expenseForm').reset();
        delete e.target.dataset.editingId;
        setDateTimeInputs(new Date());
        updateSplitBetween('equal', true); // Auto-select current user
        
        // Reset button text
        submitBtn.textContent = 'Přidat výdaj';
        
        switchTab('expenses');
        
        if (isOnlineGlobal) {
            showToast(isEditing ? '✅ Výdaj upraven' : '✅ Výdaj přidán');
        }
        
    } catch (error) {
        console.error('Add/edit expense error:', error);
        showToast('❌ Chyba', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isEditing ? '💾 Uložit změny' : 'Přidat výdaj';
    }
}

async function addIncome(e) {
    e.preventDefault();
    
    const group = getCurrentGroup();
    const user = getCurrentUser();
    if (!group || !user) return;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const isEditing = e.target.dataset.editingId;
    
    // Disable button and show loading
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
        submitBtn.textContent = originalText;
        return;
    }
    
    const amountCZK = convertToCZK(amount, currency);
    
    const transaction = {
        group_id: group.group_id,
        type: 'income',
        description,
        amount,
        currency,
        amount_czk: amountCZK,
        recipient,
        note,
        date: `${date}T${time}`
    };
    
    try {
        if (isEditing) {
            // Delete old, add new
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
            // Online: send to backend
            await apiCall('add_transaction', {
                transaction,
                user_email: user.email
            });
            
            await loadCurrentGroupData();
        } else {
            // Offline: save locally
            transaction.recipient = recipient; // For income
            await addTransactionOffline(transaction, user.email);
            updateAllViews();
            await updateUnsyncedCount();
            showToast('⚠️ Uloženo lokálně - synchronizuje se při připojení', 'warning');
        }
        
        document.getElementById('incomeForm').reset();
        delete e.target.dataset.editingId;
        setDateTimeInputs(new Date());
        
        switchTab('expenses');
        
        if (isOnlineGlobal) {
            showToast(isEditing ? '✅ Příjem upraven' : '✅ Příjem přidán');
        }
        
    } catch (error) {
        console.error('Add/edit income error:', error);
        showToast('❌ Chyba', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isEditing ? '💾 Uložit změny' : 'Přidat příjem';
    }
}

// === CURRENCY ===

function convertToCZK(amount, currency) {
    if (currency === 'CZK') return amount;
    const rate = state.exchangeRates[currency] || 1;
    return amount * rate;
}

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

async function fetchExchangeRates() {
    if (!state.isOnline) return;
    
    try {
        // Use Exchange Rate API (free, no auth needed, no CORS issues)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/CZK');
        
        if (!response.ok) {
            throw new Error('Failed to fetch rates');
        }
        
        const data = await response.json();
        
        // Convert from CZK base to rates per 1 unit of foreign currency
        // API gives: 1 CZK = X foreign currency
        // We need: 1 foreign currency = Y CZK
        const rates = {
            CZK: 1,
            EUR: 1 / data.rates.EUR,
            USD: 1 / data.rates.USD,
            GBP: 1 / data.rates.GBP,
            THB: 1 / data.rates.THB,
            PLN: 1 / data.rates.PLN
        };
        
        state.exchangeRates = rates;
        console.log('✅ Exchange rates updated from Exchange Rate API');
        console.log('Rates:', rates);
        
    } catch (error) {
        console.log('Using fallback rates:', error.message);
        // Fallback rates (approximate)
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

// === UI UPDATES ===

// Export for sidebar access
window.switchTab = function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    if (tabName === 'expenses') updateExpensesList();
    if (tabName === 'balance') updateBalance();
    if (tabName === 'stats') updateStatistics();
    if (tabName === 'invitations') updateInvitationsList();
    if (tabName === 'settings') {
        updateCategoriesList();
        updateGroupManagement();
    }
}

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

function updateExpensesList() {
    const group = getCurrentGroup();
    if (!group || !group.transactions) {
        document.getElementById('expensesList').innerHTML = '<p class="empty-state">Žádné transakce</p>';
        return;
    }
    
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
                <button class="btn-edit" onclick="editTransaction('${t.transaction_id}')">
                    ✏️ Upravit
                </button>
                <button class="btn-delete" onclick="deleteTransaction('${t.transaction_id}')">
                    🗑️ Smazat
                </button>
            </div>
        `;
        
        list.appendChild(div);
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
    // Basic stats implementation
    const group = getCurrentGroup();
    if (!group || !group.transactions) return;
    
    const expenses = group.transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + t.amount_czk, 0);
    const avg = expenses.length > 0 ? total / expenses.length : 0;
    
    document.getElementById('avgExpense').textContent = Math.round(avg).toLocaleString('cs-CZ') + ' Kč';
    document.getElementById('expenseCount').textContent = expenses.length;
}

function updateAllViews() {
    updateExpensesList();
    updateBalance();
    updateStatistics();
}

// === SYNC ===

async function syncWithBackend() {
    if (!state.scriptUrl) {
        showToast('Nejprve nastav Script URL');
        return;
    }
    
    if (!isOnlineGlobal) {
        showToast('⚠️ Offline - nelze synchronizovat', 'warning');
        return;
    }
    
    await syncAllData();
}

function saveScriptUrl() {
    state.scriptUrl = document.getElementById('scriptUrl').value.trim();
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
        showToast('✅ ' + data.message, 'success');
    } catch (error) {
        showToast('❌ Chyba připojení', 'error');
    }
}

// === TOAST ===

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');
    
    toast.className = `toast ${type}`;
    text.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// === ORGANIZATION ===

async function loadOrganizationData() {
    try {
        const data = await apiCall('get_organization', {});
        state.organizationMembers = data.members || [];
        
        const count = state.organizationMembers.length;
        document.getElementById('orgMembersCount').textContent = 
            `${count} ${count === 1 ? 'člen' : count < 5 ? 'členové' : 'členů'}`;
        
        console.log('✅ Organization loaded:', data.name, '-', count, 'members');
    } catch (error) {
        console.error('Load organization error:', error);
        document.getElementById('orgMembersCount').textContent = '0 členů';
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
        
        // Show badge if has invitations
        if (data.invitations.length > 0) {
            showToast(`📬 Máš ${data.invitations.length} nových pozvánek!`, 'success');
        }
        
    } catch (error) {
        console.error('Load invitations error:', error);
    }
}

function updateInvitationsList() {
    const list = document.getElementById('invitationsList');
    
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
                <button class="btn-success" onclick="acceptInvitation('${inv.invitation_id}')">
                    ✓ Přijmout
                </button>
                <button class="btn-secondary" onclick="declineInvitation('${inv.invitation_id}')">
                    ✗ Odmítnout
                </button>
            </div>
        `;
        
        list.appendChild(div);
    });
}

async function acceptInvitation(invitationId) {
    const user = getCurrentUser();
    if (!user) return;
    
    // Find button and disable it immediately
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Přijímám...';
    
    try {
        const data = await apiCall('accept_invitation', {
            invitation_id: invitationId,
            user_email: user.email,
            user_name: user.name
        });
        
        await loadGroupsFromBackend();
        await loadInvitations();
        
        showToast(`✅ Přijato! Vítej ve skupině ${data.group_name}`, 'success');
        
        // Switch to groups tab
        switchTab('expenses');
        
    } catch (error) {
        console.error('Accept invitation error:', error);
        showToast('❌ ' + error.message, 'error');
        
        // Re-enable button on error
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function declineInvitation(invitationId) {
    const user = getCurrentUser();
    if (!user) return;
    
    if (!confirm('Opravdu odmítnout pozvánku?')) return;
    
    // Find button and disable it
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Odmítám...';
    
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
        
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// === GROUP MANAGEMENT ===

function updateGroupManagement() {
    const container = document.getElementById('currentGroupManagement');
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
                    <button class="btn-danger-small" onclick="removeMember('${member.email}')">
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
    
    // Invite section
    html += `
        <div class="invite-section">
            <h4>➕ Pozvat člena</h4>
            <p class="help-text">Pozvi kohokoli z organizace FAMILY</p>
            <div class="invite-form">
                <input type="email" id="inviteEmail" placeholder="Email člena" class="invite-input">
                <button onclick="inviteMember()" class="btn-primary">Poslat pozvánku</button>
            </div>
        </div>
    `;
    
    // Delete group (only owner)
    if (isOwner) {
        html += `
            <div class="danger-zone">
                <h4>🗑️ Nebezpečná zóna</h4>
                <p class="help-text">Smazání skupiny je nevratné!</p>
                <button onclick="deleteCurrentGroup()" class="btn-danger">
                    Smazat skupinu
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

async function inviteMember() {
    const email = document.getElementById('inviteEmail').value.trim();
    
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
    
    // Check if already member
    if (group.members.some(m => m.email === email)) {
        alert('Tento člověk už je ve skupině');
        return;
    }
    
    // Find button and disable it
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Odesílám...';
    
    try {
        await apiCall('invite_member', {
            group_id: group.group_id,
            invited_email: email,
            invited_by: user.email,
            invited_by_name: user.name
        });
        
        document.getElementById('inviteEmail').value = '';
        showToast(`✅ Pozvánka odeslána na ${email}`, 'success');
        
    } catch (error) {
        console.error('Invite error:', error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
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

// === TRANSACTION MANAGEMENT ===

async function deleteTransaction(transactionId) {
    const user = getCurrentUser();
    const group = getCurrentGroup();
    if (!user || !group) return;
    
    const transaction = group.transactions.find(t => t.transaction_id === transactionId);
    if (!transaction) return;
    
    // Check if user created this transaction
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
    
    // Check if user created this transaction
    if (transaction.created_by !== user.email) {
        alert('Můžeš upravit pouze své vlastní výdaje');
        return;
    }
    
    // Switch to add tab
    switchTab('add');
    
    if (transaction.type === 'expense') {
        // Show expense form
        document.querySelector('[data-type="expense"]').click();
        
        // Fill form
        document.getElementById('expenseDescription').value = transaction.description;
        document.getElementById('expenseAmount').value = transaction.amount;
        document.getElementById('expenseCurrency').value = transaction.currency;
        
        const date = new Date(transaction.date);
        document.getElementById('expenseDate').value = date.toISOString().split('T')[0];
        document.getElementById('expenseTime').value = date.toTimeString().slice(0, 5);
        
        document.getElementById('expensePaidBy').value = transaction.paid_by;
        document.getElementById('expenseCategory').value = transaction.category || '';
        document.getElementById('expenseNote').value = transaction.note || '';
        
        // Set split mode
        if (transaction.split_between && transaction.split_between.length > 0) {
            const hasCustomAmounts = transaction.split_between.some(s => s.amount !== null);
            const mode = hasCustomAmounts ? 'custom' : 'equal';
            
            document.querySelector(`[data-mode="${mode}"]`).click();
            
            // Update split checkboxes
            setTimeout(() => {
                transaction.split_between.forEach(split => {
                    const checkbox = document.getElementById(`split-${split.person}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.closest('.split-item').classList.add('checked');
                        
                        if (split.amount !== null) {
                            const amountInput = document.getElementById(`amount-${split.person}`);
                            if (amountInput) {
                                amountInput.value = split.amount;
                            }
                        }
                    }
                });
            }, 100);
        }
        
        // Store original transaction ID for update
        document.getElementById('expenseForm').dataset.editingId = transactionId;
        
        // Change button text
        const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
        submitBtn.textContent = '💾 Uložit změny';
        
        showToast('📝 Editace výdaje - uprav a ulož změny', 'warning');
        
    } else {
        // Show income form
        document.querySelector('[data-type="income"]').click();
        
        // Fill form
        document.getElementById('incomeDescription').value = transaction.description;
        document.getElementById('incomeAmount').value = transaction.amount;
        document.getElementById('incomeCurrency').value = transaction.currency;
        
        const date = new Date(transaction.date);
        document.getElementById('incomeDate').value = date.toISOString().split('T')[0];
        document.getElementById('incomeTime').value = date.toTimeString().slice(0, 5);
        
        document.getElementById('incomeRecipient').value = transaction.recipient || transaction.paid_by;
        document.getElementById('incomeNote').value = transaction.note || '';
        
        // Store original transaction ID for update
        document.getElementById('incomeForm').dataset.editingId = transactionId;
        
        // Change button text
        const submitBtn = document.querySelector('#incomeForm button[type="submit"]');
        submitBtn.textContent = '💾 Uložit změny';
        
        showToast('📝 Editace příjmu - uprav a ulož změny', 'warning');
    }
}

// Initialize when auth is ready
console.log('✅ FAMILY App script loaded');

/* =====================================
   SIDEBAR & SWIPE FUNCTIONALITY
   PŘIDEJ NA KONEC app.js
   ===================================== */

// === SIDEBAR FUNCTIONS ===

function initSidebar() {
    const openBtn = document.getElementById('openSidebar');
    const closeBtn = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const logoutBtn = document.getElementById('sidebarLogout');
    
    if (!openBtn || !sidebar) return;
    
    openBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
    
    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    };
    
    closeBtn?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            closeSidebar();
            handleLogout();
        });
    }
    
    // Sidebar items
    document.querySelectorAll('.sidebar-item[data-action]').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            handleSidebarAction(action);
            closeSidebar();
        });
    });
}

function handleSidebarAction(action) {
    switch(action) {
        case 'myGroups':
            switchTab('settings');
            break;
        case 'createGroup':
            document.getElementById('addGroupBtn').click();
            break;
        case 'about':
            showToast('💎 Expense Tracker v4.0 - FAMILY Edition');
            break;
        default:
            showToast(`Funkce "${action}" připravujeme`);
    }
}

function updateSidebarUser() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update sidebar avatar
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    if (sidebarAvatar && user.picture) {
        sidebarAvatar.style.backgroundImage = `url(${user.picture})`;
        sidebarAvatar.style.backgroundSize = 'cover';
    }
    
    // Update sidebar user info
    document.querySelector('.sidebar-user-name')?.textContent = user.name || 'User';
    document.querySelector('.sidebar-user-email')?.textContent = user.email || '';
    
    // Update header avatar
    const headerAvatar = document.getElementById('headerAvatar');
    if (headerAvatar && user.picture) {
        headerAvatar.style.backgroundImage = `url(${user.picture})`;
        headerAvatar.style.backgroundSize = 'cover';
    }
    
    // Update org members in sidebar
    const count = state.organizationMembers?.length || 0;
    const sidebarOrgMembers = document.getElementById('sidebarOrgMembers');
    if (sidebarOrgMembers) {
        sidebarOrgMembers.textContent = `${count} ${count === 1 ? 'člen' : count < 5 ? 'členové' : 'členů'}`;
    }
}

// === SWIPE GROUPS FUNCTIONS ===

function updateGroupsSwiper() {
    const swiper = document.getElementById('groupsSwiper');
    if (!swiper) return;
    
    swiper.innerHTML = '';
    
    state.groups.forEach(group => {
        const card = document.createElement('div');
        card.className = 'group-card';
        if (group.group_id === state.currentGroupId) {
            card.classList.add('active');
        }
        
        const memberCount = group.members?.length || 0;
        
        card.innerHTML = `
            <div class="group-card-name">${group.name}</div>
            <div class="group-card-meta">${memberCount} členů</div>
        `;
        
        card.addEventListener('click', () => {
            state.currentGroupId = group.group_id;
            updateGroupsSwiper();
            loadCurrentGroupData();
            showToast(`📍 ${group.name}`);
        });
        
        swiper.appendChild(card);
        
        // Scroll active card into view
        if (card.classList.contains('active')) {
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }, 100);
        }
    });
    
    // Add "Create group" card
    const createCard = document.createElement('div');
    createCard.className = 'group-card';
    createCard.innerHTML = `
        <div class="group-card-name">➕ Nová skupina</div>
        <div class="group-card-meta">Vytvořit</div>
    `;
    createCard.addEventListener('click', () => {
        document.getElementById('addGroupBtn')?.click();
    });
    swiper.appendChild(createCard);
}

// === FLOATING ACTION BUTTON ===

function initFAB() {
    // Create FAB if doesn't exist
    if (!document.querySelector('.fab')) {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.innerHTML = '➕';
        fab.title = 'Přidat výdaj';
        fab.addEventListener('click', () => {
            switchTab('add');
        });
        document.body.appendChild(fab);
    }
}

// === TABS NAVIGATION ===

function initTabsNav() {
    // Create tabs nav if doesn't exist
    if (document.querySelector('.tabs-nav')) return;
    
    const tabsNav = document.createElement('div');
    tabsNav.className = 'tabs-nav';
    tabsNav.innerHTML = `
        <button class="tab-nav-btn" data-tab="expenses">📋 Výdaje</button>
        <button class="tab-nav-btn" data-tab="balance">💰 Bilance</button>
        <button class="tab-nav-btn" data-tab="stats">📊 Statistiky</button>
        <button class="tab-nav-btn" data-tab="invitations">📬 Pozvánky</button>
        <button class="tab-nav-btn" data-tab="settings">⚙️ Nastavení</button>
    `;
    
    document.querySelector('.main-content')?.before(tabsNav);
    
    // Add event listeners
    tabsNav.querySelectorAll('.tab-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
            
            // Update active state
            tabsNav.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}


/* ===== CRITICAL FIXES ===== */

// Override updateSplitBetween with fixed custom amount layout
const originalUpdateSplitBetween = window.updateSplitBetween;
window.updateSplitBetween = function(mode = 'equal', autoSelectCurrentUser = false) {
    const container = document.getElementById('expenseSplitBetween');
    const group = getCurrentGroup();
    const user = getCurrentUser();
    if (!group || !group.members) return;
    
    container.innerHTML = '';
    
    group.members.forEach(member => {
        const div = document.createElement('div');
        
        const isCurrentUser = user && member.email === user.email;
        const shouldBeChecked = autoSelectCurrentUser ? isCurrentUser : true;
        
        div.className = shouldBeChecked ? 'split-item checked' : 'split-item';
        
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
};

// Override loadOrganizationData with proper count
const originalLoadOrganizationData = window.loadOrganizationData;
window.loadOrganizationData = async function() {
    try {
        const data = await apiCall('get_organization', {});
        state.organizationMembers = data.members || [];
        
        const count = state.organizationMembers.length;
        const label = count === 1 ? 'člen' : (count >= 2 && count <= 4) ? 'členové' : 'členů';
        document.getElementById('orgMembersCount').textContent = `${count} ${label}`;
        
        console.log('✅ Organization loaded:', data.name, '-', count, label);
    } catch (error) {
        console.error('Load organization error:', error);
        document.getElementById('orgMembersCount')?.textContent = '0 členů';
    }
};

console.log('✅ Critical fixes loaded');
