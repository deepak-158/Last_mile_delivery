import prisma from '../../config/database';
import { CreateZoneInput, UpdateZoneInput, AddAreaMappingInput } from './dto';
import { ApiError } from '../../middleware/errorHandler';
import { AreaType } from '../../types/enums';

export class ZoneService {
  async findAll() {
    return prisma.zone.findMany({
      include: { areaMappings: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const zone = await prisma.zone.findUnique({
      where: { id },
      include: { areaMappings: true },
    });
    if (!zone) throw new ApiError(404, 'Zone not found');
    return zone;
  }

  async create(data: CreateZoneInput) {
    const existing = await prisma.zone.findUnique({ where: { name: data.name } });
    if (existing) throw new ApiError(409, 'Zone with this name already exists');

    return prisma.zone.create({
      data: { name: data.name, description: data.description },
      include: { areaMappings: true },
    });
  }

  async update(id: string, data: UpdateZoneInput) {
    await this.findById(id);

    if (data.name) {
      const existing = await prisma.zone.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (existing) throw new ApiError(409, 'Zone with this name already exists');
    }

    return prisma.zone.update({
      where: { id },
      data,
      include: { areaMappings: true },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await prisma.zone.delete({ where: { id } });
    return { message: 'Zone deleted successfully' };
  }

  async getAreaMappings(zoneId: string) {
    await this.findById(zoneId);
    return prisma.zoneAreaMapping.findMany({
      where: { zoneId },
      orderBy: { areaIdentifier: 'asc' },
    });
  }

  async addAreaMapping(zoneId: string, data: AddAreaMappingInput) {
    await this.findById(zoneId);

    const existing = await prisma.zoneAreaMapping.findUnique({
      where: {
        areaIdentifier_areaType: {
          areaIdentifier: data.areaIdentifier,
          areaType: data.areaType,
        },
      },
    });

    if (existing) {
      throw new ApiError(409, `Area "${data.areaIdentifier}" is already mapped to a zone`);
    }

    return prisma.zoneAreaMapping.create({
      data: {
        zoneId,
        areaIdentifier: data.areaIdentifier,
        areaType: data.areaType,
      },
    });
  }

  async removeAreaMapping(mappingId: string) {
    const mapping = await prisma.zoneAreaMapping.findUnique({ where: { id: mappingId } });
    if (!mapping) throw new ApiError(404, 'Area mapping not found');

    await prisma.zoneAreaMapping.delete({ where: { id: mappingId } });
    return { message: 'Area mapping removed' };
  }

  async detectZoneByPincode(pincode: string) {
    const mapping = await prisma.zoneAreaMapping.findFirst({
      where: { areaIdentifier: pincode, areaType: 'PINCODE' },
      include: { zone: true },
    });
    return mapping?.zone || null;
  }
}
