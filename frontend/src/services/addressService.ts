import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  contactName: string;
  contactPhone: string;
  pincode: string;
  city: string;
  state: string;
  locality?: string;
  address: string;
  createdAt?: string;
}

export const addressService = {
  async getAll(): Promise<SavedAddress[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const snap = await getDocs(
      query(collection(db, 'saved_addresses'), where('userId', '==', user.uid))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedAddress));
  },

  async save(data: {
    label: string;
    contactName: string;
    contactPhone: string;
    pincode: string;
    city: string;
    state: string;
    locality?: string;
    address: string;
  }): Promise<SavedAddress> {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to save an address.');

    const addressData = {
      userId: user.uid,
      ...data,
      createdAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    };

    const res = await addDoc(collection(db, 'saved_addresses'), addressData);
    return { id: res.id, ...addressData };
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'saved_addresses', id));
  },
};
