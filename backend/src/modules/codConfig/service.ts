import prisma from '../../config/database';
import { UpsertCODConfigInput } from './dto';
import { OrderType } from '../../types/enums';

export class CODConfigService {
  async findAll() {
    return prisma.cODSurchargeConfig.findMany({
      orderBy: { orderType: 'asc' },
    });
  }

  async upsert(data: UpsertCODConfigInput) {
    return prisma.cODSurchargeConfig.upsert({
      where: { orderType: data.orderType },
      create: {
        orderType: data.orderType,
        surchargeAmount: data.surchargeAmount,
      },
      update: {
        surchargeAmount: data.surchargeAmount,
      },
    });
  }

  async getSurcharge(orderType: OrderType): Promise<number> {
    const config = await prisma.cODSurchargeConfig.findUnique({
      where: { orderType },
    });
    return config?.surchargeAmount ?? 0;
  }
}
