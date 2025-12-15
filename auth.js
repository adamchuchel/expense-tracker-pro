// Google OAuth Configuration
// REPLACE WITH YOUR CLIENT ID FROM GOOGLE CLOUD CONSOLE
const GOOGLE_CLIENT_ID =='530414372755-0bfpaeedvq6h2h48s8if6ega0a14jvkk.apps.googleusercontent.com';

let googleUser = null;
let authToken = null;

// Initialize Google Sign-In
function initGoogleAuth() {
    if (typeof google === 'undefined') {
        console.error('Google Identity Services not loaded');
        setTimeout(initGoogleAuth, 500);
        return;
    }
    
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
    });

    // Render sign-in button
    google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        {
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 300
        }
    );

    // Check existing auth
    checkExistingAuth();
}

// Handle credential response
async function handleCredentialResponse(response) {
    try {
        const userObject = parseJwt(response.credential);
        
        googleUser = {
            id: userObject.sub,
            email: userObject.email,
            name: userObject.name,
            picture: userObject.picture
        };
        
        authToken = response.credential;
        
        // Save locally
        localStorage.setItem('googleUser', JSON.stringify(googleUser));
        localStorage.setItem('authToken', authToken);
        
        // Register/login with backend
        await loginToBackend(googleUser);
        
        // Show app
        showMainApp();
        
        console.log('✅ User signed in:', googleUser.email);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('❌ Chyba přihlášení', 'error');
    }
}

// Parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('JWT parse error:', e);
        return null;
    }
}

// Login to backend
async function loginToBackend(user) {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) {
        console.log('No script URL yet, skipping backend login');
        return;
    }
    
    try {
        const response = await fetch(scriptUrl + '?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Backend login failed:', result.message);
        }
    } catch (error) {
        console.error('Backend login error:', error);
    }
}

// Check existing auth
function checkExistingAuth() {
    const savedUser = localStorage.getItem('googleUser');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
        try {
            googleUser = JSON.parse(savedUser);
            authToken = savedToken;
            
            // Verify token validity
            const tokenData = parseJwt(authToken);
            if (tokenData && tokenData.exp * 1000 > Date.now()) {
                showMainApp();
                return;
            }
        } catch (e) {
            console.error('Auth check error:', e);
        }
    }
    
    showLoginScreen();
}

// Show main app
function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    updateUserInfo();
    
    if (typeof initializeApp === 'function') {
        initializeApp();
    }
}

// Show login screen
function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

// Update user info in UI
function updateUserInfo() {
    if (!googleUser) return;
    
    const avatar = document.getElementById('userAvatar');
    if (googleUser.picture) {
        avatar.style.backgroundImage = `url(${googleUser.picture})`;
        avatar.style.backgroundSize = 'cover';
        avatar.textContent = '';
    } else {
        avatar.textContent = googleUser.name.charAt(0).toUpperCase();
    }
    
    document.getElementById('userName').textContent = googleUser.name;
    document.getElementById('userEmail').textContent = googleUser.email;
}

// Logout
function logout() {
    if (!confirm('Opravdu se chceš odhlásit?')) return;
    
    localStorage.removeItem('googleUser');
    localStorage.removeItem('authToken');
    
    googleUser = null;
    authToken = null;
    
    google.accounts.id.disableAutoSelect();
    
    showLoginScreen();
    
    console.log('✅ User signed out');
}

// Get current user
function getCurrentUser() {
    return googleUser;
}

// Get auth token
function getAuthToken() {
    return authToken;
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleAuth);
} else {
    initGoogleAuth();
}
