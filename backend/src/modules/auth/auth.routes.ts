import { Router } from 'express';
import { authRateLimiter, refreshRateLimiter } from '../../middleware/rate-limit';
import * as authController from './auth.controller';

export const authRouter = Router();

authRouter.post('/signup', authRateLimiter, authController.signup);
authRouter.post('/login', authRateLimiter, authController.login);
authRouter.post('/refresh', refreshRateLimiter, authController.refresh);
authRouter.post('/logout', authController.logout);
