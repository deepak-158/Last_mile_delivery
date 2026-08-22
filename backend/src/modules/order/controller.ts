import { Request, Response, NextFunction } from 'express';
import { OrderService } from './service';
import { OrderStatus, OrderType } from '../../types/enums';
import { lookupPincode } from '../../utils/pincodeLookup';

const orderService = new OrderService();

export class OrderController {
  async lookupPincode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await lookupPincode(req.params.pincode);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
  async previewCharge(req: Request, res: Response, next: NextFunction) {
    try {
      const preview = await orderService.previewCharge(req.body);
      res.json(preview);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const order = await orderService.createOrder(customerId, req.body);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }

  async findOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as OrderStatus | undefined,
        zoneId: req.query.zoneId as string | undefined,
        agentId: req.query.agentId as string | undefined,
        orderType: req.query.orderType as OrderType | undefined,
        search: req.query.search as string | undefined,
      };
      const orders = await orderService.findOrders(req.user!, filters);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.findById(req.params.id, req.user!);
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.updateStatus(
        req.params.id,
        req.user!,
        req.body
      );
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.rescheduleOrder(
        req.params.id,
        req.user!,
        req.body
      );
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
}
