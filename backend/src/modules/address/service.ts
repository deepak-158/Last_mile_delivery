import prisma from '../../config/database';
import { SavedAddressInput } from './dto';
import { ApiError } from '../../middleware/errorHandler';

export class AddressService {
  async getSavedAddresses(userId: string) {
    return prisma.savedAddress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveAddress(userId: string, data: SavedAddressInput) {
    return prisma.savedAddress.create({
      data: {
        userId,
        label: data.label,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        pincode: data.pincode,
        city: data.city,
        state: data.state,
        locality: data.locality,
        address: data.address,
      },
    });
  }

  async deleteSavedAddress(userId: string, addressId: string) {
    const existing = await prisma.savedAddress.findUnique({
      where: { id: addressId },
    });
    if (!existing || existing.userId !== userId) {
      throw new ApiError(404, 'Saved address not found.');
    }
    return prisma.savedAddress.delete({
      where: { id: addressId },
    });
  }
}
