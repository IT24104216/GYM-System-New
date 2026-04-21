import { Router } from 'express';
import {
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  resetPassword,
} from './auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export { router as authRouter };
