import { Router } from 'express';
import { getusersStatus } from './users.controller.js';

const router = Router();

router.get('/', getusersStatus);

export { router as usersRouter };
