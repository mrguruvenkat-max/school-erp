const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'ap_gov_school_secret_2026_key_9876', (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token is invalid or expired" });
    }
    req.user = user;
    next();
  });
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
