import { Router } from 'express';
import { authenticateJWT } from '../../shared/middleware/auth/authenticateJWT.js';
import { authorizeRoles } from '../../shared/middleware/auth/authorizeRoles.js';
import { requireOwnership } from '../../shared/middleware/auth/requireOwnership.js';
import {
  createLocker,
  createLockerBookingRequest,
  deleteLocker,
  getLockers,
  getLockerBookings,
  getlockersStatus,
  updateLocker,
  updateLockerBookingStatus,
} from './lockers.controller.js';

const router = Router();

router.get('/', getlockersStatus);

router.get('/list', authenticateJWT, authorizeRoles('admin', 'user'), getLockers);
router.post('/list', authenticateJWT, authorizeRoles('admin'), createLocker);
router.put('/list/:id', authenticateJWT, authorizeRoles('admin'), updateLocker);
router.delete('/list/:id', authenticateJWT, authorizeRoles('admin'), deleteLocker);

router.get(
  '/bookings',
  authenticateJWT,
  authorizeRoles('admin', 'user'),
  requireOwnership({ checks: [{ from: 'query', key: 'userId' }], allowRoles: ['admin'] }),
  getLockerBookings,
);
router.post(
  '/bookings',
  authenticateJWT,
  authorizeRoles('admin', 'user'),
  requireOwnership({ checks: [{ from: 'body', key: 'userId' }], allowRoles: ['admin'] }),
  createLockerBookingRequest,
);
router.patch('/bookings/:id/status', authenticateJWT, authorizeRoles('admin'), updateLockerBookingStatus);

export { router as lockersRouter };
