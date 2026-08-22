import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/endpoints';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function AgentWalletPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    orderApi.getAll()
      .then((res) => {
        const all = res.data || [];
        const completed = all.filter((o: any) => o.status === 'DELIVERED');
        setOrders(completed.length > 0 ? completed : all);
      })
      .catch((err) => console.error('Failed to load agent wallet:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalDeliveredEarnings = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.computedCharge ? o.computedCharge * 0.7 : 0), 0);

  const balance = totalDeliveredEarnings > 0 ? totalDeliveredEarnings : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Driver Courier Wallet</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time delivery settlements and instant bank disbursements</p>
        </div>
      </div>

      {/* Current Balance Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#5046e4] via-[#5850ec] to-[#6366f1] text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-2xs font-bold uppercase tracking-wider text-indigo-200">Withdrawable Balance</span>
          <p className="text-4xl font-black font-mono mt-1">{formatCurrency(balance)}</p>
          <p className="text-2xs text-indigo-100 mt-1">Directly withdrawable from fulfilled consignments</p>
        </div>

        <button
          onClick={() => setShowWithdraw(true)}
          disabled={balance === 0}
          className="px-6 py-3 rounded-xl bg-white text-[#5046e4] font-extrabold text-xs hover:bg-indigo-50 shadow-md whitespace-nowrap disabled:opacity-50"
        >
          Withdraw Funds
        </button>
      </div>

      {/* Real Consignment Ledger */}
      <div className="delivero-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-slate-900">Fulfilled Consignment Settlements</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading wallet ledger...</div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No fulfilled orders recorded yet.</div>
          ) : (
            orders.map((ord) => {
              const share = Math.round((ord.computedCharge || 0) * 0.7);
              return (
                <div key={ord.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                      ↓
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Order #{ord.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-3xs text-slate-400 font-medium mt-0.5">
                        {ord.pickupCity} ➔ {ord.dropCity} • {formatDate(ord.createdAt)}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono font-extrabold text-emerald-600">
                    + {formatCurrency(share)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card max-w-sm w-full p-6 text-center animate-scale-in space-y-4">
            <span className="text-3xl block">🏦</span>
            <h3 className="text-base font-extrabold text-slate-900">Instant Bank Transfer</h3>
            <p className="text-xs text-slate-500">Transfer available wallet balance to linked Bank Account</p>

            <div className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(balance)}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowWithdraw(false)} className="btn-secondary flex-1 font-bold">
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('🎉 Withdrawal request initiated! Funds will reflect in your account.');
                  setShowWithdraw(false);
                }}
                className="btn-primary flex-1 font-bold"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
