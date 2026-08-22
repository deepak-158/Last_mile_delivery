import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/endpoints';
import { formatDate } from '../../utils/helpers';

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll()
      .then((res) => {
        const orders = res.data || [];
        const extractedLogs: any[] = [];

        orders.forEach((o: any) => {
          if (o.statusHistory && Array.isArray(o.statusHistory)) {
            o.statusHistory.forEach((h: any) => {
              extractedLogs.push({
                id: h.id || o.id,
                orderId: o.id,
                actor: 'System / Operator',
                action: `Status transitioned to ${h.status}`,
                module: 'Order Engine',
                notes: h.notes || 'Automated lifecycle event',
                timestamp: h.timestamp || o.createdAt,
              });
            });
          } else {
            extractedLogs.push({
              id: o.id,
              orderId: o.id,
              actor: o.user?.name || 'Customer',
              action: `Created consignment in ${o.pickupCity}`,
              module: 'Order Placement',
              notes: `${o.orderType} • ${o.actualWeight}kg`,
              timestamp: o.createdAt,
            });
          }
        });

        setLogs(extractedLogs);
      })
      .catch((err) => console.error('Failed to load activity logs:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Activity Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">Immutable audit trail of order events, courier dispatches, and overrides</p>
        </div>
      </div>

      <div className="delivero-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-3xs">
                <th className="py-3.5 px-6">Event ID</th>
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-6">Actor</th>
                <th className="py-3.5 px-6">Lifecycle Action</th>
                <th className="py-3.5 px-6">Module</th>
                <th className="py-3.5 px-6">Details / Notes</th>
                <th className="py-3.5 px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading immutable audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No activity logged in database yet.</td>
                </tr>
              ) : (
                logs.slice(0, 15).map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">#{log.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-4 px-6 font-mono font-bold text-[#5046e4]">#{log.orderId.slice(0, 8).toUpperCase()}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{log.actor}</td>
                    <td className="py-4 px-6 text-slate-800 font-semibold">{log.action}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-3xs">{log.module}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-3xs">{log.notes}</td>
                    <td className="py-4 px-6 text-right text-slate-400 text-3xs font-mono">{formatDate(log.timestamp)}</td>
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
