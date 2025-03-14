// Scans page functionality
async function initializeScans() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="dashboard-content">
            <div class="section" id="scans-section">
                <div class="dashboard-header">
                    <h2><i class="fas fa-qrcode"></i> All Scans</h2>
                    <div class="scan-controls">
                        <div class="scan-stats">
                            <div class="stat total-scans">
                                <i class="fas fa-chart-bar"></i>
                                <span>Total: 0</span>
                            </div>
                            <div class="stat allowed-scans">
                                <i class="fas fa-check"></i>
                                <span>Allowed: 0</span>
                            </div>
                            <div class="stat denied-scans">
                                <i class="fas fa-times"></i>
                                <span>Denied: 0</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="scans-container">
                    <div class="loading">Loading scans...</div>
                </div>
                <div class="pagination">
                    <button id="prev-page" disabled><i class="fas fa-chevron-left"></i> Previous</button>
                    <span id="page-info">Page 1</span>
                    <button id="next-page">Next <i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    `;

    // Initialize pagination state
    let currentPage = 0;
    const pageSize = 20;

    // Load initial data
    await loadScansPage(currentPage);

    // Add pagination event listeners
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    prevButton?.addEventListener('click', async () => {
        if (currentPage > 0) {
            currentPage--;
            await loadScansPage(currentPage);
        }
    });

    nextButton?.addEventListener('click', async () => {
        currentPage++;
        await loadScansPage(currentPage);
    });
}

async function loadScansPage(page) {
    try {
        const scans = await getScans(null, page, 20);
        const scansContainer = document.getElementById('scans-container');
        
        if (scansContainer && scans.items) {
            updateScansSection(scans, scansContainer);
            
            // Update pagination
            const prevButton = document.getElementById('prev-page');
            const nextButton = document.getElementById('next-page');
            const pageInfo = document.getElementById('page-info');
            
            if (prevButton) prevButton.disabled = page === 0;
            if (nextButton) nextButton.disabled = !scans.hasMore;
            if (pageInfo) pageInfo.textContent = `Page ${page + 1}`;

            // Update stats
            const totalScans = document.querySelector('.total-scans span');
            const allowedScans = document.querySelector('.allowed-scans span');
            const deniedScans = document.querySelector('.denied-scans span');

            if (totalScans) totalScans.textContent = `Total: ${scans.total || 0}`;
            if (allowedScans) allowedScans.textContent = `Allowed: ${scans.items.filter(scan => scan.allowed).length}`;
            if (deniedScans) deniedScans.textContent = `Denied: ${scans.items.filter(scan => !scan.allowed).length}`;
        }
    } catch (error) {
        console.error('Error loading scans:', error);
        const scansContainer = document.getElementById('scans-container');
        if (scansContainer) {
            scansContainer.innerHTML = '<div class="error">Error loading scans. Please try again.</div>';
        }
    }
}

// Add scans styles
const scansStyle = document.createElement('style');
scansStyle.textContent = `
    .scan-controls {
        display: flex;
        gap: 16px;
        align-items: center;
    }
    .scan-stats {
        display: flex;
        gap: 16px;
    }
    .stat {
        background: #f8f9fa;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 14px;
        color: #2c3e50;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        margin-top: 24px;
    }
    .pagination button {
        background: #f8f9fa;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
    }
    .pagination button:hover:not(:disabled) {
        background: #e9ecef;
    }
    .pagination button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    #page-info {
        font-size: 14px;
        color: #666;
    }
    .error {
        color: #dc3545;
        text-align: center;
        padding: 20px;
    }
`;
document.head.appendChild(scansStyle);
