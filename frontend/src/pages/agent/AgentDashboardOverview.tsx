import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi, agentApi } from '../../api/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import DeliveroMap from '../../components/DeliveroMap';
import { formatCurrency, STATUS_COLORS, STATUS_LABELS } from '../../utils/helpers';

export default function AgentDashboardOverview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      setLoading(true);
      try {
        const meRes = await agentApi.getMe().catch(() => ({ data: null }));
        const myAgent = meRes.data;
        if (myAgent) {
          setAgentProfile(myAgent);
          setIsAvailable(myAgent.isAvailable);
          const ordersRes = await orderApi.getAll({ assignedAgentId: myAgent.id }).catch(() => ({ data: [] }));
          setOrders((ordersRes.data || []).filter((o: any) => o.assignedAgentId === myAgent.id || o.assignedAgent?.id === myAgent.id));
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Failed to load agent dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgentData();
  }, []);

  const handleToggleAvailability = async () => {
    try {
      const next = !isAvailable;
      setIsAvailable(next);
      await agentApi.updateAvailability({ isAvailable: next });
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const totalAssigned = orders.length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const inProgressCount = orders.filter((o) => o.status === 'PICKED_UP' || o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY').length;

  // Courier agent earnings (e.g. 70% share of delivered consignments or total delivery charges)
  const totalEarnings = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.computedCharge ? o.computedCharge * 0.7 : 0), 0);

  const activeOrder = orders.find((o) => o.status === 'PICKED_UP' || o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'ACCEPTED');

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Good day, {user?.name || 'Courier Agent'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Zone: <span className="font-bold text-[#5046e4]">{agentProfile?.currentZone?.name || 'All Assigned Zones'}</span> • Dispatch Queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAvailability}
            disabled={agentProfile?.isVerified === false}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
              agentProfile?.isVerified === false
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isAvailable
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-slate-700 hover:bg-slate-800 text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAvailable && agentProfile?.isVerified !== false ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
            {agentProfile?.isVerified === false ? 'Awaiting Verification' : isAvailable ? 'Status: Online Dispatch' : 'Status: Offline'}
          </button>

          <Link to="/agent/orders" className="btn-primary text-xs font-bold shadow-sm">
            🛵 View Deliveries Queue ({totalAssigned})
          </Link>
        </div>
      </div>

      {/* Pending Admin Verification Banner */}
      {agentProfile?.isVerified === false && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl p-2 rounded-xl bg-amber-100/80">⏳</span>
            <div>
              <h3 className="text-sm font-extrabold text-amber-950">Courier Profile Awaiting Admin Verification</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Your agent application is under review by the Operations Admin. Once verified, your status will switch to <strong>Online Dispatch</strong> and you can start accepting package deliveries.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-amber-200/80 text-amber-950 text-3xs font-black uppercase tracking-wider shrink-0 border border-amber-300">
            🟡 Pending Approval
          </span>
        </div>
      )}

      {/* Real Performance Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="delivero-card p-4 text-center">
          <p className="text-2xl font-black text-slate-900 font-mono">{totalAssigned}</p>
          <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider mt-1 block">Assigned Orders</span>
        </div>

        <div className="delivero-card p-4 text-center">
          <p className="text-2xl font-black text-emerald-600 font-mono">{deliveredCount}</p>
          <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider mt-1 block">Delivered</span>
        </div>

        <div className="delivero-card p-4 text-center">
          <p className="text-2xl font-black text-amber-600 font-mono">{inProgressCount}</p>
          <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider mt-1 block">In Progress</span>
        </div>

        <div className="delivero-card p-4 text-center">
          <p className="text-2xl font-black text-[#5046e4] font-mono">{formatCurrency(totalEarnings)}</p>
          <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider mt-1 block">Settled Earnings</span>
        </div>
      </div>

      {/* Main Grid: Active Delivery Card & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Delivery Card & Map (7 cols) */}
        <div className="lg:col-span-7 delivero-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Current Active Consignment</h3>
              <p className="text-3xs text-slate-400">Live GPS tracking and status update</p>
            </div>
            {activeOrder && (
              <span className={`badge ${STATUS_COLORS[activeOrder.status] || 'badge-in-transit'} text-3xs`}>
                {STATUS_LABELS[activeOrder.status] || activeOrder.status}
              </span>
            )}
          </div>

          {activeOrder ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-900">Order #{activeOrder.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-3xs text-slate-400 font-mono">{activeOrder.orderType || 'B2C'} • {activeOrder.actualWeight}kg</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-3xs font-bold text-emerald-700 uppercase">📍 Pickup Origin</span>
                    <p className="font-bold text-slate-900 mt-0.5">{activeOrder.pickupCity}</p>
                    <p className="text-3xs text-slate-500">{activeOrder.pickupAddress}</p>
                  </div>

                  <div>
                    <span className="text-3xs font-bold text-purple-700 uppercase">🏁 Drop Destination</span>
                    <p className="font-bold text-slate-900 mt-0.5">{activeOrder.dropCity}</p>
                    <p className="text-3xs text-slate-500">{activeOrder.dropAddress}</p>
                  </div>
                </div>
              </div>

              {/* Map Preview */}
              <div className="h-48 rounded-2xl overflow-hidden border border-slate-200">
                <DeliveroMap
                  pickupAddress={activeOrder.pickupCity || activeOrder.pickupAddress}
                  dropAddress={activeOrder.dropCity || activeOrder.dropAddress}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Link to="/agent/orders" className="btn-primary flex-1 py-3 text-center text-xs shadow-sm font-bold">
                  Update Status & Complete Handover →
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="text-3xl block">🛵</span>
              <p className="text-xs font-bold text-slate-700">No Active Dispatches in Progress</p>
              <p className="text-3xs text-slate-400 max-w-xs mx-auto">
                Toggle your status to Online to receive automatic dispatch assignments from administrators.
              </p>
            </div>
          )}
        </div>

        {/* Assigned Queue Feed (5 cols) */}
        <div className="lg:col-span-5 delivero-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Your Assigned Consignments</h3>
            <Link to="/agent/orders" className="text-3xs font-bold text-[#5046e4] hover:underline">
              View All ({orders.length}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="py-6 text-center text-slate-400 text-xs">Loading assignments...</div>
            ) : orders.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">No orders assigned to you yet.</div>
            ) : (
              orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      #{ord.id.slice(0, 8).toUpperCase()} • <span className="text-slate-600 font-medium">{ord.dropCity}</span>
                    </p>
                    <p className="text-3xs text-slate-400 font-mono mt-0.5">
                      {ord.receiverName || 'Consignee'} • {formatCurrency(ord.computedCharge)}
                    </p>
                  </div>

                  <span className={`badge ${STATUS_COLORS[ord.status] || 'badge-pending'} text-3xs`}>
                    {STATUS_LABELS[ord.status] || ord.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
