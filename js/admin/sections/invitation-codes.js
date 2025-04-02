import { getInvitationCodes, createInvitationCode, deleteInvitationCode } from '../api.js';

let currentData = null;

export async function initializeInvitationCodes() {
    const codesSection = document.getElementById('invitation-codes');
    if (!codesSection) return;
    
    // Show loading state immediately
    codesSection.classList.add('loading');
    
    // Add loading spinner
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    loadingContainer.innerHTML = '<div class="loading-spinner"></div>';
    codesSection.appendChild(loadingContainer);

    await loadInvitationCodes();
    
    // Remove the initial loading spinner after data is loaded
    const initialSpinner = codesSection.querySelector('.loading-container');
    if (initialSpinner) {
        initialSpinner.remove();
    }

    // Add refresh button event listener
    document.addEventListener('click', (e) => {
        if (e.target.closest('#invitation-codes .refresh-button')) {
            loadInvitationCodes();
        }
    });
}

async function loadInvitationCodes() {
    const codesSection = document.getElementById('invitation-codes');
    if (!codesSection) return;

    // Show loading state (only if not already loading)
    if (!codesSection.classList.contains('loading')) {
        codesSection.classList.add('loading');
    }

    try {
        const response = await getInvitationCodes();
        console.log('Invitation codes response:', response);
        
        // Handle different response formats
        let codes = [];
        if (Array.isArray(response)) {
            codes = response;
        } else if (typeof response === 'object' && response !== null) {
            // If response is an object, try to extract codes array
            const possibleCodes = Object.values(response)[0];
            if (Array.isArray(possibleCodes)) {
                codes = possibleCodes;
            } else {
                console.error('Unexpected response format:', response);
                throw new Error('Invalid response format - expected array of codes');
            }
        } else {
            console.error('Unexpected response type:', typeof response);
            throw new Error('Invalid response format - unexpected type');
        }
        
        currentData = codes;
        renderInvitationCodesTable(codes);
    } catch (error) {
        console.error('Error loading invitation codes:', error);
        codesSection.innerHTML = `
            <div class="section-panel">
                <div class="section-header">
                    <h2>Invitation Codes</h2>
                    <button class="refresh-button">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 12a9 9 0 11-2.2-5.8M21 3v6h-6" />
                        </svg>
                        Refresh
                    </button>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading invitation codes. Please try again.</p>
                </div>
            </div>
        `;
    } finally {
        // Hide loading state
        codesSection.classList.remove('loading');
    }
}

function renderInvitationCodesTable(codes, filter = 'all') {
    const codesSection = document.getElementById('invitation-codes');
    if (!codesSection) return;
    
    // Filter codes based on selection
    const filteredCodes = filter === 'all' ? codes :
        filter === 'used' ? codes.filter(code => code.used) :
        codes.filter(code => !code.used);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .invitation-codes-container {
            padding: 1rem;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding: 0 1rem;
        }

        .section-header h2 {
            margin: 0;
            font-size: 1.25rem;
            color: #1e293b;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .data-table th,
        .data-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .data-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #1e293b;
        }
        .data-table tr:hover {
            background: #f8fafc;
        }

        .filter-container {
            margin-bottom: 1rem;
            display: flex;
            gap: 0.5rem;
        }
        .filter-button {
            padding: 0.5rem 1rem;
            border: 1px solid #e2e8f0;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            color: #64748b;
            transition: all 0.2s;
        }
        .filter-button:hover {
            background: #f8fafc;
        }
        .filter-button.active {
            background: #00c853;
            border-color: #00c853;
            color: white;
        }
        .used-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            min-width: 90px;
            text-align: center;
        }
        .used-badge.yes {
            background: #fee2e2;
            color: #991b1b;
        }
        .used-badge.no {
            background: #dcfce7;
            color: #166534;
        }

        .loading {
            opacity: 0.5;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'invitation-codes-container';

    // Create header with refresh button
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h2>Invitation Codes</h2>
        <button class="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-2.2-5.8M21 3v6h-6" />
            </svg>
            Refresh
        </button>
    `;
    container.appendChild(header);
    
    // Create filter buttons
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.innerHTML = `
        <button class="filter-button ${filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        <button class="filter-button ${filter === 'used' ? 'active' : ''}" data-filter="used">Used</button>
        <button class="filter-button ${filter === 'unused' ? 'active' : ''}" data-filter="unused">Unused</button>
    `;
    container.appendChild(filterContainer);
    
    // Add filter button listeners
    filterContainer.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', () => {
            const newFilter = button.dataset.filter;
            renderInvitationCodesTable(codes, newFilter);
        });
    });
    
    // Create table
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Code</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${filteredCodes.length ? filteredCodes.map(code => `
                <tr>
                    <td><code>${code.code || 'N/A'}</code></td>
                    <td>
                        <span class="used-badge ${code.used ? 'yes' : 'no'}">
                            ${code.used ? 'Used' : 'Unused'}
                        </span>
                    </td>
                </tr>
            `).join('') : `
                <tr>
                    <td colspan="2" style="text-align: center; padding: 2rem;">
                        <div style="color: #64748b;">
                            <i class="fas fa-ticket" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                            <p style="margin: 0;">No invitation codes found</p>
                        </div>
                    </td>
                </tr>
            `}
        </tbody>
    `;
    

    

    
    // Clear and append elements
    container.appendChild(table);
    
    codesSection.innerHTML = '';
    codesSection.appendChild(container);
}

function setupInvitationCodeForm() {
    const form = document.getElementById('new-code-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const newCode = await createInvitationCode();
            const codes = await getInvitationCodes();
            renderInvitationCodesTable(codes);
        } catch (error) {
            console.error('Error creating invitation code:', error);
            alert('Error creating invitation code. Please try again.');
        }
    });
}


