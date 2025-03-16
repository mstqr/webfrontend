import { auth } from './config.js';

const API_BASE_URL = '';  // Empty since we're using the proxy

async function getAuthHeaders() {
    const token = await auth.currentUser?.getIdToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

async function fetchWithAuth(endpoint, options = {}) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include',  // Include cookies for CORS
        headers: {
            ...headers,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// Scans API
export async function getScans(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/scans?${queryString}`);
}

// Invitation Codes API
export async function getInvitationCodes() {
    return fetchWithAuth('/api/admin/invitation-codes');
}

export async function createInvitationCode(data) {
    return fetchWithAuth('/api/admin/invitation-codes', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function deleteInvitationCode(code) {
    return fetchWithAuth(`/api/admin/invitation-codes/${code}`, {
        method: 'DELETE'
    });
}

// Residents API
export async function getResidents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/residents?${queryString}`);
}

// Passes API
export async function getPasses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/passes?${queryString}`);
}

// Scanners API
export async function getScanners() {
    return fetchWithAuth('/api/admin/scanners');
}
