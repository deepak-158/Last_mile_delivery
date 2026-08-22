import React, { useState, useEffect } from 'react';
import { agentApi } from '../../api/endpoints';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    agentApi.getAll()
      .then((res) => setAgents(res.data || []))
      .catch((err) => console.error('Failed to load agents:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredAgents = agents.filter((ag) =>
    (ag.user?.name && ag.user.name.toLowerCase().includes(search.toLowerCase())) ||
    (ag.vehicleType && ag.vehicleType.toLowerCase().includes(search.toLowerCase())) ||
    (ag.vehicleNumber && ag.vehicleNumber.toLowerCase().includes(search.toLowerCase())) ||
    (ag.user?.phone && ag.user.phone.includes(search))
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Delivery Courier Fleet</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage registered courier agents, vehicle credentials, and dispatch readiness</p>
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
                <th className="py-3.5 px-6">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading couriers from database...</td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No courier agents registered in database.</td>
                </tr>
              ) : (
                filteredAgents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">#{ag.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{ag.user?.name}</td>
                    <td className="py-4 px-6 font-mono text-slate-600">{ag.user?.phone || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-800">{ag.vehicleType || 'Two Wheeler'}</span>
                      <span className="text-3xs text-slate-400 font-mono block mt-0.5">{ag.vehicleNumber || 'Pending Reg'}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {ag.currentZone?.name || 'All Operating Corridors'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`badge ${ag.isAvailable ? 'badge-active' : 'badge-offline'} text-3xs`}>
                        {ag.isAvailable ? '🟢 Online Dispatch' : '⚪ Offline'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
