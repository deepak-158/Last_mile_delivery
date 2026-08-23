import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { fcmService, PushNotificationPayload, playNotificationChime } from '../services/fcmService';
import { useAuth } from '../contexts/AuthContext';

export default function FCMNotificationHandler() {
  const { user } = useAuth();
  const [activeToast, setActiveToast] = useState<PushNotificationPayload | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [enabling, setEnabling] = useState(false);
  const [showBellMenu, setShowBellMenu] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // 1. Listen to foreground FCM and internal dispatch events
  useEffect(() => {
    const unsubscribe = fcmService.listenForegroundMessages((payload) => {
      setActiveToast(payload);
      playNotificationChime();
      setTimeout(() => {
        setActiveToast(null);
      }, 6000);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Real-time Firestore live notification listener STRICTLY for current logged in user
  useEffect(() => {
    const currentUserId = user?.id;
    if (!currentUserId) return;

    let isInitialLoad = true;
    const q = query(collection(db, 'notifications'), where('userId', '==', currentUserId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return; // Skip past notifications on load
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          fcmService.triggerLocalAlert(
            data.subject || 'Delivero Live Update',
            data.body || 'New logistics update recorded',
            data.orderId
          );
        }
      });
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleEnablePush = async () => {
    setEnabling(true);
    try {
      const token = await fcmService.requestPermissionAndGetToken();
      const currentPerm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
      setPermissionState(currentPerm);

      fcmService.triggerLocalAlert(
        '🔔 Push & Audio Alerts Activated!',
        'You will now receive live dispatch audio chimes and delivery status notifications in real time.'
      );
    } catch (err) {
      console.error('Failed to enable push:', err);
    } finally {
      setEnabling(false);
    }
  };

  const handleTestChimeAndPush = () => {
    fcmService.triggerLocalAlert(
      '⚡ Delivero Dispatch Alert (FCM Sound Test)',
      'High-priority express parcel #LM839210 auto-dispatched to your delivery queue!'
    );
  };

  return (
    <>
      {/* 1. Top Push Permission Banner */}
      {user && permissionState === 'default' && !dismissedBanner && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white px-4 py-2.5 text-xs shadow-md flex items-center justify-between gap-4 z-40 border-b border-indigo-700">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base animate-bounce">🔔</span>
            <span>
              <strong className="font-bold text-amber-300">Enable FCM Push & Audio Chimes:</strong> Get instant delivery sound alerts and real-time status updates!
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEnablePush}
              disabled={enabling}
              className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-3xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              {enabling ? 'Enabling...' : 'Turn On Push'}
            </button>
            <button
              onClick={() => setDismissedBanner(true)}
              className="text-indigo-300 hover:text-white text-xs px-1.5 py-0.5"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Live Notification Toast with Audio Chime */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/40 animate-slide-down">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shrink-0 border border-indigo-500/30">
              🛵
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black text-amber-400 truncate tracking-tight">
                  {activeToast.title}
                </h4>
                <button
                  onClick={() => setActiveToast(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-2xs text-slate-200 mt-1 font-medium leading-relaxed">
                {activeToast.body}
              </p>
              {activeToast.orderId && (
                <span className="inline-block mt-2 font-mono text-3xs px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 font-bold border border-indigo-800">
                  Consignment: #{activeToast.orderId.slice(0, 8)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating Quick FCM Bell Button & Test Menu (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        {showBellMenu && (
          <div className="mb-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-slide-down text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🔔</span> FCM Live Push Alerts
              </span>
              <button
                onClick={() => setShowBellMenu(false)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-2xs">
                <span className="text-slate-500 font-medium">Browser Push Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  permissionState === 'granted'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {permissionState === 'granted' ? '🟢 Active' : '🟡 Needs Permission'}
                </span>
              </div>

              {permissionState !== 'granted' && (
                <button
                  onClick={handleEnablePush}
                  disabled={enabling}
                  className="w-full py-2 px-3 rounded-xl bg-[#5046e4] hover:bg-[#4338ca] text-white text-xs font-bold transition-all shadow-sm"
                >
                  {enabling ? 'Enabling...' : 'Enable Browser Push Alerts'}
                </button>
              )}

              <button
                onClick={handleTestChimeAndPush}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🔊</span> Play Audio Chime & Test Toast
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setShowBellMenu(!showBellMenu);
            handleTestChimeAndPush();
          }}
          className="w-12 h-12 rounded-full bg-[#5046e4] hover:bg-[#4338ca] text-white shadow-xl flex items-center justify-center text-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-white"
          title="Click to Test Sound Chime & FCM Alert"
        >
          🔔
        </button>
      </div>
    </>
  );
}
