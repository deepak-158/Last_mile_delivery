import { Request, Response, NextFunction } from 'express';
import { RateCardService } from './service';

const rateCardService = new RateCardService();

export class RateCardController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { res.json(await rateCardService.findAll()); }
    catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try { res.json(await rateCardService.findById(req.params.id)); }
    catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await rateCardService.create(req.body)); }
    catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json(await rateCardService.update(req.params.id, req.body)); }
    catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try { res.json(await rateCardService.delete(req.params.id)); }
    catch (err) { next(err); }
  }
}
