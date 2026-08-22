import { Router } from 'express';
import { AgentController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  updateLocationSchema,
  updateAvailabilitySchema,
  manualAssignSchema,
} from './dto';
import { Role } from '../../types/enums';

export const adminAgentRouter = Router();
export const agentRouter = Router();

const controller = new AgentController();

adminAgentRouter.use(authenticate, authorize(Role.ADMIN));

adminAgentRouter.get('/', (req, res, next) => controller.findAll(req, res, next));
adminAgentRouter.post(
  '/orders/:orderId/assign',
  validate(manualAssignSchema),
  (req, res, next) => controller.manualAssign(req, res, next)
);
adminAgentRouter.post(
  '/orders/:orderId/auto-assign',
  (req, res, next) => controller.autoAssign(req, res, next)
);

agentRouter.use(authenticate, authorize(Role.AGENT));

agentRouter.get('/me', (req, res, next) => controller.getMe(req, res, next));
agentRouter.put(
  '/location',
  validate(updateLocationSchema),
  (req, res, next) => controller.updateLocation(req, res, next)
);
agentRouter.put(
  '/availability',
  validate(updateAvailabilitySchema),
  (req, res, next) => controller.updateAvailability(req, res, next)
);
