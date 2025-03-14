// Invitation codes page functionality
async function initializeInvitationCodes() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="dashboard-content">
            <div class="section" id="invitation-codes-section">
                <div class="dashboard-header">
                    <h2><i class="fas fa-key"></i> Invitation Codes</h2>
                    <div class="code-controls">
                        <div class="code-stats">
                            <div class="stat total-codes">
                                <i class="fas fa-key"></i>
                                <span>Total: 0</span>
                            </div>
                            <div class="stat unused-codes">
                                <i class="fas fa-unlock"></i>
                                <span>Available: 0</span>
                            </div>
                            <div class="stat used-codes">
                                <i class="fas fa-lock"></i>
                                <span>Used: 0</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="filters">
                    <label class="filter">
                        <input type="checkbox" id="show-used" checked>
                        Show Used Codes
                    </label>
                    <label class="filter">
                        <input type="checkbox" id="show-unused" checked>
                        Show Unused Codes
                    </label>
                </div>
                <div id="invitation-codes-container">
                    <div class="loading">Loading invitation codes...</div>
                </div>
            </div>
        </div>
    `;

    try {
        const codes = await getInvitationCodes();
        const container = document.getElementById('invitation-codes-container');
        
        if (container && codes) {
            // Update stats
            const totalCodes = document.querySelector('.total-codes span');
            const unusedCodes = document.querySelector('.unused-codes span');
            const usedCodes = document.querySelector('.used-codes span');

            if (totalCodes) totalCodes.textContent = `Total: ${codes.length}`;
            if (unusedCodes) unusedCodes.textContent = `Available: ${codes.filter(code => !code.usedBy).length}`;
            if (usedCodes) usedCodes.textContent = `Used: ${codes.filter(code => code.usedBy).length}`;

            // Add filter functionality
            const showUsed = document.getElementById('show-used');
            const showUnused = document.getElementById('show-unused');

            function updateDisplay() {
                const filteredCodes = codes.filter(code => {
                    if (code.usedBy) return showUsed.checked;
                    return showUnused.checked;
                });
                updateInvitationCodesSection(filteredCodes, container);
            }

            showUsed?.addEventListener('change', updateDisplay);
            showUnused?.addEventListener('change', updateDisplay);

            // Initial display
            updateDisplay();
        }
    } catch (error) {
        console.error('Error loading invitation codes:', error);
        const container = document.getElementById('invitation-codes-container');
        if (container) {
            container.innerHTML = '<div class="error">Error loading invitation codes. Please try again.</div>';
        }
    }
}

// Add invitation codes styles
const invitationCodesStyle = document.createElement('style');
invitationCodesStyle.textContent = `
    .code-controls {
        display: flex;
        gap: 16px;
        align-items: center;
    }
    .code-stats {
        display: flex;
        gap: 16px;
    }
    .filters {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
    }
    .filter {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #2c3e50;
        cursor: pointer;
    }
    .filter input[type="checkbox"] {
        width: 16px;
        height: 16px;
    }
    .error {
        color: #dc3545;
        text-align: center;
        padding: 20px;
    }
`;
document.head.appendChild(invitationCodesStyle);
