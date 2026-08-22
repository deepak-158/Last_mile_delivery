import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi, agentApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';

export default function AdminOrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [search, setSearch] = useState('');
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [statusOverrideOrderId, setStatusOverrideOrderId] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tabs = ['All Orders', 'PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, agentsRes] = await Promise.all([
        orderApi.getAll(),
        agentApi.getAll().catch(() => ({ data: [] })),
      ]);
      setOrders(ordersRes.data || []);
      setAgents(agentsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Manual Agent Assignment
  const handleManualAssign = async (orderId: string) => {
    if (!selectedAgentId) {
      alert('Please select an agent from the dropdown');
      return;
    }
    try {
      await agentApi.manualAssign(orderId, selectedAgentId);
      showMsg('Agent manually assigned successfully!');
      setAssigningOrderId(null);
      setSelectedAgentId('');
      fetchAllData();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Assignment failed', 'error');
    }
  };

  // 1-Click Auto Assignment
  const handleAutoAssign = async (orderId: string) => {
    try {
      const res = await agentApi.autoAssign(orderId);
      showMsg(`Auto-assigned to agent: ${res.data?.assignedAgent?.user?.name || 'Nearest Agent'}`);
      fetchAllData();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Auto-assignment failed (No available agent found in zone)', 'error');
    }
  };

  // Status Override
  const handleStatusOverride = async (orderId: string) => {
    if (!overrideStatus) return;
    try {
      await orderApi.updateStatus(orderId, { status: overrideStatus, notes: 'Admin override' });
      showMsg(`Order status updated to ${overrideStatus}`);
      setStatusOverrideOrderId(null);
      fetchAllData();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Status override failed', 'error');
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'badge-ontheway';
      case 'DELIVERED':
        return 'badge-delivered';
      case 'PICKED_UP':
      case 'ACCEPTED':
        return 'badge-pickedup';
      case 'PENDING':
        return 'badge-pending';
      case 'FAILED':
      case 'CANCELLED':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab !== 'All Orders' && o.status !== activeTab) return false;
    if (search) {
      const s = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(s);
      const matchCustomer = (o.user?.name || o.receiverName || o.senderName || '').toLowerCase().includes(s);
      const matchCity = (o.dropCity || o.pickupCity || '').toLowerCase().includes(s);
      if (!matchId && !matchCustomer && !matchCity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Orders Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Live backend dispatch control tower & consignment audits</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/customer/orders/new" className="btn-primary text-xs flex items-center gap-1.5 shadow-sm">
            <span>+</span> Book New Consignment
          </Link>
          <Link to="/admin/zones" className="btn-secondary text-xs">
            🗺️ Zones
          </Link>
          <Link to="/admin/rate-cards" className="btn-secondary text-xs">
            💳 Rate Cards
          </Link>
          <Link to="/admin/cod-config" className="btn-secondary text-xs">
            💵 COD Config
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-bold animate-slide-down ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Main Table Card */}
      <div className="delivero-card overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-100 overflow-x-auto gap-4">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs font-bold transition-all relative whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-[#5046e4]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.replace('_', ' ')}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5046e4] rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="pb-3">
            <input
              type="text"
              placeholder="Search by ID, customer, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-56"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-3xs">
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-6">Customer / Sender</th>
                <th className="py-3.5 px-6">Corridor (Route)</th>
                <th className="py-3.5 px-6">Weight / Vol</th>
                <th className="py-3.5 px-6">Computed Charge</th>
                <th className="py-3.5 px-6">Assigned Agent</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions & Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <span className="inline-block w-6 h-6 border-2 border-[#5046e4] border-t-transparent rounded-full animate-spin mr-2" />
                    Loading real orders from database...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No orders found matching this filter.{' '}
                    <Link to="/customer/orders/new" className="text-[#5046e4] font-bold hover:underline">
                      Book a parcel delivery now →
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      <Link to={`/customer/orders/${ord.id}`} className="hover:text-[#5046e4] hover:underline">
                        #{ord.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{ord.receiverName || ord.user?.name || 'Customer'}</p>
                      <p className="text-3xs text-slate-400 font-mono">{ord.receiverPhone || ord.senderPhone || ord.user?.phone || 'No phone'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-slate-800 font-semibold">{ord.pickupCity || 'Pickup'} ➔ {ord.dropCity || 'Drop'}</p>
                      <p className="text-3xs text-slate-400">{ord.pickupPincode} to {ord.dropPincode}</p>
                    </td>
                    <td className="py-4 px-6 font-mono text-2xs">
                      <span className="font-bold text-slate-900">{ord.actualWeight}kg</span> /{' '}
                      <span className="text-slate-500">{ord.volumetricWeight}kg vol</span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {formatCurrency(ord.computedCharge)}
                      <span className="block text-3xs font-sans text-slate-400 font-normal">{ord.paymentType} • {ord.orderType}</span>
                    </td>
                    <td className="py-4 px-6">
                      {ord.assignedAgent ? (
                        <div>
                          <p className="font-bold text-[#5046e4] flex items-center gap-1">
                            <span>🛵</span> {ord.assignedAgent.user?.name || 'Courier'}
                          </p>
                          <span className="text-3xs text-emerald-600 font-bold">Assigned</span>
                        </div>
                      ) : (
                        <span className="badge badge-pending text-3xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`badge ${getStatusBadge(ord.status)}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {/* 1-Click Auto Assign */}
                      {!ord.assignedAgent && ord.status !== 'DELIVERED' && ord.status !== 'FAILED' && (
                        <button
                          onClick={() => handleAutoAssign(ord.id)}
                          className="px-2 py-1 rounded bg-[#5046e4]/10 hover:bg-[#5046e4]/20 text-[#5046e4] font-bold text-3xs transition-colors"
                          title="Auto assign nearest available agent"
                        >
                          ⚡ Auto Assign
                        </button>
                      )}

                      {/* Manual Assign Trigger */}
                      {!ord.assignedAgent && ord.status !== 'DELIVERED' && (
                        <button
                          onClick={() => setAssigningOrderId(ord.id)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-3xs"
                        >
                          Assign
                        </button>
                      )}

                      {/* Status Override */}
                      <button
                        onClick={() => setStatusOverrideOrderId(ord.id)}
                        className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-3xs"
                      >
                        Override Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing {filteredOrders.length} of {orders.length} real consignments</span>
          <button onClick={fetchAllData} className="text-[#5046e4] font-bold hover:underline">
            🔄 Refresh List
          </button>
        </div>
      </div>

      {/* Manual Agent Assign Modal */}
      {assigningOrderId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Manually Assign Courier Agent</h3>
            <p className="text-xs text-slate-500">Select an active delivery agent to dispatch this consignment:</p>

            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="input-field"
            >
              <option value="">-- Choose an Available Agent --</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.user?.name} {ag.isAvailable ? '🟢 (Available)' : '🔴 (Busy)'} - {ag.currentZone?.name || 'All Zones'}
                </option>
              ))}
            </select>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setAssigningOrderId(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={() => handleManualAssign(assigningOrderId)} className="btn-primary flex-1 font-bold">
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Override Modal */}
      {statusOverrideOrderId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Admin Status Override</h3>
            <p className="text-xs text-slate-500">Force update consignment lifecycle (logged immutably in OrderStatusHistory):</p>

            <select
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value)}
              className="input-field font-bold"
            >
              <option value="">-- Select Target Status --</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="PICKED_UP">PICKED_UP</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED (Triggers customer reschedule)</option>
            </select>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStatusOverrideOrderId(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={() => handleStatusOverride(statusOverrideOrderId)} className="btn-primary flex-1 font-bold">
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
