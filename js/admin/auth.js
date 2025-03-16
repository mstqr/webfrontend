import { auth } from './config.js';

let authInitialized = false;
let authInitPromise = null;

export function initializeAuth() {
    // If we already have a promise, return it
    if (authInitPromise) return authInitPromise;

    // Create a new promise that resolves when auth is initialized
    authInitPromise = new Promise((resolve) => {
        // Set up persistent auth check
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!authInitialized) {
                authInitialized = true;
                console.log('Auth initialized, user:', user ? 'logged in' : 'not logged in');

                // Handle redirects only on first initialization
                const isDashboardPage = window.location.pathname.includes('dashboard');
                const isLoginPage = window.location.pathname.includes('login');

                if (user) {
                    if (isLoginPage) {
                        console.log('Redirecting to dashboard');
                        window.location.replace('/admin/dashboard');
                        return;
                    }
                } else {
                    if (isDashboardPage) {
                        console.log('Redirecting to login');
                        window.location.replace('/admin/login.html');
                        return;
                    }
                }

                // Unsubscribe from the initial auth check
                unsubscribe();
                
                // Resolve with the user
                resolve(user);
            }
        });
    });

    return authInitPromise;
}

export async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const loginButton = event.target.querySelector('button[type="submit"]');
    
    try {
        // Disable login button and show loading state
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';
        errorMessage.style.display = 'none';
        
        await auth.signInWithEmailAndPassword(email, password);
        // Successful login will trigger onAuthStateChanged which handles redirect
    } catch (error) {
        console.error('Login error:', error);
        let errorText = 'Invalid email or password. Please try again.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorText = 'Please enter a valid email address.';
                break;
            case 'auth/user-not-found':
                errorText = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorText = 'Incorrect password. Please try again.';
                break;
            case 'auth/too-many-requests':
                errorText = 'Too many failed attempts. Please try again later.';
                break;
        }
        
        errorMessage.textContent = errorText;
        errorMessage.style.display = 'block';
    } finally {
        // Re-enable login button
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
}

export function logout() {
    // Show loading state on logout button
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
    }

    // Perform logout using Firebase auth instance
    auth.signOut()
        .then(() => {
            console.log('Logout successful');
            // Auth listener will handle redirect
        })
        .catch((error) => {
            console.error('Error signing out:', error);
            alert('Logout failed: ' + error.message);
            
            // Reset logout button if it exists
            if (logoutBtn) {
                logoutBtn.disabled = false;
                logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            }
        });
}
