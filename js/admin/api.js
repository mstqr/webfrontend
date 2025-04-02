import { auth } from './config.js';

const API_BASE_URL = 'https://mstqr-portal-backend.azurewebsites.net';

async function getAuthHeaders() {
    const token = await auth.currentUser?.getIdToken(true); // Force refresh token
    if (!token) {
        throw new Error('No authentication token available');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

async function fetchWithAuth(endpoint, options = {}) {
    console.group('=== API Request Started ===');
    console.log('🎯 Endpoint:', endpoint);
    console.log('👤 Auth Status:', auth.currentUser ? 'Logged in' : 'Not logged in');
    if (auth.currentUser) {
        console.log('📧 User email:', auth.currentUser.email);
        console.log('🆔 User ID:', auth.currentUser.uid);
    }
    console.log('🔧 Request Options:', {
        method: options.method || 'GET',
        mode: options.mode || 'cors',
        headers: options.headers || {}
    });

    const maxRetries = 2;
    let retryCount = 0;

    // Wait for Firebase auth to initialize
    while (!auth.currentUser && retryCount < maxRetries) {
        console.log(`[Attempt ${retryCount + 1}] Waiting for auth to initialize...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retryCount++;
    }

    if (!auth.currentUser) {
        console.error('Failed to get authenticated user after retries');
        throw new Error('Authentication failed - no current user');
    }

    // Reset retry count for API calls
    retryCount = 0;

    while (retryCount <= maxRetries) {
        try {
            console.log(`[Attempt ${retryCount + 1}] Getting fresh ID token...`);
            // Force token refresh on first try or after a failure
            const token = await auth.currentUser.getIdToken(retryCount > 0);
            console.log('Token obtained:', token.substring(0, 20) + '...');

            const url = `${API_BASE_URL}${endpoint}`;
            console.log('Full URL:', url);
            
            const requestHeaders = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': window.location.origin,
                ...options.headers
            };
            
            console.log('Request headers:', requestHeaders);

            const response = await fetch(url, {
                ...options,
                mode: 'cors',
                headers: requestHeaders
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries([...response.headers]));

            if (!response.ok) {
                console.group('❌ Response Error Details');
                console.log('Status:', response.status, response.statusText);
                console.log('Response Headers:', Object.fromEntries([...response.headers]));
                
                // Check specifically for CORS errors
                if (response.type === 'opaque' || response.status === 0) {
                    console.error('🚫 CORS Error Detected');
                    console.log('Origin:', window.location.origin);
                    console.log('Target:', API_BASE_URL);
                    throw new Error('CORS Error: The request was blocked. Please check if the server allows requests from ' + window.location.origin);
                }

                if ((response.status === 401 || response.status === 403) && retryCount < maxRetries) {
                    console.log('🔄 Auth error, retrying with fresh token...');
                    await auth.currentUser?.getIdToken(true);
                    retryCount++;
                    console.groupEnd();
                    continue;
                }

                // Try to get response body for more details
                let errorBody = '';
                try {
                    const clonedResponse = response.clone();
                    errorBody = await clonedResponse.text();
                    console.error('📄 Error response body:', errorBody);
                    
                    // Try to parse as JSON for better error details
                    try {
                        const jsonError = JSON.parse(errorBody);
                        console.log('📋 Structured error:', jsonError);
                    } catch (e) {
                        // Not JSON, that's fine
                    }
                } catch (e) {
                    console.error('Could not read error response body');
                }
                
                console.groupEnd();
                throw new Error(`API Error: ${response.status} ${response.statusText}\nBody: ${errorBody}`);
            }

            try {
                const data = await response.json();
                console.log('API Response data:', data);
                return data;
            } catch (jsonError) {
                console.error('Failed to parse JSON response:', jsonError);
                // Try to get the raw response text for debugging
                try {
                    const textResponse = await response.clone().text();
                    console.error('Raw response text:', textResponse);
                } catch (textError) {
                    console.error('Failed to get raw response text:', textError);
                }
                throw jsonError;
            }
        } catch (error) {
            console.group('🔥 API Request Error');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            
            // Network error checks
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.error('💻 Network Error - Check if the API server is running and accessible');
                console.log('API URL:', API_BASE_URL);
                console.log('Browser:', navigator.userAgent);
            }
            
            if (error.message.includes('No authentication token available') && retryCount < maxRetries) {
                console.log('🔄 Retrying due to missing auth token...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                retryCount++;
                console.groupEnd();
                continue;
            }
            
            console.groupEnd();
            throw error;
        }
    }
}

// Scans API
export async function getScans(params = {}) {
    // Add default pagination parameters if not provided
    const defaultParams = {
        page: params.page || 0,
        size: params.size || 20
    };
    // Only add sort if it's properly formatted
    if (params.sort) {
        defaultParams.sort = params.sort;
    }
    // Add date range parameters if provided
    if (params.startDate) {
        defaultParams.startDate = params.startDate;
    }
    if (params.endDate) {
        defaultParams.endDate = params.endDate;
    }
    const queryString = new URLSearchParams(defaultParams).toString();
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
