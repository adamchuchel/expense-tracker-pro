/* ========================================
   SETTLE UP SIDEBAR - SIMPLE JS
   NO MODIFICATIONS TO EXISTING CODE!
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
            console.warn('⚠️ Sidebar elements not found');
            return;
        }
        
        console.log('✅ Sidebar elements found');
        
        // Open sidebar
        openBtn.addEventListener('click', function() {
            sidebar.classList.add('open');
            overlay.classList.add('show');
            console.log('🔓 Sidebar opened');
        });
        
        // Close sidebar
        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
            console.log('🔒 Sidebar closed');
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSidebar);
        }
        
        overlay.addEventListener('click', closeSidebar);
        
        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                closeSidebar();
                setTimeout(function() {
                    if (typeof handleLogout === 'function') {
                        handleLogout();
                    } else {
                        console.warn('handleLogout not found');
                    }
                }, 300);
            });
        }
        
        // Navigation items - call switchTab directly!
        const navItems = document.querySelectorAll('.settle-nav-item[data-tab]');
        navItems.forEach(function(item) {
            item.addEventListener('click', function() {
                const tab = this.getAttribute('data-tab');
                console.log('🔄 Switching to:', tab);
                
                // Update active state in sidebar
                navItems.forEach(function(i) {
                    i.classList.remove('active');
                });
                this.classList.add('active');
                
                // Close sidebar
                closeSidebar();
                
                // Call switchTab directly!
                setTimeout(function() {
                    if (typeof switchTab === 'function') {
                        switchTab(tab);
                        console.log('✅ Tab switched:', tab);
                    } else {
                        console.error('❌ switchTab function not found!');
                    }
                }, 300);
            });
        });
        
        console.log('✅ Sidebar initialized with', navItems.length, 'nav items');
        
        // Update user info
        updateSidebarUser();
    }
    
    function updateSidebarUser() {
        // Wait for user to be loaded
        setTimeout(function() {
            const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            
            if (!user) {
                console.log('⏳ User not loaded, will retry...');
                setTimeout(updateSidebarUser, 1000);
                return;
            }
            
            console.log('👤 Updating sidebar user:', user.name);
            
            // Update avatars
            const headerAvatar = document.getElementById('headerAvatar');
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            
            if (headerAvatar && user.picture) {
                headerAvatar.style.backgroundImage = 'url(' + user.picture + ')';
            }
            
            if (sidebarAvatar && user.picture) {
                sidebarAvatar.style.backgroundImage = 'url(' + user.picture + ')';
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
        }, 500);
    }
    
    function updateOrgCount() {
        if (typeof state === 'undefined' || !state.organizationMembers) {
            return;
        }
        
        const count = state.organizationMembers.length;
        const label = count === 1 ? 'člen' : (count >= 2 && count <= 4) ? 'členové' : 'členů';
        
        const orgCount = document.getElementById('sidebarOrgCount');
        if (orgCount) {
            orgCount.textContent = count + ' ' + label;
            console.log('✅ Org count updated:', count);
        }
    }
    
    // Try to update after page load
    window.addEventListener('load', function() {
        setTimeout(updateSidebarUser, 1000);
        setTimeout(updateSidebarUser, 2000);
    });
    
    console.log('✅ Settle Up Sidebar loaded');
    
})();
