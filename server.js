require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable compression
app.use(compression());

// Cache static files
const staticOptions = {
    maxAge: '1d',
    etag: true,
    lastModified: true
};

// Security middleware
app.use((req, res, next) => {
    // Remove any reference to the server software
    res.removeHeader('X-Powered-By');
    
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

// Configure aggressive caching for fonts
const fontOptions = {
    maxAge: '30d',  // Cache fonts for 30 days
    immutable: true,
    etag: true,
    lastModified: true
};

// Serve static files with caching
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts'), fontOptions));
app.use('/js', express.static(path.join(__dirname, 'js'), staticOptions));
app.use('/admin', express.static(path.join(__dirname, 'admin'), staticOptions));
app.use(express.static(path.join(__dirname), staticOptions));

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
