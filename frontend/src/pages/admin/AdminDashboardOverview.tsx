import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi, agentApi, zoneApi } from '../../api/endpoints';
import { formatCurrency, STATUS_COLORS, STATUS_LABELS } from '../../utils/helpers';

export default function AdminDashboardOverview() {
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [ordersRes, agentsRes, zonesRes] = await Promise.all([
          orderApi.getAll().catch(() => ({ data: [] })),
          agentApi.getAll().catch(() => ({ data: [] })),
          zoneApi.getAll().catch(() => ({ data: [] })),
        ]);
        setOrders(ordersRes.data || []);
        setAgents(agentsRes.data || []);
        setZones(zonesRes.data || []);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const inTransitOrders = orders.filter((o) => o.status === 'IN_TRANSIT').length;
  const outForDeliveryOrders = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;
  const pickedUpOrders = orders.filter((o) => o.status === 'PICKED_UP').length;
  const failedOrders = orders.filter((o) => o.status === 'FAILED' || o.status === 'CANCELLED' || o.status === 'RESCHEDULED').length;

  const totalRevenue = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.computedCharge || 0), 0);

  const availableAgentsCount = agents.filter((a) => a.isAvailable).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Control Tower</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time platform metrics and live dispatch operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/assignments" className="btn-secondary text-xs flex items-center gap-1.5 font-bold">
            <span>⚡</span> Dispatch Assignments
          </Link>
          <Link to="/admin/live-tracking" className="btn-primary text-xs flex items-center gap-1.5 shadow-sm font-bold">
            <span>🛰️</span> Live Map Tracking
          </Link>
        </div>
      </div>

      {/* Top 5 Real KPI Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="delivero-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Consignments</span>
            <span className="text-base">📦</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{totalOrders}</p>
            <p className="text-3xs font-semibold text-slate-400 mt-1">Live Database Records</p>
          </div>
        </div>

        <div className="delivero-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Delivered</span>
            <span className="text-base">✅</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-emerald-600 font-mono">{deliveredOrders}</p>
            <p className="text-3xs font-semibold text-emerald-600 mt-1">
              {totalOrders > 0 ? `${((deliveredOrders / totalOrders) * 100).toFixed(1)}% fulfillment` : '0%'}
            </p>
          </div>
        </div>

        <div className="delivero-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">In Transit</span>
            <span className="text-base">🚚</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-amber-600 font-mono">{inTransitOrders + outForDeliveryOrders}</p>
            <p className="text-3xs font-semibold text-slate-400 mt-1">Active Couriers En-Route</p>
          </div>
        </div>

        <div className="delivero-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Failed / Disputed</span>
            <span className="text-base">❌</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-rose-600 font-mono">{failedOrders}</p>
            <p className="text-3xs font-semibold text-slate-400 mt-1">Requires Re-dispatch</p>
          </div>
        </div>

        <div className="delivero-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Delivered Revenue</span>
            <span className="text-base">💰</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-extrabold text-[#5046e4] font-mono">{formatCurrency(totalRevenue)}</p>
            <p className="text-3xs font-semibold text-slate-400 mt-1">Total Settled Freight</p>
          </div>
        </div>
      </div>

      {/* Orders by Status Summary & Top Couriers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Status Breakdown (2 cols) */}
        <div className="delivero-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Consignment Status Distribution</h3>
              <p className="text-3xs text-slate-400">Live operational states from database</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-[#5046e4] hover:underline">
              View All Orders →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-3xs font-bold text-slate-400 uppercase">Pending Pickup</span>
              <p className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
                {orders.filter((o) => o.status === 'PENDING').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-3xs font-bold text-slate-400 uppercase">Picked Up</span>
              <p className="text-lg font-extrabold text-indigo-600 font-mono mt-0.5">{pickedUpOrders}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-3xs font-bold text-slate-400 uppercase">In Transit</span>
              <p className="text-lg font-extrabold text-amber-600 font-mono mt-0.5">{inTransitOrders}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-3xs font-bold text-slate-400 uppercase">Out for Delivery</span>
              <p className="text-lg font-extrabold text-purple-600 font-mono mt-0.5">{outForDeliveryOrders}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-3xs font-bold text-slate-400 uppercase">Delivered</span>
              <p className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5">{deliveredOrders}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-3xs font-bold text-slate-400 uppercase">Failed / Rescheduled</span>
              <p className="text-lg font-extrabold text-rose-600 font-mono mt-0.5">{failedOrders}</p>
            </div>
          </div>

          {/* Recent Consignments Table */}
          <div className="pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Database Consignments</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-3xs font-bold uppercase text-slate-400">
                    <th className="py-2">Order ID</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Route</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">Loading orders...</td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">No orders created in database.</td>
                    </tr>
                  ) : (
                    orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-mono font-bold text-slate-900">
                          <Link to={`/customer/orders/${ord.id}`} className="hover:text-[#5046e4] hover:underline">
                            #{ord.id.slice(0, 8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-800">
                          {ord.receiverName || ord.user?.name || 'Customer'}
                        </td>
                        <td className="py-2.5 text-slate-600 text-3xs">
                          {ord.pickupCity || 'Origin'} ➔ {ord.dropCity || 'Drop'}
                        </td>
                        <td className="py-2.5 font-mono font-bold text-slate-900">
                          {formatCurrency(ord.computedCharge)}
                        </td>
                        <td className="py-2.5">
                          <span className={`badge ${STATUS_COLORS[ord.status] || 'badge-pending'} text-3xs`}>
                            {STATUS_LABELS[ord.status] || ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Fleet & Zones Overview (1 col) */}
        <div className="delivero-card p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900">Active Fleet</h3>
              <Link to="/admin/agents" className="text-3xs font-bold text-[#5046e4] hover:underline">
                Manage Fleet ({agents.length}) →
              </Link>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 mb-3 flex items-center justify-between">
              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-emerald-800">Available Couriers</span>
                <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">{availableAgentsCount} / {agents.length}</p>
              </div>
              <span className="text-2xl">🛵</span>
            </div>

            <div className="space-y-2">
              {agents.slice(0, 4).map((ag) => (
                <div key={ag.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#5046e4] text-white flex items-center justify-center font-bold text-3xs">
                      {ag.user?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-3xs">{ag.user?.name}</p>
                      <p className="text-3xs text-slate-400 font-mono">{ag.currentZone?.name || 'All Zones'}</p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${ag.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900">Configured Zones</h3>
              <Link to="/admin/zones" className="text-3xs font-bold text-[#5046e4] hover:underline">
                View Zones ({zones.length}) →
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {zones.map((z) => (
                <span key={z.id} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-3xs">
                  🗺️ {z.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
