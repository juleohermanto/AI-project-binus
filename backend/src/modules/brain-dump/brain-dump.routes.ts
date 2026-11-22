import { Router } from 'express';
import { brainDumpRateLimiter } from '../../middleware/rate-limit';
import { requireAuth } from '../../middleware/require-auth';
import * as brainDumpController from './brain-dump.controller';

export const brainDumpRouter = Router();

brainDumpRouter.post('/', requireAuth, brainDumpRateLimiter, brainDumpController.create);
