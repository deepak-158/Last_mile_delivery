import { Router } from 'express';
import { AddressController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new AddressController();

router.use(authenticate);

router.get('/', (req, res, next) => controller.getSavedAddresses(req, res, next));
router.post('/', (req, res, next) => controller.saveAddress(req, res, next));
router.delete('/:id', (req, res, next) => controller.deleteAddress(req, res, next));

export default router;
