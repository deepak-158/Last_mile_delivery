import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Zone {
  id: string;
  name: string;
  description?: string;
  areaMappings?: any[];
  agents?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export const zoneService = {
  async getAll(): Promise<Zone[]> {
    const snap = await getDocs(collection(db, 'zones'));
    const zones = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Zone));

    // If Firestore is empty, return default zones
    if (zones.length === 0) {
      return [
        { id: 'zone-north-zone', name: 'North Zone', description: 'Delhi NCR, UP, Haryana, Punjab' },
        { id: 'zone-south-zone', name: 'South Zone', description: 'Karnataka, Tamil Nadu, Kerala, AP, Telangana' },
        { id: 'zone-east-zone',  name: 'East Zone',  description: 'West Bengal, Odisha, Bihar, Jharkhand' },
        { id: 'zone-west-zone',  name: 'West Zone',  description: 'Maharashtra, Gujarat, Rajasthan, Goa' },
      ];
    }
    return zones;
  },

  async getById(id: string): Promise<Zone | null> {
    const snap = await getDoc(doc(db, 'zones', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Zone) : null;
  },

  async create(data: { name: string; description?: string }): Promise<Zone> {
    const res = await addDoc(collection(db, 'zones'), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    });
    return { id: res.id, ...data };
  },

  async update(id: string, data: { name?: string; description?: string }): Promise<void> {
    await updateDoc(doc(db, 'zones', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'zones', id));
  },

  async getAreas(zoneId: string): Promise<any[]> {
    const snap = await getDocs(query(collection(db, 'zone_area_mappings'), where('zoneId', '==', zoneId)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async addArea(zoneId: string, data: { areaIdentifier: string; areaType: string }): Promise<any> {
    const res = await addDoc(collection(db, 'zone_area_mappings'), {
      zoneId,
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: res.id, zoneId, ...data };
  },

  async removeArea(mappingId: string): Promise<void> {
    await deleteDoc(doc(db, 'zone_area_mappings', mappingId));
  },
};
