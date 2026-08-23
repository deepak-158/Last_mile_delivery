import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface CODConfig {
  id: string;
  orderType: 'B2B' | 'B2C';
  surchargeAmount: number;
  updatedAt?: string;
}

const DEFAULT_COD_CONFIGS: CODConfig[] = [
  { id: 'b2c', orderType: 'B2C', surchargeAmount: 30 },
  { id: 'b2b', orderType: 'B2B', surchargeAmount: 50 },
];

export const codConfigService = {
  async getAll(): Promise<CODConfig[]> {
    const snap = await getDocs(collection(db, 'cod_surcharge_configs'));
    const configs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CODConfig));
    return configs.length > 0 ? configs : DEFAULT_COD_CONFIGS;
  },

  async upsert(data: { orderType: string; surchargeAmount: number }): Promise<CODConfig> {
    const docId = data.orderType.toLowerCase();
    const config: CODConfig = {
      id: docId,
      orderType: data.orderType as any,
      surchargeAmount: data.surchargeAmount,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'cod_surcharge_configs', docId), {
      ...config,
      serverUpdatedAt: serverTimestamp(),
    });
    return config;
  },
};
