const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'kunci-rahasia-default';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token tidak valid atau kadaluarsa.' });
  }
};

// Middleware baru untuk memastikan hanya peran tertentu yang bisa mengakses
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: `Akses ditolak. Hanya untuk peran ${role}.` });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };