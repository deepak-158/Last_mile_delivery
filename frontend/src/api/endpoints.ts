import api from './client';

// ─── Auth ─────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ─── Address Book ─────────────────────────────────────────
export const addressApi = {
  getAll: () => api.get('/addresses'),
  save: (data: {
    label: string;
    contactName: string;
    contactPhone: string;
    pincode: string;
    city: string;
    state: string;
    locality?: string;
    address: string;
  }) => api.post('/addresses', data),
  delete: (id: string) => api.delete(`/addresses/${id}`),
};

// ─── Zones (Admin) ────────────────────────────────────────
export const zoneApi = {
  getAll: () => api.get('/admin/zones'),
  getById: (id: string) => api.get(`/admin/zones/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post('/admin/zones', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/admin/zones/${id}`, data),
  delete: (id: string) => api.delete(`/admin/zones/${id}`),
  getAreas: (zoneId: string) => api.get(`/admin/zones/${zoneId}/areas`),
  addArea: (zoneId: string, data: { areaIdentifier: string; areaType: string }) =>
    api.post(`/admin/zones/${zoneId}/areas`, data),
  removeArea: (mappingId: string) => api.delete(`/admin/zones/${mappingId}`),
};

// ─── Rate Cards (Admin) ───────────────────────────────────
export const rateCardApi = {
  getAll: () => api.get('/admin/rate-cards'),
  create: (data: { orderType: string; rateType: string; baseCharge: number; perKgCharge: number }) =>
    api.post('/admin/rate-cards', data),
  update: (id: string, data: { baseCharge?: number; perKgCharge?: number }) =>
    api.put(`/admin/rate-cards/${id}`, data),
  delete: (id: string) => api.delete(`/admin/rate-cards/${id}`),
};

// ─── COD Config (Admin) ──────────────────────────────────
export const codConfigApi = {
  getAll: () => api.get('/admin/cod-config'),
  upsert: (data: { orderType: string; surchargeAmount: number }) =>
    api.put('/admin/cod-config', data),
};

// ─── Orders ──────────────────────────────────────────────
export const orderApi = {
  lookupPincode: (pincode: string) => api.get(`/orders/lookup-pincode/${pincode}`),
  preview: (data: any) => api.post('/orders/preview', data),
  create: (data: any) => api.post('/orders', data),
  getAll: (params?: Record<string, string>) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.put(`/orders/${id}/status`, data),
  reschedule: (id: string, data: { rescheduleDate: string }) =>
    api.post(`/orders/${id}/reschedule`, data),
};

// ─── Agents ──────────────────────────────────────────────
export const agentApi = {
  getAll: () => api.get('/admin/agents'),
  getMe: () => api.get('/agent/me'),
  updateLocation: (data: { latitude: number; longitude: number; currentZoneId?: string }) =>
    api.put('/agent/location', data),
  updateAvailability: (data: { isAvailable: boolean }) =>
    api.put('/agent/availability', data),
  manualAssign: (orderId: string, agentId: string) =>
    api.post(`/admin/agents/orders/${orderId}/assign`, { agentId }),
  autoAssign: (orderId: string) =>
    api.post(`/admin/agents/orders/${orderId}/auto-assign`),
};

// ─── Users (Admin) ───────────────────────────────────────
export const userApi = {
  getAll: () => api.get('/auth/users'),
};

// ─── Wallet (Customer) ───────────────────────────────────
export const walletApi = {
  get: () => api.get('/auth/wallet'),
  topup: (amount: number) => api.post('/auth/wallet/topup', { amount }),
};

