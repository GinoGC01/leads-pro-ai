const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
// Global Logger to catch ALL /api requests before they hit the router
app.use((req, res, next) => {
    console.log(`[GLOBAL_LOG] ${req.method} ${req.url}`);
    next();
});
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
