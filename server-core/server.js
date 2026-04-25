const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import route handlers
const usersRouter = require('./routes/users');
const extensionsRouter = require('./routes/extensions');
const settingsRouter = require('./routes/settings');
const domainsRouter = require('./routes/domains');
const servicesRouter = require('./routes/services');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/server/users', usersRouter);
app.use('/api/server/extensions', extensionsRouter);
app.use('/api/server/settings', settingsRouter);
app.use('/api/server/domains', domainsRouter);
app.use('/api/server/services', servicesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
