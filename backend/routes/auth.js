const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

function sanitizeUser(u) {
  const { password_hash, otp, otp_expires_at, reset_token, reset_token_expires_at, ...safe } = u;
  return {
    ...safe,
    notification_prefs: (() => {
      try {
        if (typeof safe.notification_prefs === 'string') {
          return JSON.parse(safe.notification_prefs || '{}');
        }
        return safe.notification_prefs || {};
      } catch {
        return {};
      }
    })(),
  };
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const existing = db.users.findOne(u => u.email === email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const newUser = db.users.insert({
      id,
      email: email.toLowerCase(),
      password_hash: hash,
      role: 'user',
      is_verified: true, // Auto-verified immediately
      notification_prefs: '{}'
    });

    const access_token = signToken(newUser.id);
    res.json({ access_token, user: sanitizeUser(newUser) });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/auth/verify-otp (No-op/compatibility) ───────────────────────────
router.post('/verify-otp', (req, res) => {
  const { email } = req.body;
  const user = db.users.findOne(u => u.email === email.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const access_token = signToken(user.id);
  res.json({ access_token, user: sanitizeUser(user) });
});

// ── POST /api/auth/resend-otp (No-op/compatibility) ───────────────────────────
router.post('/resend-otp', (req, res) => {
  res.json({ message: 'OTP verification is disabled' });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = db.users.findOne(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.password_hash) return res.status(401).json({ error: 'Invalid account configuration' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const access_token = signToken(user.id);
    res.json({ access_token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json(sanitizeUser(req.user));
});

// ── PUT /api/auth/me ──────────────────────────────────────────────────────────
router.put('/me', requireAuth, (req, res) => {
  try {
    const { full_name, notification_prefs, phone } = req.body;
    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (notification_prefs !== undefined) {
      updates.notification_prefs = typeof notification_prefs === 'object' ? JSON.stringify(notification_prefs) : notification_prefs;
    }

    if (Object.keys(updates).length === 0) {
      return res.json(sanitizeUser(req.user));
    }

    const updated = db.users.update(req.user.id, updates);
    res.json(sanitizeUser(updated));
  } catch (err) {
    console.error('[auth/me PUT]', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ message: 'If an account exists, a reset email will be sent' });

    const user = db.users.findOne(u => u.email === email.toLowerCase());
    if (user) {
      const resetToken = uuidv4();
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour
      db.users.update(user.id, { reset_token: resetToken, reset_token_expires_at: expires });

      const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      console.log(`\n[PASSWORD RESET] To: ${email}\nReset Link: ${resetUrl}\n`);
    }

    res.json({ message: 'If an account exists, a reset email will be sent' });
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });

    const user = db.users.findOne(u => u.reset_token === resetToken);
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    if (Date.now() > user.reset_token_expires_at) return res.status(400).json({ error: 'Reset link has expired' });

    const hash = await bcrypt.hash(newPassword, 10);
    db.users.update(user.id, { password_hash: hash, reset_token: null, reset_token_expires_at: null });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
