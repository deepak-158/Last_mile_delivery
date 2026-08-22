import prisma from '../../config/database';
import { CreateRateCardInput, UpdateRateCardInput } from './dto';
import { ApiError } from '../../middleware/errorHandler';
import { OrderType, RateType } from '../../types/enums';

export class RateCardService {
  async findAll() {
    return prisma.rateCard.findMany({
      orderBy: [{ orderType: 'asc' }, { rateType: 'asc' }],
    });
  }

  async findById(id: string) {
    const rateCard = await prisma.rateCard.findUnique({ where: { id } });
    if (!rateCard) throw new ApiError(404, 'Rate card not found');
    return rateCard;
  }

  async create(data: CreateRateCardInput) {
    const existing = await prisma.rateCard.findUnique({
      where: {
        orderType_rateType: {
          orderType: data.orderType,
          rateType: data.rateType,
        },
      },
    });

    if (existing) {
      throw new ApiError(409, `Rate card for ${data.orderType} / ${data.rateType} already exists`);
    }

    return prisma.rateCard.create({
      data: {
        orderType: data.orderType,
        rateType: data.rateType,
        baseCharge: data.baseCharge,
        perKgCharge: data.perKgCharge,
      },
    });
  }

  async update(id: string, data: UpdateRateCardInput) {
    await this.findById(id);
    return prisma.rateCard.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    await prisma.rateCard.delete({ where: { id } });
    return { message: 'Rate card deleted' };
  }

  async lookupRate(orderType: OrderType, pickupZoneId: string, dropZoneId: string) {
    const rateType: RateType = pickupZoneId === dropZoneId ? RateType.INTRA_ZONE : RateType.INTER_ZONE;

    const rateCard = await prisma.rateCard.findUnique({
      where: { orderType_rateType: { orderType, rateType } },
    });

    if (!rateCard) {
      throw new ApiError(404, `No rate card configured for ${orderType} / ${rateType}`);
    }

    return rateCard;
  }
}
