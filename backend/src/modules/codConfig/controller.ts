import { Request, Response, NextFunction } from 'express';
import { CODConfigService } from './service';

const codConfigService = new CODConfigService();

export class CODConfigController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { res.json(await codConfigService.findAll()); }
    catch (err) { next(err); }
  }

  async upsert(req: Request, res: Response, next: NextFunction) {
    try { res.json(await codConfigService.upsert(req.body)); }
    catch (err) { next(err); }
  }
}
