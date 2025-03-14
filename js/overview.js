// Overview page functionality
async function initializeOverview() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="dashboard-content">
            <div class="section" id="recent-scans-section">
                <div class="dashboard-header">
                    <h2><i class="fas fa-qrcode"></i> Recent Scans</h2>
                    <a href="#scans" class="view-all-link">View All <i class="fas fa-arrow-right"></i></a>
                </div>
                <div id="recent-scans-container">
                    <div class="loading">Loading recent scans...</div>
                </div>
            </div>
            <div class="section" id="unused-codes-section">
                <div class="dashboard-header">
                    <h2><i class="fas fa-key"></i> Available Invitation Codes</h2>
                    <a href="#invitation-codes" class="view-all-link">View All <i class="fas fa-arrow-right"></i></a>
                </div>
                <div id="unused-codes-container">
                    <div class="loading">Loading invitation codes...</div>
                </div>
            </div>
        </div>
    `;

    try {
        // Fetch recent scans and unused invitation codes
        const [scans, codes] = await Promise.all([
            getScans(null, 0, 10),
            getInvitationCodes()
        ]);

        // Update recent scans
        const recentScansContainer = document.getElementById('recent-scans-container');
        if (recentScansContainer && scans.items) {
            updateScansSection(scans, recentScansContainer);
        }

        // Update unused invitation codes
        const unusedCodesContainer = document.getElementById('unused-codes-container');
        if (unusedCodesContainer && codes) {
            const unusedCodes = codes.filter(code => !code.usedBy).slice(0, 10);
            updateInvitationCodesSection(unusedCodes, unusedCodesContainer);
        }
    } catch (error) {
        console.error('Error initializing overview:', error);
    }
}

// Add overview styles
const overviewStyle = document.createElement('style');
overviewStyle.textContent = `
    .dashboard-content {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
    }
    .section {
        margin-bottom: 40px;
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    .dashboard-header h2 {
        margin: 0;
        color: #2c3e50;
        font-size: 24px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .view-all-link {
        color: #3498db;
        text-decoration: none;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .view-all-link:hover {
        text-decoration: underline;
    }
`;
document.head.appendChild(overviewStyle);
