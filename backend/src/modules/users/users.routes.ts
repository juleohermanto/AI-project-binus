import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import * as usersController from './users.controller';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', usersController.getMe);
usersRouter.patch('/me', usersController.updateMe);
usersRouter.patch('/me/password', usersController.changePassword);
