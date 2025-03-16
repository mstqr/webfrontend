import { getInvitationCodes, createInvitationCode, deleteInvitationCode } from '../api.js';

let codesInitialized = false;

export async function initializeInvitationCodes() {
    if (codesInitialized) return;
    codesInitialized = true;

    const codesSection = document.getElementById('invitation-codes');
    if (!codesSection) return;

    try {
        const codes = await getInvitationCodes();
        renderInvitationCodesTable(codes);
        setupInvitationCodeForm();
    } catch (error) {
        console.error('Error loading invitation codes:', error);
        codesSection.innerHTML = '<div class="error">Error loading invitation codes. Please try again later.</div>';
    }
}

function renderInvitationCodesTable(codes) {
    const codesSection = document.getElementById('invitation-codes');
    if (!codesSection) return;
    
    // Create container for the form and table
    const container = document.createElement('div');
    container.className = 'invitation-codes-container';
    
    // Create form for new codes
    const form = document.createElement('form');
    form.id = 'new-code-form';
    form.className = 'form-inline';
    form.innerHTML = `
        <button type="submit" class="btn-primary">Generate New Code</button>
    `;
    
    // Create table
    const table = document.createElement('table');
    table.className = 'data-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Code</th>
                <th>Created</th>
                <th>Used</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${codes.map(code => `
                <tr>
                    <td>${code.code}</td>
                    <td>${new Date(code.created_at).toLocaleString()}</td>
                    <td>${code.used ? 'Yes' : 'No'}</td>
                    <td>
                        ${!code.used ? `
                            <button type="button" class="btn-delete" data-code="${code.code}">
                                Delete
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    // Add event listeners for delete buttons
    table.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const code = e.target.dataset.code;
            if (!code || !confirm('Are you sure you want to delete this code?')) return;
            
            try {
                await deleteInvitationCode(code);
                const updatedCodes = await getInvitationCodes();
                renderInvitationCodesTable(updatedCodes);
            } catch (error) {
                console.error('Error deleting invitation code:', error);
                alert('Error deleting invitation code. Please try again.');
            }
        });
    });
    
    // Clear and append elements
    container.appendChild(form);
    container.appendChild(table);
    
    codesSection.innerHTML = '';
    codesSection.appendChild(container);
    
    // Set up form handler
    setupInvitationCodeForm();
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


