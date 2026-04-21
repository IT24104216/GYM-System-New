import { Router } from 'express';
import { authenticateJWT } from '../../shared/middleware/auth/authenticateJWT.js';
import { authorizeRoles } from '../../shared/middleware/auth/authorizeRoles.js';
import { requireOwnership } from '../../shared/middleware/auth/requireOwnership.js';
import {
  deleteCoachProfile,
  getcoachStatus,
  getCoachProfile,
  getPublicCoaches,
  upsertCoachProfile,
} from './coach.controller.js';
import {
  createCoachSlot,
  deleteCoachSlot,
  listCoachSlots,
  updateCoachSlot,
} from './coachScheduling.controller.js';

const router = Router();

router.get('/', getcoachStatus);
router.get('/public', getPublicCoaches);
router.get('/profile/:coachId', getCoachProfile);

router.put(
  '/profile/:coachId',
  authenticateJWT,
  authorizeRoles('admin', 'coach'),
  requireOwnership({ checks: [{ from: 'params', key: 'coachId' }], allowRoles: ['admin'] }),
  upsertCoachProfile,
);
router.delete(
  '/profile/:coachId',
  authenticateJWT,
  authorizeRoles('admin', 'coach'),
  requireOwnership({ checks: [{ from: 'params', key: 'coachId' }], allowRoles: ['admin'] }),
  deleteCoachProfile,
);
router.get('/scheduling/:coachId', listCoachSlots);
router.post(
  '/scheduling/:coachId',
  authenticateJWT,
  authorizeRoles('admin', 'coach'),
  requireOwnership({ checks: [{ from: 'params', key: 'coachId' }], allowRoles: ['admin'] }),
  createCoachSlot,
);
router.put(
  '/scheduling/:coachId/:slotId',
  authenticateJWT,
  authorizeRoles('admin', 'coach'),
  requireOwnership({ checks: [{ from: 'params', key: 'coachId' }], allowRoles: ['admin'] }),
  updateCoachSlot,
);
router.delete(
  '/scheduling/:coachId/:slotId',
  authenticateJWT,
  authorizeRoles('admin', 'coach'),
  requireOwnership({ checks: [{ from: 'params', key: 'coachId' }], allowRoles: ['admin'] }),
  deleteCoachSlot,
);

export { router as coachRouter };
