import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { authLimiter } from '../../common/middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from './auth.validator';

const router = Router();
const controller = new AuthController();

// Public routes (rate limited)
router.post('/register', authLimiter, validate(registerSchema), (req, res, next) => controller.register(req, res, next));
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) => controller.login(req, res, next));
router.post('/refresh-token', validate(refreshTokenSchema), (req, res, next) => controller.refreshToken(req, res, next));
router.post('/forgot-password', authLimiter, (req, res, next) => controller.forgotPassword(req, res, next));
router.post('/reset-password', authLimiter, (req, res, next) => controller.resetPassword(req, res, next));

// Protected routes
router.post('/logout', authenticate, (req, res, next) => controller.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => controller.getProfile(req, res, next));
router.patch('/me', authenticate, validate(updateProfileSchema), (req, res, next) => controller.updateProfile(req, res, next));
router.patch('/me/password', authenticate, validate(changePasswordSchema), (req, res, next) => controller.changePassword(req, res, next));

export default router;
