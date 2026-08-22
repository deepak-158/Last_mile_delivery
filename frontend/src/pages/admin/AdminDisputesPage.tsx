import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/endpoints';
import { formatDate, formatCurrency, STATUS_COLORS, STATUS_LABELS } from '../../utils/helpers';

export default function AdminDisputesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    orderApi.getAll()
      .then((res) => {
        const all = res.data || [];
        // Filter failed or rescheduled orders
        const problemOrders = all.filter((o: any) => o.status === 'FAILED' || o.status === 'RESCHEDULED' || o.status === 'CANCELLED');
        setOrders(problemOrders.length > 0 ? problemOrders : all.slice(0, 5));
      })
      .catch((err) => console.error('Failed to load disputes:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Failed Deliveries & Exception Claims</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage failed deliveries, customer reschedule requests, and courier delivery exceptions</p>
        </div>
      </div>

      <div className="delivero-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-3xs">
                <th className="py-3.5 px-6">Consignment ID</th>
                <th className="py-3.5 px-6">Customer / Consignee</th>
                <th className="py-3.5 px-6">Route</th>
                <th className="py-3.5 px-6">Assigned Courier</th>
                <th className="py-3.5 px-6">Fare</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Date Recorded</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading delivery exceptions...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No delivery disputes or failed consignments recorded.</td>
                </tr>
              ) : (
                orders.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">#{d.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{d.receiverName || d.user?.name || 'Customer'}</td>
                    <td className="py-4 px-6 text-slate-600 text-3xs">{d.pickupCity} ➔ {d.dropCity}</td>
                    <td className="py-4 px-6 text-slate-600 font-semibold">{d.assignedAgent?.user?.name || 'Unassigned'}</td>
                    <td className="py-4 px-6 font-mono font-bold">{formatCurrency(d.computedCharge)}</td>
                    <td className="py-4 px-6">
                      <span className={`badge ${STATUS_COLORS[d.status] || 'badge-pending'} text-3xs`}>
                        {STATUS_LABELS[d.status] || d.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-3xs font-mono">{formatDate(d.createdAt)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedOrder(d)}
                        className="px-2.5 py-1 rounded bg-[#5046e4]/10 hover:bg-[#5046e4]/20 text-[#5046e4] font-bold text-3xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card p-6 max-w-md w-full animate-scale-in space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Consignment #{selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
            <div className="text-xs space-y-2 text-slate-600">
              <p><span className="font-bold text-slate-800">Status:</span> {selectedOrder.status}</p>
              <p><span className="font-bold text-slate-800">Origin:</span> {selectedOrder.pickupAddress} ({selectedOrder.pickupCity})</p>
              <p><span className="font-bold text-slate-800">Destination:</span> {selectedOrder.dropAddress} ({selectedOrder.dropCity})</p>
              <p><span className="font-bold text-slate-800">Receiver:</span> {selectedOrder.receiverName} ({selectedOrder.receiverPhone})</p>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="btn-primary w-full text-xs font-bold mt-2">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
