import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService, NotificationItem } from '../../services/notificationService';
import { formatDate } from '../../utils/helpers';
import { fcmService } from '../../services/fcmService';
import {
  Bell,
  Volume2,
  Trash2,
  Package,
  Bike,
  Megaphone,
  Inbox,
  Sparkles,
  Mail,
} from 'lucide-react';

export default function UserNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ORDERS' | 'DISPATCHES' | 'ALERTS'>('ALL');
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentUserId = user?.id || (user as any)?.uid;

  useEffect(() => {
    if (!currentUserId) return;
    setLoading(true);

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUserId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem));
        notifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setNotifications(notifs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user notifications:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  const handleTestChime = () => {
    fcmService.triggerLocalAlert(
      'Test Notification Chime',
      'This is a sample audio and push test alert for your account.'
    );
  };

  const handleClearAll = async () => {
    if (!currentUserId || notifications.length === 0) return;
    if (!confirm('Are you sure you want to delete all your notifications?')) return;

    setClearing(true);
    try {
      await notificationService.clearUserNotifications(currentUserId);
    } catch (err) {
      alert('Failed to clear notifications.');
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      alert('Failed to delete notification.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ORDERS') return n.type === 'ORDER_PLACED' || n.type === 'STATUS_CHANGE';
    if (activeFilter === 'DISPATCHES') return n.type === 'AGENT_DISPATCH';
    if (activeFilter === 'ALERTS') return n.type === 'ADMIN_DIRECT_MESSAGE' || n.type === 'ADMIN_BROADCAST';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#5046e4]" /> My Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time delivery milestones, parcel dispatches, and personal updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestChime}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Volume2 className="w-4 h-4" /> Test Sound
          </button>

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 shadow-xs"
            >
              <Trash2 className="w-4 h-4" /> {clearing ? 'Clearing...' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: `All (${notifications.length})`, icon: null },
          { id: 'ORDERS', label: 'Orders', icon: Package },
          { id: 'DISPATCHES', label: 'Dispatches', icon: Bike },
          { id: 'ALERTS', label: 'Admin Messages', icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-[#5046e4] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications Feed */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">
            Inbox ({filteredNotifs.length})
          </h3>
          <span className="text-3xs font-mono font-bold text-emerald-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              <span className="inline-block w-6 h-6 border-2 border-[#5046e4] border-t-transparent rounded-full animate-spin mr-2" />
              Loading your notifications...
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              <Inbox className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
              <p className="font-bold text-slate-700 text-sm">No notifications found</p>
              <p className="text-2xs text-slate-400 mt-1 max-w-sm mx-auto">
                When new parcel updates or assignments are dispatched, they will appear here with live audio alerts.
              </p>
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                className="p-5 flex items-start gap-4 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                  {n.type === 'AGENT_DISPATCH' ? (
                    <Bike className="w-5 h-5 text-indigo-600" />
                  ) : n.type === 'ORDER_PLACED' ? (
                    <Package className="w-5 h-5 text-indigo-600" />
                  ) : n.type === 'VERIFICATION_UPDATE' ? (
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  ) : n.type === 'ADMIN_DIRECT_MESSAGE' ? (
                    <Mail className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Bell className="w-5 h-5 text-indigo-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-900 truncate">
                      {n.subject || 'Delivery Update'}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-3xs text-slate-400 font-mono">
                        {formatDate(n.createdAt)}
                      </span>
                      <button
                        onClick={(e) => handleDeleteOne(n.id, e)}
                        disabled={deletingId === n.id}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-all rounded"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-2xs text-slate-600 mt-1.5 font-medium leading-relaxed">
                    {n.body}
                  </p>

                  <div className="flex items-center gap-2 mt-2.5">
                    {n.orderId && (
                      <span className="text-3xs font-mono px-2 py-0.5 rounded-lg bg-indigo-50 text-[#5046e4] font-bold border border-indigo-100">
                        Consignment #{n.orderId.slice(0, 8)}
                      </span>
                    )}
                    <span className="text-3xs font-extrabold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">
                      {n.channel || 'PUSH_AND_IN_APP'}
                    </span>
                    {n.type?.startsWith('ADMIN') && (
                      <span className="text-3xs font-extrabold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700">
                        From Delivero Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
