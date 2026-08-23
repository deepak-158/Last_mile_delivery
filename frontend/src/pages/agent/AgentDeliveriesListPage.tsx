import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi, agentApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';
import { Zap } from 'lucide-react';

export default function AgentDeliveriesListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [nextStatus, setNextStatus] = useState('PICKED_UP');
  const [statusNotes, setStatusNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAgentOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll();
      setOrders(res.data || []);
    } catch (err: any) {
      console.error('Failed to load agent orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentOrders();
  }, []);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await orderApi.updateStatus(selectedOrder.id, {
        status: nextStatus,
        notes: statusNotes || `Rider updated status to ${nextStatus}`,
      });
      showMsg(`Consignment updated to ${nextStatus}. Customer notified by email.`);
      setSelectedOrder(null);
      setStatusNotes('');
      fetchAgentOrders();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Failed to update status', 'error');
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
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status);
    if (activeTab === 'Completed') return o.status === 'DELIVERED';
    if (activeTab === 'Failed') return o.status === 'FAILED';
    return o.status === activeTab;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Deliveries Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">Live dispatches assigned to your courier route</p>
        </div>
        <Link to="/agent/delivery-flow" className="btn-primary text-xs shadow-sm font-bold inline-flex items-center gap-1.5">
          <Zap className="w-4 h-4" /> Open Visual Delivery Flow
        </Link>
      </div>

      {actionMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-bold animate-slide-down ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          {actionMessage.text}
        </div>
      )}

      <div className="delivero-card overflow-hidden">
        {/* Sub-tabs */}
        <div className="flex items-center gap-4 px-6 pt-4 border-b border-slate-100 overflow-x-auto text-xs font-bold">
          {['All', 'Active', 'Completed', 'Failed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 transition-all relative ${
                activeTab === tab ? 'text-[#5046e4]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5046e4] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Deliveries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-3xs">
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-6">Receiver & Contact</th>
                <th className="py-3.5 px-6">Pickup Location</th>
                <th className="py-3.5 px-6">Drop Destination</th>
                <th className="py-3.5 px-6">Weight / Fare</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <span className="inline-block w-6 h-6 border-2 border-[#5046e4] border-t-transparent rounded-full animate-spin mr-2" />
                    Loading assigned trips from backend...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No assigned deliveries found in this view.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      #{ord.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{ord.receiverName || ord.user?.name || 'Receiver'}</p>
                      <p className="text-3xs text-slate-400 font-mono">{ord.receiverPhone || ord.user?.phone || 'No phone'}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <p className="font-semibold text-slate-800">{ord.pickupCity}</p>
                      <p className="text-3xs text-slate-400 truncate max-w-xs">{ord.pickupAddress}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <p className="font-semibold text-slate-800">{ord.dropCity}</p>
                      <p className="text-3xs text-slate-400 truncate max-w-xs">{ord.dropAddress}</p>
                    </td>
                    <td className="py-4 px-6 font-mono">
                      <span className="font-bold text-emerald-600">{formatCurrency(ord.computedCharge)}</span>
                      <span className="block text-3xs text-slate-400 font-normal">{ord.actualWeight}kg</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`badge ${getStatusBadge(ord.status)}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setNextStatus(
                            ord.status === 'ACCEPTED' ? 'PICKED_UP' :
                            ord.status === 'PICKED_UP' ? 'IN_TRANSIT' :
                            ord.status === 'IN_TRANSIT' ? 'OUT_FOR_DELIVERY' :
                            ord.status === 'OUT_FOR_DELIVERY' ? 'DELIVERED' : 'DELIVERED'
                          );
                        }}
                        className="btn-primary py-1.5 px-3 text-3xs font-bold"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rider Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Update Delivery Status</h3>
            <p className="text-xs text-slate-500">Consignment #{selectedOrder.id.slice(0, 8)}</p>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New Status
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="input-field font-bold"
                >
                  <option value="PICKED_UP">PICKED_UP (Collected from store/sender)</option>
                  <option value="IN_TRANSIT">IN_TRANSIT (In regional movement)</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Out for doorstep delivery)</option>
                  <option value="DELIVERED">DELIVERED (Handover completed)</option>
                  <option value="FAILED">FAILED (Doorstep delivery attempt failed)</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Notes / Handover Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Package collected with OTP"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 font-bold">
                  Save & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
