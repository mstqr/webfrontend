import { initializeAuth, handleLogin, logout } from './auth.js';
import { initializeDashboard, showSection } from './dashboard.js';

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Document ready, initializing app...');
    
    try {
        // Wait for auth to initialize
        const user = await initializeAuth();
        console.log('Auth initialized, user:', user ? 'logged in' : 'not logged in');
        
        // Set up login form handler if we're on the login page
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('Setting up login form handler');
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Set up dashboard handlers if we're on the dashboard page
        if (window.location.pathname.includes('dashboard')) {
            if (!user) {
                console.log('No user found, redirecting to login');
                window.location.replace('/admin/login.html');
                return;
            }
            
            console.log('Setting up dashboard handlers');
            
            // Initialize dashboard
            await initializeDashboard();
            
            // Set up navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = e.currentTarget.dataset.section;
                    showSection(section);
                });
            });
            
            // Set up logout
            const logoutBtn = document.querySelector('.btn-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }
            
            // Show initial section based on hash or default to overview
            const initialSection = window.location.hash.slice(1) || 'overview';
            showSection(initialSection);

            // Set up mobile menu toggle
            const menuToggle = document.querySelector('.menu-toggle');
            const sidebar = document.querySelector('.sidebar');
            const sidebarOverlay = document.querySelector('.sidebar-overlay');

            function toggleSidebar() {
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
                document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
            }

            if (menuToggle && sidebar && sidebarOverlay) {
                menuToggle.addEventListener('click', toggleSidebar);
                sidebarOverlay.addEventListener('click', toggleSidebar);

                // Close sidebar when clicking a nav link on mobile
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.addEventListener('click', () => {
                        if (window.innerWidth <= 768) {
                            toggleSidebar();
                        }
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});
