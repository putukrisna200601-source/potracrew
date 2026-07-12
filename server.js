const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
// Enable trust proxy so express-rate-limit works behind Railway's reverse proxy
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Middleware - Security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://flagcdn.com"]
        }
    }
}));
app.use(cors());

// Middleware - Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.', errors: [] }
});
app.use('/api/', limiter);

// Middleware - Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware - Static Files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'server', 'uploads')));

// Routes
app.use('/api/auth', require('./server/routes/authRoutes'));
app.use('/api/applicants', require('./server/routes/applicantRoutes'));
app.use('/api/criteria', require('./server/routes/criteriaRoutes'));
app.use('/api/saw', require('./server/routes/sawRoutes'));
app.use('/api/decision', require('./server/routes/decisionRoutes'));
app.use('/api/dashboard', require('./server/routes/dashboardRoutes'));

// 404 Handler for API
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found', errors: [] });
});

// Serve frontend for all other routes
app.get(/^(.*)$/, (req, res) => {
    // Basic routing to HTML pages
    const urlPath = req.path;
    if (urlPath === '/' || urlPath === '/index.html') {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else if (urlPath.startsWith('/admin')) {
        res.sendFile(path.join(__dirname, urlPath.endsWith('.html') ? urlPath : urlPath + '/index.html'));
    } else {
        res.sendFile(path.join(__dirname, urlPath));
    }
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errors: [err.message]
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
