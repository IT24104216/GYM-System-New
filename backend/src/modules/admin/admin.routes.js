import { Router } from 'express';
import { authenticateJWT } from '../../shared/middleware/auth/authenticateJWT.js';
import { authorizeRoles } from '../../shared/middleware/auth/authorizeRoles.js';
import {
  changeAdminPassword,
  getAdminSettings,
  getAdminReportsOverview,
  deleteUser,
  getAdminStats,
  getAdminStatus,
  getUserById,
  getUsers,
  updateAdminSettings,
  updateUser,
} from './admin.controller.js';

const router = Router();

router.get('/', getAdminStatus);

router.use(authenticateJWT);
router.use(authorizeRoles('admin'));

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/stats', getAdminStats);
router.get('/reports/overview', getAdminReportsOverview);
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);
router.put('/settings/password', changeAdminPassword);

export { router as adminRouter };
