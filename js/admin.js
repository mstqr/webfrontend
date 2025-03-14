    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCE_XbhQQpfTrtCvqjQloioBqeoAhDKYXs",
        authDomain: "mstqrweb.firebaseapp.com",
        projectId: "mstqrweb",
        storageBucket: "mstqrweb.firebasestorage.app",
        messagingSenderId: "181872086077",
        appId: "1:181872086077:web:3337f34676d6404129ae54",
        measurementId: "G-PD25M967XC"
    };

    // Backend API Configuration
    const API_BASE_URL = '';  // Empty since we're using the proxy

    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Get Auth instance
    const auth = firebase.auth();
    
    console.log('Firebase initialized');



    // Initialize page based on current path
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // We're on the login page
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                const email = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const errorMessage = document.getElementById('error-message');
                const loginButton = loginForm.querySelector('button[type="submit"]');
                
                try {
                    // Disable login button and show loading state
                    loginButton.disabled = true;
                    loginButton.textContent = 'Logging in...';
                    errorMessage.style.display = 'none';
                    
                    await auth.signInWithEmailAndPassword(email, password);
                    // Successful login will trigger onAuthStateChanged which handles redirect
                } catch (error) {
                    console.error('Login error:', error);
                    let errorText = 'Invalid email or password. Please try again.';
                    
                    switch (error.code) {
                        case 'auth/invalid-email':
                            errorText = 'Please enter a valid email address.';
                            break;
                        case 'auth/user-not-found':
                            errorText = 'No account found with this email.';
                            break;
                        case 'auth/wrong-password':
                            errorText = 'Incorrect password. Please try again.';
                            break;
                        case 'auth/too-many-requests':
                            errorText = 'Too many failed attempts. Please try again later.';
                            break;
                    }
                    
                    errorMessage.textContent = errorText;
                    errorMessage.style.display = 'block';
                    
                    // Re-enable login button
                    loginButton.disabled = false;
                    loginButton.textContent = 'Login';
                }
            });
        }
    });

    // Logout Function
    window.logout = function() {
        // Show loading state on logout button
        const logoutBtn = document.querySelector('.btn-logout');
        if (logoutBtn) {
            logoutBtn.disabled = true;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
        }

        // Perform logout using Firebase auth instance
        auth.signOut()
            .then(() => {
                console.log('Logout successful');
                // Auth listener will handle redirect
            })
            .catch((error) => {
                console.error('Error signing out:', error);
                alert('Logout failed: ' + error.message);
                
                // Reset logout button if it exists
                if (logoutBtn) {
                    logoutBtn.disabled = false;
                    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                }
            });
    };

    // Section Switching
    window.showSection = function(sectionId) {
        const sections = ['residents', 'passes', 'scanners'];
        sections.forEach(id => {
            const section = document.getElementById(id);
            const tab = document.querySelector(`[data-section="${id}"]`);
            if (section) {
                section.style.display = id === sectionId ? 'block' : 'none';
            }
            if (tab) {
                tab.classList.toggle('active', id === sectionId);
            }
        });
    };

    // Backend API Service Functions
    async function getFirebaseToken() {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('No user is signed in');
        }
        return await currentUser.getIdToken();
    }

    async function callPaginatedApi(endpoint, method = 'GET', body = null) {
        
        console.log('=== Paginated API Call Debug Start ===');
        console.log('Endpoint:', endpoint);
        console.log('Method:', method);
        
        // Get a fresh token
        const token = await getToken(true);
        console.log('Fresh token obtained successfully');
        
        const options = {
            method,
            credentials: 'include',  // Include cookies for CORS
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
            console.log('Added request body');
        } else {
            console.log('No body provided');
        }
        
        console.log('Request options:', {
            ...options,
            headers: { ...options.headers, Authorization: '[REDACTED]' }
        });
        
        try {
            console.log('Making request to:', `${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries([...response.headers]));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('=== API Error Details ===');
                console.error('Status:', response.status);
                console.error('Status Text:', response.statusText);
                console.error('Error Text:', errorText || '(empty response)');
                console.error('=== End API Error Details ===');
                throw new Error(`API call failed: ${response.statusText} (${response.status})${errorText ? ': ' + errorText : ''}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Paginated API call error:', error);
            throw error;
        }
    }

    // Token management
    let currentToken = null;
    let tokenRefreshPromise = null;
    let lastTokenRefresh = 0;
    const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes

    const getToken = async (forceRefresh = false) => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('No user is signed in');
        }

        try {
            // If a refresh is already in progress, wait for it
            if (tokenRefreshPromise) {
                return await tokenRefreshPromise;
            }

            // Check if we need to refresh
            const needsRefresh = forceRefresh || 
                               !currentToken || 
                               (Date.now() - lastTokenRefresh) > TOKEN_REFRESH_INTERVAL;

            // Use existing token if valid
            if (!needsRefresh && currentToken) {
                return currentToken;
            }

            // Get new token
            tokenRefreshPromise = currentUser.getIdToken(true);
            currentToken = await tokenRefreshPromise;
            lastTokenRefresh = Date.now();
            tokenRefreshPromise = null;

            return currentToken;
        } catch (error) {
            console.error('Error getting token:', error);
            tokenRefreshPromise = null;
            currentToken = null;
            throw error;
        }
    };

    async function callApi(endpoint, method = 'GET', body = null) {
        console.log('=== API Call Debug Start ===');
        console.log('Endpoint:', endpoint);
        console.log('Method:', method);

        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
            try {
                // Always get a fresh token for each attempt
                const token = await auth.currentUser?.getIdToken(true);
                if (!token) {
                    throw new Error('No authentication token available');
                }

                console.log(`Token obtained successfully (attempt ${retryCount + 1})`);

                const headers = new Headers({
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache'
                });

                if (method !== 'GET' && method !== 'HEAD') {
                    headers.append('Content-Type', 'application/json');
                }

                const options = {
                    method,
                    headers,
                    credentials: 'include'
                };

                if (body) {
                    options.body = JSON.stringify(body);
                    console.log('Request body:', body);
                }

                console.log(`Making request (attempt ${retryCount + 1}):`, {
                    url: endpoint,
                    method,
                    headers: [...headers.entries()]
                });

                const response = await fetch(endpoint, options);
                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries([...response.headers]));

                // Clone response for error handling
                const responseClone = response.clone();

                if (!response.ok) {
                    let errorText;
                    try {
                        const errorData = await responseClone.json();
                        errorText = JSON.stringify(errorData);
                    } catch {
                        errorText = await response.text();
                    }

                    console.error(`=== API Error Details (attempt ${retryCount + 1}) ===`);
                    console.error('Status:', response.status);
                    console.error('Status Text:', response.statusText);
                    console.error('Error Data:', errorText);

                    // Only retry on specific status codes
                    if ([400, 401, 403].includes(response.status) && retryCount < maxRetries) {
                        console.log(`Retrying request due to status ${response.status}`);
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                        continue;
                    }

                    throw new Error(`API call failed: ${response.statusText} (${response.status})${errorText ? ': ' + errorText : ''}`);
                }

                // Always clone before reading
                const contentType = response.headers.get('content-type');
                const clonedResponse = response.clone();

                try {
                    if (contentType?.includes('application/json')) {
                        const data = await clonedResponse.json();
                        console.log('Response data:', data);
                        console.log('=== API Call Debug End ===');
                        return data;
                    } else {
                        const text = await response.text();
                        try {
                            const data = JSON.parse(text);
                            console.log('Response data:', data);
                            console.log('=== API Call Debug End ===');
                            return data;
                        } catch {
                            console.log('Response is not JSON, returning as text');
                            console.log('Response text:', text);
                            console.log('=== API Call Debug End ===');
                            return text;
                        }
                    }
                } catch (error) {
                    console.error('Error parsing response:', error);
                    const text = await response.text();
                    console.log('Fallback response text:', text);
                    console.log('=== API Call Debug End ===');
                    return text;
                }
            } catch (error) {
                if (retryCount < maxRetries) {
                    console.error(`API call error (attempt ${retryCount + 1}):`, error);
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    continue;
                }
                console.error('Final API call error:', error);
                throw error;
            }
        }
    }

    // API Service Functions
    async function getInvitationCodes() {
        console.log('Fetching invitation codes');
        try {
            const token = await auth.currentUser?.getIdToken(true);
            if (!token) {
                throw new Error('No authentication token available');
            }

            const headers = new Headers({
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            });

            const response = await fetch('/api/admin/invitation-codes', {
                method: 'GET',
                headers,
                credentials: 'include'
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries([...response.headers]));

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('Invitation codes response:', data);
            return data;
        } catch (error) {
            console.error('Failed to fetch invitation codes:', error);
            return {};
        }
    }

    async function getScans(hostId = null, page = 0, size = 10) {
        console.log('Fetching scans with params:', { hostId, page, size });
        try {
            const token = await auth.currentUser?.getIdToken(true);
            if (!token) {
                throw new Error('No authentication token available');
            }

            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: 'scannedAt,desc'
            });

            if (hostId) {
                params.append('hostId', hostId.toString());
            }

            const headers = new Headers({
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            });

            const url = `/api/admin/scans?${params.toString()}`;
            console.log('Fetching from URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers,
                credentials: 'include'
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('Scans API response:', data);
            
            // Ensure we return a properly structured object
            if (!data) {
                console.warn('API returned null/undefined data');
                return { content: [] };
            }
            
            if (Array.isArray(data)) {
                console.log('API returned an array, wrapping in content object');
                return { content: data };
            }
            
            if (data && typeof data === 'object' && !data.content) {
                console.log('API returned object without content, wrapping response');
                return { content: [data] };
            }
            
            console.log('Returning data as-is:', data);
            return data;
        } catch (error) {
            console.error('Failed to fetch scans:', error);
            return { content: [] };
        }
    }

    async function getHosts() {
        try {
            return await callApi('/api/admin/hosts');
        } catch (error) {
            console.error('Failed to fetch hosts:', error);
            throw error;
        }
    }

    // Admin Authentication
    window.handleLogin = async function(event) {
        event.preventDefault(); // Prevent form submission
        console.log('Login form submitted');
        
        const form = event.target;
        const email = form.querySelector('#username').value;
        const password = form.querySelector('#password').value;
        const errorMessage = document.getElementById('error-message');
        const loginButton = form.querySelector('.login-btn');
        
        console.log('Attempting login...'); // Debug log
        
        try {
            // Disable login button and show loading state
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
            errorMessage.style.display = 'none';
            
            console.log('Authenticating with Firebase...'); // Debug log
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Authentication successful:', userCredential); // Debug log
            
            // Store authentication state
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('userEmail', userCredential.user.email);
            
            console.log('Redirecting to dashboard...'); // Debug log
            window.location.href = '/admin/dashboard';
        } catch (error) {
            console.error('Login error:', error); // For debugging
            errorMessage.style.display = 'block';
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
            
            // Provide more user-friendly error messages
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage.textContent = 'Please enter a valid email address.';
                    break;
                case 'auth/user-not-found':
                    errorMessage.textContent = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage.textContent = 'Incorrect password. Please try again.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage.textContent = 'Too many failed attempts. Please try again later.';
                    break;
                default:
                    errorMessage.textContent = 'Login failed. Please try again.';
            }
            
            // Reset login button
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    }

    // Dashboard Functions
    window.loadResidents = function() {
        const tbody = document.querySelector('#residentsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        sampleResidents.forEach(resident => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${resident.id}</td>
                <td>${resident.name}</td>
                <td>${resident.unit}</td>
                <td>${resident.email}</td>
                <td>${resident.phone}</td>
                <td><span class="status-badge status-${resident.status}">${resident.status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-edit" onclick="editResident('${resident.id}')">Edit</button>
                    <button class="btn btn-delete" onclick="deleteResident('${resident.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    window.loadPasses = function() {
        const tbody = document.querySelector('#passesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        samplePasses.forEach(pass => {
            const resident = sampleResidents.find(r => r.id === pass.residentId);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pass.id}</td>
                <td>${resident ? resident.name : 'Unknown'}</td>
                <td>${pass.type}</td>
                <td>${pass.validUntil}</td>
                <td><span class="status-badge status-${pass.status}">${pass.status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-edit" onclick="editPass('${pass.id}')">Edit</button>
                    <button class="btn btn-delete" onclick="deletePass('${pass.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    window.loadScanners = function() {
        const tbody = document.querySelector('#scannersTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        sampleScanners.forEach(scanner => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${scanner.id}</td>
                <td>${scanner.location}</td>
                <td>${scanner.lastActive}</td>
                <td><span class="status-badge status-${scanner.status}">${scanner.status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-edit" onclick="editScanner('${scanner.id}')">Edit</button>
                    <button class="btn btn-delete" onclick="deleteScanner('${scanner.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    // CRUD Functions
    window.addResident = function() {
        // TODO: Implement add resident form
        alert('Add resident functionality coming soon!');
    };

    window.editResident = function(id) {
        const resident = sampleResidents.find(r => r.id === id);
        if (resident) {
            // TODO: Implement edit resident form
            alert(`Edit resident ${resident.name}`);
        }
    };

    window.deleteResident = function(id) {
        if (confirm('Are you sure you want to delete this resident?')) {
            // TODO: Implement delete resident
            alert(`Delete resident ${id}`);
        }
    };

    window.addPass = function() {
        // TODO: Implement add pass form
        alert('Add pass functionality coming soon!');
    };

    window.editPass = function(id) {
        const pass = samplePasses.find(p => p.id === id);
        if (pass) {
            // TODO: Implement edit pass form
            alert(`Edit pass ${pass.id}`);
        }
    };

    window.deletePass = function(id) {
        if (confirm('Are you sure you want to delete this pass?')) {
            // TODO: Implement delete pass
            alert(`Delete pass ${id}`);
        }
    };

    window.addScanner = function() {
        // TODO: Implement add scanner form
        alert('Add scanner functionality coming soon!');
    };

    window.editScanner = function(id) {
        const scanner = sampleScanners.find(s => s.id === id);
        if (scanner) {
            // TODO: Implement edit scanner form
            alert(`Edit scanner ${scanner.location}`);
        }
    };

    window.deleteScanner = function(id) {
        if (confirm('Are you sure you want to delete this scanner?')) {
            // TODO: Implement delete scanner
            alert(`Delete scanner ${id}`);
        }
    };

    // Section Switching
    window.showSection = function(sectionId) {
        const sections = ['residents', 'passes', 'scanners'];
        const navLinks = document.querySelectorAll('.admin-nav a');
        
        // Hide all sections and remove active class from nav links
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'none';
        });
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Show selected section and set nav link as active
        const selectedSection = document.getElementById(sectionId);
        const selectedLink = document.querySelector(`.admin-nav a[href="#${sectionId}"]`);
        
        if (selectedSection) {
            selectedSection.style.display = 'block';
            selectedLink?.classList.add('active');
            
            // Load data for the selected section
            switch(sectionId) {
                case 'residents':
                    loadResidents();
                    break;
                case 'passes':
                    loadPasses();
                    break;
                case 'scanners':
                    loadScanners();
                    break;
            }
        }
    };

    // Initialize Firebase Auth state listener
    auth.onAuthStateChanged(async (user) => {
        const isDashboardPage = window.location.pathname.includes('dashboard');
        const isLoginPage = window.location.pathname.includes('login');
        
        // Reset token state on auth changes
        currentToken = null;
        tokenRefreshPromise = null;
        lastTokenRefresh = 0;
        
        // Reset initialization state
        isDashboardInitialized = false;

        if (user) {
            // User is signed in
            if (isLoginPage) {
                // Redirect to dashboard if on login page
                window.location.href = '/admin/dashboard.html';
            } else if (isDashboardPage) {
                // Initialize dashboard if on dashboard page
                await initializeDashboard();
            }
        } else {
            // No user is signed in
            if (!isLoginPage && isDashboardPage) {
                // Redirect to login if not authenticated
                window.location.href = '/admin/login.html';
            }
        }
    });

    // Initial page load setup
    document.addEventListener('DOMContentLoaded', () => {
        const isDashboardPage = window.location.pathname.includes('dashboard');
        if (isDashboardPage) {
            // Show loading state
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = '<div class="loading">Loading...</div>';
            }
            
            // Initialize dashboard if user is already signed in
            const currentUser = auth.currentUser;
            if (currentUser) {
                initializeDashboard().then(() => {
                    // Remove loading state
                    if (mainContent) {
                        mainContent.innerHTML = '';
                    }
                }).catch(error => {
                    console.error('Failed to initialize dashboard:', error);
                    if (mainContent) {
                        mainContent.innerHTML = '<div class="error">Failed to load dashboard</div>';
                    }
                });
            }
        }
    });

    async function loadResidents() {
        try {
            const residentsSnapshot = await getDocs(collection(db, 'residents'));
            const tableBody = document.querySelector('#residentsTable tbody');
            tableBody.innerHTML = '';
            
            residentsSnapshot.forEach(doc => {
                const resident = doc.data();
                const row = `
                    <tr>
                        <td>${doc.id}</td>
                        <td>${resident.name}</td>
                        <td>${resident.unit}</td>
                        <td>${resident.email}</td>
                        <td>${resident.phone}</td>
                        <td>${resident.status}</td>
                        <td>
                            <button onclick="editResident('${doc.id}', { ...resident })">Edit</button>
                            <button onclick="deleteResident('${doc.id}')">Delete</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } catch (error) {
            console.error('Error loading residents:', error);
        }
    }

    async function loadPasses() {
        try {
            const passesSnapshot = await getDocs(collection(db, 'passes'));
            const tableBody = document.querySelector('#passesTable tbody');
            tableBody.innerHTML = '';
            
            passesSnapshot.forEach(doc => {
                const pass = doc.data();
                const row = `
                    <tr>
                        <td>${doc.id}</td>
                        <td>${pass.visitorName}</td>
                        <td>${pass.date}</td>
                        <td>${pass.status}</td>
                        <td>
                            <button onclick="viewPass('${doc.id}')">View</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } catch (error) {
            console.error('Error loading passes:', error);
        }
    }

    async function loadScanners() {
        try {
            const scannersSnapshot = await getDocs(collection(db, 'scanners'));
            const tableBody = document.querySelector('#scannersTable tbody');
            tableBody.innerHTML = '';
            
            scannersSnapshot.forEach(doc => {
                const scanner = doc.data();
                const row = `
                    <tr>
                        <td>${doc.id}</td>
                        <td>${scanner.location}</td>
                        <td>${scanner.status}</td>
                        <td>
                            <button onclick="manageScannerStatus('${doc.id}')">Toggle Status</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } catch (error) {
            console.error('Error loading scanners:', error);
        }
    }

    // Add new resident
    async function addResident(data) {
        try {
            await addDoc(collection(db, 'residents'), data);
            loadResidents();
        } catch (error) {
            console.error('Error adding resident:', error);
        }
    }

    // Delete resident
    async function deleteResident(id) {
        try {
            await deleteDoc(doc(db, 'residents', id));
            loadResidents();
        } catch (error) {
            console.error('Error deleting resident:', error);
        }
    }

    // Edit resident
    async function editResident(id, data) {
        try {
            await updateDoc(doc(db, 'residents', id), data);
            loadResidents();
        } catch (error) {
            console.error('Error updating resident:', error);
        }
    }



    // Show/Hide Sections and Initialize Dashboard
    window.showSection = function(sectionId) {
        // Hide all sections
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });

        // Show the selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.style.display = 'block';
        }

        // Update active state in navigation
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Load data for the selected section
        switch(sectionId) {
            case 'overview':
                // Metrics are already updated by initializeDashboard
                break;
            case 'residents':
                loadResidents();
                break;
            case 'passes':
                loadPasses();
                break;
            case 'scanners':
                loadScanners();
                break;
        }
    };

    // Function to update the current date
    function updateCurrentDate() {
        const dateElement = document.querySelector('.current-date');
        if (dateElement) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const currentDate = new Date().toLocaleDateString('en-US', options);
            dateElement.textContent = currentDate;
        }
    }

    // Function to update dashboard metrics
    async function updateDashboardMetrics() {
        try {
            // Temporarily disabled scans service
            const scansToday = 0;

            // Get invitation codes
            console.log('Fetching invitation codes...');
            const invitationCodes = await getInvitationCodes();
            console.log('Invitation codes response:', invitationCodes);
            
            // Sum up all invitation codes across all hosts
            const activeInvitationCodes = invitationCodes ? 
                Object.values(invitationCodes).reduce((total, codes) => total + codes.length, 0) : 0;

            // Get hosts
            const hosts = await getHosts();
            const activeHosts = hosts.length;

            // Update the metrics in the UI
            const elements = {
                totalScansToday: document.getElementById('totalScansToday'),
                activeInvitationCodes: document.getElementById('activeInvitationCodes'),
                activeHosts: document.getElementById('activeHosts')
            };

            if (elements.totalScansToday) elements.totalScansToday.textContent = scansToday;
            if (elements.activeInvitationCodes) elements.activeInvitationCodes.textContent = activeInvitationCodes;
            if (elements.activeHosts) elements.activeHosts.textContent = activeHosts;

            // Update scanner activity chart
            await updateScannerActivityChart();

        } catch (error) {
            console.error('Error updating dashboard metrics:', error);
            // Set default values if API calls fail
            const elements = {
                totalScansToday: document.getElementById('totalScansToday'),
                activeInvitationCodes: document.getElementById('activeInvitationCodes'),
                activeHosts: document.getElementById('activeHosts')
            };

            if (elements.totalScansToday) elements.totalScansToday.textContent = '0';
            if (elements.activeInvitationCodes) elements.activeInvitationCodes.textContent = '0';
            if (elements.activeHosts) elements.activeHosts.textContent = '0';
        }
    }

    // Function to update scanner activity chart
    let scannerActivityChart = null;
    function updateScannerActivityChart() {
        const ctx = document.getElementById('scannerActivityChart');
        if (!ctx) return;

        // Sample data for the last 7 days
        const labels = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        }).reverse();

        const data = {
            labels: labels,
            datasets: [{
                label: 'Total Scans',
                data: [156, 142, 138, 145, 132, 148, 150],
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };

        if (scannerActivityChart) {
            scannerActivityChart.destroy();
        }
        scannerActivityChart = new Chart(ctx, config);
    }

    // Sample recent activities data
    const sampleActivities = [
        { type: 'scan', message: 'John Smith scanned at Main Gate', timestamp: '2025-02-05T20:45:00' },
        { type: 'pass', message: 'New visitor pass created for Unit A101', timestamp: '2025-02-05T19:30:00' },
        { type: 'resident', message: 'Emma Johnson updated contact information', timestamp: '2025-02-05T18:15:00' },
        { type: 'scanner', message: 'Pool Entrance scanner went offline', timestamp: '2025-02-05T17:45:00' },
        { type: 'pass', message: 'Service pass expired for Unit B205', timestamp: '2025-02-05T16:30:00' }
    ];

    // Function to format timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Function to update recent activity list
    async function updateRecentActivity() {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        activityList.innerHTML = '';

        try {
            const scansData = await getScans(null, 0, 5);
            if (!scansData || !scansData.content || scansData.content.length === 0) {
                activityList.innerHTML = '<p class="no-data">No recent activity</p>';
                return;
            }

            scansData.content.forEach(scan => {
                activityList.innerHTML += `
                    <div class="activity-item scan">
                        <div class="activity-icon">
                            <i class="fas fa-qrcode"></i>
                        </div>
                        <div class="activity-details">
                            <p>${scan.visitorName} scanned at ${scan.scannerDisplayName}</p>
                            <span class="activity-time">${formatTimestamp(scan.scannedAt)}</span>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Error updating recent activity:', error);
            activityList.innerHTML = '<p class="error">Failed to load recent activity</p>';
        }
        
    }

    

    // Function to update dashboard with fetched data
    // Individual section update functions
    function updateInvitationCodesSection(codes) {
        // Update invitation codes UI
        const codesContainer = document.getElementById('invitation-codes-container');
        if (!codesContainer) return;
        
        // Clear existing content
        codesContainer.innerHTML = '';
        
        // Add new content
        Object.entries(codes).forEach(([hostName, hostCodes]) => {
            const hostSection = document.createElement('div');
            hostSection.className = 'host-section';
            hostSection.innerHTML = `<h3>${hostName}</h3>`;
            
            const codesList = document.createElement('ul');
            hostCodes.forEach(code => {
                const li = document.createElement('li');
                li.textContent = `${code.code} (${code.used ? 'Used' : 'Available'})`;
                codesList.appendChild(li);
            });
            
            hostSection.appendChild(codesList);
            codesContainer.appendChild(hostSection);
        });
    }
    
    function updateScansSection(scans) {
        // Update scans UI
        const scansContainer = document.getElementById('scans-container');
        if (!scansContainer) return;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .scans-container {
                padding: 20px;
            }
            .scans-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .scan-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .scan-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            .scan-header {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            .scan-icon {
                background: #f0f9ff;
                color: #0369a1;
                padding: 10px;
                border-radius: 10px;
                margin-right: 15px;
            }
            .scan-main-info {
                flex-grow: 1;
            }
            .scan-host {
                font-weight: 600;
                color: #1e293b;
                font-size: 1.1em;
                margin-bottom: 4px;
                display: block;
            }
            .scan-time {
                color: #64748b;
                font-size: 0.9em;
                display: block;
            }
            .scan-details {
                display: grid;
                grid-template-columns: 1fr;
                gap: 12px;
            }
            .detail-item {
                display: flex;
                align-items: center;
                color: #475569;
                font-size: 0.95em;
            }
            .detail-item i {
                margin-right: 8px;
                color: #64748b;
                width: 16px;
            }
            .empty-state {
                text-align: center;
                padding: 40px;
                color: #64748b;
            }
            .empty-state i {
                font-size: 48px;
                margin-bottom: 16px;
                color: #94a3b8;
            }
            .empty-state h3 {
                margin: 0 0 8px 0;
                color: #1e293b;
            }
        `;
        document.head.appendChild(style);
        
        // Clear existing content
        scansContainer.innerHTML = '';
        
        if (!scans || !scans.content || scans.content.length === 0) {
            scansContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-qrcode"></i>
                    <h3>No Recent Scans</h3>
                    <p>There are no scans recorded yet.</p>
                </div>
            `;
            return;
        }
        
        console.log('Rendering scans:', scans.content);
        
        const scansGrid = document.createElement('div');
        scansGrid.className = 'scans-grid';
        
        scans.content.forEach(scan => {
            console.log('Processing scan:', scan);
            const scanCard = document.createElement('div');
            scanCard.className = 'scan-card';
            scanCard.innerHTML = `
                <div class="scan-header">
                    <div class="scan-icon">
                        <i class="fas fa-qrcode"></i>
                    </div>
                    <div class="scan-main-info">
                        <span class="scan-host">${scan.hostName || 'Unknown Host'}</span>
                        <span class="scan-time">${scan.scannedAt || 'Unknown Time'}</span>
                    </div>
                </div>
                <div class="scan-details">
                    <div class="detail-item">
                        <i class="fas fa-user"></i>
                        <span>Visitor: ${scan.visitorName || 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-qrcode"></i>
                        <span>Scanner: ${scan.scannerDisplayName || 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-id-badge"></i>
                        <span>Issuer: ${scan.issuerDisplayName || 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-home"></i>
                        <span>Host: ${scan.hostName || 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-key"></i>
                        <span>Scan ID: ${scan.jti || 'N/A'}</span>
                    </div>
                </div>
            `;
            scansGrid.appendChild(scanCard);
        });
        
        scansContainer.appendChild(scansGrid);
    }
    
    function updateHostsSection(hosts) {
        // Update hosts UI
        const hostsContainer = document.getElementById('hosts-container');
        if (!hostsContainer) return;
        
        // Clear existing content
        hostsContainer.innerHTML = '';
        
        if (!hosts || hosts.length === 0) {
            hostsContainer.innerHTML = '<p>No hosts found</p>';
            return;
        }
        
        const hostsList = document.createElement('ul');
        hosts.forEach(host => {
            const li = document.createElement('li');
            li.textContent = host.name;
            hostsList.appendChild(li);
        });
        
        hostsContainer.appendChild(hostsList);
    }
    
    function updateDashboardWithData(codes, scans, hosts) {
        try {
            console.log('Updating dashboard with data:', { codes, scans, hosts });
            
            // Update invitation codes section
            const invitationCodesSection = document.getElementById('invitation-codes');
            if (invitationCodesSection) {
                updateInvitationCodesSection(codes);
            }

            // Update scans section
            updateScansSection(scans);

            // Update hosts section
            const hostsSection = document.getElementById('hosts');
            if (hostsSection) {
                updateHostsSection(hosts);
            }

            // Update metrics
            updateDashboardMetrics();

            // Update scanner activity chart
            updateScannerActivityChart();

            // Update recent activity
            updateRecentActivity();

            console.log('Dashboard updated successfully');
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    // Cache for API responses
    const apiCache = {
        data: {
            invitationCodes: null,
            scans: null,
            hosts: null
        },
        lastFetch: {
            invitationCodes: 0,
            scans: 0,
            hosts: 0
        }
    };
    
    const CACHE_TTL = 30000; // 30 seconds cache TTL
    
    // Function to check if cache is valid
    function isCacheValid(key) {
        return apiCache.data[key] !== null && 
               (Date.now() - apiCache.lastFetch[key]) < CACHE_TTL;
    }
    
    // Function to get data with caching
    async function getCachedData(key, fetchFn) {
        if (isCacheValid(key)) {
            console.log(`Using cached ${key} data`);
            return apiCache[key];
        }
        
        const data = await fetchFn();
        apiCache[key] = data;
        apiCache.lastFetch[key] = Date.now();
        return data;
    }
    
    // Track if dashboard is already initialized
    let isDashboardInitialized = false;
    
    // Function to initialize the dashboard
    async function initializeDashboard() {
        // Prevent multiple initializations
        if (isDashboardInitialized) {
            console.log('Dashboard already initialized, skipping...');
            return;
        }
        
        console.log('Starting dashboard initialization...');
        
        try {
            // Clear any previous error state
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = '<div class="loading">Loading dashboard data...</div>';
            }

            // Fetch both invitation codes and scans
            const [codes, scans] = await Promise.all([
                getInvitationCodes(),
                getScans()
            ]);
            
            console.log('Fetched invitation codes:', codes);
            console.log('Fetched scans:', scans);

            // Update main content
            if (mainContent) {
                // Add styles
                const style = document.createElement('style');
                style.textContent = `
                    .dashboard-content {
                        padding: 20px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .section {
                        margin-bottom: 40px;
                        background: #fff;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .dashboard-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 24px;
                    }
                    .dashboard-header h2 {
                        margin: 0;
                        color: #2c3e50;
                        font-size: 24px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .scan-stats {
                        display: flex;
                        gap: 16px;
                    }
                    .stat {
                        background: #f8f9fa;
                        padding: 8px 12px;
                        border-radius: 8px;
                        font-size: 14px;
                        color: #2c3e50;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .scans-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .scan-card {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 16px;
                        transition: all 0.2s;
                    }
                    .scan-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .scan-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                    }
                    .scan-location {
                        font-weight: 500;
                        color: #2c3e50;
                    }
                    .scan-time {
                        color: #666;
                        font-size: 14px;
                    }
                    .scan-details {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .scan-user {
                        font-size: 14px;
                        color: #666;
                    }
                    .scan-status {
                        font-size: 12px;
                        padding: 4px 8px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .scan-status.allowed {
                        background: #e8f5e9;
                        color: #2e7d32;
                    }
                    .scan-status.denied {
                        background: #ffebee;
                        color: #c62828;
                    }
                    .invitation-codes-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 20px;
                        margin-top: 20px;
                    }
                    .host-section {
                        background: #fff;
                        border-radius: 10px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        padding: 20px;
                        margin-bottom: 20px;
                    }
                    .host-section h3 {
                        color: #34495e;
                        margin: 0 0 15px 0;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .code-card {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 10px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        transition: all 0.2s;
                    }
                    .code-card.used {
                        background: #f5f5f5;
                    }
                    .code-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .code-info {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .code-value {
                        font-family: monospace;
                        font-size: 14px;
                        color: #2c3e50;
                        background: #fff;
                        padding: 4px 8px;
                        border-radius: 4px;
                        border: 1px solid #e9ecef;
                        letter-spacing: 1px;
                    }
                    .code-used-by, .code-used-at {
                        font-size: 12px;
                        color: #666;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .code-status {
                        font-size: 12px;
                        padding: 6px 10px;
                        border-radius: 12px;
                        background: #e8f5e9;
                        color: #2e7d32;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        white-space: nowrap;
                    }
                    .code-status.used {
                        background: #ffebee;
                        color: #c62828;
                    }
                    .code-status i {
                        font-size: 10px;
                    }
                    .empty-state {
                        text-align: center;
                        padding: 40px;
                        color: #666;
                    }
                `;
                document.head.appendChild(style);

                // Create dashboard content
                const hostsHtml = Object.entries(codes).map(([host, hostCodes]) => `
                    <div class="host-section">
                        <h3>
                            <i class="fas fa-building"></i>
                            ${host}
                        </h3>
                        <div class="invitation-codes-grid">
                            ${hostCodes.map(code => {
                                // Check if code is an object with code and used properties
                                const codeValue = typeof code === 'object' ? code.code : code;
                                const isUsed = typeof code === 'object' ? code.used : false;
                                return `
                                    <div class="code-card ${isUsed ? 'used' : ''}">
                                        <div class="code-info">
                                            <span class="code-value">${codeValue}</span>
                                            ${code.usedBy ? `
                                                <span class="code-used-by">
                                                    <i class="fas fa-user"></i> ${code.usedBy}
                                                </span>
                                            ` : ''}
                                            ${code.usedAt ? `
                                                <span class="code-used-at">
                                                    <i class="fas fa-clock"></i> ${new Date(code.usedAt).toLocaleString()}
                                                </span>
                                            ` : ''}
                                        </div>
                                        <span class="code-status ${isUsed ? 'used' : 'active'}">
                                            ${isUsed ? '<i class="fas fa-check-circle"></i> Used' : '<i class="fas fa-circle"></i> Active'}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('');

                mainContent.innerHTML = `
                    <div class="dashboard-content">
                        <div class="section">
                            <div class="dashboard-header">
                                <h2><i class="fas fa-ticket-alt"></i> Invitation Codes</h2>
                                <button class="btn btn-primary" onclick="generateNewCode()">
                                    <i class="fas fa-plus"></i> Generate New Code
                                </button>
                            </div>
                            ${Object.keys(codes).length ? hostsHtml : `
                                <div class="empty-state">
                                    <i class="fas fa-ticket-alt fa-3x"></i>
                                    <h3>No Invitation Codes</h3>
                                    <p>There are no invitation codes available at the moment.</p>
                                </div>
                            `}
                        </div>

                        <div class="section">
                            <div class="dashboard-header">
                                <h2><i class="fas fa-qrcode"></i> Recent Scans</h2>
                            </div>
                            <div id="scans-container"></div>
                        </div>
                    </div>
                `;
            }

            // Update the scans section with the fetched data
            updateScansSection(scans);

            isDashboardInitialized = true;
            console.log('Dashboard initialization complete');
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            isDashboardInitialized = false;
            
            // Show error state
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error">
                        <h2>Error Loading Dashboard</h2>
                        <p>Failed to load invitation codes. Please try refreshing the page.</p>
                        <pre>${error.message}</pre>
                    </div>
                `;
            }
        }
    }
