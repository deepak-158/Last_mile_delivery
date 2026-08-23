import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface RateCard {
  id: string;
  orderType: 'B2B' | 'B2C';
  rateType: 'INTRA_ZONE' | 'INTER_ZONE';
  baseCharge: number;
  perKgCharge: number;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_RATE_CARDS: RateCard[] = [
  { id: 'b2c-intra', orderType: 'B2C', rateType: 'INTRA_ZONE', baseCharge: 50,  perKgCharge: 20 },
  { id: 'b2c-inter', orderType: 'B2C', rateType: 'INTER_ZONE', baseCharge: 100, perKgCharge: 35 },
  { id: 'b2b-intra', orderType: 'B2B', rateType: 'INTRA_ZONE', baseCharge: 40,  perKgCharge: 15 },
  { id: 'b2b-inter', orderType: 'B2B', rateType: 'INTER_ZONE', baseCharge: 80,  perKgCharge: 28 },
];

export const rateCardService = {
  async getAll(): Promise<RateCard[]> {
    const snap = await getDocs(collection(db, 'rate_cards'));
    const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RateCard));
    return cards.length > 0 ? cards : DEFAULT_RATE_CARDS;
  },

  async create(data: {
    orderType: string;
    rateType: string;
    baseCharge: number;
    perKgCharge: number;
  }): Promise<RateCard> {
    const docId = `${data.orderType.toLowerCase()}-${data.rateType.toLowerCase().replace('_', '-')}`;
    const rateCard: RateCard = {
      id: docId,
      orderType: data.orderType as any,
      rateType: data.rateType as any,
      baseCharge: data.baseCharge,
      perKgCharge: data.perKgCharge,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'rate_cards', docId), {
      ...rateCard,
      serverCreatedAt: serverTimestamp(),
    });
    return rateCard;
  },

  async update(
    id: string,
    data: { baseCharge?: number; perKgCharge?: number }
  ): Promise<void> {
    await updateDoc(doc(db, 'rate_cards', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'rate_cards', id));
  },
};
