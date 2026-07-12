const jwt = require('jsonwebtoken');
const SECRET = 'transitops-hackathon-secret-2026'; // fine for a hackathon demo, not production

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}
function fail(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '12h' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 401, 'No token provided');
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return fail(res, 401, 'Invalid or expired token');
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, 403, 'You do not have permission to perform this action');
    }
    next();
  };
}

module.exports = { ok, fail, signToken, requireAuth, requireRole, SECRET };
