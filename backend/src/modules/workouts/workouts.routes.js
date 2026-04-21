import { Router } from 'express';
import { authenticateJWT } from '../../shared/middleware/auth/authenticateJWT.js';
import { authorizeRoles } from '../../shared/middleware/auth/authorizeRoles.js';
import { requireOwnership } from '../../shared/middleware/auth/requireOwnership.js';
import {
  createExerciseCategoryItem,
  createWorkoutPlan,
  deleteExerciseCategoryItem,
  deleteWorkoutPlan,
  finishWorkoutSession,
  getExerciseSuggestions,
  getExerciseCategories,
  getworkoutsStatus,
  getWorkoutPlans,
  getWorkoutRequests,
  startWorkoutSession,
  submitWorkoutPlan,
  updateExerciseCategoryItem,
  updateWorkoutSessionProgress,
  updateWorkoutPlan,
} from './workouts.controller.js';

const router = Router();

const enforceWorkoutScope = (req, res, next) => {
  const role = String(req.user?.role || '');
  const authUserId = String(req.user?.id || '');
  if (!role || !authUserId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (role === 'admin') return next();

  const query = req.query || {};
  if (role === 'user' && query.userId && String(query.userId || '') !== authUserId) {
    return res.status(403).json({ message: 'Forbidden: userId scope mismatch' });
  }
  if (role === 'coach' && query.coachId && String(query.coachId || '') !== authUserId) {
    return res.status(403).json({ message: 'Forbidden: coachId scope mismatch' });
  }
  return next();
};

router.get('/', getworkoutsStatus);
router.use(authenticateJWT);

router.get('/requests', authorizeRoles('admin', 'coach'), enforceWorkoutScope, getWorkoutRequests);
router.get('/plans', authorizeRoles('admin', 'coach', 'user'), enforceWorkoutScope, getWorkoutPlans);
router.post(
  '/plans',
  authorizeRoles('admin', 'coach'),
  requireOwnership({ checks: [{ from: 'body', key: 'coachId' }], allowRoles: ['admin'] }),
  createWorkoutPlan,
);
router.put('/plans/:id', authorizeRoles('admin', 'coach'), updateWorkoutPlan);
router.patch('/plans/:id/submit', authorizeRoles('admin', 'coach'), submitWorkoutPlan);
router.post(
  '/plans/:id/session/start',
  authorizeRoles('admin', 'user'),
  requireOwnership({ checks: [{ from: 'body', key: 'userId' }], allowRoles: ['admin'] }),
  startWorkoutSession,
);
router.patch(
  '/plans/:id/session/progress',
  authorizeRoles('admin', 'user'),
  requireOwnership({ checks: [{ from: 'body', key: 'userId' }], allowRoles: ['admin'] }),
  updateWorkoutSessionProgress,
);
router.patch(
  '/plans/:id/session/finish',
  authorizeRoles('admin', 'user'),
  requireOwnership({ checks: [{ from: 'body', key: 'userId' }], allowRoles: ['admin'] }),
  finishWorkoutSession,
);
router.delete('/plans/:id', authorizeRoles('admin', 'coach'), deleteWorkoutPlan);
router.get(
  '/categories',
  authorizeRoles('admin', 'coach'),
  requireOwnership({ checks: [{ from: 'query', key: 'coachId' }], allowRoles: ['admin'] }),
  getExerciseCategories,
);
router.get('/exercises/suggestions', authorizeRoles('admin', 'coach'), getExerciseSuggestions);
router.post(
  '/categories',
  authorizeRoles('admin', 'coach'),
  requireOwnership({ checks: [{ from: 'body', key: 'coachId' }], allowRoles: ['admin'] }),
  createExerciseCategoryItem,
);
router.put('/categories/:id', authorizeRoles('admin', 'coach'), updateExerciseCategoryItem);
router.delete('/categories/:id', authorizeRoles('admin', 'coach'), deleteExerciseCategoryItem);

export { router as workoutsRouter };
