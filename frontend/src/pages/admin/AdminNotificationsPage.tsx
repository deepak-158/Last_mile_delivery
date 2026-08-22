import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/endpoints';
import { formatDate, getOrderOrigin, getOrderDestination } from '../../utils/helpers';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll()
      .then((res) => {
        const orders = res.data || [];
        const dynamicNotifs: any[] = [];

        orders.forEach((o: any) => {
          const origin = getOrderOrigin(o);
          const dest = getOrderDestination(o);

          dynamicNotifs.push({
            id: `ord_${o.id}`,
            title: `Consignment #${o.id.slice(0, 8).toUpperCase()} placed (${origin} ➔ ${dest})`,
            category: 'Order',
            time: formatDate(o.createdAt),
            isUnread: o.status === 'PENDING',
            icon: '📦',
          });

          if (o.status === 'DELIVERED') {
            dynamicNotifs.push({
              id: `del_${o.id}`,
              title: `Consignment #${o.id.slice(0, 8).toUpperCase()} successfully delivered (${origin} ➔ ${dest})`,
              category: 'Payment',
              time: formatDate(o.updatedAt || o.createdAt),
              isUnread: false,
              icon: '✅',
            });
          }
        });

        setNotifications(dynamicNotifs);
      })
      .catch((err) => console.error('Failed to load notifications:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time alerts, consignment dispatch events, and transaction triggers</p>
        </div>
      </div>

      <div className="delivero-card overflow-hidden">
        {/* Notifications Feed */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <span className="inline-block w-5 h-5 border-2 border-[#5046e4] border-t-transparent rounded-full animate-spin mr-2" />
              Loading notifications from database...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No notifications recorded in database.</div>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 transition-colors ${
                  n.isUnread ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sm shadow-xs shrink-0">
                  {n.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                    <span className="text-3xs text-slate-400 font-mono shrink-0">{n.time}</span>
                  </div>
                  <span className="inline-block px-2 py-0.5 mt-1 rounded bg-slate-100 text-slate-600 text-3xs font-semibold">
                    {n.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
