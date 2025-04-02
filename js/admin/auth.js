import { auth } from './config.js';

let authInitialized = false;
let authInitPromise = null;

export function initializeAuth() {
    // If we already have a promise, return it
    if (authInitPromise) return authInitPromise;

    // Create a new promise that resolves when auth is initialized
    authInitPromise = new Promise((resolve) => {
        // Set up persistent auth check
        auth.onAuthStateChanged((user) => {
            // Handle auth state changes
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

            // Handle initial auth state
            if (!authInitialized) {
                authInitialized = true;
                console.log('Auth initialized, user:', user ? 'logged in' : 'not logged in');
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
            // Explicitly redirect to login page
            window.location.replace('/admin/login.html');
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

export function initPasswordResetUI() {
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const modal = document.getElementById('password-reset-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const resetForm = document.getElementById('reset-password-form');
    const resetMessage = document.getElementById('reset-message');
    
    // If we're not on the login page, don't initialize the password reset UI
    if (!forgotPasswordLink || !modal) return;
    
    // Open modal when forgot password link is clicked
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        
        // Pre-fill email if it's already entered in the login form
        const loginEmail = document.getElementById('username').value;
        const resetEmail = document.getElementById('reset-email');
        if (loginEmail && resetEmail) {
            resetEmail.value = loginEmail;
        }
    });
    
    // Close modal when X is clicked
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resetMessage.textContent = '';
            resetMessage.className = 'reset-message';
        });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetMessage.textContent = '';
            resetMessage.className = 'reset-message';
        }
    });
    
    // Handle password reset form submission
    if (resetForm) {
        resetForm.addEventListener('submit', handlePasswordReset);
    }
}

async function handlePasswordReset(event) {
    event.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    const resetBtn = event.target.querySelector('button[type="submit"]');
    const resetMessage = document.getElementById('reset-message');
    
    // Clear previous messages
    resetMessage.textContent = '';
    resetMessage.className = 'reset-message';
    
    try {
        // Disable button and show loading state
        resetBtn.disabled = true;
        resetBtn.textContent = 'Sending...';
        
        // Send password reset email using Firebase
        await auth.sendPasswordResetEmail(email);
        
        // Show success message
        resetMessage.textContent = 'Password reset email sent! Check your inbox for further instructions.';
        resetMessage.className = 'reset-message success';
        
        // Clear the form
        document.getElementById('reset-email').value = '';
    } catch (error) {
        console.error('Password reset error:', error);
        let errorText = 'Failed to send password reset email. Please try again.';
        
        // Provide more specific error messages based on Firebase error codes
        switch (error.code) {
            case 'auth/invalid-email':
                errorText = 'Please enter a valid email address.';
                break;
            case 'auth/user-not-found':
                errorText = 'No account found with this email address.';
                break;
            case 'auth/too-many-requests':
                errorText = 'Too many attempts. Please try again later.';
                break;
        }
        
        resetMessage.textContent = errorText;
        resetMessage.className = 'reset-message error';
    } finally {
        // Re-enable button
        resetBtn.disabled = false;
        resetBtn.textContent = 'Send Reset Link';
    }
}
