import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { brainDumpRouter } from '../modules/brain-dump/brain-dump.routes';
import { focusSessionsRouter } from '../modules/focus-sessions/focus-session.routes';
import { overviewRouter } from '../modules/overview/overview.routes';
import { tasksRouter } from '../modules/tasks/task.routes';
import { usersRouter } from '../modules/users/users.routes';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/brain-dump', brainDumpRouter);
apiRouter.use('/overview', overviewRouter);
apiRouter.use('/focus-sessions', focusSessionsRouter);
