import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import * as focusSessionController from './focus-session.controller';

export const focusSessionsRouter = Router();

focusSessionsRouter.use(requireAuth);

focusSessionsRouter.post('/', focusSessionController.create);
focusSessionsRouter.get('/', focusSessionController.list);
focusSessionsRouter.get('/active', focusSessionController.getActive);
focusSessionsRouter.get('/:id', focusSessionController.get);
focusSessionsRouter.patch('/:id/complete', focusSessionController.complete);
focusSessionsRouter.patch('/:id/cancel', focusSessionController.cancel);
