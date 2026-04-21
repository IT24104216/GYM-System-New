import { Router } from 'express';
import { authenticateJWT } from '../../shared/middleware/auth/authenticateJWT.js';
import { authorizeRoles } from '../../shared/middleware/auth/authorizeRoles.js';
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  getPromotionsStatus,
  getPublicPromotions,
  updatePromotion,
} from './promotions.controller.js';

const router = Router();

router.get('/', getPromotionsStatus);
router.get('/public', getPublicPromotions);
router.get('/list', authenticateJWT, authorizeRoles('admin'), getPromotions);
router.post('/', authenticateJWT, authorizeRoles('admin'), createPromotion);
router.put('/:id', authenticateJWT, authorizeRoles('admin'), updatePromotion);
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), deletePromotion);

export { router as promotionsRouter };

