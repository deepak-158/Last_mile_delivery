import { Request, Response, NextFunction } from 'express';
import { AddressService } from './service';
import { savedAddressSchema } from './dto';

const addressService = new AddressService();

export class AddressController {
  async getSavedAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const addresses = await addressService.getSavedAddresses(req.user!.id);
      res.json(addresses);
    } catch (err) {
      next(err);
    }
  }

  async saveAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = savedAddressSchema.parse(req.body);
      const address = await addressService.saveAddress(req.user!.id, validated);
      res.status(201).json(address);
    } catch (err) {
      next(err);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      await addressService.deleteSavedAddress(req.user!.id, req.params.id);
      res.json({ message: 'Address successfully removed from address book.' });
    } catch (err) {
      next(err);
    }
  }
}
