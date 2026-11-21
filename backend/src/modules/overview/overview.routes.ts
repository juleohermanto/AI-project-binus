import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import * as overviewController from './overview.controller';

export const overviewRouter = Router();

overviewRouter.use(requireAuth);

overviewRouter.get('/', overviewController.getOverview);
