import { getScans } from '../api.js';

let currentSort = null;

export async function initializeScans() {
    const scansSection = document.getElementById('scans');
    if (!scansSection) return;

    await loadScans();

    // Add refresh button event listener
    document.addEventListener('click', (e) => {
        if (e.target.closest('#scans .refresh-button')) {
            loadScans();
        }
    });
}

async function loadScans() {
    const scansSection = document.getElementById('scans');
    if (!scansSection) return;

    // Show loading state
    scansSection.classList.add('loading');

    try {
        const response = await getScans(currentSort ? { sort: currentSort } : {});
        console.log('Scans response:', response);
        
        // Handle different response formats
        if (!response) {
            throw new Error('No response received from API');
        }
        
        // If response is an array, wrap it in a pageable format
        if (Array.isArray(response)) {
            renderScansTable({
                content: response,
                totalElements: response.length,
                size: response.length,
                number: 0
            });
        }
        // If response is already in pageable format
        else if (response.content && Array.isArray(response.content)) {
            renderScansTable(response);
        }
        else {
            console.error('Unexpected response format:', response);
            throw new Error('Invalid response format - expected array or pageable object');
        }
    } catch (error) {
        console.error('Error loading scans:', error);
        scansSection.innerHTML = '<div class="error">Error loading scans. Please try again later.</div>';
    } finally {
        // Hide loading state
        scansSection.classList.remove('loading');
    }
}

async function handleSort(property) {
    const scansSection = document.getElementById('scans');
    if (!scansSection) return;

    try {
        // Toggle sort direction or set initial sort
        if (currentSort === `${property},asc`) {
            currentSort = `${property},desc`;
        } else if (currentSort === `${property},desc`) {
            currentSort = null;
        } else {
            currentSort = `${property},asc`;
        }

        const response = await getScans(currentSort ? { sort: currentSort } : {});
        if (!response || !response.content) {
            throw new Error('Invalid response format');
        }
        renderScansTable(response);
    } catch (error) {
        console.error('Error sorting scans:', error);
    }
}

function renderScansTable(scans) {
    const scansSection = document.getElementById('scans');
    
    // Create container for the section
    const container = document.createElement('div');
    container.className = 'section-panel';

    // Create header with refresh button
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h2>Recent Scans</h2>
        <button class="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-2.2-5.8M21 3v6h-6" />
            </svg>
            Refresh
        </button>
    `;

    // Create loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';

    // Add table styles
    const style = document.createElement('style');
    style.textContent = `
        .data-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 1rem;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
        }
        .data-table th,
        .data-table td {
            padding: 16px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .data-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            cursor: pointer;
            user-select: none;
            position: relative;
        }
        .data-table th.sortable:hover {
            background: #f1f5f9;
        }
        .data-table th .sort-indicator {
            display: inline-block;
            width: 0;
            height: 0;
            margin-left: 8px;
            vertical-align: middle;
            opacity: 0.3;
        }
        .data-table th[data-sort-dir="asc"] .sort-indicator {
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 4px solid currentColor;
            opacity: 1;
        }
        .data-table th[data-sort-dir="desc"] .sort-indicator {
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 4px solid currentColor;
            opacity: 1;
        }
        .data-table tr:last-child td {
            border-bottom: none;
        }
        .data-table tr:hover {
            background: #f8fafc;
        }
        .data-table td.visitor-name {
            font-weight: 500;
            color: #1e293b;
        }
        .data-table td.time {
            color: #64748b;
            font-size: 0.875rem;
        }
        .data-table td.issuer {
            max-width: 150px;
        }
        .data-table td.scanner {
            color: #64748b;
        }

    `;
    document.head.appendChild(style);
    
    // Create table
    const table = document.createElement('table');
    table.className = 'data-table';
    
    // Add table content
    table.innerHTML = `
        <thead>
            <tr>
                <th class="sortable" data-sort="visitorName">
                    Visitor
                    <span class="sort-indicator"></span>
                </th>
                <th class="sortable" data-sort="scannedAt">
                    Time
                    <span class="sort-indicator"></span>
                </th>
                <th class="sortable" data-sort="issuerDisplayName">
                    Issuer
                    <span class="sort-indicator"></span>
                </th>
                <th class="sortable" data-sort="scannerDisplayName">
                    Scanner
                    <span class="sort-indicator"></span>
                </th>
            </tr>
        </thead>
        <tbody>
            ${scans.content && scans.content.length ? scans.content.map(scan => `
                <tr>
                    <td class="visitor-name">${scan.visitorName || 'N/A'}</td>
                    <td class="time">${new Date(scan.scannedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</td>
                    <td class="issuer" title="${scan.issuerDisplayName || 'N/A'}">${(scan.issuerDisplayName || 'N/A').length > 20 ? scan.issuerDisplayName.substring(0, 20) + '...' : scan.issuerDisplayName}</td>
                    <td class="scanner">${scan.scannerDisplayName || 'N/A'}</td>
                </tr>
            `).join('') : `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem;">
                        <div style="color: #64748b;">
                            <i class="fas fa-qrcode" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                            <p style="margin: 0;">No scans found</p>
                        </div>
                    </td>
                </tr>
            `}
        </tbody>
    `;
    
    // Update the section
    scansSection.innerHTML = '';
    container.appendChild(header);
    container.appendChild(spinner);
    container.appendChild(table);
    scansSection.appendChild(style);
    scansSection.appendChild(container);

    // Add click handlers for sortable columns
    const sortableHeaders = table.querySelectorAll('th.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const property = header.dataset.sort;
            handleSort(property);
        });

        // Update sort indicators
        if (currentSort) {
            const [sortProperty, sortDirection] = currentSort.split(',');
            if (header.dataset.sort === sortProperty) {
                header.setAttribute('data-sort-dir', sortDirection);
            } else {
                header.removeAttribute('data-sort-dir');
            }
        } else {
            header.removeAttribute('data-sort-dir');
        }
    });
}
