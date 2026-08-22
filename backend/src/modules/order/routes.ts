import { Router } from 'express';
import { OrderController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  orderPreviewSchema,
  orderCreateSchema,
  orderStatusUpdateSchema,
  orderRescheduleSchema,
} from './dto';
import { Role } from '../../types/enums';

const router = Router();
const controller = new OrderController();

// Pincode Verification & Location Auto-Fetch (Public/Open)
router.get('/lookup-pincode/:pincode', (req, res, next) => controller.lookupPincode(req, res, next));

// All subsequent endpoints require authentication
router.use(authenticate);

router.post(
  '/preview',
  validate(orderPreviewSchema),
  (req, res, next) => controller.previewCharge(req, res, next)
);

router.post(
  '/',
  authorize(Role.CUSTOMER, Role.ADMIN),
  validate(orderCreateSchema),
  (req, res, next) => controller.create(req, res, next)
);

router.get('/', (req, res, next) => controller.findOrders(req, res, next));
router.get('/:id', (req, res, next) => controller.findById(req, res, next));

router.put(
  '/:id/status',
  authorize(Role.AGENT, Role.ADMIN),
  validate(orderStatusUpdateSchema),
  (req, res, next) => controller.updateStatus(req, res, next)
);

router.post(
  '/:id/reschedule',
  authorize(Role.CUSTOMER, Role.ADMIN),
  validate(orderRescheduleSchema),
  (req, res, next) => controller.reschedule(req, res, next)
);

export default router;
