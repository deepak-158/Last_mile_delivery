import prisma from '../config/database';
import bcrypt from 'bcryptjs';

/**
 * Auto-seed the database on every startup.
 * Railway's ephemeral filesystem means the SQLite DB is fresh on each deploy.
 * This function creates all required demo data: users, zones, rate cards, etc.
 * It's idempotent — skips seeding if data already exists.
 */
export async function autoSeed(): Promise<void> {
  try {
    // Check if data already exists (server restart without redeploy)
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('📦 Database already seeded, skipping...');
      return;
    }

    console.log('🌱 Fresh database detected — seeding demo data...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // ─── Admin User ────────────────────────────────────────
    const admin = await prisma.user.create({
      data: {
        email: 'admin@lastmile.dev',
        password: hashedPassword,
        name: 'System Admin',
        phone: '+919999900000',
        role: 'ADMIN',
      },
    });
    console.log('  ✓ Admin created:', admin.email);

    // ─── Zones ─────────────────────────────────────────────
    const zones = await Promise.all([
      prisma.zone.create({ data: { name: 'North Zone', description: 'Delhi NCR, UP, Haryana, Punjab' } }),
      prisma.zone.create({ data: { name: 'South Zone', description: 'Karnataka, Tamil Nadu, Kerala, AP, Telangana' } }),
      prisma.zone.create({ data: { name: 'East Zone',  description: 'West Bengal, Odisha, Bihar, Jharkhand' } }),
      prisma.zone.create({ data: { name: 'West Zone',  description: 'Maharashtra, Gujarat, Rajasthan, Goa' } }),
    ]);
    console.log('  ✓ 4 zones created');

    // ─── Zone Area Mappings (Pincodes) ─────────────────────
    await prisma.zoneAreaMapping.createMany({
      data: [
        // North Zone
        { zoneId: zones[0].id, areaIdentifier: '110001', areaType: 'PINCODE' },
        { zoneId: zones[0].id, areaIdentifier: '110002', areaType: 'PINCODE' },
        { zoneId: zones[0].id, areaIdentifier: '110003', areaType: 'PINCODE' },
        { zoneId: zones[0].id, areaIdentifier: '110010', areaType: 'PINCODE' },
        { zoneId: zones[0].id, areaIdentifier: '110020', areaType: 'PINCODE' },
        { zoneId: zones[0].id, areaIdentifier: '201301', areaType: 'PINCODE' },
        { zoneId: zones[0].id, areaIdentifier: '122001', areaType: 'PINCODE' },
        // South Zone
        { zoneId: zones[1].id, areaIdentifier: '560001', areaType: 'PINCODE' },
        { zoneId: zones[1].id, areaIdentifier: '560002', areaType: 'PINCODE' },
        { zoneId: zones[1].id, areaIdentifier: '560010', areaType: 'PINCODE' },
        { zoneId: zones[1].id, areaIdentifier: '600001', areaType: 'PINCODE' },
        { zoneId: zones[1].id, areaIdentifier: '600002', areaType: 'PINCODE' },
        { zoneId: zones[1].id, areaIdentifier: '500001', areaType: 'PINCODE' },
        // East Zone
        { zoneId: zones[2].id, areaIdentifier: '700001', areaType: 'PINCODE' },
        { zoneId: zones[2].id, areaIdentifier: '700002', areaType: 'PINCODE' },
        { zoneId: zones[2].id, areaIdentifier: '700010', areaType: 'PINCODE' },
        { zoneId: zones[2].id, areaIdentifier: '751001', areaType: 'PINCODE' },
        { zoneId: zones[2].id, areaIdentifier: '800001', areaType: 'PINCODE' },
        // West Zone
        { zoneId: zones[3].id, areaIdentifier: '400001', areaType: 'PINCODE' },
        { zoneId: zones[3].id, areaIdentifier: '400002', areaType: 'PINCODE' },
        { zoneId: zones[3].id, areaIdentifier: '400010', areaType: 'PINCODE' },
        { zoneId: zones[3].id, areaIdentifier: '380001', areaType: 'PINCODE' },
        { zoneId: zones[3].id, areaIdentifier: '411001', areaType: 'PINCODE' },
        { zoneId: zones[3].id, areaIdentifier: '302001', areaType: 'PINCODE' },
      ],
    });
    console.log('  ✓ Zone area mappings created');

    // ─── Agents (one per zone) ─────────────────────────────
    const agentData = [
      { email: 'agent.north@lastmile.dev', name: 'Raj Kumar',    phone: '+919999900001', lat: 28.6139, lng: 77.2090 },
      { email: 'agent.south@lastmile.dev', name: 'Priya Sharma', phone: '+919999900002', lat: 12.9716, lng: 77.5946 },
      { email: 'agent.east@lastmile.dev',  name: 'Amit Das',     phone: '+919999900003', lat: 22.5726, lng: 88.3639 },
      { email: 'agent.west@lastmile.dev',  name: 'Sneha Patel',  phone: '+919999900004', lat: 19.0760, lng: 72.8777 },
    ];

    for (let i = 0; i < agentData.length; i++) {
      const ad = agentData[i];
      const user = await prisma.user.create({
        data: {
          email: ad.email,
          password: hashedPassword,
          name: ad.name,
          phone: ad.phone,
          role: 'AGENT',
        },
      });
      await prisma.agent.create({
        data: {
          userId: user.id,
          currentZoneId: zones[i].id,
          latitude: ad.lat,
          longitude: ad.lng,
          isAvailable: true,
        },
      });
    }
    console.log('  ✓ 4 agents created');

    // ─── Rate Cards ────────────────────────────────────────
    await prisma.rateCard.createMany({
      data: [
        { orderType: 'B2C', rateType: 'INTRA_ZONE', baseCharge: 50,  perKgCharge: 20 },
        { orderType: 'B2C', rateType: 'INTER_ZONE', baseCharge: 100, perKgCharge: 35 },
        { orderType: 'B2B', rateType: 'INTRA_ZONE', baseCharge: 40,  perKgCharge: 15 },
        { orderType: 'B2B', rateType: 'INTER_ZONE', baseCharge: 80,  perKgCharge: 28 },
      ],
    });
    console.log('  ✓ Rate cards created');

    // ─── COD Surcharges ────────────────────────────────────
    await prisma.cODSurchargeConfig.createMany({
      data: [
        { orderType: 'B2C', surchargeAmount: 30 },
        { orderType: 'B2B', surchargeAmount: 50 },
      ],
    });
    console.log('  ✓ COD surcharge configs created');

    // ─── Demo Customer ─────────────────────────────────────
    const customer = await prisma.user.create({
      data: {
        email: 'customer@example.com',
        password: hashedPassword,
        name: 'Rohan Mehta',
        phone: '+919876543210',
        role: 'CUSTOMER',
      },
    });
    console.log('  ✓ Demo customer created');

    // ─── Saved Addresses for Customer ──────────────────────
    await prisma.savedAddress.createMany({
      data: [
        {
          userId: customer.id,
          label: '🏠 Home / Residence',
          contactName: 'Rohan Mehta',
          contactPhone: '+91 98765 43210',
          pincode: '110001',
          city: 'New Delhi',
          state: 'Delhi',
          locality: 'Connaught Place',
          address: 'Flat 402, Regal Promenade, Sansad Marg',
        },
        {
          userId: customer.id,
          label: '🏢 Corporate Office',
          contactName: 'Rohan Mehta (Admin Desk)',
          contactPhone: '+91 98765 43210',
          pincode: '122002',
          city: 'Gurugram',
          state: 'Haryana',
          locality: 'DLF Phase 1',
          address: 'Tower B, 8th Floor, Cyber City, Sector 24',
        },
        {
          userId: customer.id,
          label: '📦 Bangalore Regional Warehouse',
          contactName: 'Karthik Raman (Warehouse Manager)',
          contactPhone: '+91 91234 56789',
          pincode: '560034',
          city: 'Bengaluru',
          state: 'Karnataka',
          locality: 'Koramangala 3rd Block',
          address: 'Plot 18, Industrial Estate, 80 Feet Road',
        },
      ],
    });
    console.log('  ✓ 3 saved addresses created');

    console.log('\n✅ Auto-seed completed successfully!');
  } catch (error) {
    console.error('❌ Auto-seed failed:', error);
    // Don't crash the server — it can still run without seed data
  }
}
