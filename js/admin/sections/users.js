import { getUsers, changeUserHost, changeUserRole } from '../api.js';

let currentData = null;

export async function initializeUsers() {
    const usersSection = document.getElementById('users');
    if (!usersSection) return;
    
    // Show loading state immediately
    usersSection.classList.add('loading');
    
    // Add loading spinner
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    loadingContainer.innerHTML = '<div class="loading-spinner"></div>';
    usersSection.appendChild(loadingContainer);

    await loadUsers();
    
    // Remove the initial loading spinner after data is loaded
    const initialSpinner = usersSection.querySelector('.loading-container');
    if (initialSpinner) {
        initialSpinner.remove();
    }

    // Add refresh button event listener
    document.addEventListener('click', (e) => {
        if (e.target.closest('#users .refresh-button')) {
            // Show loading spinner
            const usersSection = document.getElementById('users');
            if (usersSection) {
                usersSection.classList.add('loading');
                
                // Add loading spinner if it doesn't exist
                if (!usersSection.querySelector('.loading-spinner')) {
                    const spinner = document.createElement('div');
                    spinner.className = 'loading-spinner';
                    usersSection.appendChild(spinner);
                }
            }
            
            // Load users data
            loadUsers();
        }
    });
}

async function loadUsers() {
    const usersSection = document.getElementById('users');
    if (!usersSection) return;

    // Show loading state (only if not already loading)
    if (!usersSection.classList.contains('loading')) {
        usersSection.classList.add('loading');
    }

    try {
        const response = await getUsers();
        console.log('Users response:', response);
        
        // Handle the nested object response format
        let users = [];
        if (Array.isArray(response)) {
            users = response;
        } else if (typeof response === 'object' && response !== null) {
            // The response is a nested object with user IDs as keys
            // First level might be a wrapper object like "Test Host"
            let userObjects = response;
            
            // If there's a wrapper object, get the first value which should contain all users
            if (Object.keys(response).length === 1 && typeof Object.values(response)[0] === 'object') {
                userObjects = Object.values(response)[0];
            }
            
            // Now extract all users from the object
            users = Object.entries(userObjects).map(([id, userData]) => {
                return {
                    id: id,
                    name: userData.displayName || '',
                    email: userData.email || '',
                    role: userData.role || '',
                    active: true, // Assuming all users are active
                    createdAt: new Date().toISOString() // Default to current date if not provided
                };
            });
        } else {
            console.error('Unexpected response type:', typeof response);
            throw new Error('Invalid response format - unexpected type');
        }
        
        currentData = users;
        renderUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        usersSection.innerHTML = `
            <div class="section-panel">
                <div class="section-header">
                    <h2>Users</h2>
                    <button class="refresh-button">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 12a9 9 0 11-2.2-5.8M21 3v6h-6" />
                        </svg>
                        Refresh
                    </button>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading users. Please try again.</p>
                </div>
            </div>
        `;
    } finally {
        // Hide loading state
        usersSection.classList.remove('loading');
        
        // Remove spinner
        const spinner = usersSection.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }
}

function renderUsersTable(users) {
    const usersSection = document.getElementById('users');
    if (!usersSection) return;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .users-container {
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

        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            min-width: 90px;
            text-align: center;
        }
        .status-badge.active {
            background: #dcfce7;
            color: #166534;
        }
        .status-badge.inactive {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .role-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            background: #e0f2fe;
            color: #0369a1;
        }
        
        .role-badge.scanner {
            background: #fef3c7;
            color: #92400e;
        }

        .loading {
            opacity: 0.5;
            pointer-events: none;
            position: relative;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: #00c853;
            animation: spin 1s linear infinite;
            position: absolute;
            top: 50%;
            left: 50%;
            margin-top: -20px;
            margin-left: -20px;
            z-index: 10;
        }
        
        .button-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: currentColor;
            animation: spin 1s linear infinite;
            display: inline-block;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .action-button {
            background: none;
            border: none;
            cursor: pointer;
            color: #64748b;
            transition: color 0.2s;
            padding: 5px;
        }
        .action-button:hover {
            color: #0f172a;
        }
        .action-button.delete {
            color: #ef4444;
        }
        .action-button.delete:hover {
            color: #b91c1c;
        }
        
        .actions {
            white-space: nowrap;
            text-align: right;
        }
    `;
    document.head.appendChild(style);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'users-container';

    // Create header with refresh button
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h2>Users</h2>
        <button class="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-2.2-5.8M21 3v6h-6" />
            </svg>
            Refresh
        </button>
    `;
    container.appendChild(header);

    // Create table
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    if (users.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <p>No users found.</p>
            </div>
        `;
    } else {
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        users.forEach(user => {
            const tr = document.createElement('tr');
            
            // Format date
            const createdDate = new Date(user.createdAt);
            const formattedDate = createdDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            tr.innerHTML = `
                <td>${user.name || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>
                    <span class="role-badge ${user.role === 'SCANNER' ? 'scanner' : ''}">${user.role || '-'}</span>
                </td>
                <td class="actions">
                    <button class="action-button change-host delete" data-uid="${user.id}" title="Delete User">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                    <button class="action-button change-role" data-uid="${user.id}" data-current-role="${user.role || ''}" title="${user.role === 'SCANNER' ? 'Change to STANDARD user' : 'Change to SCANNER user'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }
    
    container.appendChild(tableContainer);
    

    
    // Replace existing content
    usersSection.innerHTML = '';
    usersSection.appendChild(container);
    
    // Add event listeners
    setupUserFormHandlers();
}

function setupUserFormHandlers() {
    const usersSection = document.getElementById('users');
    if (!usersSection) return;
    
    // Add event listener for changing host
    usersSection.addEventListener('click', async (e) => {
        const changeHostBtn = e.target.closest('.change-host');
        if (changeHostBtn) {
            const uid = changeHostBtn.dataset.uid;
            if (!uid) return;
            
            if (confirm('Are you sure you want to delete this user\'s host?')) {
                try {
                    // Show loading state
                    changeHostBtn.disabled = true;
                    changeHostBtn.innerHTML = '<div class="button-spinner"></div>';
                    
                    await changeUserHost(uid);
                    alert('User host deleted successfully');
                    
                    // Reload users to reflect changes
                    await loadUsers();
                } catch (error) {
                    console.error('Error deleting user host:', error);
                    alert(`Error deleting user host: ${error.message}`);
                    changeHostBtn.disabled = false;
                    changeHostBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    `;
                }
            }
        }
        
        // Handle role change
        const changeRoleBtn = e.target.closest('.change-role');
        if (changeRoleBtn) {
            const uid = changeRoleBtn.dataset.uid;
            const currentRole = changeRoleBtn.dataset.currentRole;
            if (!uid) return;
            
            // Determine the new role (toggle between SCANNER and STANDARD)
            const newRole = currentRole === 'SCANNER' ? 'STANDARD' : 'SCANNER';
            
            if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
                try {
                    // Show loading state
                    changeRoleBtn.disabled = true;
                    changeRoleBtn.innerHTML = '<div class="button-spinner"></div>';
                    
                    await changeUserRole(uid, newRole);
                    alert(`User role changed to ${newRole} successfully`);
                    
                    // Reload users to reflect changes
                    await loadUsers();
                } catch (error) {
                    console.error('Error changing user role:', error);
                    alert(`Error changing user role: ${error.message}`);
                    changeRoleBtn.disabled = false;
                    changeRoleBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    `;
                }
            }
        }
    });
}
