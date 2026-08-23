import React, { useState, useEffect } from 'react';
import { agentApi } from '../../api/endpoints';
import { Truck, Clock, CheckCircle2, Check } from 'lucide-react';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAgents = () => {
    setLoading(true);
    agentApi.getAll()
      .then((res) => setAgents(res.data || []))
      .catch((err) => console.error('Failed to load agents:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleVerify = async (agentId: string, approve: boolean) => {
    try {
      setActionLoading(agentId);
      await agentApi.verifyAgent(agentId, approve);
      fetchAgents();
    } catch (err: any) {
      alert(err?.message || 'Failed to update agent verification status.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAgents = agents.filter((ag) =>
    (ag.user?.name && ag.user.name.toLowerCase().includes(search.toLowerCase())) ||
    (ag.vehicleType && ag.vehicleType.toLowerCase().includes(search.toLowerCase())) ||
    (ag.vehicleNumber && ag.vehicleNumber.toLowerCase().includes(search.toLowerCase())) ||
    (ag.user?.phone && ag.user.phone.includes(search))
  );

  const pendingCount = agents.filter((a) => a.isVerified === false).length;
  const verifiedCount = agents.filter((a) => a.isVerified !== false).length;
  const onlineCount = agents.filter((a) => a.isAvailable).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Delivery Courier Fleet & Verification</h1>
          <p className="text-xs text-slate-500 mt-0.5">Review pending agent applications, verify KYC vehicle credentials, and dispatch readiness</p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="delivero-card p-4 flex items-center justify-between">
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Total Couriers</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{agents.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5046e4] flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="delivero-card p-4 flex items-center justify-between border-amber-100 bg-amber-50/20">
          <div>
            <span className="text-2xs font-bold text-amber-700 uppercase tracking-wider block">Pending Approval</span>
            <span className="text-2xl font-black text-amber-600 mt-0.5 block">{pendingCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="delivero-card p-4 flex items-center justify-between">
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Online & Ready</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{onlineCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="delivero-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search by courier name, phone, or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-72"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-3xs">
                <th className="py-3.5 px-6">Agent ID</th>
                <th className="py-3.5 px-6">Courier Name</th>
                <th className="py-3.5 px-6">Phone</th>
                <th className="py-3.5 px-6">Vehicle Details</th>
                <th className="py-3.5 px-6">Assigned Zone</th>
                <th className="py-3.5 px-6">Verification Status</th>
                <th className="py-3.5 px-6 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading couriers from database...</td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No courier agents registered in database.</td>
                </tr>
              ) : (
                filteredAgents.map((ag) => {
                  const isPending = ag.isVerified === false;
                  return (
                    <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">#{ag.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 block">{ag.user?.name || 'Agent'}</span>
                        <span className="text-3xs text-slate-400 font-mono">{ag.user?.email}</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600">{ag.user?.phone || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800">{ag.vehicleType || 'Two Wheeler'}</span>
                        <span className="text-3xs text-slate-400 font-mono block mt-0.5">{ag.vehicleNumber || 'Pending Reg'}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {ag.currentZone?.name || 'All Operating Corridors'}
                      </td>
                      <td className="py-4 px-6">
                        {ag.isVerified === false ? (
                          <span className="px-2.5 py-1 rounded-full text-3xs font-extrabold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Courier
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={actionLoading === ag.id}
                              onClick={() => handleVerify(ag.id, true)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-3xs transition-colors shadow-sm inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> {actionLoading === ag.id ? 'Processing...' : 'Approve & Activate'}
                            </button>
                            <button
                              disabled={actionLoading === ag.id}
                              onClick={() => handleVerify(ag.id, false)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-3xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-3xs text-slate-400 font-medium">Authorized</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
