import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import * as taskController from './task.controller';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get('/', taskController.list);
tasksRouter.post('/', taskController.create);
tasksRouter.get('/:id', taskController.get);
tasksRouter.patch('/:id', taskController.update);
tasksRouter.delete('/:id', taskController.remove);
tasksRouter.patch('/:id/complete', taskController.complete);
tasksRouter.patch('/:id/reopen', taskController.reopen);

tasksRouter.post('/:id/steps', taskController.addStep);
tasksRouter.patch('/:id/steps/:stepId', taskController.updateStep);
tasksRouter.delete('/:id/steps/:stepId', taskController.removeStep);
tasksRouter.patch('/:id/steps/:stepId/complete', taskController.completeStep);
tasksRouter.patch('/:id/steps/:stepId/reopen', taskController.reopenStep);
