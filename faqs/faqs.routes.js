import { Router } from 'express';
import { authenticateJWT } from '../../shared/middleware/auth/authenticateJWT.js';
import { authorizeRoles } from '../../shared/middleware/auth/authorizeRoles.js';
import {
  createFaq,
  deleteFaq,
  getFaqs,
  getfaqsStatus,
  updateFaq,
} from './faqs.controller.js';

const router = Router();

router.get('/', getfaqsStatus);
router.get('/list', getFaqs);
router.post('/list', authenticateJWT, authorizeRoles('admin'), createFaq);
router.put('/list/:id', authenticateJWT, authorizeRoles('admin'), updateFaq);
router.delete('/list/:id', authenticateJWT, authorizeRoles('admin'), deleteFaq);

export { router as faqsRouter };
