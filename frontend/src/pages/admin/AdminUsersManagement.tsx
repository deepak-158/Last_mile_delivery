import React, { useState, useEffect } from 'react';
import { userApi, agentApi } from '../../api/endpoints';
import { formatDate } from '../../utils/helpers';
import { Clock, ShieldCheck, Check } from 'lucide-react';

export default function AdminUsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'AGENT' | 'CUSTOMER' | 'ADMIN'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, aRes] = await Promise.all([
        userApi.getAll().catch(() => ({ data: [] })),
        agentApi.getAll().catch(() => ({ data: [] })),
      ]);
      setUsers(uRes.data || []);
      setAgents(aRes.data || []);
    } catch (err) {
      console.error('Failed to load users management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyAgent = async (agentId: string, approve: boolean) => {
    try {
      setActionLoading(agentId);
      await agentApi.verifyAgent(agentId, approve);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update verification status.');
    } finally {
      setActionLoading(null);
    }
  };

  const agentsMap = new Map(agents.map((a) => [a.userId || a.id, a]));

  const mergedUsers = users.map((u) => {
    const agentRecord = agentsMap.get(u.id);
    return {
      ...u,
      agent: agentRecord,
      isAgent: u.role === 'AGENT' || !!agentRecord,
      isVerified: agentRecord ? agentRecord.isVerified !== false : true,
    };
  });

  const pendingAgents = mergedUsers.filter((u) => u.isAgent && u.isVerified === false);

  const filteredUsers = mergedUsers.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.includes(search));

    if (!matchesSearch) return false;

    if (filterTab === 'PENDING') return u.isAgent && u.isVerified === false;
    if (filterTab === 'AGENT') return u.role === 'AGENT' || u.isAgent;
    if (filterTab === 'CUSTOMER') return u.role === 'CUSTOMER';
    if (filterTab === 'ADMIN') return u.role === 'ADMIN';

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Users & Courier Verification</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer profiles, review courier KYC credentials, and approve agents</p>
        </div>
      </div>

      {/* Pending Approval Banner */}
      {pendingAgents.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-amber-950">
                {pendingAgents.length} Courier Agent{pendingAgents.length > 1 ? 's' : ''} Awaiting Verification
              </h4>
              <p className="text-3xs text-amber-800 mt-0.5 font-medium">
                New delivery couriers cannot receive delivery assignments until approved by an Administrator.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterTab('PENDING')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-3xs shadow-sm transition-colors shrink-0"
          >
            Review Pending Agents ({pendingAgents.length})
          </button>
        </div>
      )}

      <div className="delivero-card overflow-hidden">
        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-3xs font-bold transition-all ${
                filterTab === 'ALL' ? 'bg-[#5046e4] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              onClick={() => setFilterTab('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-3xs font-bold transition-all flex items-center gap-1.5 ${
                filterTab === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              Pending Approvals ({pendingAgents.length})
            </button>
            <button
              onClick={() => setFilterTab('AGENT')}
              className={`px-3 py-1.5 rounded-xl text-3xs font-bold transition-all ${
                filterTab === 'AGENT' ? 'bg-[#5046e4] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Delivery Agents ({mergedUsers.filter((u) => u.isAgent).length})
            </button>
            <button
              onClick={() => setFilterTab('CUSTOMER')}
              className={`px-3 py-1.5 rounded-xl text-3xs font-bold transition-all ${
                filterTab === 'CUSTOMER' ? 'bg-[#5046e4] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Customers ({users.filter((u) => u.role === 'CUSTOMER').length})
            </button>
            <button
              onClick={() => setFilterTab('ADMIN')}
              className={`px-3 py-1.5 rounded-xl text-3xs font-bold transition-all ${
                filterTab === 'ADMIN' ? 'bg-[#5046e4] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Admins ({users.filter((u) => u.role === 'ADMIN').length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-3xs">
                <th className="py-3.5 px-6">User ID</th>
                <th className="py-3.5 px-6">User Info</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Phone</th>
                <th className="py-3.5 px-6">Courier / Vehicle Details</th>
                <th className="py-3.5 px-6">Status / Verification</th>
                <th className="py-3.5 px-6 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading users from database...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No users found for this filter.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAgent = u.isAgent;
                  const isPending = isAgent && u.isVerified === false;
                  const agentId = u.agent?.id || u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">#{u.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 block">{u.name || 'User'}</span>
                        <span className="text-3xs text-slate-400 font-mono">{u.email}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-3xs ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isAgent
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-indigo-50 text-[#5046e4] border border-indigo-200'
                        }`}>
                          {u.role || (isAgent ? 'AGENT' : 'CUSTOMER')}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600">{u.phone || 'N/A'}</td>
                      <td className="py-4 px-6">
                        {isAgent && u.agent ? (
                          <div>
                            <span className="font-semibold text-slate-800 block text-3xs">{u.agent.vehicleType || 'Two Wheeler'}</span>
                            <span className="font-mono text-3xs text-slate-400 block">{u.agent.vehicleNumber || 'Pending Reg'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-3xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isAgent ? (
                          isPending ? (
                            <span className="px-2.5 py-1 rounded-full text-3xs font-extrabold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Agent
                            </span>
                          )
                        ) : (
                          <span className="badge badge-active text-3xs font-bold">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={actionLoading === agentId}
                              onClick={() => handleVerifyAgent(agentId, true)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-3xs transition-colors shadow-sm inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> {actionLoading === agentId ? 'Saving...' : 'Approve'}
                            </button>
                            <button
                              disabled={actionLoading === agentId}
                              onClick={() => handleVerifyAgent(agentId, false)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-3xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : isAgent ? (
                          <span className="text-3xs text-emerald-600 font-bold">Verified</span>
                        ) : (
                          <span className="text-3xs text-slate-400">—</span>
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
