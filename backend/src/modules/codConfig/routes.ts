import { Router } from 'express';
import { CODConfigController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { upsertCODConfigSchema } from './dto';
import { Role } from '../../types/enums';

const router = Router();
const controller = new CODConfigController();

router.use(authenticate, authorize(Role.ADMIN));

router.get('/', (req, res, next) => controller.findAll(req, res, next));
router.put('/', validate(upsertCODConfigSchema), (req, res, next) => controller.upsert(req, res, next));

export default router;
