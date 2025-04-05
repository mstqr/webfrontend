import { getScans } from '../api.js';

// Using native browser capabilities for exports instead of external libraries
// to comply with Content Security Policy

let currentSort = 'scannedAt,desc';
let startDate = null;
let endDate = null;
let currentPage = 0;
let pageSize = 20;

// Export to CSV function (works natively in browsers)
function exportToCSV() {
    try {
        // Show loading indicator
        const scansSection = document.getElementById('scans');
        scansSection.classList.add('loading');
        
        // Get current scans data
        const scansTable = document.querySelector('#scans .data-table');
        if (!scansTable) {
            throw new Error('No scans data available to export');
        }
        
        // Extract table data
        const headers = [];
        const rows = [];
        
        // Get headers
        const headerCells = scansTable.querySelectorAll('thead th');
        headerCells.forEach(cell => {
            headers.push(cell.textContent.trim());
        });
        
        // Get rows
        const rowElements = scansTable.querySelectorAll('tbody tr');
        rowElements.forEach(row => {
            if (!row.querySelector('td[colspan]')) { // Skip empty state row
                const rowData = [];
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    // Escape quotes and wrap in quotes if contains comma
                    let cellText = cell.textContent.trim();
                    if (cellText.includes(',') || cellText.includes('"') || cellText.includes('\n')) {
                        cellText = '"' + cellText.replace(/"/g, '""') + '"';
                    }
                    rowData.push(cellText);
                });
                rows.push(rowData);
            }
        });
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.join(',') + '\n';
        });
        
        // Add metadata as a comment at the top
        let metadata = '# Scans Report\n';
        if (startDate || endDate) {
            metadata += '# Date Range: ';
            if (startDate) {
                metadata += startDate.split('T')[0];
            } else {
                metadata += 'All';
            }
            metadata += ' to ';
            if (endDate) {
                metadata += endDate.split('T')[0];
            } else {
                metadata += 'Present';
            }
            metadata += '\n';
        }
        metadata += '# Generated on: ' + new Date().toLocaleString() + '\n\n';
        
        // Combine metadata and CSV content
        const fullContent = metadata + csvContent;
        
        // Create download link
        const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scans-report.csv';
        a.click();
        
        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        // Hide loading indicator
        scansSection.classList.remove('loading');
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('Failed to export CSV. Please try again later.');
        
        // Hide loading indicator
        const scansSection = document.getElementById('scans');
        scansSection.classList.remove('loading');
    }
}

// Export to HTML table function (for printing)
function exportToPrint() {
    try {
        // Show loading indicator
        const scansSection = document.getElementById('scans');
        scansSection.classList.add('loading');
        
        // Get current scans data
        const scansTable = document.querySelector('#scans .data-table');
        if (!scansTable) {
            throw new Error('No scans data available to export');
        }
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('Pop-up blocked. Please allow pop-ups for this site to print.');
        }
        
        // Create HTML content
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Scans Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { font-size: 18px; margin-bottom: 10px; }
                    .metadata { font-size: 12px; margin-bottom: 20px; color: #666; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    @media print {
                        .no-print { display: none; }
                        body { margin: 0; }
                        h1 { font-size: 14px; }
                        th, td { padding: 5px; font-size: 12px; }
                    }
                </style>
            </head>
            <body>
                <h1>Scans Report</h1>
                <div class="metadata">
        `;
        
        // Add date range if applied
        if (startDate || endDate) {
            htmlContent += '<div>Date Range: ';
            if (startDate) {
                htmlContent += startDate.split('T')[0];
            } else {
                htmlContent += 'All';
            }
            htmlContent += ' to ';
            if (endDate) {
                htmlContent += endDate.split('T')[0];
            } else {
                htmlContent += 'Present';
            }
            htmlContent += '</div>';
        }
        
        // Add generation timestamp
        htmlContent += `<div>Generated on: ${new Date().toLocaleString()}</div>`;
        htmlContent += `</div>`;
        
        // Add print button
        htmlContent += `
            <div class="no-print" style="margin-bottom: 20px;">
                <button onclick="window.print()" style="padding: 8px 16px; background: #00c853; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Print Report
                </button>
                <button onclick="window.close()" style="padding: 8px 16px; margin-left: 10px; background: #f1f5f9; color: #475569; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        `;
        
        // Clone the table and add to HTML content
        const tableClone = scansTable.cloneNode(true);
        htmlContent += tableClone.outerHTML;
        
        // Close HTML tags
        htmlContent += `
            </body>
            </html>
        `;
        
        // Write to the new window and prepare for printing
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Hide loading indicator
        scansSection.classList.remove('loading');
    } catch (error) {
        console.error('Error preparing print view:', error);
        alert(error.message || 'Failed to prepare print view. Please try again later.');
        
        // Hide loading indicator
        const scansSection = document.getElementById('scans');
        scansSection.classList.remove('loading');
    }
}

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

    // Add refresh, export, and date filter event listeners
    document.addEventListener('click', (e) => {
        if (e.target.closest('#scans .refresh-button')) {
            loadScans();
        }
        if (e.target.closest('#scans .export-csv-button')) {
            exportToCSV();
        }
        if (e.target.closest('#scans .export-print-button')) {
            exportToPrint();
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

    // Create header with refresh and export buttons
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h2>Recent Scans</h2>
        <div class="header-actions">
            <div class="export-buttons">
                <button class="export-csv-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Export CSV
                </button>
                <button class="export-print-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Print
                </button>
            </div>
            <button class="refresh-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 11-2.2-5.8M21 3v6h-6" />
                </svg>
                Refresh
            </button>
        </div>
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

    // Add table, filter, pagination, and export button styles
    const style = document.createElement('style');
    style.textContent = `
        .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        .export-buttons {
            display: flex;
            gap: 0.5rem;
        }
        .export-csv-button, .export-print-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            border: 1px solid #e2e8f0;
            background: white;
            color: #475569;
            cursor: pointer;
            transition: all 0.2s;
        }
        .export-csv-button:hover, .export-print-button:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
        }
        .export-csv-button svg, .export-print-button svg {
            width: 16px;
            height: 16px;
        }
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
            background: #00c853;
            color: white;
            border-color: #00c853;
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
            background: #00c853;
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
