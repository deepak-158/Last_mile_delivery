import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, getFCM } from '../config/firebase';

export interface NotificationItem {
  id: string;
  orderId?: string;
  userId: string;
  type: string;
  channel: string;
  status: string;
  subject?: string;
  body?: string;
  createdAt: string;
}

export const notificationService = {
  /**
   * Request browser push permission & log notification to Firestore
   */
  async requestPushPermission(): Promise<string | null> {
    try {
      if ('Notification' in window && Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          console.log('Browser notification permission granted.');
        }
      }
      const messaging = await getFCM();
      return messaging ? 'fcm_enabled' : null;
    } catch {
      return null;
    }
  },

  /**
   * Send targeted in-app & push notification to a specific user
   */
  async sendNotification(data: {
    userId: string;
    orderId?: string;
    type: string;
    channel?: string;
    subject?: string;
    body?: string;
  }): Promise<void> {
    if (!data.userId) return;

    try {
      // Build clean document without any undefined fields
      const cleanDoc: Record<string, any> = {
        userId: data.userId,
        type: data.type || 'NOTIFICATION',
        channel: data.channel || 'PUSH_AND_IN_APP',
        status: 'SENT',
        subject: data.subject || 'Delivero Notification',
        body: data.body || '',
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        serverCreatedAt: serverTimestamp(),
      };

      if (data.orderId) {
        cleanDoc.orderId = data.orderId;
      }

      // 1. Persist in Firestore notifications collection (targeted to recipient userId)
      await addDoc(collection(db, 'notifications'), cleanDoc);

      // 2. If sending to the currently logged in user, trigger local sound chime immediately
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === data.userId) {
        try {
          const { fcmService } = await import('./fcmService');
          fcmService.triggerLocalAlert(
            data.subject || 'Delivero Dispatch Alert',
            data.body || 'New logistics update received',
            data.orderId
          );
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Failed to record targeted notification:', err);
    }
  },

  /**
   * Send notification to multiple target users
   */
  async sendToUsers(
    userIds: string[],
    payload: { subject: string; body: string; type?: string; orderId?: string }
  ): Promise<number> {
    let count = 0;
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    for (const uid of uniqueIds) {
      try {
        const notifData: any = {
          userId: uid,
          subject: payload.subject,
          body: payload.body,
          type: payload.type || 'ADMIN_BROADCAST',
        };
        if (payload.orderId) {
          notifData.orderId = payload.orderId;
        }

        await this.sendNotification(notifData);
        count++;
      } catch (err) {
        console.warn(`Failed to notify user ${uid}:`, err);
      }
    }
    return count;
  },

  /**
   * Broadcast message to users filtered by role ('AGENT', 'CUSTOMER', or 'ALL')
   */
  async sendToRole(
    targetRole: 'AGENT' | 'CUSTOMER' | 'ALL',
    payload: { subject: string; body: string; type?: string; orderId?: string }
  ): Promise<number> {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let targetUserIds: string[] = [];

      usersSnap.docs.forEach((docSnap) => {
        const u = docSnap.data();
        const docId = docSnap.id;
        const role = (u.role || 'CUSTOMER').toUpperCase();
        if (targetRole === 'ALL') {
          targetUserIds.push(docId);
        } else if (targetRole === 'CUSTOMER' && (role === 'CUSTOMER' || role === 'USER')) {
          targetUserIds.push(docId);
        } else if (targetRole === 'AGENT' && role === 'AGENT') {
          targetUserIds.push(docId);
        }
      });

      return await this.sendToUsers(targetUserIds, payload);
    } catch (err) {
      console.error('Failed to broadcast to role:', err);
      return 0;
    }
  },

  /**
   * Delete single notification by ID
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  },

  /**
   * Clear all notifications for a specific user
   */
  async clearUserNotifications(userId: string): Promise<void> {
    try {
      const snap = await getDocs(
        query(collection(db, 'notifications'), where('userId', '==', userId))
      );
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to clear user notifications:', err);
      throw err;
    }
  },

  /**
   * Clear all notifications in system (Admin only)
   */
  async clearAllNotifications(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      throw err;
    }
  },

  /**
   * Fetch notifications for current user
   */
  async getMyNotifications(): Promise<NotificationItem[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const snap = await getDocs(
        query(collection(db, 'notifications'), where('userId', '==', user.uid))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return list;
    } catch {
      return [];
    }
  },

  /**
   * Fetch all notifications for Admin
   */
  async getAll(): Promise<NotificationItem[]> {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return list;
    } catch {
      return [];
    }
  },
};
