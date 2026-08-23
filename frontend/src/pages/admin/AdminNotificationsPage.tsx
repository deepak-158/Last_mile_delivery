import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { notificationService, NotificationItem } from '../../services/notificationService';
import { fcmService } from '../../services/fcmService';
import { smsService } from '../../services/smsService';
import { emailService } from '../../services/emailService';
import { formatDate } from '../../utils/helpers';

interface GroupedNotification {
  groupKey: string;
  ids: string[];
  type: string;
  subject?: string;
  body?: string;
  orderId?: string;
  channel: string;
  createdAt: string;
  recipientUserIds: string[];
}

export default function AdminNotificationsPage() {
  const [rawNotifications, setRawNotifications] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ORDER' | 'SYSTEM' | 'ADMIN'>('ALL');

  // Compose State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [targetType, setTargetType] = useState<'USER' | 'AGENT' | 'CUSTOMER' | 'ALL'>('USER');
  const [dispatchChannel, setDispatchChannel] = useState<'PUSH_AND_IN_APP' | 'SMS_TWILIO' | 'EMAIL_GMAIL' | 'OMNICHANNEL'>('PUSH_AND_IN_APP');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Real-time Firestore notifications stream
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem));
        setRawNotifications(notifs);
        setLoading(false);
      },
      (err) => {
        console.error('Error in notifications snapshot:', err);
        setLoading(false);
      }
    );

    // Realtime listener for users to always have fresh phone numbers
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const uList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(uList);
    });

    return () => {
      unsubscribe();
      unsubUsers();
    };
  }, []);

  const usersMap = useMemo(() => {
    const map = new Map<string, any>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  // Group multiple broadcast notifications into a single deduplicated entry for Admin view
  const groupedNotifications = useMemo(() => {
    const groups: GroupedNotification[] = [];
    const groupMap = new Map<string, GroupedNotification>();

    rawNotifications.forEach((n) => {
      // Group key based on subject, body, orderId, type, and rounded timestamp (within same 10 seconds)
      const timeBucket = n.createdAt ? n.createdAt.slice(0, 16) : 'recent'; // down to the minute
      const key = `${n.type}_${n.subject || ''}_${n.body || ''}_${n.orderId || ''}_${timeBucket}`;

      if (groupMap.has(key)) {
        const existing = groupMap.get(key)!;
        existing.ids.push(n.id);
        if (!existing.recipientUserIds.includes(n.userId)) {
          existing.recipientUserIds.push(n.userId);
        }
      } else {
        const item: GroupedNotification = {
          groupKey: key,
          ids: [n.id],
          type: n.type || 'NOTIFICATION',
          subject: n.subject,
          body: n.body,
          orderId: n.orderId,
          channel: n.channel || 'PUSH_AND_IN_APP',
          createdAt: n.createdAt,
          recipientUserIds: [n.userId],
        };
        groupMap.set(key, item);
        groups.push(item);
      }
    });

    return groups;
  }, [rawNotifications]);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      showMsg('Please provide both notification title and body.', 'error');
      return;
    }

    setSending(true);
    try {
      if (targetType === 'USER') {
        if (!selectedUserId) {
          showMsg('Please select a specific recipient user.', 'error');
          setSending(false);
          return;
        }

        const targetUser = usersMap.get(selectedUserId);

        // 1. In-App / Push Notification
        if (dispatchChannel === 'PUSH_AND_IN_APP' || dispatchChannel === 'OMNICHANNEL') {
          await notificationService.sendNotification({
            userId: selectedUserId,
            subject,
            body,
            type: 'ADMIN_DIRECT_MESSAGE',
            channel: dispatchChannel,
          });
        }

        // 2. Twilio SMS
        if (dispatchChannel === 'SMS_TWILIO' || dispatchChannel === 'OMNICHANNEL') {
          const targetPhone = targetUser?.phone || '';
          if (targetPhone) {
            await smsService.sendSMS({
              to: targetPhone,
              body: `${subject}: ${body}`,
              type: 'CUSTOM',
            });
          }
        }

        // 3. Email Notification (Gmail Gateway)
        if (dispatchChannel === 'EMAIL_GMAIL' || dispatchChannel === 'OMNICHANNEL') {
          const targetEmail = targetUser?.email || '';
          if (targetEmail) {
            await emailService.sendEmail({
              to: targetEmail,
              subject,
              htmlBody: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;"><h2 style="color: #5046e4;">${subject}</h2><p style="font-size: 14px; line-height: 1.6;">${body}</p><hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" /><p style="font-size: 11px; color: #94a3b8;">Delivero Logistics Express Notification</p></div>`,
              type: 'ADMIN_BROADCAST',
            });
          }
        }

        showMsg(`Dispatched successfully via ${dispatchChannel}.`);
      } else {
        // Broadcast
        const count = await notificationService.sendToRole(targetType, {
          subject,
          body,
          type: 'ADMIN_BROADCAST',
        });

        // Filter target users for omnichannel delivery
        const targetUsers = users.filter((u) => {
          const r = (u.role || 'CUSTOMER').toUpperCase();
          if (targetType === 'ALL') return true;
          if (targetType === 'CUSTOMER') return r === 'CUSTOMER' || r === 'USER';
          if (targetType === 'AGENT') return r === 'AGENT';
          return false;
        });

        if (dispatchChannel === 'SMS_TWILIO' || dispatchChannel === 'OMNICHANNEL') {
          for (const u of targetUsers) {
            if (u.phone) {
              await smsService.sendSMS({
                to: u.phone,
                body: `${subject}: ${body}`,
                type: 'CUSTOM',
              }).catch(() => {});
            }
          }
        }

        if (dispatchChannel === 'EMAIL_GMAIL' || dispatchChannel === 'OMNICHANNEL') {
          for (const u of targetUsers) {
            if (u.email) {
              await emailService.sendEmail({
                to: u.email,
                subject,
                htmlBody: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;"><h2 style="color: #5046e4;">${subject}</h2><p style="font-size: 14px; line-height: 1.6;">${body}</p><hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" /><p style="font-size: 11px; color: #94a3b8;">Delivero Logistics Express Announcement</p></div>`,
                type: 'ADMIN_BROADCAST',
              }).catch(() => {});
            }
          }
        }

        showMsg(`Broadcast dispatched via ${dispatchChannel} to ${count} active accounts.`);
      }

      setShowComposeModal(false);
      setSubject('');
      setBody('');
      setSubject('');
      setBody('');
    } catch (err: any) {
      showMsg(err?.message || 'Failed to dispatch push notification.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleClearAll = async () => {
    if (rawNotifications.length === 0) return;
    if (!confirm('Are you sure you want to clear all notifications across the system?')) return;

    setClearing(true);
    try {
      await notificationService.clearAllNotifications();
      showMsg('All system notifications cleared successfully.');
    } catch (err) {
      showMsg('Failed to clear notifications.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteGroup = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => notificationService.deleteNotification(id)));
      showMsg('Notification log deleted.');
    } catch {
      showMsg('Failed to delete notification.', 'error');
    }
  };

  const handleTestFCM = () => {
    fcmService.triggerLocalAlert(
      '⚡ Live FCM Dispatch Alert!',
      'New high-priority express consignment auto-dispatched to Courier Fleet in South Zone.'
    );
  };

  const getRecipientSummary = (userIds: string[]) => {
    if (userIds.length === 1) {
      const u = usersMap.get(userIds[0]);
      return u ? `${u.name || 'User'} (${u.email || u.id.slice(0, 8)})` : `User ${userIds[0].slice(0, 10)}...`;
    }
    return `Broadcast to ${userIds.length} Recipients`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🔔</span> System Notifications & FCM Dispatch
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Admin console for dispatching targeted push messages and auditing system events
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTestFCM}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>🔊</span> Test Sound
          </button>

          {rawNotifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 shadow-xs"
            >
              <span>🗑️</span> {clearing ? 'Clearing...' : 'Clear All Logs'}
            </button>
          )}

          <button
            onClick={() => setShowComposeModal(true)}
            className="btn-primary text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>✉️</span> Send Push Message
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold animate-slide-down ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Real-time Notifications Feed */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">
            Live System Notifications ({groupedNotifications.length})
          </h3>
          <span className="text-3xs font-mono font-bold text-emerald-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Firestore Listener
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              <span className="inline-block w-6 h-6 border-2 border-[#5046e4] border-t-transparent rounded-full animate-spin mr-2" />
              Loading real-time notifications from Firestore...
            </div>
          ) : groupedNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              <div className="text-4xl mb-2">📭</div>
              <p className="font-bold text-slate-700 text-sm">No notifications recorded</p>
              <p className="text-2xs text-slate-400 mt-1">Try sending a push message using the button above!</p>
            </div>
          ) : (
            groupedNotifications.map((n) => (
              <div
                key={n.groupKey}
                className="p-5 flex items-start gap-4 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                  {n.type === 'AGENT_DISPATCH'
                    ? '🛵'
                    : n.type === 'ORDER_PLACED'
                    ? '📦'
                    : n.type === 'VERIFICATION_UPDATE'
                    ? '🎉'
                    : n.type === 'ADMIN_DIRECT_MESSAGE' || n.type === 'ADMIN_BROADCAST'
                    ? '✉️'
                    : '🔔'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-900 truncate">
                      {n.subject || 'Logistics Notification'}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-3xs text-slate-400 font-mono">
                        {formatDate(n.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDeleteGroup(n.ids)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-all rounded cursor-pointer"
                        title="Delete notification log"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="text-2xs text-slate-600 mt-1.5 font-medium leading-relaxed">
                    {n.body}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-3xs font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      Target: {getRecipientSummary(n.recipientUserIds)}
                    </span>
                    {n.orderId && (
                      <span className="text-3xs font-mono px-2 py-0.5 rounded-lg bg-indigo-50 text-[#5046e4] font-bold border border-indigo-100">
                        Order #{n.orderId.slice(0, 8)}
                      </span>
                    )}
                    <span className="text-3xs font-extrabold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">
                      {n.channel}
                    </span>
                    {n.ids.length > 1 && (
                      <span className="text-3xs font-extrabold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                        {n.ids.length} Delivered Instances
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Notification Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scale-up text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>✉️</span> Compose Targeted Push Notification
              </h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Target Audience
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                  >
                    <option value="USER">🎯 Specific User</option>
                    <option value="CUSTOMER">👤 All Customers</option>
                    <option value="AGENT">🛵 All Agents (Fleet)</option>
                    <option value="ALL">📢 Global Broadcast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Delivery Channel
                  </label>
                  <select
                    value={dispatchChannel}
                    onChange={(e) => setDispatchChannel(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                  >
                    <option value="PUSH_AND_IN_APP">🔔 Push & In-App (FCM)</option>
                    <option value="SMS_TWILIO">📱 SMS (Twilio Gateway)</option>
                    <option value="EMAIL_GMAIL">📧 Email (Gmail Gateway)</option>
                    <option value="OMNICHANNEL">🌐 Omnichannel (Push + SMS + Email)</option>
                  </select>
                </div>
              </div>

              {targetType === 'USER' && (
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Select Recipient Account
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                  >
                    <option value="">-- Choose User --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || 'User'} ({u.email || u.id}) • [{(u.role || 'CUSTOMER').toUpperCase()}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Notification Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Holiday Surcharge or Delivery Route Update"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  placeholder="Type your message to be pushed with instant audio chime..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  {sending ? 'Sending Push...' : '🚀 Send Push & Sound Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
