import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();

// Authorized Admin Google Accounts
export const ALLOWED_ADMIN_EMAILS = [
  'admin@lastmile.dev',
  'deepakshukla1508.i@gmail.com',
  'dipakshukla158@gmail.com',
];

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN';
  phone?: string;
  walletBalance?: number;
  isNewUser?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export const authService = {
  /**
   * Log in or register user using Google Sign-In with Admin whitelist verification
   */
  async signInWithGoogle(defaultRole: 'CUSTOMER' | 'AGENT' | 'ADMIN' = 'CUSTOMER'): Promise<{ user: UserProfile; token: string; isNewUser: boolean }> {
    const cred = await signInWithPopup(auth, googleProvider);
    const token = await cred.user.getIdToken();
    const uid = cred.user.uid;
    const email = (cred.user.email || '').toLowerCase().trim();
    const name = cred.user.displayName || email.split('@')[0] || 'User';

    // Check if user profile already exists in Firestore
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    // Check if email belongs to authorized Admin whitelist
    const isWhitelistedAdmin = ALLOWED_ADMIN_EMAILS.some((e) => e.toLowerCase() === email);

    let isNewUser = false;
    let profile: UserProfile;

    if (snap.exists()) {
      const data = snap.data();
      const existingRole = (isWhitelistedAdmin ? 'ADMIN' : (data.role || defaultRole)).toUpperCase() as 'CUSTOMER' | 'AGENT' | 'ADMIN';

      // Verify Admin whitelist if trying to access admin
      if (defaultRole === 'ADMIN' || existingRole === 'ADMIN') {
        if (!isWhitelistedAdmin && data.role !== 'ADMIN') {
          await signOut(auth);
          throw new Error(`Access Denied: Google account (${email}) is not authorized for System Administrator access.`);
        }
      }

      profile = {
        id: uid,
        email: data.email || email,
        name: data.name || name,
        role: isWhitelistedAdmin ? 'ADMIN' : existingRole,
        phone: data.phone || cred.user.phoneNumber || '',
        walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : 5000,
        isNewUser: false, // Existing user or Admin never needs onboarding
      };
    } else {
      // New Google User
      const finalRole = isWhitelistedAdmin ? 'ADMIN' : defaultRole;

      // Restrict Admin registration via Google to whitelisted emails only
      if (defaultRole === 'ADMIN' && !isWhitelistedAdmin) {
        await signOut(auth);
        throw new Error(`Access Denied: Google account (${email}) is not authorized for System Administrator access.`);
      }

      // If Admin, bypass onboarding completely
      isNewUser = isWhitelistedAdmin ? false : true;

      profile = {
        id: uid,
        email,
        name,
        role: finalRole,
        phone: cred.user.phoneNumber || '',
        walletBalance: 5000,
        isNewUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(userRef, {
        ...profile,
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      });

      // If Agent, create initial pending verification agent record
      if (finalRole === 'AGENT') {
        await setDoc(doc(db, 'agents', uid), {
          id: uid,
          userId: uid,
          vehicleType: 'Two Wheeler / Motorcycle',
          vehicleNumber: 'Pending Verification',
          currentZoneId: 'zone-north-zone',
          latitude: 28.6139,
          longitude: 77.2090,
          isVerified: false, // Requires Admin verification!
          verificationStatus: 'PENDING_APPROVAL',
          isAvailable: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(profile));

    return { user: profile, token, isNewUser };
  },

  /**
   * Complete detailed user registration / onboarding
   */
  async completeOnboarding(uid: string, data: {
    name?: string;
    phone: string;
    role: 'CUSTOMER' | 'AGENT';
    vehicleType?: string;
    vehicleNumber?: string;
    zoneId?: string;
    city?: string;
    state?: string;
  }): Promise<UserProfile> {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      name: data.name,
      phone: data.phone,
      role: data.role,
      city: data.city || '',
      state: data.state || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    if (data.role === 'AGENT') {
      await setDoc(doc(db, 'agents', uid), {
        id: uid,
        userId: uid,
        vehicleType: data.vehicleType || 'Two Wheeler / Motorcycle',
        vehicleNumber: data.vehicleNumber || 'Pending Verification',
        currentZoneId: data.zoneId || 'zone-north-zone',
        isVerified: false, // Requires admin approval
        verificationStatus: 'PENDING_APPROVAL',
        isAvailable: false,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    const updatedProfile = await this.getUserProfile(uid);
    localStorage.setItem('user', JSON.stringify(updatedProfile));
    return updatedProfile;
  },

  /**
   * Log in user using Firebase Authentication and fetch their Firestore profile
   */
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const token = await cred.user.getIdToken();
    const profile = await this.getUserProfile(cred.user.uid, cred.user.email || email);

    // Cache to localStorage for fast initial render
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(profile));

    return { user: profile, token };
  },

  /**
   * Register a new user with Firebase Authentication and create their Firestore profile
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'CUSTOMER' | 'AGENT' | 'ADMIN';
    vehicleType?: string;
    vehicleNumber?: string;
    zoneId?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const role = data.role || 'CUSTOMER';

    // Restrict Admin registration to whitelisted emails
    if (role === 'ADMIN') {
      const email = data.email.toLowerCase().trim();
      const isWhitelisted = ALLOWED_ADMIN_EMAILS.some((e) => e.toLowerCase() === email);
      if (!isWhitelisted) {
        throw new Error(`Registration Denied: Email (${data.email}) is not on the authorized Administrator whitelist.`);
      }
    }

    const cred = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
    const token = await cred.user.getIdToken();

    const profile: UserProfile = {
      id: cred.user.uid,
      email: data.email.trim(),
      name: data.name.trim(),
      phone: data.phone || '',
      role,
      walletBalance: 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore users/{uid}
    await setDoc(doc(db, 'users', cred.user.uid), {
      ...profile,
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });

    // If agent, create initial agent document requiring admin verification
    if (role === 'AGENT') {
      await setDoc(doc(db, 'agents', cred.user.uid), {
        id: cred.user.uid,
        userId: cred.user.uid,
        vehicleType: data.vehicleType || 'Two Wheeler / Motorcycle',
        vehicleNumber: data.vehicleNumber || 'Pending Verification',
        currentZoneId: data.zoneId || 'zone-north-zone',
        latitude: 28.6139,
        longitude: 77.2090,
        isVerified: false, // Requires Admin verification!
        verificationStatus: 'PENDING_APPROVAL',
        isAvailable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(profile));

    return { user: profile, token };
  },

  /**
   * Fetch Firestore user profile by UID (with safe fallback & demo agent linking)
   */
  async getUserProfile(uid: string, fallbackEmail = ''): Promise<UserProfile> {
    const cleanEmail = fallbackEmail.toLowerCase().trim();
    const isWhitelistedAdmin = ALLOWED_ADMIN_EMAILS.some((e) => e.toLowerCase() === cleanEmail) || cleanEmail.startsWith('admin@');

    const KNOWN_NAMES: Record<string, string> = {
      'agent.north@lastmile.dev': 'Raj Kumar',
      'agent.south@lastmile.dev': 'Priya Sharma',
      'agent.east@lastmile.dev': 'Amit Das',
      'agent.west@lastmile.dev': 'Sneha Patel',
      'customer@example.com': 'Rohan Mehta',
      'admin@lastmile.dev': 'System Admin',
      'deepakshukla1508.i@gmail.com': 'Deepak Shukla',
      'dipakshukla158@gmail.com': 'Deepak Shukla',
    };

    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data();
        const email = (data.email || fallbackEmail).toLowerCase().trim();
        const isAdmin = isWhitelistedAdmin || ALLOWED_ADMIN_EMAILS.some((e) => e.toLowerCase() === email) || email.startsWith('admin@');
        const role = isAdmin
          ? 'ADMIN'
          : ((data.role || (email.includes('agent') ? 'AGENT' : 'CUSTOMER')).toUpperCase() as 'CUSTOMER' | 'AGENT' | 'ADMIN');

        let name = data.name;
        if (!name || name === email.split('@')[0] || name === 'agent.north' || name === 'agent.south' || name === 'agent.east' || name === 'agent.west') {
          if (KNOWN_NAMES[email]) {
            name = KNOWN_NAMES[email];
            // Sync resolved friendly name to Firestore
            setDoc(doc(db, 'users', uid), { name }, { merge: true }).catch(() => {});
          }
        }

        // If agent, ensure an active agent record exists linked to this UID
        if (role === 'AGENT') {
          try {
            const agentDocRef = doc(db, 'agents', uid);
            const agentSnap = await getDoc(agentDocRef);
            if (!agentSnap.exists()) {
              await setDoc(agentDocRef, {
                id: uid,
                userId: uid,
                vehicleType: 'Two Wheeler / Motorcycle',
                vehicleNumber: 'DL 01 AB 1234',
                currentZoneId: 'zone-north-zone',
                latitude: 28.6139,
                longitude: 77.2090,
                isVerified: true,
                verificationStatus: 'VERIFIED',
                isAvailable: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }, { merge: true });
            }
          } catch {
            // ignore
          }
        }

        return {
          id: uid,
          email: data.email || fallbackEmail,
          name: name || (fallbackEmail ? fallbackEmail.split('@')[0] : 'User'),
          role,
          phone: data.phone || '',
          walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : 5000,
        };
      }
    } catch (err) {
      console.warn('Firestore profile read error:', err);
    }

    const fallbackRole = isWhitelistedAdmin ? 'ADMIN' : cleanEmail.includes('agent') ? 'AGENT' : 'CUSTOMER';
    const resolvedName = KNOWN_NAMES[cleanEmail] || cleanEmail.split('@')[0] || 'User';

    return {
      id: uid,
      email: fallbackEmail,
      name: resolvedName,
      role: fallbackRole,
      walletBalance: 5000,
    };
  },

  /**
   * Log out user from Firebase Auth
   */
  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Send password reset email via Firebase Auth
   */
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  /**
   * Fetch all users for Admin management
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email || '',
        name: data.name || '',
        role: (data.role || 'CUSTOMER').toUpperCase() as 'CUSTOMER' | 'AGENT' | 'ADMIN',
        phone: data.phone || '',
        walletBalance: data.walletBalance ?? 5000,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });
  },

  /**
   * Update name and phone number for currently logged in user
   */
  async updateUserProfile(data: { name?: string; phone?: string }): Promise<UserProfile> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated.');

    const userRef = doc(db, 'users', currentUser.uid);
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();

    await setDoc(userRef, updateData, { merge: true });

    const updated = await this.getUserProfile(currentUser.uid, currentUser.email || '');
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  },

  /**
   * Listen to Firebase auth state changes
   */
  onAuthStateChanged(callback: (user: UserProfile | null) => void) {
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const profile = await this.getUserProfile(fbUser.uid, fbUser.email || '');
        callback(profile);
      } else {
        callback(null);
      }
    });
  },
};
