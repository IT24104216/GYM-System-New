import { Router } from 'express';
import { authenticateJWT } from '../../shared/middleware/auth/authenticateJWT.js';
import { authorizeRoles } from '../../shared/middleware/auth/authorizeRoles.js';
import {
  cancelSubscription,
  createSubscription,
  getMySubscription,
  getsubscriptionsStatus,
  getUserSubscription,
  grantSubscription,
  renewSubscription,
  toggleAutoRenew,
} from './subscriptions.controller.js';

const router = Router();

router.get('/', getsubscriptionsStatus);

router.get('/my', authenticateJWT, authorizeRoles('user'), getMySubscription);
router.post('/my', authenticateJWT, authorizeRoles('user'), createSubscription);
router.post('/my/renew', authenticateJWT, authorizeRoles('user'), renewSubscription);
router.patch('/my/cancel', authenticateJWT, authorizeRoles('user'), cancelSubscription);
router.patch('/my/auto-renew', authenticateJWT, authorizeRoles('user'), toggleAutoRenew);

router.post('/grant', authenticateJWT, authorizeRoles('admin'), grantSubscription);
router.get('/user/:userId', authenticateJWT, authorizeRoles('admin'), getUserSubscription);

export { router as subscriptionsRouter };
