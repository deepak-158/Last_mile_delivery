import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, AreaType, OrderType, RateType } from '../src/types/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.notification.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.savedAddress.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.zoneAreaMapping.deleteMany();
  await prisma.cODSurchargeConfig.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lastmile.dev',
      password: hashedPassword,
      name: 'System Admin',
      phone: '+919999900000',
      role: Role.ADMIN,
    },
  });
  console.log('  ✓ Admin created:', admin.email);

  // Zones
  const zones = await Promise.all([
    prisma.zone.create({ data: { name: 'North Zone', description: 'Delhi NCR, UP, Haryana, Punjab' } }),
    prisma.zone.create({ data: { name: 'South Zone', description: 'Karnataka, Tamil Nadu, Kerala, AP, Telangana' } }),
    prisma.zone.create({ data: { name: 'East Zone',  description: 'West Bengal, Odisha, Bihar, Jharkhand' } }),
    prisma.zone.create({ data: { name: 'West Zone',  description: 'Maharashtra, Gujarat, Rajasthan, Goa' } }),
  ]);
  console.log('  ✓ 4 zones created');

  // Zone Area Mappings
  const areaMappings = [
    // North Zone
    { zoneId: zones[0].id, areaIdentifier: '110001', areaType: AreaType.PINCODE },
    { zoneId: zones[0].id, areaIdentifier: '110002', areaType: AreaType.PINCODE },
    { zoneId: zones[0].id, areaIdentifier: '110003', areaType: AreaType.PINCODE },
    { zoneId: zones[0].id, areaIdentifier: '110010', areaType: AreaType.PINCODE },
    { zoneId: zones[0].id, areaIdentifier: '110020', areaType: AreaType.PINCODE },
    { zoneId: zones[0].id, areaIdentifier: '201301', areaType: AreaType.PINCODE },
    { zoneId: zones[0].id, areaIdentifier: '122001', areaType: AreaType.PINCODE },
    // South Zone
    { zoneId: zones[1].id, areaIdentifier: '560001', areaType: AreaType.PINCODE },
    { zoneId: zones[1].id, areaIdentifier: '560002', areaType: AreaType.PINCODE },
    { zoneId: zones[1].id, areaIdentifier: '560010', areaType: AreaType.PINCODE },
    { zoneId: zones[1].id, areaIdentifier: '600001', areaType: AreaType.PINCODE },
    { zoneId: zones[1].id, areaIdentifier: '600002', areaType: AreaType.PINCODE },
    { zoneId: zones[1].id, areaIdentifier: '500001', areaType: AreaType.PINCODE },
    // East Zone
    { zoneId: zones[2].id, areaIdentifier: '700001', areaType: AreaType.PINCODE },
    { zoneId: zones[2].id, areaIdentifier: '700002', areaType: AreaType.PINCODE },
    { zoneId: zones[2].id, areaIdentifier: '700010', areaType: AreaType.PINCODE },
    { zoneId: zones[2].id, areaIdentifier: '751001', areaType: AreaType.PINCODE },
    { zoneId: zones[2].id, areaIdentifier: '800001', areaType: AreaType.PINCODE },
    // West Zone
    { zoneId: zones[3].id, areaIdentifier: '400001', areaType: AreaType.PINCODE },
    { zoneId: zones[3].id, areaIdentifier: '400002', areaType: AreaType.PINCODE },
    { zoneId: zones[3].id, areaIdentifier: '400010', areaType: AreaType.PINCODE },
    { zoneId: zones[3].id, areaIdentifier: '380001', areaType: AreaType.PINCODE },
    { zoneId: zones[3].id, areaIdentifier: '411001', areaType: AreaType.PINCODE },
    { zoneId: zones[3].id, areaIdentifier: '302001', areaType: AreaType.PINCODE },
  ];

  await prisma.zoneAreaMapping.createMany({ data: areaMappings });
  console.log('  ✓ Zone area mappings created');

  // Agents
  const agentData = [
    { email: 'agent.north@lastmile.dev', name: 'Raj Kumar',     phone: '+919999900001', lat: 28.6139, lng: 77.2090 },
    { email: 'agent.south@lastmile.dev', name: 'Priya Sharma',  phone: '+919999900002', lat: 12.9716, lng: 77.5946 },
    { email: 'agent.east@lastmile.dev',  name: 'Amit Das',      phone: '+919999900003', lat: 22.5726, lng: 88.3639 },
    { email: 'agent.west@lastmile.dev',  name: 'Sneha Patel',   phone: '+919999900004', lat: 19.0760, lng: 72.8777 },
  ];

  for (let i = 0; i < agentData.length; i++) {
    const ad = agentData[i];
    const user = await prisma.user.create({
      data: {
        email: ad.email,
        password: hashedPassword,
        name: ad.name,
        phone: ad.phone,
        role: Role.AGENT,
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

  // Rate Cards
  await prisma.rateCard.createMany({
    data: [
      { orderType: OrderType.B2C, rateType: RateType.INTRA_ZONE, baseCharge: 50,  perKgCharge: 20 },
      { orderType: OrderType.B2C, rateType: RateType.INTER_ZONE, baseCharge: 100, perKgCharge: 35 },
      { orderType: OrderType.B2B, rateType: RateType.INTRA_ZONE, baseCharge: 40,  perKgCharge: 15 },
      { orderType: OrderType.B2B, rateType: RateType.INTER_ZONE, baseCharge: 80,  perKgCharge: 28 },
    ],
  });
  console.log('  ✓ Rate cards created (B2B + B2C, intra + inter)');

  // COD Surcharges
  await prisma.cODSurchargeConfig.createMany({
    data: [
      { orderType: OrderType.B2C, surchargeAmount: 30 },
      { orderType: OrderType.B2B, surchargeAmount: 50 },
    ],
  });
  console.log('  ✓ COD surcharge configs created');

  // Customer
  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: hashedPassword,
      name: 'Rohan Mehta',
      phone: '+919876543210',
      role: Role.CUSTOMER,
    },
  });
  console.log('  ✓ Demo customer created');

  // Seed Saved Addresses for Customer
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
  console.log('  ✓ Seeded 3 saved addresses in Address Book');

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
