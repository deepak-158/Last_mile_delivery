import { Router } from 'express';
import { RateCardController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createRateCardSchema, updateRateCardSchema } from './dto';
import { Role } from '../../types/enums';

const router = Router();
const controller = new RateCardController();

router.use(authenticate, authorize(Role.ADMIN));

router.get('/', (req, res, next) => controller.findAll(req, res, next));
router.post('/', validate(createRateCardSchema), (req, res, next) => controller.create(req, res, next));
router.get('/:id', (req, res, next) => controller.findById(req, res, next));
router.put('/:id', validate(updateRateCardSchema), (req, res, next) => controller.update(req, res, next));
router.delete('/:id', (req, res, next) => controller.delete(req, res, next));

export default router;
