import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/endpoints';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function AdminEarningsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll()
      .then((res) => setOrders(res.data || []))
      .catch((err) => console.error('Failed to load earnings:', err))
      .finally(() => setLoading(false));
  }, []);

  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const grossFreight = deliveredOrders.reduce((sum, o) => sum + (o.computedCharge || 0), 0);
  const platformCommission = Math.round(grossFreight * 0.2); // 20% platform share
  const courierPayouts = grossFreight - platformCommission; // 80% courier payout
  const pendingOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'FAILED');
  const pendingEscrow = pendingOrders.reduce((sum, o) => sum + (o.computedCharge || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Earnings & Settlements</h1>
          <p className="text-xs text-slate-500 mt-0.5">Platform gross freight, courier splits, and database transaction ledger</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Gross Settled Freight</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatCurrency(grossFreight)}</p>
          <p className="text-3xs font-semibold text-slate-400 mt-1">{deliveredOrders.length} fulfilled orders</p>
        </div>

        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Courier Payouts (80%)</span>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{formatCurrency(courierPayouts)}</p>
          <p className="text-3xs font-semibold text-emerald-600 mt-1">Disbursed to fleet</p>
        </div>

        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Platform Commission (20%)</span>
          <p className="text-2xl font-black text-[#5046e4] font-mono mt-1">{formatCurrency(platformCommission)}</p>
          <p className="text-3xs font-semibold text-slate-400 mt-1">Platform net margin</p>
        </div>

        <div className="delivero-card p-5">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Pending Active Escrow</span>
          <p className="text-2xl font-black text-amber-600 font-mono mt-1">{formatCurrency(pendingEscrow)}</p>
          <p className="text-3xs font-semibold text-slate-400 mt-1">{pendingOrders.length} active orders</p>
        </div>
      </div>

      {/* Real Transactions Ledger */}
      <div className="delivero-card p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
          Real Database Consignment Settlement Log
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading ledger...</div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No orders recorded in database.</div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {orders.slice(0, 10).map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900">Order #{ord.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-slate-500 ml-2 font-medium">({ord.pickupCity || 'Origin'} ➔ {ord.dropCity || 'Drop'})</span>
                  <p className="text-3xs text-slate-400 font-mono mt-0.5">
                    {formatDate(ord.createdAt)} • {ord.paymentType} • Courier: {ord.assignedAgent?.user?.name || 'Unassigned'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-slate-900 text-sm">{formatCurrency(ord.computedCharge)}</span>
                  <span className="block text-3xs font-bold text-emerald-600">
                    + {formatCurrency((ord.computedCharge || 0) * 0.2)} (20% Net)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
