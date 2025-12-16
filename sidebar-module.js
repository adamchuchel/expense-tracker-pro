/* =====================================
   SETTLE UP SIDEBAR MODULE
   Complete, working implementation
   ===================================== */

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettleUpUI);
} else {
    initSettleUpUI();
}

// Main initialization
function initSettleUpUI() {
    console.log('🎨 Initializing Settle Up UI...');
    
    initSidebar();
    initFAB();
    updateAvatars();
    
    console.log('✅ Settle Up UI initialized');
}

/* ===== SIDEBAR ===== */

function initSidebar() {
    const openBtn = document.getElementById('openSidebar');
    const closeBtn = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const logoutBtn = document.getElementById('sidebarLogout');
    
    if (!openBtn || !sidebar || !overlay) {
        console.warn('⚠️ Sidebar elements not found');
        return;
    }
    
    console.log('✅ Sidebar elements found, attaching listeners...');
    
    // Open sidebar
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔓 Opening sidebar');
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
    
    // Close sidebar function
    const closeSidebar = () => {
        console.log('🔒 Closing sidebar');
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    };
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeSidebar();
        });
    }
    
    // Overlay click
    overlay.addEventListener('click', closeSidebar);
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeSidebar();
            setTimeout(() => {
                if (window.handleLogout) {
                    window.handleLogout();
                } else {
                    console.log('🚪 Logout function not found');
                }
            }, 300);
        });
    }
    
    // Sidebar menu items
    const menuItems = document.querySelectorAll('.sidebar-item[data-action]');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const action = item.dataset.action;
            console.log('📱 Sidebar action:', action);
            
            closeSidebar();
            
            setTimeout(() => {
                switch(action) {
                    case 'createGroup':
                        const addGroupBtn = document.getElementById('addGroupBtn');
                        if (addGroupBtn) {
                            addGroupBtn.click();
                        }
                        break;
                    case 'about':
                        if (window.showToast) {
                            window.showToast('💎 Expense Tracker v5 - Settle Up Style');
                        } else {
                            alert('💎 Expense Tracker v5 - Settle Up Style');
                        }
                        break;
                }
            }, 300);
        });
    });
    
    // Sidebar navigation items (tabs)
    const navItems = document.querySelectorAll('.sidebar-nav-item[data-tab]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            console.log('🔄 Switching to tab:', tab);
            
            // Remove active from all
            navItems.forEach(i => i.classList.remove('active'));
            // Add active to clicked
            item.classList.add('active');
            
            closeSidebar();
            
            setTimeout(() => {
                if (window.switchTab) {
                    window.switchTab(tab);
                } else {
                    console.warn('⚠️ switchTab function not found');
                }
            }, 300);
        });
    });
    
    console.log('✅ Sidebar initialized with', menuItems.length, 'menu items and', navItems.length, 'nav items');
}

/* ===== FAB BUTTON ===== */

function initFAB() {
    const fabBtn = document.getElementById('fabBtn');
    
    if (!fabBtn) {
        console.warn('⚠️ FAB button not found');
        return;
    }
    
    // Show FAB
    fabBtn.style.display = 'flex';
    
    // Click handler
    fabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('➕ FAB clicked');
        
        if (window.switchTab) {
            window.switchTab('add');
        } else {
            // Fallback - click on bottom nav
            const addTab = document.querySelector('[data-tab="add"]');
            if (addTab) {
                addTab.click();
            }
        }
    });
    
    console.log('✅ FAB button initialized');
}

/* ===== AVATARS ===== */

function updateAvatars() {
    // Wait a bit for user data to load
    setTimeout(() => {
        const user = window.getCurrentUser ? window.getCurrentUser() : null;
        
        if (!user) {
            console.log('⏳ User not loaded yet, will retry...');
            setTimeout(updateAvatars, 1000);
            return;
        }
        
        console.log('👤 Updating avatars for:', user.name);
        
        // Update header avatar
        const headerAvatar = document.getElementById('headerAvatar');
        if (headerAvatar && user.picture) {
            headerAvatar.style.backgroundImage = `url(${user.picture})`;
            console.log('✅ Header avatar updated');
        }
        
        // Update sidebar avatar
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        if (sidebarAvatar && user.picture) {
            sidebarAvatar.style.backgroundImage = `url(${user.picture})`;
            console.log('✅ Sidebar avatar updated');
        }
        
        // Update sidebar user info
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserEmail = document.getElementById('sidebarUserEmail');
        
        if (sidebarUserName) {
            sidebarUserName.textContent = user.name || 'User';
        }
        
        if (sidebarUserEmail) {
            sidebarUserEmail.textContent = user.email || '';
        }
        
        // Update org members count
        updateOrgMembers();
        
    }, 500);
}

function updateOrgMembers() {
    const state = window.state;
    if (!state || !state.organizationMembers) {
        return;
    }
    
    const count = state.organizationMembers.length;
    const label = count === 1 ? 'člen' : (count >= 2 && count <= 4) ? 'členové' : 'členů';
    
    const sidebarOrgMembers = document.getElementById('sidebarOrgMembers');
    if (sidebarOrgMembers) {
        sidebarOrgMembers.textContent = `${count} ${label}`;
        console.log('✅ Org members updated:', count, label);
    }
}

/* ===== GLOBAL HOOKS ===== */

// Hook into app initialization
window.addEventListener('load', () => {
    // Try to update avatars after everything loads
    setTimeout(updateAvatars, 1000);
    setTimeout(updateAvatars, 2000);
});

// Export for manual calls
window.updateSettleUpAvatars = updateAvatars;
window.updateSettleUpOrgMembers = updateOrgMembers;

console.log('📦 Sidebar module loaded');
