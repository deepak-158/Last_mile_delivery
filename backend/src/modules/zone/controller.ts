import { Request, Response, NextFunction } from 'express';
import { ZoneService } from './service';

const zoneService = new ZoneService();

export class ZoneController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await zoneService.findAll();
      res.json(zones);
    } catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await zoneService.findById(req.params.id);
      res.json(zone);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await zoneService.create(req.body);
      res.status(201).json(zone);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await zoneService.update(req.params.id, req.body);
      res.json(zone);
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await zoneService.delete(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  }

  async getAreaMappings(req: Request, res: Response, next: NextFunction) {
    try {
      const areas = await zoneService.getAreaMappings(req.params.id);
      res.json(areas);
    } catch (err) { next(err); }
  }

  async addAreaMapping(req: Request, res: Response, next: NextFunction) {
    try {
      const mapping = await zoneService.addAreaMapping(req.params.id, req.body);
      res.status(201).json(mapping);
    } catch (err) { next(err); }
  }

  async removeAreaMapping(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await zoneService.removeAreaMapping(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  }
}
