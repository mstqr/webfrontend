import { getScans } from '../api.js';

let currentSort = 'scannedAt,desc';
let startDate = null;
let endDate = null;
let currentPage = 0;
let pageSize = 20;

export async function initializeScans() {
    const scansSection = document.getElementById('scans');
    if (!scansSection) return;
    
    // Show loading state immediately
    scansSection.classList.add('loading');
    
    // Add loading spinner
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    loadingContainer.innerHTML = '<div class="loading-spinner"></div>';
    scansSection.appendChild(loadingContainer);

    // Set initial sort to newest first
    currentSort = 'scannedAt,desc';
    await loadScans();
    
    // Remove the initial loading spinner after data is loaded
    const initialSpinner = scansSection.querySelector('.loading-container');
    if (initialSpinner) {
        initialSpinner.remove();
    }

    // Add refresh button and date filter event listeners
    document.addEventListener('click', (e) => {
        if (e.target.closest('#scans .refresh-button')) {
            loadScans();
        }
        if (e.target.closest('#scans .apply-date-filter')) {
            const startDateInput = document.getElementById('scan-start-date');
            const endDateInput = document.getElementById('scan-end-date');
            
            // Format dates with time components
            if (startDateInput.value) {
                startDate = `${startDateInput.value}T00:00:00`;
            } else {
                startDate = null;
            }
            
            if (endDateInput.value) {
                endDate = `${endDateInput.value}T23:59:59`;
            } else {
                endDate = null;
            }
            
            loadScans();
        }
        if (e.target.closest('#scans .clear-date-filter')) {
            const startDateInput = document.getElementById('scan-start-date');
            const endDateInput = document.getElementById('scan-end-date');
            
            startDateInput.value = '';
            endDateInput.value = '';
            startDate = null;
            endDate = null;
            
            loadScans();
        }
    });
}

async function loadScans() {
    const scansSection = document.getElementById('scans');
    if (!scansSection) return;

    // Show loading state (only if not already loading)
    if (!scansSection.classList.contains('loading')) {
        scansSection.classList.add('loading');
    }

    try {
        // Set up parameters with pagination
        const params = {
            page: currentPage,
            size: pageSize
        };
        
        // Add sort parameter if available
        if (currentSort) {
            const [field, direction] = currentSort.split(',');
            params.sort = `${field},${direction}`;
        }
        
        // Add date range parameters if provided
        if (startDate) {
            params.startDate = startDate;
        }
        if (endDate) {
            params.endDate = endDate;
        }
        console.log('Fetching scans with params:', params);
        const response = await getScans(params);
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
        // Only allow sorting on scannedAt
        if (property !== 'scannedAt') return;

        // Toggle sort direction
        if (currentSort === `${property},asc`) {
            currentSort = `${property},desc`;
        } else if (currentSort === `${property},desc`) {
            currentSort = `${property},asc`;
        } else {
            currentSort = `${property},desc`; // Default to desc when no sort
        }

        // Reset to first page when sorting changes
        currentPage = 0;
        
        // Load scans with new sort parameters
        loadScans();
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
    
    // Create date filter controls
    const dateFilter = document.createElement('div');
    dateFilter.className = 'date-filter';
    dateFilter.innerHTML = `
        <div class="filter-controls">
            <div class="date-inputs">
                <div class="input-group">
                    <label for="scan-start-date">Start Date</label>
                    <input type="date" id="scan-start-date" value="${startDate || ''}">
                </div>
                <div class="input-group">
                    <label for="scan-end-date">End Date</label>
                    <input type="date" id="scan-end-date" value="${endDate || ''}">
                </div>
            </div>
            <div class="filter-actions">
                <button class="apply-date-filter">Apply Filter</button>
                <button class="clear-date-filter">Clear</button>
            </div>
        </div>
    `;

    // Create loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';

    // Add table, filter, and pagination styles
    const style = document.createElement('style');
    style.textContent = `
        .pagination-controls {
            margin-top: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
        }
        .pagination-info {
            font-size: 0.875rem;
            color: #64748b;
        }
        .pagination-buttons {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        .pagination-btn {
            padding: 0.5rem 0.75rem;
            border: 1px solid #e2e8f0;
            background: white;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            color: #475569;
            cursor: pointer;
            transition: all 0.2s;
        }
        .pagination-btn:hover:not([disabled]) {
            background: #f1f5f9;
            border-color: #cbd5e1;
        }
        .pagination-btn.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }
        .pagination-btn[disabled] {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .date-filter {
            margin-top: 1rem;
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
        }
        .filter-controls {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: flex-end;
            gap: 16px;
        }
        .date-inputs {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            flex: 1;
        }
        .input-group {
            display: flex;
            flex-direction: column;
            min-width: 150px;
        }
        .input-group label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #475569;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .input-group input {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 0.875rem;
        }
        .filter-actions {
            display: flex;
            gap: 8px;
        }
        .apply-date-filter, .clear-date-filter {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }
        .apply-date-filter {
            background: #3b82f6;
            color: white;
        }
        .apply-date-filter:hover {
            background: #2563eb;
        }
        .clear-date-filter {
            background: #f1f5f9;
            color: #64748b;
        }
        .clear-date-filter:hover {
            background: #e2e8f0;
        }
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
            user-select: none;
            position: relative;
            cursor: default;
        }
        .data-table th.sortable {
            cursor: pointer;
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
                <th>
                    Visitor
                </th>
                <th class="sortable" data-sort="scannedAt">
                    Time
                    <span class="sort-indicator"></span>
                </th>
                <th>
                    Issuer
                </th>
                <th>
                    Scanner
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
    
    // Create pagination controls if we have pageable data
    const pagination = document.createElement('div');
    pagination.className = 'pagination-controls';
    
    if (scans.totalPages && scans.totalPages > 1) {
        const totalPages = scans.totalPages;
        const currentPageNum = scans.number;
        
        // Create pagination HTML
        let paginationHTML = '<div class="pagination-info">Page ' + (currentPageNum + 1) + ' of ' + totalPages + '</div>';
        paginationHTML += '<div class="pagination-buttons">';
        
        // Previous button
        paginationHTML += `<button class="pagination-btn prev-page" ${currentPageNum === 0 ? 'disabled' : ''}>&laquo; Previous</button>`;
        
        // Page buttons
        const startPage = Math.max(0, currentPageNum - 2);
        const endPage = Math.min(totalPages - 1, currentPageNum + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="pagination-btn page-number ${i === currentPageNum ? 'active' : ''}" data-page="${i}">${i + 1}</button>`;
        }
        
        // Next button
        paginationHTML += `<button class="pagination-btn next-page" ${currentPageNum >= totalPages - 1 ? 'disabled' : ''}>Next &raquo;</button>`;
        paginationHTML += '</div>';
        
        pagination.innerHTML = paginationHTML;
        
        // Add event listeners for pagination buttons
        setTimeout(() => {
            // Previous page button
            const prevButton = pagination.querySelector('.prev-page');
            if (prevButton && !prevButton.hasAttribute('disabled')) {
                prevButton.addEventListener('click', () => {
                    currentPage = Math.max(0, currentPageNum - 1);
                    loadScans();
                });
            }
            
            // Next page button
            const nextButton = pagination.querySelector('.next-page');
            if (nextButton && !nextButton.hasAttribute('disabled')) {
                nextButton.addEventListener('click', () => {
                    currentPage = Math.min(totalPages - 1, currentPageNum + 1);
                    loadScans();
                });
            }
            
            // Page number buttons
            const pageButtons = pagination.querySelectorAll('.page-number');
            pageButtons.forEach(button => {
                if (!button.classList.contains('active')) {
                    button.addEventListener('click', () => {
                        currentPage = parseInt(button.dataset.page);
                        loadScans();
                    });
                }
            });
        }, 0);
    }
    
    // Update the section
    scansSection.innerHTML = '';
    container.appendChild(header);
    container.appendChild(dateFilter);
    container.appendChild(spinner);
    container.appendChild(table);
    container.appendChild(pagination);
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
