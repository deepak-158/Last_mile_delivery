import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { lookupPincode, PincodeLookupResult } from '../utils/pincodeLookup';
import {
  calculateVolumetricWeight,
  calculateBillableWeight,
  calculateRoadDistance,
  computeLogisticsETA,
  haversineDistance,
} from '../utils/calculations';
import { rateCardService } from './rateCardService';
import { codConfigService } from './codConfigService';
import { walletService } from './walletService';
import { notificationService } from './notificationService';
import { agentService } from './agentService';
import { smsService } from './smsService';

export interface OrderPreviewPayload {
  pickupPincode: string;
  dropPincode: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  orderType: 'B2B' | 'B2C';
  paymentType: 'PREPAID' | 'COD';
  senderName?: string;
  senderPhone?: string;
  pickupAddress?: string;
  pickupCity?: string;
  pickupState?: string;
  receiverName?: string;
  receiverPhone?: string;
  dropAddress?: string;
  dropCity?: string;
  dropState?: string;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  customerId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  pickupPincode: string;
  pickupCity?: string;
  pickupState?: string;
  receiverName: string;
  receiverPhone: string;
  dropAddress: string;
  dropPincode: string;
  dropCity?: string;
  dropState?: string;
  pickupZoneId?: string;
  dropZoneId?: string;
  pickupZone?: { id: string; name: string };
  dropZone?: { id: string; name: string };
  pickupLocation?: any;
  dropLocation?: any;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  actualWeight?: number;
  volumetricWeightKg: number;
  volumetricWeight?: number;
  billableWeightKg: number;
  billableWeight?: number;
  orderType: 'B2B' | 'B2C';
  paymentType: 'PREPAID' | 'COD';
  baseCharge: number;
  codSurcharge: number;
  totalCharge: number;
  computedCharge?: number;
  status: string;
  assignedAgentId?: string;
  assignedAgent?: any;
  rescheduleDate?: string;
  statusHistory?: any[];
  etaBreakdown?: any;
  estimatedDistanceKm?: number;
  estimatedDurationMinutes?: number;
  routingEngine?: string;
  createdAt: string;
  updatedAt?: string;
}

export const orderService = {
  /**
   * Look up city, state, locality, and zone from a 6-digit postal PIN code
   */
  async lookupPincode(pincode: string): Promise<PincodeLookupResult> {
    return lookupPincode(pincode);
  },

  /**
   * Preview price, distance, SLA, and routing breakdown before placing order
   */
  async preview(data: OrderPreviewPayload) {
    const [pickupLookup, dropLookup] = await Promise.all([
      lookupPincode(data.pickupPincode),
      lookupPincode(data.dropPincode),
    ]);

    if (!pickupLookup.valid || !dropLookup.valid) {
      throw new Error('Please enter valid 6-digit Indian PIN codes.');
    }

    const volWeight = calculateVolumetricWeight(data.lengthCm, data.breadthCm, data.heightCm);
    const billWeight = calculateBillableWeight(data.actualWeightKg, volWeight);

    const pickupLat = pickupLookup.latitude ?? 28.6139;
    const pickupLng = pickupLookup.longitude ?? 77.2090;
    const dropLat = dropLookup.latitude ?? 19.0760;
    const dropLng = dropLookup.longitude ?? 72.8777;

    const routing = await calculateRoadDistance(pickupLat, pickupLng, dropLat, dropLng);
    const estimatedDistanceKm = Math.max(1.0, routing.distanceKm);

    const isIntraZone = pickupLookup.zone?.name === dropLookup.zone?.name;
    const rateType = isIntraZone ? 'INTRA_ZONE' : 'INTER_ZONE';

    // Rate card lookup
    const rateCards = await rateCardService.getAll();
    const matchedCard = rateCards.find(
      (c) => c.orderType === data.orderType && c.rateType === rateType
    ) || { baseCharge: isIntraZone ? 50 : 100, perKgCharge: isIntraZone ? 20 : 35 };

    const baseTariff = matchedCard.baseCharge;
    const weightCharge = Math.round(billWeight * matchedCard.perKgCharge * 100) / 100;

    let distanceCharge = 0;
    if (rateType === 'INTRA_ZONE') {
      const extraKm = Math.max(0, estimatedDistanceKm - 5.0);
      distanceCharge = Math.round(extraKm * 5 * 100) / 100;
    } else {
      const extraKm = Math.max(0, estimatedDistanceKm - 50.0);
      distanceCharge = Math.round(extraKm * 3 * 100) / 100;
    }

    const baseCharge = Math.round((baseTariff + weightCharge + distanceCharge) * 100) / 100;

    // COD Surcharge lookup
    let codSurcharge = 0;
    if (data.paymentType === 'COD') {
      const codConfigs = await codConfigService.getAll();
      const matchedCOD = codConfigs.find((c) => c.orderType === data.orderType);
      codSurcharge = matchedCOD?.surchargeAmount ?? (data.orderType === 'B2B' ? 40 : 25);
    }

    const totalCharge = Math.round((baseCharge + codSurcharge) * 100) / 100;

    // SLA & Dynamic ETA calculation
    const etaBreakdown = computeLogisticsETA(estimatedDistanceKm, routing.durationMinutes, rateType);

    const pickupCity = data.pickupCity || pickupLookup.city || 'Origin City';
    const pickupState = data.pickupState || pickupLookup.state || 'Origin State';
    const pickupLocality = (pickupLookup.localities && pickupLookup.localities[0]) || '';

    const dropCity = data.dropCity || dropLookup.city || 'Drop City';
    const dropState = data.dropState || dropLookup.state || 'Drop State';
    const dropLocality = (dropLookup.localities && dropLookup.localities[0]) || '';

    return {
      pickupLocation: {
        pincode: data.pickupPincode,
        locality: pickupLocality,
        city: pickupCity,
        state: pickupState,
        formatted: `${pickupLocality ? pickupLocality + ', ' : ''}${pickupCity}, ${pickupState}`,
        latitude: pickupLat,
        longitude: pickupLng,
      },
      dropLocation: {
        pincode: data.dropPincode,
        locality: dropLocality,
        city: dropCity,
        state: dropState,
        formatted: `${dropLocality ? dropLocality + ', ' : ''}${dropCity}, ${dropState}`,
        latitude: dropLat,
        longitude: dropLng,
      },
      pickupZone: pickupLookup.zone || { id: 'zone-north-zone', name: 'North Zone' },
      dropZone: dropLookup.zone || { id: 'zone-south-zone', name: 'South Zone' },
      rateType,
      dimensions: {
        lengthCm: Number(data.lengthCm) || 1,
        breadthCm: Number(data.breadthCm) || 1,
        heightCm: Number(data.heightCm) || 1,
      },
      volumetricWeightKg: Math.round(volWeight * 1000) / 1000,
      billableWeightKg: Math.round(billWeight * 1000) / 1000,
      actualWeightKg: Number(data.actualWeightKg) || 1,
      estimatedDistanceKm,
      estimatedDurationMinutes: etaBreakdown.totalEstimatedMinutes,
      etaBreakdown,
      routingEngine: routing.source,
      rateCard: {
        baseCharge: baseTariff,
        perKgCharge: matchedCard.perKgCharge,
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
      pricing: {
        baseTariff,
        weightCharge,
        distanceCharge,
        baseCharge,
        codSurcharge,
        totalCharge,
      },
      paymentType: data.paymentType,
      orderType: data.orderType,
    };
  },

  /**
   * Create and book a new delivery order
   */
  async create(data: any): Promise<OrderItem> {
    const user = auth.currentUser;
    const customerId = user?.uid || 'guest-customer';

    const previewData = await this.preview(data);
    const orderNumber = `LM${Math.floor(100000 + Math.random() * 900000)}`;

    const actualWeight = Number(data.actualWeightKg ?? data.actualWeight ?? 1);
    const volumetricWeight = Number(previewData.volumetricWeightKg ?? 1);
    const billableWeight = Number(previewData.billableWeightKg ?? 1);
    const finalTotalCharge = Number(previewData.pricing.totalCharge ?? previewData.totalCharge ?? 150);

    const pickupCity = data.pickupCity || previewData.pickupLocation?.city || 'Origin City';
    const dropCity = data.dropCity || previewData.dropLocation?.city || 'Destination City';

    // Automated Spatial Courier Dispatch on creation
    let assignedAgentId: string | undefined = undefined;
    let initialStatus = 'PENDING';
    let assignedAgentName = '';

    try {
      const agents = await agentService.getAll();
      let candidates = agents.filter((a) => a.isAvailable && a.isVerified !== false);
      if (candidates.length === 0) {
        candidates = agents.filter((a) => a.isVerified !== false);
      }
      if (candidates.length === 0) {
        candidates = agents;
      }

      if (candidates.length > 0) {
        const pickupLat = previewData.pickupLocation?.latitude || 28.6139;
        const pickupLng = previewData.pickupLocation?.longitude || 77.2090;

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

        assignedAgentId = nearest.id;
        initialStatus = 'ACCEPTED';
        assignedAgentName = nearest.user?.name || 'Courier Agent';
      }
    } catch (err) {
      console.warn('Auto-assignment during creation note:', err);
    }

    const orderData: any = {
      orderNumber,
      customerId,
      senderName: data.senderName || '',
      senderPhone: data.senderPhone || '',
      pickupAddress: data.pickupAddress || previewData.pickupLocation?.formatted || '',
      pickupPincode: data.pickupPincode,
      pickupCity,
      pickupState: data.pickupState || previewData.pickupLocation?.state || '',
      receiverName: data.receiverName || '',
      receiverPhone: data.receiverPhone || '',
      dropAddress: data.dropAddress || previewData.dropLocation?.formatted || '',
      dropPincode: data.dropPincode,
      dropCity,
      dropState: data.dropState || previewData.dropLocation?.state || '',
      pickupZoneId: previewData.pickupZone?.id,
      dropZoneId: previewData.dropZone?.id,
      pickupZone: previewData.pickupZone,
      dropZone: previewData.dropZone,
      pickupLocation: previewData.pickupLocation,
      dropLocation: previewData.dropLocation,
      lengthCm: Number(data.lengthCm) || 1,
      breadthCm: Number(data.breadthCm) || 1,
      heightCm: Number(data.heightCm) || 1,
      actualWeightKg: actualWeight,
      actualWeight: actualWeight,
      volumetricWeightKg: volumetricWeight,
      volumetricWeight: volumetricWeight,
      billableWeightKg: billableWeight,
      billableWeight: billableWeight,
      orderType: data.orderType || 'B2C',
      paymentType: data.paymentType || 'PREPAID',
      baseCharge: previewData.pricing.baseCharge,
      codSurcharge: previewData.pricing.codSurcharge,
      totalCharge: finalTotalCharge,
      computedCharge: finalTotalCharge,
      status: initialStatus,
      assignedAgentId,
      etaBreakdown: previewData.etaBreakdown,
      estimatedDistanceKm: previewData.estimatedDistanceKm,
      estimatedDurationMinutes: previewData.estimatedDurationMinutes,
      routingEngine: previewData.routingEngine,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    };

    // If Prepaid, deduct from customer wallet
    if (data.paymentType === 'PREPAID' && user) {
      try {
        await walletService.deduct(
          user.uid,
          finalTotalCharge,
          orderNumber,
          `Delivery Booking: ${orderNumber}`
        );
      } catch (err) {
        console.warn('Wallet deduction note:', err);
      }
    }

    // Save to Firestore
    const res = await addDoc(collection(db, 'orders'), orderData);
    const newOrder = { id: res.id, ...orderData };

    // Record initial status history
    await addDoc(collection(db, `orders/${res.id}/statusHistory`), {
      orderId: res.id,
      status: initialStatus,
      timestamp: new Date().toISOString(),
      actorId: customerId,
      notes: assignedAgentId
        ? `Order booked and auto-dispatched via Spatial Nearest-Neighbor routing to ${assignedAgentName}`
        : 'Order placed successfully by customer',
    });

    // 1. Send targeted push notification & SMS to Customer
    if (user) {
      await notificationService.sendNotification({
        userId: user.uid,
        orderId: res.id,
        type: 'ORDER_PLACED',
        subject: `Order Placed: ${orderNumber}`,
        body: assignedAgentName
          ? `Your parcel ${orderNumber} is booked and assigned to courier ${assignedAgentName}. Total: ₹${finalTotalCharge}`
          : `Your order ${orderNumber} is scheduled for pickup at ${data.pickupPincode}. Total: ₹${finalTotalCharge}`,
      });

      const customerPhone = data.pickupContactPhone || user.phoneNumber || '';
      if (customerPhone) {
        smsService.sendOrderBookedSMS(customerPhone, orderNumber, finalTotalCharge, assignedAgentName);
      }
    }

    // 2. Send targeted push notification & SMS ONLY to assigned Courier Agent
    if (assignedAgentId) {
      try {
        const agentDoc = await getDoc(doc(db, 'agents', assignedAgentId));
        if (agentDoc.exists()) {
          const aData = agentDoc.data();
          const agentUserId = aData.userId;
          if (agentUserId) {
            await notificationService.sendNotification({
              userId: agentUserId,
              orderId: res.id,
              type: 'AGENT_DISPATCH',
              subject: `🛵 New Dispatch Assigned: #${orderNumber}`,
              body: `Pickup: ${pickupCity} (${data.pickupPincode}) ➔ Drop: ${dropCity} (${data.dropPincode}). ₹${finalTotalCharge}`,
            });

            const agentUserDoc = await getDoc(doc(db, 'users', agentUserId));
            const agentPhone = agentUserDoc.exists() ? agentUserDoc.data().phone : '';
            if (agentPhone) {
              smsService.sendAgentDispatchSMS(agentPhone, orderNumber, data.pickupPincode, data.dropPincode, finalTotalCharge);
            }
          }
        }
      } catch (err) {
        console.warn('Agent dispatch notification note:', err);
      }
    }

    return newOrder;
  },

  /**
   * Fetch all orders with automatic courier agent hydration and role-based filtering
   */
  async getAll(params?: Record<string, string>): Promise<OrderItem[]> {
    const [orderSnap, agentSnap, userSnap] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'agents')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
    ]);

    const usersMap = new Map(userSnap.docs.map((d: any) => [d.id, { id: d.id, ...d.data() }]));
    const agentsMap = new Map(agentSnap.docs.map((d: any) => {
      const aData = d.data();
      const u = usersMap.get(aData.userId);
      return [d.id, { id: d.id, ...aData, user: u }];
    }));

    let orders: OrderItem[] = orderSnap.docs.map((d) => {
      const data = d.data() as any;
      const assignedAgent = data.assignedAgentId ? agentsMap.get(data.assignedAgentId) : data.assignedAgent;
      const user = data.customerId ? usersMap.get(data.customerId) : undefined;

      const actWeight = Number(data.actualWeight ?? data.actualWeightKg ?? 1);
      const volWeight = Number(data.volumetricWeight ?? data.volumetricWeightKg ?? 1);
      const charge = Number(data.computedCharge ?? data.totalCharge ?? 0);

      return {
        id: d.id,
        ...data,
        user,
        actualWeight: actWeight,
        actualWeightKg: actWeight,
        volumetricWeight: volWeight,
        volumetricWeightKg: volWeight,
        computedCharge: charge,
        totalCharge: charge,
        pickupCity: data.pickupCity || data.pickupLocation?.city || 'Origin City',
        dropCity: data.dropCity || data.dropLocation?.city || 'Drop City',
        assignedAgent: assignedAgent || undefined,
        assignedAgentId: data.assignedAgentId || assignedAgent?.id,
      } as OrderItem;
    });

    // Sort by createdAt descending
    orders.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // Apply Role-Based Scoping (Admins always see all orders)
    const ALLOWED_ADMIN_EMAILS = [
      'admin@lastmile.dev',
      'deepakshukla1508.i@gmail.com',
      'dipakshukla158@gmail.com',
    ];

    const currentUser = auth.currentUser;
    const currentUserProfile = currentUser ? usersMap.get(currentUser.uid) : null;
    const userEmail = currentUser?.email?.toLowerCase() || '';

    const isAdmin =
      params?.all === 'true' ||
      ALLOWED_ADMIN_EMAILS.includes(userEmail) ||
      currentUserProfile?.role === 'ADMIN' ||
      (() => {
        try {
          const cached = JSON.parse(localStorage.getItem('user') || '{}');
          return cached.role === 'ADMIN' || ALLOWED_ADMIN_EMAILS.includes(cached.email?.toLowerCase());
        } catch {
          return false;
        }
      })();

    if (currentUser && !isAdmin && !params?.all) {
      const userRole = currentUserProfile?.role || (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || '{}').role || 'CUSTOMER';
        } catch {
          return 'CUSTOMER';
        }
      })();

      if (userRole === 'AGENT') {
        let myAgentId = '';
        for (const [aId, aData] of agentsMap.entries()) {
          if (aData.userId === currentUser.uid) {
            myAgentId = aId;
            break;
          }
        }
        if (myAgentId) {
          orders = orders.filter((o) => o.assignedAgentId === myAgentId || o.assignedAgent?.id === myAgentId);
        } else {
          orders = [];
        }
      } else if (userRole === 'CUSTOMER') {
        orders = orders.filter((o) => o.customerId === currentUser.uid);
      }
    }

    // Apply explicit query filters if specified
    if (params?.status) {
      orders = orders.filter((o) => o.status === params.status);
    }
    if (params?.orderType) {
      orders = orders.filter((o) => o.orderType === params.orderType);
    }
    if (params?.customerId) {
      orders = orders.filter((o) => o.customerId === params.customerId);
    }
    if (params?.assignedAgentId) {
      orders = orders.filter((o) => o.assignedAgentId === params.assignedAgentId || o.assignedAgent?.id === params.assignedAgentId);
    }

    return orders;
  },

  /**
   * Fetch a single order by ID along with its status history
   */
  async getById(id: string): Promise<OrderItem | null> {
    const [snap, agentSnap, userSnap] = await Promise.all([
      getDoc(doc(db, 'orders', id)),
      getDocs(collection(db, 'agents')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
    ]);

    if (!snap.exists()) return null;

    const data = snap.data() as any;
    const usersMap = new Map(userSnap.docs.map((d: any) => [d.id, { id: d.id, ...d.data() }]));
    const agentsMap = new Map(agentSnap.docs.map((d: any) => {
      const aData = d.data();
      const u = usersMap.get(aData.userId);
      return [d.id, { id: d.id, ...aData, user: u }];
    }));

    const assignedAgent = data.assignedAgentId ? agentsMap.get(data.assignedAgentId) : data.assignedAgent;
    const user = data.customerId ? usersMap.get(data.customerId) : undefined;

    const actWeight = Number(data.actualWeight ?? data.actualWeightKg ?? 1);
    const volWeight = Number(data.volumetricWeight ?? data.volumetricWeightKg ?? 1);
    const charge = Number(data.computedCharge ?? data.totalCharge ?? 0);

    const orderData: OrderItem = {
      id: snap.id,
      ...data,
      user,
      actualWeight: actWeight,
      actualWeightKg: actWeight,
      volumetricWeight: volWeight,
      volumetricWeightKg: volWeight,
      computedCharge: charge,
      totalCharge: charge,
      pickupCity: data.pickupCity || data.pickupLocation?.city || 'Origin City',
      dropCity: data.dropCity || data.dropLocation?.city || 'Drop City',
      assignedAgent: assignedAgent || undefined,
    };

    // Fetch status history subcollection
    try {
      const historySnap = await getDocs(collection(db, `orders/${id}/statusHistory`));
      const history: any[] = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      history.sort(
        (a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
      );
      orderData.statusHistory = history;
    } catch {
      orderData.statusHistory = [];
    }

    return orderData;
  },

  /**
   * Realtime Order Tracking Listener (powered by Firestore onSnapshot)
   */
  subscribeOrder(id: string, callback: (order: OrderItem | null) => void) {
    const unsub = onSnapshot(doc(db, 'orders', id), async (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data() as any;
      let history: any[] = [];
      try {
        const historySnap = await getDocs(collection(db, `orders/${id}/statusHistory`));
        history = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        history.sort(
          (a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
        );
      } catch {
        // ignore
      }

      const actWeight = Number(data.actualWeight ?? data.actualWeightKg ?? 1);
      const volWeight = Number(data.volumetricWeight ?? data.volumetricWeightKg ?? 1);
      const charge = Number(data.computedCharge ?? data.totalCharge ?? 0);

      callback({
        id: snap.id,
        ...data,
        actualWeight: actWeight,
        actualWeightKg: actWeight,
        volumetricWeight: volWeight,
        volumetricWeightKg: volWeight,
        computedCharge: charge,
        totalCharge: charge,
        pickupCity: data.pickupCity || data.pickupLocation?.city || 'Origin City',
        dropCity: data.dropCity || data.dropLocation?.city || 'Drop City',
        statusHistory: history,
      } as OrderItem);
    });

    return unsub;
  },

  /**
   * Progress or update order status along standard delivery workflow
   */
  async updateStatus(id: string, data: { status: string; notes?: string }): Promise<OrderItem> {
    const user = auth.currentUser;
    const actorId = user?.uid || 'system';

    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, {
      status: data.status,
      updatedAt: new Date().toISOString(),
    });

    // Record status history transition
    await addDoc(collection(db, `orders/${id}/statusHistory`), {
      orderId: id,
      status: data.status,
      timestamp: new Date().toISOString(),
      actorId,
      notes: data.notes || `Status transitioned to ${data.status}`,
    });

    // Send push / in-app notification and Twilio SMS to customer
    const snap = await getDoc(orderRef);
    if (snap.exists()) {
      const order = snap.data();
      if (order.customerId) {
        await notificationService.sendNotification({
          userId: order.customerId,
          orderId: id,
          type: 'STATUS_CHANGE',
          subject: `Order Update: ${order.orderNumber}`,
          body: `Your delivery package status is now "${data.status}". ${data.notes || ''}`,
        });

        // Trigger Twilio SMS for key delivery milestones
        const customerPhone = order.pickupContactPhone || order.user?.phone || '';
        if (customerPhone) {
          if (data.status === 'OUT_FOR_DELIVERY') {
            smsService.sendOutForDeliverySMS(
              customerPhone,
              order.orderNumber || id.slice(0, 8),
              order.assignedAgent?.user?.name || 'Rider',
              order.deliveryOtp || '8492'
            );
          } else if (data.status === 'DELIVERED') {
            smsService.sendDeliveredSMS(customerPhone, order.orderNumber || id.slice(0, 8));
          }
        }
      }
    }

    const updated = await this.getById(id);
    return updated!;
  },

  /**
   * Reschedule order delivery date
   */
  async reschedule(id: string, data: { rescheduleDate: string }): Promise<OrderItem> {
    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, {
      rescheduleDate: data.rescheduleDate,
      status: 'RESCHEDULED',
      updatedAt: new Date().toISOString(),
    });

    await addDoc(collection(db, `orders/${id}/statusHistory`), {
      orderId: id,
      status: 'RESCHEDULED',
      timestamp: new Date().toISOString(),
      actorId: auth.currentUser?.uid || 'customer',
      notes: `Rescheduled delivery date to ${data.rescheduleDate}`,
    });

    const updated = await this.getById(id);
    return updated!;
  },
};
