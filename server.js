require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use((req, res, next) => {
    // Remove any reference to the server software
    res.removeHeader('X-Powered-By');
    
    // CORS headers
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader("Content-Security-Policy", 
        "default-src 'self' https://*.gstatic.com https://*.firebaseapp.com https://*.googleapis.com; " +
        "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://api.emailjs.com https://*.azurewebsites.net; " +
        "img-src 'self' data: https:; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.gstatic.com https://*.firebaseapp.com https://cdn.jsdelivr.net https://cdn.emailjs.com;"
    );
    next();
});

// Parse JSON bodies
app.use(express.json());

// Serve static files from js directory first (to not interfere with /api)
app.use('/js', express.static(path.join(__dirname, 'js')));

// Serve static files from admin directory
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve static files from root directory last
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for Azure backend
app.all('/api/*', async (req, res) => {
    try {
        console.log('Proxying request:', req.method, req.url);
        
        console.log('=== Proxy Request Debug Start ===');
        console.log('Original URL:', req.url);
        console.log('Original Method:', req.method);
        console.log('Original Headers:', Object.keys(req.headers).sort());
        
        // Start fresh with essential headers only
        const headers = {
            'Accept': 'application/json',
            'User-Agent': req.headers['user-agent'],
            'Accept-Language': req.headers['accept-language'],
            'Cache-Control': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        // Copy authorization header if present (case-sensitive)
        if (req.headers.authorization) {
            headers.authorization = req.headers.authorization; // Keep lowercase
            console.log('Authorization header copied');
        } else {
            console.log('WARNING: No Authorization header found!');
        }
        
        // Handle Content-Type only for non-GET/HEAD requests
        if (!(req.method === 'GET' || req.method === 'HEAD')) {
            headers['content-type'] = 'application/json';
            console.log('Set Content-Type for non-GET request');
        }
        
        console.log('Final proxy headers:', {
            ...headers,
            Authorization: headers.Authorization ? '[REDACTED]' : undefined
        });
        console.log('=== Proxy Request Debug End ===');

        // Keep the /api prefix for the backend
        const targetPath = req.url;
        console.log('Target path:', targetPath);
        
        const options = {
            hostname: 'mstqr-portal-backend.azurewebsites.net',
            path: targetPath,
            method: req.method,
            headers: headers
        };

        console.log('Proxy options:', {
            ...options,
            headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined }
        });

        await new Promise((resolve, reject) => {
            const proxyReq = https.request(options, (proxyRes) => {
                console.log('Proxy response status:', proxyRes.statusCode);
                console.log('Proxy response headers:', proxyRes.headers);

                // Copy response headers
                Object.keys(proxyRes.headers).forEach(key => {
                    res.setHeader(key, proxyRes.headers[key]);
                });

                res.status(proxyRes.statusCode);

                // Collect the response data
                let responseData = '';
                proxyRes.on('data', (chunk) => {
                    responseData += chunk;
                });

                proxyRes.on('end', () => {
                    console.log('Proxy response data:', responseData);
                    res.send(responseData);
                    resolve();
                });

                proxyRes.on('error', (error) => {
                    console.error('Proxy response error:', error);
                    reject(error);
                });
            });

            proxyReq.on('error', (error) => {
                console.error('Proxy request error:', error);
                reject(error);
            });

            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.write(bodyData);
                console.log('Proxy request body:', bodyData);
            }

            proxyReq.end();
        });
    } catch (error) {
        console.error('Proxy handler error:', error);
        res.status(500).json({
            error: 'Proxy Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Route handlers
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.redirect('/admin/login.html');
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
