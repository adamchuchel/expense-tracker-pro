// Google OAuth Authentication
// Client ID - REPLACE WITH YOUR OWN from Google Cloud Console
const GOOGLE_CLIENT_ID = '530414372755-0bfpaeedvq6h2h48s8if6ega0a14jvkk.apps.googleusercontent.com';

let googleUser = null;
let authToken = null;

// Initialize Google Sign-In
function initGoogleAuth() {
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
    });

    // Render the sign-in button
    google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        {
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 280
        }
    );

    // Check if user is already signed in
    checkExistingAuth();
}

// Handle credential response from Google
function handleCredentialResponse(response) {
    // Decode the JWT token
    const userObject = parseJwt(response.credential);
    
    googleUser = {
        id: userObject.sub,
        email: userObject.email,
        name: userObject.name,
        picture: userObject.picture
    };
    
    authToken = response.credential;
    
    // Save to localStorage
    localStorage.setItem('googleUser', JSON.stringify(googleUser));
    localStorage.setItem('authToken', authToken);
    
    // Show main app
    showMainApp();
    
    console.log('User signed in:', googleUser);
}

// Parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

// Check for existing authentication
function checkExistingAuth() {
    const savedUser = localStorage.getItem('googleUser');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
        try {
            googleUser = JSON.parse(savedUser);
            authToken = savedToken;
            
            // Verify token is still valid (basic check)
            const tokenData = parseJwt(authToken);
            if (tokenData && tokenData.exp * 1000 > Date.now()) {
                // Token is still valid
                showMainApp();
                return;
            }
        } catch (e) {
            console.error('Error loading saved auth:', e);
        }
    }
    
    // No valid auth, show login screen
    showLoginScreen();
}

// Show main app
function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Update user info in settings
    updateUserInfo();
    
    // Load app data
    if (typeof loadState === 'function') {
        loadState();
    }
    if (typeof initializeUI === 'function') {
        initializeUI();
    }
    if (typeof updateAllViews === 'function') {
        updateAllViews();
    }
}

// Show login screen
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').classList.add('hidden');
}

// Update user info in settings
function updateUserInfo() {
    if (!googleUser) return;
    
    // User avatar
    const avatar = document.getElementById('userAvatar');
    if (googleUser.picture) {
        avatar.style.backgroundImage = `url(${googleUser.picture})`;
        avatar.style.backgroundSize = 'cover';
        avatar.textContent = '';
    } else {
        avatar.textContent = googleUser.name.charAt(0).toUpperCase();
    }
    
    // User name and email
    document.getElementById('userName').textContent = googleUser.name;
    document.getElementById('userEmail').textContent = googleUser.email;
}

// Logout
function logout() {
    if (!confirm('Opravdu se chceš odhlásit?')) return;
    
    // Clear local storage
    localStorage.removeItem('googleUser');
    localStorage.removeItem('authToken');
    
    // Reset variables
    googleUser = null;
    authToken = null;
    
    // Google sign out
    google.accounts.id.disableAutoSelect();
    
    // Show login screen
    showLoginScreen();
    
    console.log('User signed out');
}

// Get current auth token for API calls
function getAuthToken() {
    return authToken;
}

// Get current user
function getCurrentUser() {
    return googleUser;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleAuth);
} else {
    initGoogleAuth();
}
