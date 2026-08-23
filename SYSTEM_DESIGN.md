# Delivero Logistics: System Design & Core Architecture

---

## 1. Dynamic Rate Calculation Engine

Delivero’s logistics pricing engine computes accurate freight tariffs in real-time through a deterministic multi-variable pipeline combining volumetric dimensions, deadweight, zone classification, and cash handling risks:

```
[Dimensions: L × W × H] ──> Volumetric Weight (kg) ──┐
                                                      ├──> max() ──> Billable Weight (kg)
[Scale Reading]         ──> Actual Weight (kg)     ──┘
                                                                       │
                                                                       ▼
[Rate Card Matrix: B2C / B2B] ──> Base Fare + [Extra Kg × Per-Kg Rate] + [COD Surcharge] ──> Total Tariff (₹)
```

1. **Volumetric vs. Deadweight Resolution**:
   - Industry-standard courier volumetric weight formula:
     $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$
   - **Billable Weight** is dynamically resolved as:
     $$\text{Billable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

2. **Tariff Tier Evaluation**:
   - The engine loads the active Firestore `rate_cards` based on **Service Mode** (`B2C`, `B2B`, `EXPRESS`) and **Route Classification** (`INTRA_ZONE` vs. `INTER_ZONE`).
   - **Total Tariff Formula**:
     $$\text{Total Fare (₹)} = \text{Base Charge} + \max(0, \lceil\text{Billable Weight} - 1\rceil) \times \text{Per-Kg Rate} + \text{COD Surcharge}$$
   - For Cash-on-Delivery shipments, a risk fee from `cod_configs` is added to cover cash reconciliation overhead.

---

## 2. Zone Detection & Spatial Routing Approach

Delivero classifies pickup and delivery endpoints into discrete operational hubs to decide logistics routing paths and pricing matrices:

1. **Hierarchical Pincode-to-Zone Ingestion**:
   - Postal PIN codes are mapped to predefined regional logistics zones (e.g., `zone-north-delhi`, `zone-south-bangalore`, `zone-east-kolkata`, `zone-west-mumbai`).
   - If an unindexed PIN is entered, a spatial reverse-geocoding fallback calculates geographic centroid coordinates $(\text{lat}, \text{lng})$ and projects them onto the nearest zone boundary.

2. **Intra-Zone vs. Inter-Zone Determination**:
   - **Intra-Zone** ($\text{Origin Zone} == \text{Destination Zone}$): Handled as a single last-mile run by a local fleet partner with lower base rates and direct point-to-point delivery ($< 4$ hours).
   - **Inter-Zone** ($\text{Origin Zone} \neq \text{Destination Zone}$): Triggers hub-and-spoke linehaul routing, applying inter-zone rate cards and multi-day transit milestones.

---

## 3. Spatial Auto-Assignment Logic

Delivero utilizes an automated **Spatial Nearest-Neighbor Matching Engine** to pair newly placed orders with the optimal online courier agent:

```
[New Order Created] ──> [Filter Candidate Fleet in Zone] ──> [Haversine Distance Sorting] ──> [Assign Nearest Agent]
                              • isAvailable == true
                              • isVerified == true
                              • verificationStatus == 'APPROVED'
                              • Current Active Load < Max Threshold
```

1. **Candidate Fleet Filtering**:
   - Queries `agents` collection where `currentZoneId == pickupZoneId`, `isAvailable == true`, `isVerified == true`, and `verificationStatus == 'APPROVED'`.

2. **Haversine Proximity Optimization**:
   - For every candidate agent, the Great-Circle Haversine distance between their real-time coordinates $(\phi_1, \lambda_1)$ and the pickup origin $(\phi_2, \lambda_2)$ is computed:
     $$d = 2R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$
   - The agent with the minimum distance $d_{\min}$ is selected, assigned in Firestore, and immediately notified via FCM push & SMS.

---

## 4. Failed Delivery Handling & Return-to-Origin (RTO)

To minimize failed delivery costs and prevent package loss, Delivero implements a structured multi-attempt state machine:

```
                  ┌─────────────────────── [Attempt 1 or 2 Failed] ────────────────────────┐
                  ▼                                                                        │
[OUT_FOR_DELIVERY] ──> [Attempt Delivery] ──> [Delivery Unsuccessful?] ──> [Log Reason & Customer Alert]
                             │                                                             │
                             ▼ [Handover PIN Verified]                                     ▼ [Attempt >= 3]
                       [DELIVERED]                                                  [RETURN_TO_ORIGIN]
```

1. **Failure Telemetry & Reason Codes**:
   - When a delivery cannot be completed, the courier selects a standardized failure reason code:
     - `CUSTOMER_UNAVAILABLE` (Customer not at address)
     - `INCORRECT_ADDRESS` (Address incomplete or wrong PIN)
     - `CUSTOMER_REJECTED` (Customer refused package/COD payment)
     - `OTP_MISMATCH` (Security PIN verification failed)

2. **Customer Rescheduling & Automated Retry**:
   - Customers receive an instant SMS and in-app prompt with a 1-click delivery rescheduling selector to pick a new date/time slot.
   - Up to 3 re-attempts are scheduled within 48 hours.

3. **Return-to-Origin (RTO) Escalation**:
   - If 3 attempts fail or the package is explicitly rejected, the status transitions to `RETURN_TO_ORIGIN` (`RTO_IN_TRANSIT` ➔ `RTO_DELIVERED`), reversing the route back to the origin warehouse with automatic COD cancellation and refund settlement.
