import { getInvitationCodes, createInvitationCode, deleteInvitationCode } from '../api.js';

let currentData = null;

export async function initializeInvitationCodes() {
    const codesSection = document.getElementById('invitation-codes');
    if (!codesSection) return;

    // If we already have data, just re-render it
    if (currentData) {
        renderInvitationCodesTable(currentData);
        return;
    }

    // Show loading state
    codesSection.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p style="margin: 0;">Loading invitation codes...</p>
        </div>
    `;

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
            <div style="text-align: center; padding: 2rem; color: #dc2626;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p style="margin: 0;">Could not load invitation codes. Please try again later.</p>
            </div>
        `;
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
            background: #0284c7;
            border-color: #0284c7;
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
    `;
    document.head.appendChild(style);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'invitation-codes-container';
    
    // Create filter buttons
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.innerHTML = `
        <button class="filter-button ${filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        <button class="filter-button ${filter === 'used' ? 'active' : ''}" data-filter="used">Used</button>
        <button class="filter-button ${filter === 'unused' ? 'active' : ''}" data-filter="unused">Unused</button>
    `;
    
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

    container.appendChild(filterContainer);
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


