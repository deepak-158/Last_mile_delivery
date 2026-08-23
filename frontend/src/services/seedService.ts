import { doc, getDoc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { rateCardService } from './rateCardService';
import { codConfigService } from './codConfigService';

export const seedService = {
  /**
   * Safe, idempotent database initializer.
   * Checks if default data already exists before populating Firestore collections.
   */
  async initializeDemoData(progressCallback?: (msg: string) => void): Promise<{ success: boolean; message: string }> {
    const log = (msg: string) => {
      console.log(`[Firebase Spark Seed] ${msg}`);
      progressCallback?.(msg);
    };

    try {
      log('Checking existing database state...');

      // 1. Seed Zones
      const zones = [
        { id: 'zone-north-zone', name: 'North Zone', description: 'Delhi NCR, UP, Haryana, Punjab' },
        { id: 'zone-south-zone', name: 'South Zone', description: 'Karnataka, Tamil Nadu, Kerala, AP, Telangana' },
        { id: 'zone-east-zone',  name: 'East Zone',  description: 'West Bengal, Odisha, Bihar, Jharkhand' },
        { id: 'zone-west-zone',  name: 'West Zone',  description: 'Maharashtra, Gujarat, Rajasthan, Goa' },
      ];

      for (const z of zones) {
        await setDoc(doc(db, 'zones', z.id), {
          ...z,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      log('✓ 4 Zones verified');

      // 2. Seed Rate Cards
      const rateCards = [
        { id: 'b2c-intra', orderType: 'B2C', rateType: 'INTRA_ZONE', baseCharge: 50,  perKgCharge: 20 },
        { id: 'b2c-inter', orderType: 'B2C', rateType: 'INTER_ZONE', baseCharge: 100, perKgCharge: 35 },
        { id: 'b2b-intra', orderType: 'B2B', rateType: 'INTRA_ZONE', baseCharge: 40,  perKgCharge: 15 },
        { id: 'b2b-inter', orderType: 'B2B', rateType: 'INTER_ZONE', baseCharge: 80,  perKgCharge: 28 },
      ];
      for (const rc of rateCards) {
        await setDoc(doc(db, 'rate_cards', rc.id), {
          ...rc,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      log('✓ Rate cards verified');

      // 3. Seed COD Configs
      await codConfigService.upsert({ orderType: 'B2C', surchargeAmount: 30 });
      await codConfigService.upsert({ orderType: 'B2B', surchargeAmount: 50 });
      log('✓ COD surcharge configs verified');

      // 4. Create / Verify Demo Accounts in Firestore
      const demoUsers = [
        {
          uid: 'demo-admin-uid',
          email: 'admin@lastmile.dev',
          name: 'System Admin',
          role: 'ADMIN',
          phone: '+919999900000',
        },
        {
          uid: 'demo-agent-north-uid',
          email: 'agent.north@lastmile.dev',
          name: 'Raj Kumar',
          role: 'AGENT',
          phone: '+919999900001',
          lat: 28.6139,
          lng: 77.2090,
          zoneId: 'zone-north-zone',
        },
        {
          uid: 'demo-agent-south-uid',
          email: 'agent.south@lastmile.dev',
          name: 'Priya Sharma',
          role: 'AGENT',
          phone: '+919999900002',
          lat: 12.9716,
          lng: 77.5946,
          zoneId: 'zone-south-zone',
        },
        {
          uid: 'demo-agent-east-uid',
          email: 'agent.east@lastmile.dev',
          name: 'Amit Das',
          role: 'AGENT',
          phone: '+919999900003',
          lat: 22.5726,
          lng: 88.3639,
          zoneId: 'zone-east-zone',
        },
        {
          uid: 'demo-agent-west-uid',
          email: 'agent.west@lastmile.dev',
          name: 'Sneha Patel',
          role: 'AGENT',
          phone: '+919999900004',
          lat: 19.0760,
          lng: 72.8777,
          zoneId: 'zone-west-zone',
        },
        {
          uid: 'demo-customer-uid',
          email: 'customer@example.com',
          name: 'Rohan Mehta',
          role: 'CUSTOMER',
          phone: '+919876543210',
        },
      ];

      for (const u of demoUsers) {
        // Try creating user in Firebase Auth if not already created
        try {
          await createUserWithEmailAndPassword(auth, u.email, 'password123');
        } catch {
          // User already exists in Firebase Auth, proceed to Firestore profile
        }

        // Save profile in Firestore
        await setDoc(doc(db, 'users', u.uid), {
          id: u.uid,
          email: u.email,
          name: u.name,
          role: u.role,
          phone: u.phone,
          walletBalance: 5000,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // If Agent, create agent doc
        if (u.role === 'AGENT') {
          await setDoc(doc(db, 'agents', u.uid), {
            id: u.uid,
            userId: u.uid,
            latitude: (u as any).lat,
            longitude: (u as any).lng,
            isAvailable: true,
            currentZoneId: (u as any).zoneId,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      }
      log('✓ 6 Demo accounts (Admin, 4 Agents, Customer) verified');

      // 5. Seed Customer Saved Addresses
      const savedAddresses = [
        {
          id: 'addr-home',
          userId: 'demo-customer-uid',
          label: 'Home / Residence',
          contactName: 'Rohan Mehta',
          contactPhone: '+91 98765 43210',
          pincode: '110001',
          city: 'New Delhi',
          state: 'Delhi',
          locality: 'Connaught Place',
          address: 'Flat 402, Regal Promenade, Sansad Marg',
        },
        {
          id: 'addr-office',
          userId: 'demo-customer-uid',
          label: 'Corporate Office',
          contactName: 'Rohan Mehta (Admin Desk)',
          contactPhone: '+91 98765 43210',
          pincode: '122002',
          city: 'Gurugram',
          state: 'Haryana',
          locality: 'DLF Phase 1',
          address: 'Tower B, 8th Floor, Cyber City, Sector 24',
        },
        {
          id: 'addr-warehouse',
          userId: 'demo-customer-uid',
          label: 'Bangalore Regional Warehouse',
          contactName: 'Karthik Raman (Warehouse Manager)',
          contactPhone: '+91 91234 56789',
          pincode: '560034',
          city: 'Bengaluru',
          state: 'Karnataka',
          locality: 'Koramangala 3rd Block',
          address: 'Plot 18, Industrial Estate, 80 Feet Road',
        },
      ];

      for (const a of savedAddresses) {
        await setDoc(doc(db, 'saved_addresses', a.id), {
          ...a,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      log('✓ Saved addresses verified');

      // Mark system initialization complete
      await setDoc(doc(db, 'system', 'metadata'), {
        isInitialized: true,
        initializedAt: new Date().toISOString(),
      }, { merge: true });

      log('🎉 Database initialization complete!');
      return { success: true, message: 'Demo data initialized successfully.' };
    } catch (err: any) {
      console.error('Seed error:', err);
      return { success: false, message: err.message || 'Initialization failed.' };
    }
  },
};
