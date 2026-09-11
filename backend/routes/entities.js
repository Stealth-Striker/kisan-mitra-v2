/**
 * Generic entity CRUD routes using the JSON database collections.
 */
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// ── Entity Configuration ──────────────────────────────────────────────────────
const ENTITIES = {
  Farm: {
    collection: 'farms',
    userField: 'created_by_id', // Note: frontend uses created_by_id for owner id in Base44 context
    publicRead: false,
  },
  Conversation: {
    collection: 'conversations',
    userField: 'created_by_id',
    publicRead: false,
  },
  Message: {
    collection: 'messages',
    userField: null, // checked via conversation_id
    publicRead: false,
  },
  CropDiagnosis: {
    collection: 'crop_diagnoses',
    userField: 'created_by_id',
    publicRead: false,
  },
  DiseaseAlert: {
    collection: 'disease_alerts',
    userField: null,
    publicRead: true,
    adminWrite: true,
  },
  MarketPrice: {
    collection: 'market_prices',
    userField: null,
    publicRead: true,
    adminWrite: true,
  },
  User: {
    collection: 'users',
    userField: null,
    publicRead: false,
    adminOnly: true,
  },
};

// Resolve entity name from URL param (case-insensitive)
function resolveEntity(req, res, next) {
  const entry = Object.entries(ENTITIES).find(([k]) => k.toLowerCase() === req.params.entity.toLowerCase());
  if (!entry) return res.status(404).json({ error: `Unknown entity: ${req.params.entity}` });
  req.entityName = entry[0];
  req.entityConfig = entry[1];
  next();
}

// All entity routes require auth
router.use(requireAuth);
router.use('/:entity', resolveEntity);
router.use('/:entity/:id', resolveEntity);

// Helper to filter items based on query/request parameters
function getFilteredItems(req) {
  const { entityName, entityConfig, user } = req;
  const { collection, userField, adminOnly } = entityConfig;

  if (adminOnly && user.role !== 'admin') {
    throw { status: 403, message: 'Admin access required' };
  }

  let items = db[collection].list();

  // Filter by ownership if user is not admin
  if (userField && user.role !== 'admin') {
    items = items.filter(item => item[userField] === user.id);
  }

  // Filter messages by conversation ownership
  if (entityName === 'Message' && user.role !== 'admin') {
    const myConvs = db.conversations.find(c => c.created_by_id === user.id).map(c => c.id);
    items = items.filter(item => myConvs.includes(item.conversation_id));
  }

  // Filter by query parameters
  const { _sort, _limit, ...filters } = req.query;
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') {
      items = items.filter(item => {
        // Handle boolean conversions
        if (v === 'true') return item[k] === true;
        if (v === 'false') return item[k] === false;
        // String/numeric comparison
        return String(item[k]) === String(v);
      });
    }
  }

  // Sorting
  if (_sort) {
    const desc = _sort.startsWith('-');
    const col = desc ? _sort.slice(1) : _sort;
    items = [...items].sort((a, b) => {
      const valA = a[col];
      const valB = b[col];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (typeof valA === 'string') {
        return desc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return desc ? valB - valA : valA - valB;
    });
  } else {
    // Default sort by created_date descending if exists
    items = [...items].sort((a, b) => {
      const dateA = a.created_date || '';
      const dateB = b.created_date || '';
      return dateB.localeCompare(dateA);
    });
  }

  // Limit
  if (_limit) {
    const limit = parseInt(_limit, 10);
    if (!isNaN(limit)) items = items.slice(0, limit);
  }

  // Sanitize user output if requesting User entity
  if (collection === 'users') {
    items = items.map(r => {
      const { password_hash, otp, otp_expires_at, reset_token, reset_token_expires_at, ...safe } = r;
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
    });
  }

  return items;
}

// ── GET /api/entities/:entity (list / filter) ─────────────────────────────────
router.get('/:entity', (req, res) => {
  try {
    const items = getFilteredItems(req);
    res.json(items);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error listing items' });
  }
});

// Access check helper to prevent IDOR and enforce ownership
function checkItemAccess(req, item) {
  const { entityName, entityConfig, user } = req;
  const { userField, adminOnly } = entityConfig;

  if (adminOnly && user.role !== 'admin') {
    return false;
  }
  if (user.role === 'admin') {
    return true;
  }
  if (userField && item[userField] !== user.id) {
    return false;
  }
  if (entityName === 'Message') {
    const conv = db.conversations.findOne(c => c.id === item.conversation_id);
    if (!conv || conv.created_by_id !== user.id) {
      return false;
    }
  }
  return true;
}

// ── POST /api/entities/:entity (create) ───────────────────────────────────────
router.post('/:entity', (req, res) => {
  const { entityName, entityConfig, user } = req;
  const { collection, userField, adminWrite } = entityConfig;

  if (adminWrite && user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const data = { ...req.body };

    // Prevent non-admin from inserting messages into other users' conversations
    if (entityName === 'Message' && user.role !== 'admin') {
      if (!data.conversation_id) {
        return res.status(400).json({ error: 'conversation_id is required' });
      }
      const conv = db.conversations.findOne(c => c.id === data.conversation_id);
      if (!conv || conv.created_by_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden: Cannot post to conversation owned by another user' });
      }
    }

    data.id = data.id || uuidv4();
    data.created_date = new Date().toISOString();
    
    if (userField) {
      data[userField] = user.id;
    }

    const created = db[collection].insert(data);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/entities/:entity/:id ─────────────────────────────────────────────
router.get('/:entity/:id', (req, res) => {
  const { entityConfig } = req;
  const { collection } = entityConfig;

  try {
    const item = db[collection].findOne(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    if (!checkItemAccess(req, item)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/entities/:entity/:id ─────────────────────────────────────────────
router.put('/:entity/:id', (req, res) => {
  const { entityConfig, user } = req;
  const { collection, adminWrite } = entityConfig;

  if (adminWrite && user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const item = db[collection].findOne(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    if (!checkItemAccess(req, item)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = db[collection].update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/entities/:entity/:id ──────────────────────────────────────────
router.delete('/:entity/:id', (req, res) => {
  const { entityConfig, user } = req;
  const { collection, adminWrite } = entityConfig;

  if (adminWrite && user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const item = db[collection].findOne(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    if (!checkItemAccess(req, item)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    db[collection].delete(req.params.id);

    // Cascade deletes for conversations (delete associated messages)
    if (collection === 'conversations') {
      db.messages.deleteMany(m => m.conversation_id === req.params.id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/entities/:entity/delete-many ────────────────────────────────────
router.post('/:entity/delete-many', (req, res) => {
  const { entityConfig, user } = req;
  const { collection, adminWrite } = entityConfig;

  if (adminWrite && user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const filters = req.body || {};
    const deleteFn = (item) => {
      // Access check
      if (!checkItemAccess(req, item)) {
        return false;
      }
      
      // Match filters
      for (const [k, v] of Object.entries(filters)) {
        if (item[k] !== v) return false;
      }
      return true;
    };

    const count = db[collection].deleteMany(deleteFn);
    res.json({ deleted: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
