import {
  calculateVolumetricWeight,
  calculateBillableWeight,
  haversineDistance,
} from './calculations';
import { isValidTransition } from './statusTransitions';
import { OrderStatus } from '../types/enums';

console.log('🧪 Running Verification Tests for Core Logistics Engine...\n');

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string) {
  total++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// ─── 1. Volumetric Weight Calculation ──────────────────────
const volWeight = calculateVolumetricWeight(50, 40, 30);
assert(volWeight === 12, 'Volumetric weight (50x40x30)/5000 should equal 12 kg');

assert(calculateVolumetricWeight(10, 10, 10) === 0.2, 'Small package volumetric weight should equal 0.2 kg');

// ─── 2. Billable Weight Selection ──────────────────────────
assert(calculateBillableWeight(5, volWeight) === 12, 'Billable weight takes maximum when volumetric > actual');
assert(calculateBillableWeight(20, volWeight) === 20, 'Billable weight takes actual when actual > volumetric');

// ─── 3. Haversine Distance Calculation ─────────────────────
const distDelhiGurgaon = haversineDistance(28.6139, 77.2090, 28.4595, 77.0266);
assert(distDelhiGurgaon > 20 && distDelhiGurgaon < 35, `Haversine distance Delhi-Gurgaon (${distDelhiGurgaon.toFixed(2)} km) is accurate`);
assert(haversineDistance(12.9716, 77.5946, 12.9716, 77.5946) === 0, 'Distance between identical coordinates is 0');

// ─── 4. Status Transition Lifecycle Enforcement ────────────
assert(isValidTransition(OrderStatus.PENDING, OrderStatus.PICKED_UP), 'PENDING -> PICKED_UP is valid');
assert(isValidTransition(OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT), 'PICKED_UP -> IN_TRANSIT is valid');
assert(isValidTransition(OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY), 'IN_TRANSIT -> OUT_FOR_DELIVERY is valid');
assert(isValidTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED), 'OUT_FOR_DELIVERY -> DELIVERED is valid');
assert(isValidTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED), 'OUT_FOR_DELIVERY -> FAILED is valid');
assert(isValidTransition(OrderStatus.FAILED, OrderStatus.RESCHEDULED), 'FAILED -> RESCHEDULED is valid');
assert(isValidTransition(OrderStatus.RESCHEDULED, OrderStatus.PICKED_UP), 'RESCHEDULED -> PICKED_UP is valid');

// Illegal transitions
assert(!isValidTransition(OrderStatus.PENDING, OrderStatus.DELIVERED), 'Illegal transition PENDING -> DELIVERED rejected');
assert(!isValidTransition(OrderStatus.DELIVERED, OrderStatus.PICKED_UP), 'Terminal status DELIVERED -> PICKED_UP rejected');
assert(!isValidTransition(OrderStatus.FAILED, OrderStatus.DELIVERED), 'Illegal transition FAILED -> DELIVERED rejected');

console.log(`\n📊 Test Results: ${passed}/${total} passed.\n`);
