import { auth } from '../config.js';

export async function initializeOverview() {
    const overviewSection = document.getElementById('overview');
    if (!overviewSection) return;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDate = new Date().toLocaleDateString('en-US', options);

    overviewSection.innerHTML = `
        <div class="welcome-header">
            <h1>Welcome Back</h1>
            <p class="current-date">${currentDate}</p>
        </div>

        <div class="action-grid">
            <a href="#scans" class="action-card" data-section="scans">
                <div class="action-icon">📊</div>
                <h3>View Scans</h3>
            </a>
            <a href="#invitation-codes" class="action-card" data-section="invitation-codes">
                <div class="action-icon">🎟️</div>
                <h3>View Invitation Codes</h3>
            </a>
        </div>
    `;

    // Add click handlers for action cards
    overviewSection.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const section = card.getAttribute('data-section');
            window.location.hash = section;
        });
    });
}
