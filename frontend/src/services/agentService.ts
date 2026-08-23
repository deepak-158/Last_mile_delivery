import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { haversineDistance } from '../utils/calculations';
import { notificationService } from './notificationService';

export interface AgentRecord {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  currentZoneId?: string;
  currentZone?: {
    id: string;
    name: string;
  };
  latitude?: number;
  longitude?: number;
  isAvailable: boolean;
  isVerified?: boolean;
  verificationStatus?: 'PENDING_APPROVAL' | 'VERIFIED' | 'REJECTED';
  vehicleType?: string;
  vehicleNumber?: string;
  orders?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export const agentService = {
  /**
   * Get all delivery agents with merged user details, active order counts, and verification status
   */
  async getAll(): Promise<AgentRecord[]> {
    const [agentSnap, userSnap, zoneSnap, orderSnap] = await Promise.all([
      getDocs(collection(db, 'agents')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'zones')),
      getDocs(collection(db, 'orders')),
    ]);

    const usersMap = new Map(userSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() } as any]));
    const zonesMap = new Map(zoneSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() } as any]));

    const orders = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    return agentSnap.docs.map((d) => {
      const data = d.data();
      const user = usersMap.get(data.userId);
      const zone = data.currentZoneId ? zonesMap.get(data.currentZoneId) : undefined;
      const activeOrders = orders.filter(
        (o) => o.assignedAgentId === d.id && !['DELIVERED', 'FAILED'].includes(o.status)
      );

      const isVerified = data.isVerified !== undefined ? Boolean(data.isVerified) : true;
      const verificationStatus = data.verificationStatus || (isVerified ? 'VERIFIED' : 'PENDING_APPROVAL');

      return {
        id: d.id,
        userId: data.userId,
        user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone } : undefined,
        currentZoneId: data.currentZoneId,
        currentZone: zone ? { id: zone.id, name: zone.name } : undefined,
        latitude: data.latitude ?? 28.6139,
        longitude: data.longitude ?? 77.2090,
        isAvailable: data.isAvailable !== false && isVerified,
        isVerified,
        verificationStatus,
        vehicleType: data.vehicleType || 'Two Wheeler',
        vehicleNumber: data.vehicleNumber || 'Pending Reg',
        orders: activeOrders,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });
  },

  /**
   * Get currently logged-in agent profile
   */
  async getMe(): Promise<AgentRecord | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const snap = await getDocs(
      query(collection(db, 'agents'), where('userId', '==', user.uid))
    );

    if (snap.empty) {
      const directSnap = await getDoc(doc(db, 'agents', user.uid));
      if (directSnap.exists()) {
        const data = directSnap.data();
        const isVerified = data.isVerified !== undefined ? Boolean(data.isVerified) : true;
        return {
          id: directSnap.id,
          userId: user.uid,
          latitude: data.latitude,
          longitude: data.longitude,
          isAvailable: data.isAvailable !== false && isVerified,
          isVerified,
          verificationStatus: data.verificationStatus || (isVerified ? 'VERIFIED' : 'PENDING_APPROVAL'),
          vehicleType: data.vehicleType,
          vehicleNumber: data.vehicleNumber,
          currentZoneId: data.currentZoneId,
        };
      }
      return null;
    }

    const docData = snap.docs[0];
    const data = docData.data();
    const isVerified = data.isVerified !== undefined ? Boolean(data.isVerified) : true;
    return {
      id: docData.id,
      userId: user.uid,
      latitude: data.latitude,
      longitude: data.longitude,
      isAvailable: data.isAvailable !== false && isVerified,
      isVerified,
      verificationStatus: data.verificationStatus || (isVerified ? 'VERIFIED' : 'PENDING_APPROVAL'),
      vehicleType: data.vehicleType,
      vehicleNumber: data.vehicleNumber,
      currentZoneId: data.currentZoneId,
    };
  },

  /**
   * Admin verification & approval of delivery courier agent
   */
  async verifyAgent(agentId: string, approved: boolean): Promise<void> {
    await updateDoc(doc(db, 'agents', agentId), {
      isVerified: approved,
      verificationStatus: approved ? 'VERIFIED' : 'REJECTED',
      isAvailable: approved,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Notify the specific agent
    try {
      const agentSnap = await getDoc(doc(db, 'agents', agentId));
      if (agentSnap.exists()) {
        const agentUserId = agentSnap.data().userId;
        if (agentUserId) {
          await notificationService.sendNotification({
            userId: agentUserId,
            type: 'VERIFICATION_UPDATE',
            subject: approved ? '🎉 Courier Account Verified & Activated!' : 'Courier Verification Status',
            body: approved
              ? 'Your delivery courier profile is now verified by Admin. You can now toggle Online to receive live parcels!'
              : 'Your courier profile was not approved at this time.',
          });
        }
      }
    } catch (err) {
      console.warn('Verification notification note:', err);
    }
  },

  /**
   * Update agent's GPS coordinates and active zone
   */
  async updateLocation(data: {
    latitude: number;
    longitude: number;
    currentZoneId?: string;
  }): Promise<void> {
    const agent = await this.getMe();
    if (!agent) throw new Error('Agent profile not found.');

    await updateDoc(doc(db, 'agents', agent.id), {
      latitude: data.latitude,
      longitude: data.longitude,
      ...(data.currentZoneId && { currentZoneId: data.currentZoneId }),
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Update agent availability toggle
   */
  async updateAvailability(data: { isAvailable: boolean }): Promise<void> {
    const agent = await this.getMe();
    if (!agent) throw new Error('Agent profile not found.');

    if (!agent.isVerified) {
      throw new Error('Your agent profile is pending Admin verification. You cannot go online until approved.');
    }

    await updateDoc(doc(db, 'agents', agent.id), {
      isAvailable: data.isAvailable,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Manually assign an order to a specific agent
   */
  async manualAssign(orderId: string, agentId: string): Promise<any> {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    const currentStatus = orderSnap.exists() ? orderSnap.data().status : 'PENDING';
    const nextStatus = currentStatus === 'PENDING' ? 'ACCEPTED' : currentStatus;
    const orderData = orderSnap.exists() ? orderSnap.data() : null;

    await updateDoc(orderRef, {
      assignedAgentId: agentId,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });

    // Record status history
    try {
      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, `orders/${orderId}/statusHistory`), {
        orderId,
        status: nextStatus,
        timestamp: new Date().toISOString(),
        actorId: 'admin',
        notes: `Consignment assigned to courier agent`,
      });
    } catch {
      // ignore
    }

    try {
      await updateDoc(doc(db, 'agents', agentId), {
        isAvailable: false,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }

    // Targeted notification ONLY to the assigned agent
    try {
      const agentSnap = await getDoc(doc(db, 'agents', agentId));
      if (agentSnap.exists()) {
        const agentUserId = agentSnap.data().userId;
        if (agentUserId) {
          await notificationService.sendNotification({
            userId: agentUserId,
            orderId,
            type: 'AGENT_DISPATCH',
            subject: `🛵 Consignment Assigned: #${orderData?.orderNumber || orderId.slice(0, 8)}`,
            body: `You have been assigned order #${orderData?.orderNumber || orderId.slice(0, 8)}. Check your active queue!`,
          });
        }
      }

      // Targeted notification to the customer
      if (orderData?.customerId) {
        await notificationService.sendNotification({
          userId: orderData.customerId,
          orderId,
          type: 'STATUS_CHANGE',
          subject: `🛵 Courier Dispatched: #${orderData.orderNumber || orderId.slice(0, 8)}`,
          body: `A courier agent has been assigned to deliver your package #${orderData.orderNumber || orderId.slice(0, 8)}.`,
        });
      }
    } catch {
      // ignore
    }

    return { success: true, orderId, agentId };
  },

  /**
   * Automatically find and assign the closest available verified agent (with smart fallback)
   */
  async autoAssign(orderId: string): Promise<any> {
    const orderSnap = await getDoc(doc(db, 'orders', orderId));
    if (!orderSnap.exists()) throw new Error('Order not found.');
    const order = orderSnap.data();

    const agents = await this.getAll();
    let candidates = agents.filter((a) => a.isAvailable && a.isVerified !== false);

    // Fallback 1: Any verified agent (even if offline)
    if (candidates.length === 0) {
      candidates = agents.filter((a) => a.isVerified !== false);
    }

    // Fallback 2: Any registered courier agent
    if (candidates.length === 0) {
      candidates = agents;
    }

    if (candidates.length === 0) {
      throw new Error('No courier agents are currently registered in the database. Please initialize demo agents or register a delivery courier first.');
    }

    const pickupLat = order.pickupLat || order.pickupLocation?.latitude || 28.6139;
    const pickupLng = order.pickupLng || order.pickupLocation?.longitude || 77.2090;

    let nearest = candidates[0];
    let shortestDist = Infinity;

    for (const a of candidates) {
      const aLat = a.latitude ?? 28.6139;
      const aLng = a.longitude ?? 77.2090;
      const dist = haversineDistance(pickupLat, pickupLng, aLat, aLng);
      if (dist < shortestDist) {
        shortestDist = dist;
        nearest = a;
      }
    }

    return this.manualAssign(orderId, nearest.id);
  },
};
