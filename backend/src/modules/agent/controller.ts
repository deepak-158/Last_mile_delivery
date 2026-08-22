import { Request, Response, NextFunction } from 'express';
import { AgentService } from './service';

const agentService = new AgentService();

export class AgentController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await agentService.findAll();
      res.json(agents);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const agent = await agentService.getAgentByUserId(req.user!.id);
      res.json(agent);
    } catch (err) {
      next(err);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await agentService.updateLocation(req.user!.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await agentService.updateAvailability(req.user!.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async manualAssign(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await agentService.manualAssign(
        req.params.orderId,
        req.body.agentId,
        req.user!.id
      );
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  async autoAssign(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await agentService.autoAssign(req.params.orderId, req.user!.id);
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
}
