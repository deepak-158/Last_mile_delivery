/**
 * Firebase Spark Service Adapter for API Endpoints.
 * Bridges all existing UI pages seamlessly to Firebase Auth, Cloud Firestore, and FCM.
 */
import { authService } from '../services/authService';
import { addressService } from '../services/addressService';
import { zoneService } from '../services/zoneService';
import { rateCardService } from '../services/rateCardService';
import { codConfigService } from '../services/codConfigService';
import { orderService } from '../services/orderService';
import { agentService } from '../services/agentService';
import { walletService } from '../services/walletService';

// Helper to wrap service responses in an axios-like `{ data: ... }` envelope
const wrap = <T>(promise: Promise<T>): Promise<{ data: T }> =>
  promise.then((data) => ({ data }));

// ─── Auth ─────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string; role?: any }) =>
    wrap(authService.register(data)),
  login: (data: { email: string; password: string }) =>
    wrap(authService.login(data.email, data.password)),
  me: () =>
    wrap(
      authService
        .getUserProfile(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : '')
    ),
};

// ─── Address Book ─────────────────────────────────────────
export const addressApi = {
  getAll: () => wrap(addressService.getAll()),
  save: (data: {
    label: string;
    contactName: string;
    contactPhone: string;
    pincode: string;
    city: string;
    state: string;
    locality?: string;
    address: string;
  }) => wrap(addressService.save(data)),
  delete: (id: string) => wrap(addressService.delete(id)),
};

// ─── Zones (Admin) ────────────────────────────────────────
export const zoneApi = {
  getAll: () => wrap(zoneService.getAll()),
  getById: (id: string) => wrap(zoneService.getById(id)),
  create: (data: { name: string; description?: string }) =>
    wrap(zoneService.create(data)),
  update: (id: string, data: { name?: string; description?: string }) =>
    wrap(zoneService.update(id, data)),
  delete: (id: string) => wrap(zoneService.delete(id)),
  getAreas: (zoneId: string) => wrap(zoneService.getAreas(zoneId)),
  addArea: (zoneId: string, data: { areaIdentifier: string; areaType: string }) =>
    wrap(zoneService.addArea(zoneId, data)),
  removeArea: (mappingId: string) => wrap(zoneService.removeArea(mappingId)),
};

// ─── Rate Cards (Admin) ───────────────────────────────────
export const rateCardApi = {
  getAll: () => wrap(rateCardService.getAll()),
  create: (data: { orderType: string; rateType: string; baseCharge: number; perKgCharge: number }) =>
    wrap(rateCardService.create(data)),
  update: (id: string, data: { baseCharge?: number; perKgCharge?: number }) =>
    wrap(rateCardService.update(id, data)),
  delete: (id: string) => wrap(rateCardService.delete(id)),
};

// ─── COD Config (Admin) ──────────────────────────────────
export const codConfigApi = {
  getAll: () => wrap(codConfigService.getAll()),
  upsert: (data: { orderType: string; surchargeAmount: number }) =>
    wrap(codConfigService.upsert(data)),
};

// ─── Orders ──────────────────────────────────────────────
export const orderApi = {
  lookupPincode: (pincode: string) => wrap(orderService.lookupPincode(pincode)),
  preview: (data: any) => wrap(orderService.preview(data)),
  create: (data: any) => wrap(orderService.create(data)),
  getAll: (params?: Record<string, string>) => wrap(orderService.getAll(params)),
  getById: (id: string) => wrap(orderService.getById(id)),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    wrap(orderService.updateStatus(id, data)),
  reschedule: (id: string, data: { rescheduleDate: string }) =>
    wrap(orderService.reschedule(id, data)),
  subscribe: (id: string, callback: (order: any) => void) =>
    orderService.subscribeOrder(id, callback),
};

// ─── Agents ──────────────────────────────────────────────
export const agentApi = {
  getAll: () => wrap(agentService.getAll()),
  getMe: () => wrap(agentService.getMe()),
  verifyAgent: (agentId: string, approved: boolean) =>
    wrap(agentService.verifyAgent(agentId, approved)),
  updateLocation: (data: { latitude: number; longitude: number; currentZoneId?: string }) =>
    wrap(agentService.updateLocation(data)),
  updateAvailability: (data: { isAvailable: boolean }) =>
    wrap(agentService.updateAvailability(data)),
  manualAssign: (orderId: string, agentId: string) =>
    wrap(agentService.manualAssign(orderId, agentId)),
  autoAssign: (orderId: string) => wrap(agentService.autoAssign(orderId)),
};

// ─── Users (Admin) ───────────────────────────────────────
export const userApi = {
  getAll: () => wrap(authService.getAllUsers()),
};

// ─── Wallet (Customer) ───────────────────────────────────
export const walletApi = {
  get: () => wrap(walletService.getWallet()),
  topup: (amount: number) => wrap(walletService.topup(amount)),
};
