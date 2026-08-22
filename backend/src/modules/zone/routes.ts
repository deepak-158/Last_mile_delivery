import { Router } from 'express';
import { ZoneController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createZoneSchema, updateZoneSchema, addAreaMappingSchema } from './dto';
import { Role } from '../../types/enums';

const router = Router();
const controller = new ZoneController();

router.use(authenticate, authorize(Role.ADMIN));

router.get('/', (req, res, next) => controller.findAll(req, res, next));
router.post('/', validate(createZoneSchema), (req, res, next) => controller.create(req, res, next));
router.get('/:id', (req, res, next) => controller.findById(req, res, next));
router.put('/:id', validate(updateZoneSchema), (req, res, next) => controller.update(req, res, next));
router.delete('/:id', (req, res, next) => controller.delete(req, res, next));

router.get('/:id/areas', (req, res, next) => controller.getAreaMappings(req, res, next));
router.post('/:id/areas', validate(addAreaMappingSchema), (req, res, next) => controller.addAreaMapping(req, res, next));

export default router;
