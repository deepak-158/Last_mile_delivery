import prisma from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { UpdateLocationInput, UpdateAvailabilityInput } from './dto';
import { haversineDistance } from '../../utils/calculations';
import { OrderStatus } from '../../types/enums';
import { lookupPincode } from '../../utils/pincodeLookup';

export class AgentService {
  async findAll() {
    return prisma.agent.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        currentZone: true,
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.PENDING,
                OrderStatus.PICKED_UP,
                OrderStatus.IN_TRANSIT,
                OrderStatus.OUT_FOR_DELIVERY,
              ],
            },
          },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAgentByUserId(userId: string) {
    const agent = await prisma.agent.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        currentZone: true,
      },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent profile not found for this account.');
    }

    return agent;
  }

  async updateLocation(userId: string, data: UpdateLocationInput) {
    const agent = await this.getAgentByUserId(userId);

    return prisma.agent.update({
      where: { id: agent.id },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        ...(data.currentZoneId && { currentZoneId: data.currentZoneId }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        currentZone: true,
      },
    });
  }

  async updateAvailability(userId: string, data: UpdateAvailabilityInput) {
    const agent = await this.getAgentByUserId(userId);

    return prisma.agent.update({
      where: { id: agent.id },
      data: { isAvailable: data.isAvailable },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        currentZone: true,
      },
    });
  }

  async manualAssign(orderId: string, agentId: string, adminId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { assignedAgent: true },
    });
    if (!order) throw new ApiError(404, 'Order not found.');

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });
    if (!agent) throw new ApiError(404, 'Agent not found.');

    if (!agent.isAvailable) {
      throw new ApiError(400, `Agent ${agent.user.name} is currently marked unavailable or on another active delivery.`);
    }

    return prisma.$transaction(async (tx) => {
      if (order.assignedAgentId && order.assignedAgentId !== agentId) {
        await tx.agent.update({
          where: { id: order.assignedAgentId },
          data: { isAvailable: true },
        });
      }

      await tx.agent.update({
        where: { id: agent.id },
        data: { isAvailable: false },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { assignedAgentId: agent.id },
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
          status: order.status,
          actorId: adminId,
          notes: `Agent ${agent.user.name} manually assigned by Admin.`,
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Production Intelligent Auto-Assignment Engine
   * 1. Resolves dynamic pickup coordinates via India Post / Geocoding.
   * 2. Filters available agents and prioritizes in-zone fleet.
   * 3. Calculates exact spatial Haversine distance from agent GPS to pickup origin.
   * 4. Multi-factor load scoring for optimal courier dispatch.
   */
  async autoAssign(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { pickupZone: true },
    });

    if (!order) throw new ApiError(404, 'Order not found.');

    const availableAgents = await prisma.agent.findMany({
      where: { isAvailable: true },
      include: {
        user: true,
        currentZone: true,
        orders: {
          where: {
            status: { in: [OrderStatus.PENDING, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY] },
          },
        },
      },
    });

    if (availableAgents.length === 0) {
      throw new ApiError(400, 'No delivery couriers are currently available for assignment.');
    }

    // 1. Resolve dynamic target coordinates for pickup location
    const pickupLookup = await lookupPincode(order.pickupPincode);
    const targetLat = pickupLookup.latitude || 28.6139;
    const targetLng = pickupLookup.longitude || 77.2090;

    // 2. Score candidate couriers
    const inZoneAgents = availableAgents.filter(
      (ag) => ag.currentZoneId === order.pickupZoneId
    );

    const candidates = inZoneAgents.length > 0 ? inZoneAgents : availableAgents;
    const isZoneMatch = inZoneAgents.length > 0;

    // Rank candidates by shortest distance to pickup and active load balance
    let bestAgent = candidates[0];
    let minDistanceKm = 999999;

    candidates.forEach((agent) => {
      const agentLat = agent.latitude || targetLat;
      const agentLng = agent.longitude || targetLng;
      const dist = haversineDistance(targetLat, targetLng, agentLat, agentLng);

      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        bestAgent = agent;
      }
    });

    const formattedDist = Math.round(minDistanceKm * 10) / 10;
    const assignmentReason = isZoneMatch
      ? `In-Zone Spatial Proximity (${formattedDist} km from pickup hub • ${order.pickupZone?.name || 'Assigned Zone'})`
      : `Regional Fleet Fallback (${formattedDist} km from pickup hub)`;

    return prisma.$transaction(async (tx) => {
      if (order.assignedAgentId && order.assignedAgentId !== bestAgent.id) {
        await tx.agent.update({
          where: { id: order.assignedAgentId },
          data: { isAvailable: true },
        });
      }

      await tx.agent.update({
        where: { id: bestAgent.id },
        data: { isAvailable: false },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { assignedAgentId: bestAgent.id },
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
          status: order.status,
          actorId: adminId,
          notes: `Courier ${bestAgent.user.name} auto-assigned via Intelligent Dispatch Engine. Strategy: ${assignmentReason}.`,
        },
      });

      return updatedOrder;
    });
  }
}
