import React, { useState, useEffect } from 'react';
import { orderApi, agentApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';
import { Zap, Bike } from 'lucide-react';

export default function AdminAssignmentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Unassigned' | 'Assigned'>('Unassigned');
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const [ordersRes, agentsRes] = await Promise.all([
        orderApi.getAll({ all: 'true' }),
        agentApi.getAll().catch(() => ({ data: [] })),
      ]);
      setOrders(ordersRes.data || []);
      setAgents(agentsRes.data || []);
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleManualAssign = async (orderId: string) => {
    if (!selectedAgentId) {
      alert('Please select an agent');
      return;
    }
    try {
      await agentApi.manualAssign(orderId, selectedAgentId);
      showMsg('Agent assigned successfully!');
      setAssigningOrderId(null);
      setSelectedAgentId('');
      fetchAssignments();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Assignment failed', 'error');
    }
  };

  const handleAutoAssign = async (orderId: string) => {
    try {
      const res = await agentApi.autoAssign(orderId);
      showMsg(`Auto-assigned to agent: ${res.data?.assignedAgent?.user?.name || 'Nearest Courier'}`);
      fetchAssignments();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'No available agent in zone', 'error');
    }
  };

  const handleBatchAutoAssign = async () => {
    const unassigned = orders.filter((o) => !o.assignedAgent && o.status !== 'DELIVERED' && o.status !== 'FAILED');
    if (unassigned.length === 0) {
      showMsg('All active orders are already assigned!', 'success');
      return;
    }
    let successCount = 0;
    for (const ord of unassigned) {
      try {
        await agentApi.autoAssign(ord.id);
        successCount++;
      } catch {}
    }
    showMsg(`Batch auto-assigned ${successCount} orders to nearest available agents!`);
    fetchAssignments();
  };

  const unassignedOrders = orders.filter((o) => !o.assignedAgent && o.status !== 'DELIVERED' && o.status !== 'FAILED');
  const assignedOrders = orders.filter((o) => o.assignedAgent);
  const displayOrders = activeTab === 'Unassigned' ? unassignedOrders : assignedOrders;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Consignment Dispatch & Assignments</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated spatial routing and manual courier dispatching</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchAutoAssign}
            className="btn-primary text-xs flex items-center gap-1.5 shadow-sm font-bold"
          >
            <Zap className="w-3.5 h-3.5" /> Batch Auto Assign All
          </button>
        </div>
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
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('Unassigned')}
            className={`pb-4 transition-all relative ${
              activeTab === 'Unassigned' ? 'text-[#5046e4]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Unassigned Queue ({unassignedOrders.length})
            {activeTab === 'Unassigned' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5046e4] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('Assigned')}
            className={`pb-4 transition-all relative ${
              activeTab === 'Assigned' ? 'text-[#5046e4]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Assigned In Dispatch ({assignedOrders.length})
            {activeTab === 'Assigned' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5046e4] rounded-full" />
            )}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-3xs">
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Pickup Zone / Area</th>
                <th className="py-3.5 px-6">Drop Destination</th>
                <th className="py-3.5 px-6">Fare / Weight</th>
                <th className="py-3.5 px-6">Assigned Agent</th>
                <th className="py-3.5 px-6 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <span className="inline-block w-6 h-6 border-2 border-[#5046e4] border-t-transparent rounded-full animate-spin mr-2" />
                    Loading dispatch queue...
                  </td>
                </tr>
              ) : displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No orders in this dispatch state.
                  </td>
                </tr>
              ) : (
                displayOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      #{ord.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {ord.receiverName || ord.user?.name || 'Customer'}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <p className="font-semibold text-slate-800">{ord.pickupCity}</p>
                      <p className="text-3xs text-slate-400">{ord.pickupAddress}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <p className="font-semibold text-slate-800">{ord.dropCity}</p>
                      <p className="text-3xs text-slate-400">{ord.dropAddress}</p>
                    </td>
                    <td className="py-4 px-6 font-mono">
                      <span className="font-bold text-slate-900">{formatCurrency(ord.computedCharge)}</span>
                      <span className="block text-3xs text-slate-400 font-normal">{ord.actualWeight}kg</span>
                    </td>
                    <td className="py-4 px-6">
                      {ord.assignedAgent ? (
                        <p className="font-bold text-[#5046e4] flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5" /> {ord.assignedAgent.user?.name}
                        </p>
                      ) : (
                        <span className="badge badge-pending text-3xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleAutoAssign(ord.id)}
                        className="px-2.5 py-1 rounded bg-[#5046e4]/10 hover:bg-[#5046e4]/20 text-[#5046e4] font-bold text-3xs inline-flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" /> Auto
                      </button>
                      <button
                        onClick={() => setAssigningOrderId(ord.id)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-3xs"
                      >
                        Manual Assign
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Modal */}
      {assigningOrderId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Manually Assign Courier Agent</h3>
            <p className="text-xs text-slate-500">Choose courier partner for Order #{assigningOrderId.slice(0, 8)}:</p>

            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="input-field"
            >
              <option value="">-- Choose Courier Agent --</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.user?.name} {ag.isAvailable ? '(Available)' : '(Busy)'} - {ag.currentZone?.name || 'All Zones'}
                </option>
              ))}
            </select>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setAssigningOrderId(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={() => handleManualAssign(assigningOrderId)} className="btn-primary flex-1 font-bold">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
