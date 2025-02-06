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

    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Get Auth instance
    const auth = firebase.auth();
    
    console.log('Firebase initialized');

    // Add auth state listener
    auth.onAuthStateChanged((user) => {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('/login');
        const isDashboardPage = currentPath.includes('/dashboard');

        if (user) {
            // User is logged in
            if (isLoginPage) {
                // On login page, redirect to dashboard
                window.location.replace('/admin/dashboard');
            } else if (isDashboardPage) {
                // On dashboard, initialize if needed
                const dashboardContent = document.querySelector('.admin-dashboard');
                if (dashboardContent && !dashboardContent.dataset.initialized) {
                    initializeDashboard();
                    dashboardContent.dataset.initialized = 'true';
                }
            }
        } else {
            // No user logged in
            if (!isLoginPage) {
                // Not on login page, redirect to login
                window.location.replace('/admin/login');
            }
        }
    });

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

    // Sample Data
    const sampleResidents = [
        { id: 'R001', name: 'John Smith', unit: 'A101', email: 'john.smith@email.com', phone: '+1234567890', status: 'active' },
        { id: 'R002', name: 'Emma Johnson', unit: 'B205', email: 'emma.j@email.com', phone: '+1234567891', status: 'active' },
        { id: 'R003', name: 'Michael Brown', unit: 'C304', email: 'm.brown@email.com', phone: '+1234567892', status: 'pending' },
        { id: 'R004', name: 'Sarah Wilson', unit: 'A205', email: 's.wilson@email.com', phone: '+1234567893', status: 'inactive' },
    ];

    const samplePasses = [
        { id: 'P001', residentId: 'R001', type: 'Resident', validUntil: '2025-12-31', status: 'active' },
        { id: 'P002', residentId: 'R002', type: 'Visitor', validUntil: '2025-06-30', status: 'active' },
        { id: 'P003', residentId: 'R003', type: 'Temporary', validUntil: '2025-03-15', status: 'pending' },
        { id: 'P004', residentId: 'R004', type: 'Service', validUntil: '2025-09-30', status: 'inactive' },
    ];

    const sampleScanners = [
        { id: 'S001', location: 'Main Gate', lastActive: '2025-02-04 21:30:00', status: 'active' },
        { id: 'S002', location: 'Pool Entrance', lastActive: '2025-02-04 20:45:00', status: 'active' },
        { id: 'S003', location: 'Garage Entry', lastActive: '2025-02-04 19:15:00', status: 'inactive' },
        { id: 'S004', location: 'Gym Door', lastActive: '2025-02-04 21:00:00', status: 'active' },
    ];

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

    // Initialize the dashboard when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        const isDashboardPage = window.location.pathname.includes('dashboard');
        if (isDashboardPage) {
            initializeDashboard();
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
                updateDashboardMetrics();
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
            // Get total scans for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const scansToday = 156; // This would be fetched from your database

            // Get active residents count
            const activeResidents = sampleResidents.filter(r => r.status === 'active').length;

            // Get active passes count
            const activePasses = samplePasses.filter(p => p.status === 'active').length;

            // Get pending approvals count
            const pendingApprovals = sampleResidents.filter(r => r.status === 'pending').length +
                                   samplePasses.filter(p => p.status === 'pending').length;

            // Update the metrics in the UI
            const elements = {
                totalScansToday: document.getElementById('totalScansToday'),
                activeResidents: document.getElementById('activeResidents'),
                activePasses: document.getElementById('activePasses'),
                pendingApprovals: document.getElementById('pendingApprovals')
            };

            if (elements.totalScansToday) elements.totalScansToday.textContent = scansToday;
            if (elements.activeResidents) elements.activeResidents.textContent = activeResidents;
            if (elements.activePasses) elements.activePasses.textContent = activePasses;
            if (elements.pendingApprovals) elements.pendingApprovals.textContent = pendingApprovals;

            // Update scanner activity chart
            updateScannerActivityChart();

        } catch (error) {
            console.error('Error updating dashboard metrics:', error);
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
    function updateRecentActivity() {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        activityList.innerHTML = '';
        
        sampleActivities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            let iconClass = '';
            switch(activity.type) {
                case 'scan':
                    iconClass = 'fa-qrcode';
                    break;
                case 'pass':
                    iconClass = 'fa-id-card';
                    break;
                case 'resident':
                    iconClass = 'fa-user';
                    break;
                case 'scanner':
                    iconClass = 'fa-wifi';
                    break;
            }
            
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-message">${activity.message}</p>
                    <span class="activity-time">${formatTimestamp(activity.timestamp)}</span>
                </div>
            `;
            
            activityList.appendChild(activityItem);
        });
    }

    // Function to initialize the dashboard
    function initializeDashboard() {
        // Show the overview section by default
        showSection('overview');
        
        // Update the current date
        updateCurrentDate();
        
        // Update dashboard metrics and activities
        updateDashboardMetrics();
        updateRecentActivity();
        
        // Set up periodic updates
        setInterval(updateDashboardMetrics, 60000); // Update every minute
        setInterval(updateCurrentDate, 60000); // Update date every minute
        setInterval(updateRecentActivity, 60000); // Update activities every minute

        // Handle search functionality
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                // Implement search functionality here
                console.log('Searching for:', searchTerm);
            });
        }
    }
