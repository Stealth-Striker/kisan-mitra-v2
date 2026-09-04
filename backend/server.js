require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const entitiesRoutes = require('./routes/entities');
const functionsRoutes = require('./routes/functions');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security Headers Middleware ───────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(self)');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ── Rate Limiting Helper ──────────────────────────────────────────────────────
const rateLimitMap = new Map();
function createRateLimiter(windowMs = 60 * 1000, maxRequests = 60, message = 'Too many requests, please try again later.') {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + windowMs;
    } else {
      entry.count += 1;
    }

    rateLimitMap.set(ip, entry);

    if (entry.count > maxRequests) {
      return res.status(429).json({ error: message });
    }
    next();
  };
}

// ── General Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes with Rate Limiting ─────────────────────────────────────────────────
app.use('/api/auth', createRateLimiter(60 * 1000, 30, 'Too many auth requests, please try again later.'), authRoutes);
app.use('/api/entities', entitiesRoutes);
app.use('/api/functions', createRateLimiter(60 * 1000, 45, 'Too many AI requests, please try again later.'), functionsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ 
  status: 'ok',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production'
}));

// ── Central Error Handling Middleware ─────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  console.error(`[kisan-mitra error] ${req.method} ${req.url}:`, err.message || err);
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' && status === 500
      ? 'An unexpected server error occurred'
      : (err.message || 'Internal server error')
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[kisan-mitra] Backend running at http://localhost:${PORT}`);
  });
}

module.exports = app;
