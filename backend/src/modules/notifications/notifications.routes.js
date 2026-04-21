import { Router } from 'express';
import {
  getnotificationsStatus,
  getNotifications,
  getNotificationPreferences,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from './notifications.controller.js';
import { authenticateJWT } from '../../shared/middleware/auth/authenticateJWT.js';
import { authorizeRoles } from '../../shared/middleware/auth/authorizeRoles.js';
import { requireOwnership } from '../../shared/middleware/auth/requireOwnership.js';

const router = Router();

router.get('/', getnotificationsStatus);
const enforceNotificationRoleMatch = (from = 'query') => (req, res, next) => {
  const authRole = String(req.user?.role || '');
  if (!authRole) return res.status(401).json({ message: 'Unauthorized' });
  if (authRole === 'admin') return next();

  const incomingRole = String((from === 'body' ? req.body?.role : req.query?.role) || authRole);
  if (incomingRole !== authRole) {
    return res.status(403).json({ message: 'Forbidden: role scope mismatch' });
  }
  return next();
};

router.get(
  '/list',
  authenticateJWT,
  authorizeRoles('admin', 'user', 'coach', 'dietitian'),
  enforceNotificationRoleMatch('query'),
  requireOwnership({ checks: [{ from: 'query', key: 'userId' }], allowRoles: ['admin'] }),
  getNotifications,
);
router.patch(
  '/read-all',
  authenticateJWT,
  authorizeRoles('admin', 'user', 'coach', 'dietitian'),
  enforceNotificationRoleMatch('body'),
  requireOwnership({ checks: [{ from: 'body', key: 'userId' }], allowRoles: ['admin'] }),
  markAllNotificationsRead,
);
router.patch(
  '/:id/read',
  authenticateJWT,
  authorizeRoles('admin', 'user', 'coach', 'dietitian'),
  enforceNotificationRoleMatch('body'),
  requireOwnership({ checks: [{ from: 'body', key: 'userId' }], allowRoles: ['admin'] }),
  markNotificationRead,
);
router.get(
  '/preferences',
  authenticateJWT,
  authorizeRoles('admin', 'user', 'coach', 'dietitian'),
  enforceNotificationRoleMatch('query'),
  getNotificationPreferences,
);
router.patch(
  '/preferences',
  authenticateJWT,
  authorizeRoles('admin', 'user', 'coach', 'dietitian'),
  enforceNotificationRoleMatch('body'),
  updateNotificationPreferences,
);

export { router as notificationsRouter };
