import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll()
      .then((res) => setOrders(res.data || []))
      .catch((err) => console.error('Failed to fetch orders:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const failedOrders = orders.filter((o) => o.status === 'FAILED' || o.status === 'CANCELLED' || o.status === 'RESCHEDULED').length;
  const inTransitOrders = orders.filter((o) => o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY').length;

  const totalRevenue = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.computedCharge || 0), 0);

  const avgOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;
  const fulfillmentRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0';

  const b2cOrdersCount = orders.filter((o) => o.orderType === 'B2C').length;
  const b2bOrdersCount = orders.filter((o) => o.orderType === 'B2B').length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time database intelligence and fulfillment breakdown</p>
        </div>
      </div>

      {/* Real Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Consignments</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{totalOrders}</p>
          <p className="text-3xs font-semibold text-slate-400 mt-1">Recorded in Database</p>
        </div>

        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Delivered & Fulfilled</span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{completedOrders}</p>
          <p className="text-3xs font-semibold text-emerald-600 mt-1">{fulfillmentRate}% fulfillment rate</p>
        </div>

        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Active In-Transit</span>
          <p className="text-2xl font-black text-amber-600 font-mono mt-1">{inTransitOrders}</p>
          <p className="text-3xs font-semibold text-slate-400 mt-1">Live en-route dispatches</p>
        </div>

        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Average Order Fare</span>
          <p className="text-2xl font-black text-[#5046e4] font-mono mt-1">{formatCurrency(avgOrderValue)}</p>
          <p className="text-3xs font-semibold text-slate-400 mt-1">Per delivered package</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Breakdown */}
        <div className="delivero-card p-6 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Consignment Type & Settlement Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
              <span className="text-3xs font-bold uppercase text-[#5046e4]">B2C Consumer Deliveries</span>
              <p className="text-3xl font-black text-slate-900 font-mono">{b2cOrdersCount}</p>
              <p className="text-3xs text-slate-500">Doorstep retail & consumer parcel bookings</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
              <span className="text-3xs font-bold uppercase text-purple-700">B2B Enterprise Shipments</span>
              <p className="text-3xl font-black text-slate-900 font-mono">{b2bOrdersCount}</p>
              <p className="text-3xs text-slate-500">Merchant bulk & commercial dispatches</p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Consignment Operational Log</h4>
            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading report data...</p>
            ) : orders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No orders recorded in database yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {orders.slice(0, 6).map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">#{ord.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-slate-500 ml-2">{ord.pickupCity || 'Origin'} ➔ {ord.dropCity || 'Drop'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold">{formatCurrency(ord.computedCharge)}</span>
                      <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Real Revenue Summary */}
        <div className="delivero-card p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Settled Revenue
            </h3>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-3xs font-bold text-slate-400 uppercase">Gross Fulfilled Freight</span>
                <p className="text-3xl font-black text-[#5046e4] font-mono mt-0.5">{formatCurrency(totalRevenue)}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivered Orders:</span>
                  <span className="font-bold text-slate-900">{completedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Failed / Cancelled:</span>
                  <span className="font-bold text-rose-600">{failedOrders}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
