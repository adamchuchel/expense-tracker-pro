/* ========================================
   SETTLE UP SIDEBAR - FIXED VERSION
   ======================================== */

(function() {
    'use strict';
    
    console.log('🎨 Settle Up Sidebar loading...');
    
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
    
    function initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const openBtn = document.getElementById('openSidebar');
        const closeBtn = document.getElementById('closeSidebar');
        const logoutBtn = document.getElementById('sidebarLogout');
        
        if (!sidebar || !overlay || !openBtn) {
            console.warn('⚠️ Sidebar elements not found, retrying...');
            setTimeout(initSidebar, 500);
            return;
        }
        
        console.log('✅ Sidebar elements found');
        
        // Open sidebar
        openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            sidebar.classList.add('open');
            overlay.classList.add('show');
            console.log('📂 Sidebar opened');
        });
        
        // Close sidebar
        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
            console.log('📁 Sidebar closed');
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeSidebar();
            });
        }
        
        overlay.addEventListener('click', closeSidebar);
        
        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeSidebar();
                setTimeout(function() {
                    if (typeof logout === 'function') {
                        logout();
                    } else {
                        console.error('❌ logout function not found!');
                    }
                }, 300);
            });
        }
        
        // Navigation items - FIXED!
        const navItems = document.querySelectorAll('.settle-nav-item[data-tab]');
        console.log('📋 Found', navItems.length, 'navigation items');
        
        navItems.forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const tab = this.getAttribute('data-tab');
                console.log('🔄 Switching to tab:', tab);
                
                // Update active state in sidebar
                navItems.forEach(function(i) {
                    i.classList.remove('active');
                });
                this.classList.add('active');
                
                // Close sidebar
                closeSidebar();
                
                // Wait for sidebar to close, then switch tab
                setTimeout(function() {
                    // Try multiple ways to call switchTab
                    if (typeof window.switchTab === 'function') {
                        window.switchTab(tab);
                        console.log('✅ Tab switched via window.switchTab:', tab);
                    } else if (typeof switchTab === 'function') {
                        switchTab(tab);
                        console.log('✅ Tab switched via switchTab:', tab);
                    } else {
                        console.error('❌ switchTab function not found!');
                        
                        // Fallback: manually trigger tab change
                        manualSwitchTab(tab);
                    }
                }, 300);
            });
        });
        
        console.log('✅ Sidebar initialized');
        
        // Update user info after a delay
        setTimeout(updateSidebarUser, 1000);
        setTimeout(updateSidebarUser, 2000);
        setTimeout(updateSidebarUser, 3000);
    }
    
    // Fallback manual tab switch
    function manualSwitchTab(tabName) {
        console.log('🔧 Using fallback tab switch for:', tabName);
        
        // Update navigation buttons
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(function(content) {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(tabName + 'Tab');
        if (targetTab) {
            targetTab.classList.add('active');
            console.log('✅ Fallback tab switch successful:', tabName);
            
            // Trigger view updates
            if (tabName === 'expenses' && typeof updateExpensesList === 'function') {
                updateExpensesList();
            }
            if (tabName === 'balance' && typeof updateBalance === 'function') {
                updateBalance();
            }
            if (tabName === 'stats' && typeof updateStatistics === 'function') {
                updateStatistics();
            }
            if (tabName === 'settings' && typeof updateCategoriesList === 'function') {
                updateCategoriesList();
                if (typeof updateGroupManagement === 'function') {
                    updateGroupManagement();
                }
            }
        } else {
            console.error('❌ Tab not found:', tabName + 'Tab');
        }
    }
    
    function updateSidebarUser() {
        // Wait for user to be loaded
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        
        if (!user) {
            console.log('⏳ User not loaded yet, will retry...');
            return;
        }
        
        console.log('👤 Updating sidebar user:', user.name);
        
        // Update avatars
        const headerAvatar = document.getElementById('headerAvatar');
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        
        if (headerAvatar) {
            if (user.picture) {
                headerAvatar.style.backgroundImage = 'url(' + user.picture + ')';
                headerAvatar.style.backgroundSize = 'cover';
                headerAvatar.style.backgroundPosition = 'center';
            } else {
                headerAvatar.textContent = user.name.charAt(0).toUpperCase();
            }
        }
        
        if (sidebarAvatar) {
            if (user.picture) {
                sidebarAvatar.style.backgroundImage = 'url(' + user.picture + ')';
                sidebarAvatar.style.backgroundSize = 'cover';
                sidebarAvatar.style.backgroundPosition = 'center';
            } else {
                sidebarAvatar.textContent = user.name.charAt(0).toUpperCase();
            }
        }
        
        // Update name and email
        const sidebarName = document.getElementById('sidebarName');
        const sidebarEmail = document.getElementById('sidebarEmail');
        
        if (sidebarName) {
            sidebarName.textContent = user.name || 'User';
        }
        
        if (sidebarEmail) {
            sidebarEmail.textContent = user.email || '';
        }
        
        // Update org count
        updateOrgCount();
        
        console.log('✅ Sidebar user updated');
    }
    
    function updateOrgCount() {
        if (typeof state === 'undefined' || !state.organizationMembers) {
            setTimeout(updateOrgCount, 1000);
            return;
        }
        
        const count = state.organizationMembers.length;
        let label;
        if (count === 1) {
            label = 'člen';
        } else if (count >= 2 && count <= 4) {
            label = 'členové';
        } else {
            label = 'členů';
        }
        
        const orgCount = document.getElementById('sidebarOrgCount');
        if (orgCount) {
            orgCount.textContent = count + ' ' + label;
            console.log('✅ Org count updated:', count, label);
        }
    }
    
    // Expose update functions globally
    window.updateSidebarUser = updateSidebarUser;
    window.updateOrgCount = updateOrgCount;
    
    // Try to update after page load
    window.addEventListener('load', function() {
        setTimeout(updateSidebarUser, 1000);
        setTimeout(updateSidebarUser, 2000);
        setTimeout(updateSidebarUser, 3000);
    });
    
    console.log('✅ Settle Up Sidebar loaded');
    
})();
