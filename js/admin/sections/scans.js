import { getScans } from '../api.js';

let scansInitialized = false;

export async function initializeScans() {
    if (scansInitialized) return;
    scansInitialized = true;

    const scansSection = document.getElementById('scans');
    if (!scansSection) return;

    try {
        const scans = await getScans();
        renderScansTable(scans);
    } catch (error) {
        console.error('Error loading scans:', error);
        scansSection.innerHTML = '<div class="error">Error loading scans. Please try again later.</div>';
    }
}

function renderScansTable(scans) {
    const scansSection = document.getElementById('scans');
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Scanner</th>
                <th>Pass ID</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${scans.map(scan => `
                <tr>
                    <td>${new Date(scan.timestamp).toLocaleString()}</td>
                    <td>${scan.scanner_id}</td>
                    <td>${scan.pass_id}</td>
                    <td><span class="status ${scan.status}">${scan.status}</span></td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    scansSection.innerHTML = '';
    scansSection.appendChild(table);
}
