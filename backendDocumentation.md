# Web Backend (Java Spring Boot)

This is the Java Spring Boot version of the Web Backend application for the QR Code Management System.

URL: mstqr-portal-backend.azurewebsites.net

## Prerequisites

- Java 17 or higher
- Maven
- PostgreSQL
- Firebase Admin SDK credentials
- Azure account with subscription

## Project Structure

The project follows standard Spring Boot application structure:
```
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── webportal/
│   │           ├── config/      # Configuration classes
│   │           ├── controller/  # REST controllers
│   │           ├── model/       # Entity classes
│   │           ├── repository/  # JPA repositories
│   │           ├── service/     # Business logic
│   │           └── security/    # Security configuration
│   └── resources/
│       └── application.properties
```

## Local Setup

1. Clone the repository
2. Configure your database in `application.properties`
3. Set up your Firebase credentials
4. Run the application:
   ```bash
   mvn spring-boot:run
   ```

## Environment Variables

Create a `.env` file with the following variables:
- `DATABASE_URL`: PostgreSQL connection URL
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 8080)
- `FIREBASE_CREDENTIALS_PATH`: Path to Firebase credentials JSON file

## Features

- JWT Authentication
- Firebase Integration
- PostgreSQL Database with JPA
- RESTful API endpoints
- Spring Security

## Frontend Service Integration Guide

### Authentication
The application uses Firebase Authentication. Ensure you include your Firebase configuration and initialize the Firebase SDK in your frontend application.

```javascript
// Initialize Firebase in your frontend app
const firebaseConfig = {
    // Your Firebase config object
};
firebase.initializeApp(firebaseConfig);
```

### Available API Endpoints

#### Admin Services

##### 1. Get Invitation Codes
- **Endpoint**: `GET /api/admin/invitation-codes`
- **Authentication**: Requires admin role
- **Response**: Map of host names to their invitation codes with usage status
- **Example Usage**:
```javascript
async function getInvitationCodes() {
    const response = await fetch('/api/admin/invitation-codes', {
        headers: {
            'Authorization': 'Bearer ' + await getFirebaseToken()
        }
    });
    return await response.json();
}
```

##### 2. Get Scans
- **Endpoint**: `GET /api/admin/scans`
- **Authentication**: Requires admin role
- **Query Parameters**:
  - `hostId` (optional): UUID to filter scans by host
  - `page`: Page number (zero-based)
  - `size`: Number of items per page
- **Response**: Paginated list of token scans
- **Example Usage**:
```javascript
async function getScans(hostId = null, page = 0, size = 10) {
    const params = new URLSearchParams({
        page: page,
        size: size
    });
    if (hostId) params.append('hostId', hostId);
    
    const response = await fetch(`/api/admin/scans?${params}`, {
        headers: {
            'Authorization': 'Bearer ' + await getFirebaseToken()
        }
    });
    return await response.json();
}
```

##### 3. Get Host Names
- **Endpoint**: `GET /api/admin/hosts`
- **Authentication**: Requires admin role
- **Response**: List of host names
- **Example Usage**:
```javascript
async function getHostNames() {
    const response = await fetch('/api/admin/hosts', {
        headers: {
            'Authorization': 'Bearer ' + await getFirebaseToken()
        }
    });
    return await response.json();
}
```

### Helper Functions

#### Firebase Token Helper
```javascript
async function getFirebaseToken() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        throw new Error('No user is signed in');
    }
    return await currentUser.getIdToken();
}
```

#### API Call Helper
```javascript
async function callApi(endpoint, method = 'GET', body = null) {
    const token = await getFirebaseToken();
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(endpoint, options);
    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }
    return await response.json();
}
```

### Error Handling
All API calls should be wrapped in try-catch blocks to handle potential errors:

```javascript
try {
    const invitationCodes = await getInvitationCodes();
    // Handle successful response
} catch (error) {
    if (error.message.includes('401')) {
        // Handle unauthorized access
        console.error('Unauthorized access');
    } else {
        // Handle other errors
        console.error('Error:', error.message);
    }
}
```

### CORS Configuration
The backend is configured to accept requests from allowed origins. Make sure your frontend application's domain is included in the CORS configuration of the backend.

## Azure Deployment

### Prerequisites
1. Install Azure CLI
2. Login to Azure:
   ```bash
   az login
   ```

### Steps
1. Create a resource group:
   ```bash
   az group create --name webportal-rg --location eastus
   ```

2. Create an Azure Database for PostgreSQL:
   ```bash
   az postgres flexible-server create \
     --resource-group webportal-rg \
     --name webportal-db \
     --location eastus \
     --admin-user your_admin \
     --admin-password your_password \
     --sku-name Standard_B1ms
   ```

3. Create an App Service plan:
   ```bash
   az appservice plan create \
     --name webportal-plan \
     --resource-group webportal-rg \
     --sku B1 \
     --is-linux
   ```

4. Create a Web App:
   ```bash
   az webapp create \
     --resource-group webportal-rg \
     --plan webportal-plan \
     --name your-app-name \
     --runtime "JAVA:17-java17" \
     --deployment-local-git
   ```

5. Configure environment variables:
   ```bash
   az webapp config appsettings set \
     --resource-group webportal-rg \
     --name your-app-name \
     --settings \
       DATABASE_URL="jdbc:postgresql://webportal-db.postgres.database.azure.com:5432/postgres" \
       DB_USERNAME="your_admin" \
       DB_PASSWORD="your_password" \
       FIREBASE_CREDENTIALS_PATH="/home/site/wwwroot/firebase-config.json"
   ```

6. Deploy the application:
   ```bash
   mvn clean package
   az webapp deploy \
     --resource-group webportal-rg \
     --name your-app-name \
     --src-path target/webbackend-1.0.0.jar
   ```

## Frontend Integration Guide

### Authentication

```javascript
// Initialize Firebase in your frontend
const firebaseConfig = {
  // Your Firebase config
};
firebase.initializeApp(firebaseConfig);

// Get ID token and make API calls
async function callApi(endpoint, method = 'GET', body = null) {
  const user = firebase.auth().currentUser;
  const idToken = await user.getIdToken();

  const response = await fetch(`https://your-app-name.azurewebsites.net/api${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });

  return response.json();
}
```

### API Examples

```javascript
// Get invitation codes
async function getInvitationCodes() {
  try {
    const codes = await callApi('/admin/invitation-codes');
    return codes;
  } catch (error) {
    console.error('Error fetching invitation codes:', error);
  }
}

// Get scans with pagination
async function getScans(hostId = null, page = 0, size = 10) {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    if (hostId) queryParams.append('hostId', hostId);

    const scans = await callApi(`/admin/scans?${queryParams}`);
    return scans;
  } catch (error) {
    console.error('Error fetching scans:', error);
  }
}

// Get host names
async function getHosts() {
  try {
    const hosts = await callApi('/admin/hosts');
    return hosts;
  } catch (error) {
    console.error('Error fetching hosts:', error);
  }
}
```

### Example Usage in HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>QR Code Management System</title>
    <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js"></script>
</head>
<body>
    <div id="app">
        <h1>QR Code Management System</h1>
        <div id="login-section">
            <button onclick="signInWithGoogle()">Sign in with Google</button>
        </div>
        <div id="content" style="display: none;">
            <h2>Invitation Codes</h2>
            <div id="invitation-codes"></div>
            
            <h2>Scans</h2>
            <div id="scans"></div>
            
            <h2>Hosts</h2>
            <div id="hosts"></div>
        </div>
    </div>

    <script>
        async function signInWithGoogle() {
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                await firebase.auth().signInWithPopup(provider);
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('content').style.display = 'block';
                loadData();
            } catch (error) {
                console.error('Error signing in:', error);
            }
        }

        async function loadData() {
            const [codes, scans, hosts] = await Promise.all([
                getInvitationCodes(),
                getScans(),
                getHosts()
            ]);

            // Update UI
            document.getElementById('invitation-codes').innerHTML = 
                JSON.stringify(codes, null, 2);
            document.getElementById('scans').innerHTML = 
                JSON.stringify(scans, null, 2);
            document.getElementById('hosts').innerHTML = 
                JSON.stringify(hosts, null, 2);
        }
    </script>
</body>
</html>
```

## Cost Optimization

- Use B1 tier for App Service Plan (~$13/month)
- Use Basic tier for PostgreSQL (~$25-30/month)
- Enable auto-scaling rules based on CPU usage
- Consider using Azure CDN for static content
- Monitor usage with Azure Monitor

## Security Best Practices

1. Always use HTTPS
2. Store secrets in Azure Key Vault
3. Enable Azure AD authentication for PostgreSQL
4. Use managed identities for service connections
5. Configure CORS properly
6. Enable Azure Web Application Firewall
