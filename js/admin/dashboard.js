import { initializeScans } from './sections/scans.js';
import { initializeInvitationCodes } from './sections/invitation-codes.js';
import { initializeOverview } from './sections/overview.js';

let dashboardInitialized = false;

// Function to update the current date
function updateCurrentDate() {
    const dateElement = document.querySelector('.current-date');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

// Initialize dashboard
let currentSection = null;

export async function initializeDashboard() {
    if (dashboardInitialized) return;
    
    console.log('Initializing dashboard...');
    
    try {
        // Set current date
        updateCurrentDate();
        
        // Set up section change handler
        window.addEventListener('popstate', () => {
            const sectionId = window.location.hash.slice(1) || 'overview';
            if (sectionId !== currentSection) {
                showSection(sectionId);
            }
        });
        
        dashboardInitialized = true;
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        throw error;
    }
}

// Show section
export async function showSection(sectionId) {
    // Prevent showing the same section multiple times
    if (sectionId === currentSection) return;
    
    console.log('Showing section:', sectionId);
    currentSection = sectionId;
    
    try {
        // Hide all sections
        document.querySelectorAll('.section-content').forEach(section => {
            section.style.display = 'none';
        });

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.style.display = 'block';
            
            // Initialize section content if needed
            try {
                switch (sectionId) {
                    case 'scans':
                        await initializeScans();
                        break;
                    case 'invitation-codes':
                        await initializeInvitationCodes();
                        break;
                    case 'overview':
                        await initializeOverview();
                        break;
                }
            } catch (error) {
                console.error(`Error initializing section ${sectionId}:`, error);
                // Don't throw here - let the section handle its own errors
            }
        } else {
            console.warn(`Section ${sectionId} not found`);
            return;
        }

        // Add active class to current nav link
        const currentLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }
        
        // Update URL hash without triggering hashchange
        if (window.location.hash !== `#${sectionId}`) {
            history.pushState(null, '', `#${sectionId}`);
        }
        
        console.log(`Section ${sectionId} shown successfully`);
    } catch (error) {
        console.error(`Error showing section ${sectionId}:`, error);
        currentSection = null; // Reset current section on error
    }
}
