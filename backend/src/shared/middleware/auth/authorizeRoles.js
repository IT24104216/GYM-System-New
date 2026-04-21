import { normalizeRole } from '../../utils/roles.js';

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    const normalizedAllowedRoles = allowedRoles.map((item) => normalizeRole(item));
    if (!role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!normalizedAllowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    return next();
  };
}
