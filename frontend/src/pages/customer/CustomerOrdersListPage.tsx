import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../../api/endpoints';
import {
  formatCurrency,
  formatDate,
  getOrderCharge,
  getOrderActualWeight,
  getOrderBillableWeight,
  getOrderOrigin,
  getOrderDestination,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../../utils/helpers';

export default function CustomerOrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [rescheduleOrder, setRescheduleOrder] = useState<any | null>(null);
  const [newDate, setNewDate] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCustomerOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll();
      setOrders(res.data || []);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerOrders();
  }, []);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleOrder || !newDate) return;
    try {
      await orderApi.reschedule(rescheduleOrder.id, { rescheduleDate: newDate });
      showMsg('Delivery rescheduled successfully! Dispatch will be re-assigned on the selected date.');
      setRescheduleOrder(null);
      setNewDate('');
      fetchCustomerOrders();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Failed to reschedule order', 'error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Ongoing') return ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status);
    if (activeTab === 'Completed') return o.status === 'DELIVERED';
    if (activeTab === 'Canceled') return o.status === 'FAILED' || o.status === 'CANCELLED';
    return o.status === activeTab;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Deliveries & Orders</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Track active express dispatches and past delivery history</p>
        </div>
        <Link to="/customer/orders/new" className="btn-primary text-xs shadow-md font-bold flex items-center gap-1.5">
          <span>+</span> Book New Delivery
        </Link>
      </div>

      {actionMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-bold animate-slide-down ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-0 text-xs font-bold">
        {['All', 'Ongoing', 'Completed', 'Canceled'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-3 transition-all relative ${
              activeTab === t ? 'text-[#5046e4]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
            {activeTab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5046e4] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      {loading ? (
        <div className="delivero-card p-12 text-center text-slate-400 text-xs">
          <span className="inline-block w-6 h-6 border-2 border-[#5046e4] border-t-transparent rounded-full animate-spin mr-2" />
          Loading orders from backend...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="delivero-card p-12 text-center space-y-4">
          <span className="text-4xl block">📦</span>
          <h3 className="font-extrabold text-slate-900 text-base">No orders found</h3>
          <p className="text-xs text-slate-500">You don't have any orders in this category yet.</p>
          <Link to="/customer/orders/new" className="btn-primary inline-block text-xs font-bold shadow-sm">
            Book an Express Parcel Delivery →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const charge = getOrderCharge(ord);
            const actualWeight = getOrderActualWeight(ord);
            const billableWeight = getOrderBillableWeight(ord);
            const originName = getOrderOrigin(ord);
            const destName = getOrderDestination(ord);

            return (
              <div key={ord.id} className="delivero-card p-5 hover:shadow-md transition-all space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-2xl shadow-xs">
                      📦
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-400">#{ord.id.slice(0, 8).toUpperCase()}</span>
                        <h3 className="font-extrabold text-sm text-slate-900">
                          {originName} ➔ {destName}
                        </h3>
                      </div>
                      <p className="text-3xs text-slate-400 mt-0.5 font-medium">
                        Placed {formatDate(ord.createdAt)} • Receiver: <span className="text-slate-800 font-bold">{ord.receiverName || 'Self'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-black text-base text-slate-900">{formatCurrency(charge)}</p>
                    <span className={`badge mt-1 ${STATUS_COLORS[ord.status] || 'badge-pending'} text-3xs font-bold`}>
                      {STATUS_LABELS[ord.status] || ord.status}
                    </span>
                  </div>
                </div>

                {/* Weight & Type Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-3xs font-medium text-slate-600">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Actual Wt</span>
                    <span className="font-black text-slate-800 font-mono">{actualWeight} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Dimensions (LxBxH)</span>
                    <span className="font-black text-slate-800 font-mono">{ord.lengthCm}×{ord.breadthCm}×{ord.heightCm} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Billable Wt</span>
                    <span className="font-black text-[#5046e4] font-mono">{billableWeight} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Payment / Type</span>
                    <span className="font-black text-slate-800">{ord.paymentType} • {ord.orderType}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 text-3xs font-medium">
                    {ord.assignedAgent?.user?.name
                      ? `🛵 Courier: ${ord.assignedAgent.user.name}`
                      : '🛵 Awaiting Automated Courier Assignment'}
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Reschedule Button for Failed Orders */}
                    {ord.status === 'FAILED' && (
                      <button
                        onClick={() => setRescheduleOrder(ord)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-200 text-xs"
                      >
                        📅 Reschedule Delivery
                      </button>
                    )}

                    <Link to={`/customer/orders/${ord.id}`} className="text-[#5046e4] font-black text-xs hover:underline">
                      View Details & Receipt →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Reschedule Failed Delivery</h3>
            <p className="text-xs text-slate-500">
              Select a new preferred delivery attempt date for Order #{rescheduleOrder.id.slice(0, 8)}:
            </p>

            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">
                  New Preferred Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="input-field font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleOrder(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 font-bold">
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
