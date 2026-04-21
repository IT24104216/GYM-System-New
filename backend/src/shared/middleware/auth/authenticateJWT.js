import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import { normalizeRole } from '../../utils/roles.js';

export function authenticateJWT(req, res, next) {
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: missing token' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = {
      id: String(decoded?.sub || ''),
      role: normalizeRole(decoded?.role),
      email: String(decoded?.email || ''),
      name: String(decoded?.name || ''),
    };
    if (!req.user.id || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized: invalid token payload' });
    }
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: invalid token' });
  }
}
