import prisma from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import {
  OrderPreviewInput,
  OrderCreateInput,
  OrderStatusUpdateInput,
  OrderRescheduleInput,
} from './dto';
import {
  calculateVolumetricWeight,
  calculateBillableWeight,
  haversineDistance,
  calculateRoadDistance,
  computeLogisticsETA,
} from '../../utils/calculations';
import { isValidTransition } from '../../utils/statusTransitions';
import { NotificationService } from '../notification/service';
import { OrderStatus, OrderType, PaymentType, RateType, Role } from '../../types/enums';
import { lookupPincode } from '../../utils/pincodeLookup';

const notificationService = new NotificationService();

function extractCityFromAddress(address?: string | null, zoneName?: string | null, pincode?: string | null): string {
  if (address) {
    const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      return parts[parts.length - 2];
    } else if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
  }
  if (zoneName) return zoneName;
  if (pincode) return `PIN ${pincode}`;
  return 'Origin Hub';
}

function formatOrderResponse(order: any) {
  if (!order) return order;
  const pickupCity = extractCityFromAddress(order.pickupAddress, order.pickupZone?.name, order.pickupPincode);
  const dropCity = extractCityFromAddress(order.dropAddress, order.dropZone?.name, order.dropPincode);

  return {
    ...order,
    pickupCity,
    dropCity,
    computedCharge: order.totalCharge,
    actualWeight: order.actualWeightKg,
    billableWeight: order.billableWeightKg,
  };
}

export class OrderService {
  async previewCharge(data: OrderPreviewInput) {
    // 1. Verify and resolve pickup zone & coordinates
    const pickupLookup = await lookupPincode(data.pickupPincode);
    if (!pickupLookup.valid || !pickupLookup.zone) {
      throw new ApiError(400, pickupLookup.message || `Pickup pincode ${data.pickupPincode} is not a valid or serviceable postal code.`);
    }

    // 2. Verify and resolve drop zone & coordinates
    const dropLookup = await lookupPincode(data.dropPincode);
    if (!dropLookup.valid || !dropLookup.zone) {
      throw new ApiError(400, dropLookup.message || `Drop pincode ${data.dropPincode} is not a valid or serviceable postal code.`);
    }

    const pickupZone = pickupLookup.zone;
    const dropZone = dropLookup.zone;

    // 3. Weight & Dimension Calculations
    const volumetricWeightKg = calculateVolumetricWeight(
      data.lengthCm,
      data.breadthCm,
      data.heightCm
    );
    const billableWeightKg = calculateBillableWeight(
      data.actualWeightKg,
      volumetricWeightKg
    );

    // 4. Real Road Distance Calculation via OSRM with Geodesic fallback
    let routingResult: {
      distanceKm: number;
      durationMinutes: number;
      source: string;
      geometry?: Array<[number, number]>;
    } = {
      distanceKm: 5.0,
      durationMinutes: 15,
      source: 'GEODESIC_HAVERSINE',
      geometry: [],
    };

    if (pickupLookup.latitude && pickupLookup.longitude && dropLookup.latitude && dropLookup.longitude) {
      routingResult = await calculateRoadDistance(
        pickupLookup.latitude,
        pickupLookup.longitude,
        dropLookup.latitude,
        dropLookup.longitude
      );
    }
    const estimatedDistanceKm = routingResult.distanceKm < 1.0 ? 1.0 : routingResult.distanceKm;

    // 5. Determine RateType
    const rateType: RateType =
      pickupZone.id === dropZone.id ? RateType.INTRA_ZONE : RateType.INTER_ZONE;

    // 6. Rate Card Tariff Lookup
    const rateCard = await prisma.rateCard.findUnique({
      where: {
        orderType_rateType: {
          orderType: data.orderType,
          rateType,
        },
      },
    });

    if (!rateCard) {
      throw new ApiError(
        404,
        `No rate card configured for ${data.orderType} with ${rateType} delivery.`
      );
    }

    // 7. Multi-Tier Fare Formulation (Base + Weight + Distance + COD)
    const baseTariff = rateCard.baseCharge;
    const weightCharge = Math.round(billableWeightKg * rateCard.perKgCharge * 100) / 100;
    
    // Distance tariff: Intra-zone (₹1.80/km after 5km) / Inter-zone (₹0.40/km long haul)
    let distanceCharge = 0;
    if (rateType === RateType.INTRA_ZONE) {
      const extraKm = Math.max(0, estimatedDistanceKm - 5.0);
      distanceCharge = Math.round(extraKm * 1.80 * 100) / 100;
    } else {
      distanceCharge = Math.round(estimatedDistanceKm * 0.40 * 100) / 100;
    }

    const baseCharge = Math.round((baseTariff + weightCharge + distanceCharge) * 100) / 100;

    // 8. COD Surcharge Lookup
    let codSurcharge = 0;
    if (data.paymentType === PaymentType.COD) {
      const codConfig = await prisma.cODSurchargeConfig.findUnique({
        where: { orderType: data.orderType },
      });
      if (codConfig) {
        codSurcharge = codConfig.surchargeAmount;
      }
    }

    const totalCharge = Math.round((baseCharge + codSurcharge) * 100) / 100;

    // Full structured location strings
    const pickupLocality = data.pickupLocality || pickupLookup.selectedLocality || '';
    const pickupCity = data.pickupCity || pickupLookup.city || '';
    const pickupState = data.pickupState || pickupLookup.state || '';

    const dropLocality = data.dropLocality || dropLookup.selectedLocality || '';
    const dropCity = data.dropCity || dropLookup.city || '';
    const dropState = data.dropState || dropLookup.state || '';

    const etaBreakdown = computeLogisticsETA(estimatedDistanceKm, routingResult.durationMinutes, rateType);

    return {
      senderName: data.senderName,
      senderPhone: data.senderPhone,
      receiverName: data.receiverName,
      receiverPhone: data.receiverPhone,
      pickupLocation: {
        pincode: data.pickupPincode,
        locality: pickupLocality,
        city: pickupCity,
        state: pickupState,
        formatted: `${pickupLocality ? pickupLocality + ', ' : ''}${pickupCity}, ${pickupState}`,
        latitude: pickupLookup.latitude,
        longitude: pickupLookup.longitude,
      },
      dropLocation: {
        pincode: data.dropPincode,
        locality: dropLocality,
        city: dropCity,
        state: dropState,
        formatted: `${dropLocality ? dropLocality + ', ' : ''}${dropCity}, ${dropState}`,
        latitude: dropLookup.latitude,
        longitude: dropLookup.longitude,
      },
      pickupZone: { id: pickupZone.id, name: pickupZone.name },
      dropZone: { id: dropZone.id, name: dropZone.name },
      rateType,
      dimensions: {
        lengthCm: data.lengthCm,
        breadthCm: data.breadthCm,
        heightCm: data.heightCm,
      },
      volumetricWeightKg: Math.round(volumetricWeightKg * 1000) / 1000,
      billableWeightKg: Math.round(billableWeightKg * 1000) / 1000,
      actualWeightKg: data.actualWeightKg,
      estimatedDistanceKm,
      estimatedDurationMinutes: etaBreakdown.totalEstimatedMinutes,
      etaBreakdown,
      routingEngine: routingResult.source,
      routeGeometry: routingResult.geometry,
      rateCard: {
        id: rateCard.id,
        baseCharge: rateCard.baseCharge,
        perKgCharge: rateCard.perKgCharge,
      },
      fareBreakdown: {
        baseTariff,
        weightCharge,
        distanceCharge,
        subtotal: baseCharge,
        codSurcharge,
        totalCharge,
      },
      baseCharge,
      codSurcharge,
      totalCharge,
      orderType: data.orderType,
      paymentType: data.paymentType,
    };
  }

  async createOrder(customerId: string, data: OrderCreateInput) {
    const preview = await this.previewCharge(data);

    // Format full address with house/street + locality + city + state
    const fullPickupAddress = `${data.pickupAddress.trim()}, ${preview.pickupLocation.formatted}`;
    const fullDropAddress = `${data.dropAddress.trim()}, ${preview.dropLocation.formatted}`;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Optionally save pickup address to customer address book
      if (data.savePickupAddress) {
        await tx.savedAddress.create({
          data: {
            userId: customerId,
            label: data.pickupAddressLabel || 'Pickup Location',
            contactName: data.senderName,
            contactPhone: data.senderPhone,
            pincode: data.pickupPincode,
            city: preview.pickupLocation.city,
            state: preview.pickupLocation.state,
            locality: preview.pickupLocation.locality,
            address: data.pickupAddress,
          },
        });
      }

      // 2. Optionally save drop address to customer address book
      if (data.saveDropAddress) {
        await tx.savedAddress.create({
          data: {
            userId: customerId,
            label: data.dropAddressLabel || 'Receiver Location',
            contactName: data.receiverName,
            contactPhone: data.receiverPhone,
            pincode: data.dropPincode,
            city: preview.dropLocation.city,
            state: preview.dropLocation.state,
            locality: preview.dropLocation.locality,
            address: data.dropAddress,
          },
        });
      }

      // 3. Check and deduct from customer wallet if PREPAID
      if (data.paymentType === PaymentType.PREPAID) {
        const user = await tx.user.findUnique({ where: { id: customerId } });
        if (!user) {
          throw new ApiError(404, 'Customer user account not found.');
        }
        if (user.walletBalance < preview.totalCharge) {
          throw new ApiError(
            400,
            `Insufficient Delivero Wallet balance (₹${user.walletBalance.toFixed(2)}). Total order freight is ₹${preview.totalCharge.toFixed(2)}. Please top up your wallet or choose COD.`
          );
        }

        await tx.user.update({
          where: { id: customerId },
          data: { walletBalance: { decrement: preview.totalCharge } },
        });
      }

      // 4. Create Consignment Order
      const newOrder = await tx.order.create({
        data: {
          customerId,
          senderName: data.senderName,
          senderPhone: data.senderPhone,
          pickupAddress: fullPickupAddress,
          pickupPincode: data.pickupPincode,
          receiverName: data.receiverName,
          receiverPhone: data.receiverPhone,
          dropAddress: fullDropAddress,
          dropPincode: data.dropPincode,
          pickupZoneId: preview.pickupZone.id,
          dropZoneId: preview.dropZone.id,
          lengthCm: data.lengthCm,
          breadthCm: data.breadthCm,
          heightCm: data.heightCm,
          actualWeightKg: data.actualWeightKg,
          volumetricWeightKg: preview.volumetricWeightKg,
          billableWeightKg: preview.billableWeightKg,
          orderType: data.orderType,
          paymentType: data.paymentType,
          baseCharge: preview.baseCharge,
          codSurcharge: preview.codSurcharge,
          totalCharge: preview.totalCharge,
          status: OrderStatus.PENDING,
        },
        include: {
          pickupZone: true,
          dropZone: true,
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      // 5. Create Wallet Transaction Record if Prepaid
      if (data.paymentType === PaymentType.PREPAID) {
        await tx.walletTransaction.create({
          data: {
            userId: customerId,
            amount: preview.totalCharge,
            type: 'DEBIT',
            orderId: newOrder.id,
            description: `Payment for Consignment Order #${newOrder.id.slice(0, 8).toUpperCase()}`,
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: OrderStatus.PENDING,
          actorId: customerId,
          notes: `Order booked by ${data.senderName}. Route: ${preview.estimatedDistanceKm} km | Billable: ${preview.billableWeightKg} kg`,
        },
      });

      return newOrder;
    });

    return formatOrderResponse(order);
  }

  async findOrders(
    user: { id: string; role: Role },
    filters?: {
      status?: OrderStatus;
      zoneId?: string;
      agentId?: string;
      orderType?: OrderType;
      search?: string;
    }
  ) {
    const where: any = {};

    if (user.role === Role.CUSTOMER) {
      where.customerId = user.id;
    } else if (user.role === Role.AGENT) {
      const agent = await prisma.agent.findUnique({ where: { userId: user.id } });
      if (!agent) {
        throw new ApiError(404, 'Agent profile not found.');
      }
      where.assignedAgentId = agent.id;
    }

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.zoneId) {
      where.OR = [{ pickupZoneId: filters.zoneId }, { dropZoneId: filters.zoneId }];
    }
    if (filters?.agentId && user.role === Role.ADMIN) {
      where.assignedAgentId = filters.agentId;
    }
    if (filters?.orderType) {
      where.orderType = filters.orderType;
    }
    if (filters?.search) {
      where.OR = [
        { id: { contains: filters.search } },
        { senderName: { contains: filters.search } },
        { receiverName: { contains: filters.search } },
        { pickupAddress: { contains: filters.search } },
        { dropAddress: { contains: filters.search } },
        { pickupPincode: { contains: filters.search } },
        { dropPincode: { contains: filters.search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        pickupZone: true,
        dropZone: true,
        assignedAgent: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(formatOrderResponse);
  }

  async findById(orderId: string, user: { id: string; role: Role }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        pickupZone: true,
        dropZone: true,
        assignedAgent: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            currentZone: true,
          },
        },
        statusHistory: {
          include: {
            actor: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { timestamp: 'asc' },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    if (user.role === Role.CUSTOMER && order.customerId !== user.id) {
      throw new ApiError(403, 'You are not authorized to view this order.');
    }
    if (user.role === Role.AGENT) {
      const agent = await prisma.agent.findUnique({ where: { userId: user.id } });
      if (!agent || order.assignedAgentId !== agent.id) {
        throw new ApiError(403, 'You are not authorized to view this order.');
      }
    }

    return formatOrderResponse(order);
  }

  async updateStatus(
    orderId: string,
    actor: { id: string; role: Role },
    data: OrderStatusUpdateInput
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { assignedAgent: true },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    const currentStatus = order.status as OrderStatus;
    const newStatus = data.status as OrderStatus;

    if (currentStatus === newStatus) {
      throw new ApiError(400, `Order is already in ${newStatus} status.`);
    }

    if (actor.role === Role.AGENT) {
      const agent = await prisma.agent.findUnique({ where: { userId: actor.id } });
      if (!agent || order.assignedAgentId !== agent.id) {
        throw new ApiError(403, 'Only the assigned delivery agent can update this order status.');
      }

      if (!isValidTransition(currentStatus, newStatus)) {
        throw new ApiError(
          400,
          `Illegal status transition from ${currentStatus} to ${newStatus}.`
        );
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
          customer: true,
          pickupZone: true,
          dropZone: true,
          assignedAgent: { include: { user: true } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          actorId: actor.id,
          notes: data.notes || (actor.role === Role.ADMIN ? 'Admin status update.' : 'Agent status update.'),
        },
      });

      if (
        (newStatus === OrderStatus.DELIVERED || newStatus === OrderStatus.FAILED) &&
        order.assignedAgentId
      ) {
        await tx.agent.update({
          where: { id: order.assignedAgentId },
          data: { isAvailable: true },
        });
      }

      return updated;
    });

    notificationService.notifyStatusChange(orderId, newStatus).catch((err) => {
      console.error('Failed to dispatch notification:', err);
    });

    return updatedOrder;
  }

  async rescheduleOrder(
    orderId: string,
    actor: { id: string; role: Role },
    data: OrderRescheduleInput
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    if (actor.role === Role.CUSTOMER && order.customerId !== actor.id) {
      throw new ApiError(403, 'You are not authorized to reschedule this order.');
    }

    if (order.status !== OrderStatus.FAILED) {
      throw new ApiError(400, 'Only failed delivery orders can be rescheduled.');
    }

    const rescheduleDate = new Date(data.rescheduleDate);
    if (rescheduleDate < new Date()) {
      throw new ApiError(400, 'Reschedule date must be in the future.');
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (order.assignedAgentId) {
        await tx.agent.update({
          where: { id: order.assignedAgentId },
          data: { isAvailable: true },
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.RESCHEDULED,
          rescheduleDate,
          assignedAgentId: null,
        },
        include: {
          customer: true,
          pickupZone: true,
          dropZone: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.RESCHEDULED,
          actorId: actor.id,
          notes: `Delivery rescheduled for ${rescheduleDate.toLocaleDateString()}.`,
        },
      });

      return updated;
    });

    notificationService.notifyReschedule(orderId, rescheduleDate).catch((err) => {
      console.error('Failed to dispatch reschedule notification:', err);
    });

    return updatedOrder;
  }
}
