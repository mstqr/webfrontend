import { getScans } from '../api.js';

let scansInitialized = false;

export async function initializeScans() {
    if (scansInitialized) return;
    scansInitialized = true;

    const scansSection = document.getElementById('scans');
    if (!scansSection) return;

    try {
        const response = await getScans();
        if (!response || !response.content) {
            throw new Error('Invalid response format');
        }
        renderScansTable(response);
    } catch (error) {
        console.error('Error loading scans:', error);
        scansSection.innerHTML = '<div class="error">Error loading scans. Please try again later.</div>';
    }
}

function renderScansTable(scans) {
    const scansSection = document.getElementById('scans');
    
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
                <th>Visitor</th>
                <th>Time</th>
                <th>Issuer</th>
                <th>Scanner</th>
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
    scansSection.appendChild(table);
}
