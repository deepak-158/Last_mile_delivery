import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/endpoints';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function AgentEarningsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll()
      .then((res) => setOrders(res.data || []))
      .catch((err) => console.error('Failed to load agent earnings:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalAssigned = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalEarnings = deliveredOrders.reduce((sum, o) => sum + (o.computedCharge ? o.computedCharge * 0.7 : 0), 0);
  const avgPerTrip = deliveredOrders.length > 0 ? Math.round(totalEarnings / deliveredOrders.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Earnings & Compensation</h1>
          <p className="text-xs text-slate-500 mt-0.5">Summary of order compensation, distance splits, and courier payouts</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Delivered Share</span>
          <p className="text-2xl font-black text-[#5046e4] font-mono mt-1">{formatCurrency(totalEarnings)}</p>
        </div>

        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Completed Trips</span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{deliveredOrders.length}</p>
        </div>

        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Average Per Trip</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatCurrency(avgPerTrip)}</p>
        </div>

        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Dispatches</span>
          <p className="text-2xl font-black text-amber-600 font-mono mt-1">{totalAssigned}</p>
        </div>
      </div>

      {/* Real Consignment Earnings Log */}
      <div className="delivero-card p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
          Consignment Earnings Log
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading earnings log...</div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No orders assigned yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {orders.map((ord) => {
              const courierShare = Math.round((ord.computedCharge || 0) * 0.7);
              return (
                <div key={ord.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900">Order #{ord.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-slate-500 ml-2">({ord.pickupCity} ➔ {ord.dropCity})</span>
                    <p className="text-3xs text-slate-400 font-mono mt-0.5">
                      {formatDate(ord.createdAt)} • Status: {ord.status}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      Gross: {formatCurrency(ord.computedCharge)}
                    </span>
                    <span className="block text-3xs font-extrabold text-emerald-600">
                      Courier Share: {formatCurrency(courierShare)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
