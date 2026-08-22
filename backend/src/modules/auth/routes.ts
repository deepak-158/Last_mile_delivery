import { Router } from 'express';
import { AuthController } from './controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { rateLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './dto';

const router = Router();
const controller = new AuthController();

// Rate-limited Auth endpoints (brute-force protection: max 25 attempts / 15 mins)
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 25 });

router.post('/register', authLimiter, validate(registerSchema), (req, res, next) => controller.register(req, res, next));
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) => controller.login(req, res, next));

// Authenticated User profile & security
router.get('/me', authenticate, (req, res, next) => controller.me(req, res, next));
router.put('/profile', authenticate, validate(updateProfileSchema), (req, res, next) => controller.updateProfile(req, res, next));
router.put('/change-password', authenticate, validate(changePasswordSchema), (req, res, next) => controller.changePassword(req, res, next));

// Admin User queries & Wallet
router.get('/users', authenticate, (req, res, next) => controller.listUsers(req, res, next));
router.get('/wallet', authenticate, (req, res, next) => controller.getWallet(req, res, next));
router.post('/wallet/topup', authenticate, (req, res, next) => controller.topupWallet(req, res, next));

export default router;
