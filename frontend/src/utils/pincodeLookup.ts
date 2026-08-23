export interface PincodeLookupResult {
  valid: boolean;
  pincode?: string;
  city?: string;
  district?: string;
  state?: string;
  localities?: string[];
  selectedLocality?: string;
  formattedLocation?: string;
  latitude?: number;
  longitude?: number;
  zone?: {
    id: string;
    name: string;
  } | null;
  isServiced?: boolean;
  message?: string;
}

const STATE_COORDINATES: Record<string, { lat: number; lng: number; zoneName: string }> = {
  // North
  'delhi': { lat: 28.6139, lng: 77.2090, zoneName: 'North Zone' },
  'new delhi': { lat: 28.6139, lng: 77.2090, zoneName: 'North Zone' },
  'haryana': { lat: 29.0588, lng: 76.0856, zoneName: 'North Zone' },
  'punjab': { lat: 31.1471, lng: 75.3412, zoneName: 'North Zone' },
  'uttar pradesh': { lat: 26.8467, lng: 80.9462, zoneName: 'North Zone' },
  'uttarakhand': { lat: 30.0668, lng: 79.0193, zoneName: 'North Zone' },
  'himachal pradesh': { lat: 31.1048, lng: 77.1734, zoneName: 'North Zone' },
  'jammu & kashmir': { lat: 33.7782, lng: 76.5762, zoneName: 'North Zone' },
  'jammu and kashmir': { lat: 33.7782, lng: 76.5762, zoneName: 'North Zone' },
  'ladakh': { lat: 34.1526, lng: 77.5771, zoneName: 'North Zone' },
  'rajasthan': { lat: 27.0238, lng: 74.2179, zoneName: 'North Zone' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, zoneName: 'North Zone' },

  // South
  'karnataka': { lat: 12.9716, lng: 77.5946, zoneName: 'South Zone' },
  'tamil nadu': { lat: 13.0827, lng: 80.2707, zoneName: 'South Zone' },
  'kerala': { lat: 8.5241, lng: 76.9366, zoneName: 'South Zone' },
  'andhra pradesh': { lat: 15.9129, lng: 79.7400, zoneName: 'South Zone' },
  'telangana': { lat: 17.3850, lng: 78.4867, zoneName: 'South Zone' },
  'puducherry': { lat: 11.9416, lng: 79.8083, zoneName: 'South Zone' },
  'pondicherry': { lat: 11.9416, lng: 79.8083, zoneName: 'South Zone' },

  // East
  'west bengal': { lat: 22.5726, lng: 88.3639, zoneName: 'East Zone' },
  'bihar': { lat: 25.5941, lng: 85.1376, zoneName: 'East Zone' },
  'jharkhand': { lat: 23.3441, lng: 85.3096, zoneName: 'East Zone' },
  'odisha': { lat: 20.2961, lng: 85.8245, zoneName: 'East Zone' },
  'orissa': { lat: 20.2961, lng: 85.8245, zoneName: 'East Zone' },
  'assam': { lat: 26.1445, lng: 91.7362, zoneName: 'East Zone' },
  'sikkim': { lat: 27.3389, lng: 88.6065, zoneName: 'East Zone' },
  'meghalaya': { lat: 25.5788, lng: 91.8933, zoneName: 'East Zone' },
  'tripura': { lat: 23.8315, lng: 91.2868, zoneName: 'East Zone' },

  // West
  'maharashtra': { lat: 19.0760, lng: 72.8777, zoneName: 'West Zone' },
  'gujarat': { lat: 23.0225, lng: 72.5714, zoneName: 'West Zone' },
  'goa': { lat: 15.2993, lng: 74.1240, zoneName: 'West Zone' },
  'madhya pradesh': { lat: 23.2599, lng: 77.4126, zoneName: 'West Zone' },
  'chhattisgarh': { lat: 21.2787, lng: 81.8661, zoneName: 'West Zone' },
};

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'ludhiana': { lat: 30.9010, lng: 75.8573 },

  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'coimbatore': { lat: 11.0168, lng: 76.9558 },
  'mysuru': { lat: 12.2958, lng: 76.6394 },

  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'ranchi': { lat: 23.3441, lng: 85.3096 },
  'guwahati': { lat: 26.1445, lng: 91.7362 },

  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'vadodara': { lat: 22.3072, lng: 73.1812 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
};

const KNOWN_PINCODES: Record<string, { city: string; state: string; locality: string; lat: number; lng: number; zoneName: string }> = {
  // North Zone
  '110001': { city: 'New Delhi', state: 'Delhi', locality: 'Connaught Place', lat: 28.6315, lng: 77.2167, zoneName: 'North Zone' },
  '110002': { city: 'New Delhi', state: 'Delhi', locality: 'Darya Ganj', lat: 28.6433, lng: 77.2410, zoneName: 'North Zone' },
  '110003': { city: 'New Delhi', state: 'Delhi', locality: 'Aliganj / Lodhi Colony', lat: 28.5833, lng: 77.2167, zoneName: 'North Zone' },
  '110010': { city: 'South West Delhi', state: 'Delhi', locality: 'Delhi Cantt', lat: 28.5921, lng: 77.1350, zoneName: 'North Zone' },
  '110020': { city: 'South Delhi', state: 'Delhi', locality: 'Okhla Industrial Area', lat: 28.5355, lng: 77.2732, zoneName: 'North Zone' },
  '122001': { city: 'Gurugram', state: 'Haryana', locality: 'Old Gurgaon / Sector 14', lat: 28.4695, lng: 77.0366, zoneName: 'North Zone' },
  '122002': { city: 'Gurugram', state: 'Haryana', locality: 'DLF Phase 1 / Cyber City', lat: 28.4817, lng: 77.0927, zoneName: 'North Zone' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh', locality: 'Sector 1 to 18 / Film City', lat: 28.5700, lng: 77.3200, zoneName: 'North Zone' },

  // South Zone
  '560001': { city: 'Bengaluru', state: 'Karnataka', locality: 'MG Road / Brigade Road', lat: 12.9756, lng: 77.6066, zoneName: 'South Zone' },
  '560002': { city: 'Bengaluru', state: 'Karnataka', locality: 'City Market / Chickpet', lat: 12.9667, lng: 77.5833, zoneName: 'South Zone' },
  '560010': { city: 'Bengaluru', state: 'Karnataka', locality: 'Rajajinagar', lat: 12.9915, lng: 77.5554, zoneName: 'South Zone' },
  '560034': { city: 'Bengaluru', state: 'Karnataka', locality: 'Koramangala 3rd Block', lat: 12.9352, lng: 77.6245, zoneName: 'South Zone' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', locality: 'George Town / Parrys', lat: 13.0900, lng: 80.2900, zoneName: 'South Zone' },
  '600002': { city: 'Chennai', state: 'Tamil Nadu', locality: 'Anna Salai / Mount Road', lat: 13.0600, lng: 80.2700, zoneName: 'South Zone' },
  '500001': { city: 'Hyderabad', state: 'Telangana', locality: 'Abids / Koti', lat: 17.3888, lng: 78.4744, zoneName: 'South Zone' },

  // East Zone
  '700001': { city: 'Kolkata', state: 'West Bengal', locality: 'BBD Bagh / Dalhousie', lat: 22.5726, lng: 88.3510, zoneName: 'East Zone' },
  '700002': { city: 'Kolkata', state: 'West Bengal', locality: 'Cossipore / Sinthee', lat: 22.6100, lng: 88.3700, zoneName: 'East Zone' },
  '700010': { city: 'Kolkata', state: 'West Bengal', locality: 'Beliaghata', lat: 22.5650, lng: 88.3900, zoneName: 'East Zone' },
  '751001': { city: 'Bhubaneswar', state: 'Odisha', locality: 'Bhubaneswar GPO / Unit 1', lat: 20.2644, lng: 85.8281, zoneName: 'East Zone' },
  '800001': { city: 'Patna', state: 'Bihar', locality: 'Patna GPO / Fraser Road', lat: 25.6090, lng: 85.1376, zoneName: 'East Zone' },

  // West Zone
  '400001': { city: 'Mumbai', state: 'Maharashtra', locality: 'Fort / Nariman Point', lat: 18.9322, lng: 72.8344, zoneName: 'West Zone' },
  '400002': { city: 'Mumbai', state: 'Maharashtra', locality: 'Kalbadevi / Marine Lines', lat: 18.9480, lng: 72.8290, zoneName: 'West Zone' },
  '400010': { city: 'Mumbai', state: 'Maharashtra', locality: 'Mazgaon / Dockyard', lat: 18.9700, lng: 72.8450, zoneName: 'West Zone' },
  '411001': { city: 'Pune', state: 'Maharashtra', locality: 'Pune Station / Camp', lat: 18.5204, lng: 73.8700, zoneName: 'West Zone' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', locality: 'Lal Darwaja / Bhadra', lat: 23.0258, lng: 72.5850, zoneName: 'West Zone' },
  '302001': { city: 'Jaipur', state: 'Rajasthan', locality: 'M.I. Road / City Palace', lat: 26.9200, lng: 75.8200, zoneName: 'West Zone' },
};

export async function lookupPincode(pincode: string): Promise<PincodeLookupResult> {
  const clean = pincode.replace(/\D/g, '').trim();

  if (clean.length !== 6) {
    return {
      valid: false,
      message: 'Please enter a valid 6-digit Indian Postal PIN code.',
    };
  }

  // 1. Fast path: Instant Known Database lookup
  const known = KNOWN_PINCODES[clean];
  if (known) {
    return {
      valid: true,
      pincode: clean,
      city: known.city,
      district: known.city,
      state: known.state,
      localities: [known.locality],
      selectedLocality: known.locality,
      formattedLocation: `${known.locality}, ${known.city}, ${known.state}`,
      latitude: known.lat,
      longitude: known.lng,
      zone: { id: `zone-${known.zoneName.toLowerCase().replace(/\s+/g, '-')}`, name: known.zoneName },
      isServiced: true,
    };
  }

  // 2. Fetch from India Post Public API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].Status === 'Success') {
        const postOffices: any[] = data[0].PostOffice || [];
        if (postOffices.length > 0) {
          const first = postOffices[0];
          const rawCity = first.District || first.Block || first.Circle || '';
          const rawState = first.State || '';
          const localities = postOffices.map((po: any) => po.Name).filter(Boolean);
          const primaryLocality = localities[0] || rawCity;

          const stateKey = rawState.toLowerCase().trim();
          const cityKey = rawCity.toLowerCase().trim();

          const cityCoords = CITY_COORDINATES[cityKey];
          const stateCoords = STATE_COORDINATES[stateKey];

          const lat = cityCoords?.lat ?? stateCoords?.lat ?? 20.5937;
          const lng = cityCoords?.lng ?? stateCoords?.lng ?? 78.9629;
          const zoneName = stateCoords?.zoneName || getZoneFromDigit(clean[0]);

          return {
            valid: true,
            pincode: clean,
            city: rawCity,
            district: first.District || rawCity,
            state: rawState,
            localities,
            selectedLocality: primaryLocality,
            formattedLocation: `${primaryLocality}, ${rawCity}, ${rawState}`,
            latitude: lat,
            longitude: lng,
            zone: { id: `zone-${zoneName.toLowerCase().replace(/\s+/g, '-')}`, name: zoneName },
            isServiced: true,
          };
        }
      }
    }
  } catch {
    // fallback below
  }

  // 3. Fallback: Region digit mapping for all other valid PIN codes
  const fallbackZone = getZoneFromDigit(clean[0]);
  return {
    valid: true,
    pincode: clean,
    city: 'Regional Hub',
    district: 'Service District',
    state: getStateFromDigit(clean[0]),
    localities: ['Main Delivery Hub'],
    selectedLocality: 'Main Delivery Hub',
    formattedLocation: `Pincode ${clean}, ${getStateFromDigit(clean[0])}`,
    latitude: 20.5937,
    longitude: 78.9629,
    zone: { id: `zone-${fallbackZone.toLowerCase().replace(/\s+/g, '-')}`, name: fallbackZone },
    isServiced: true,
  };
}

function getZoneFromDigit(firstDigit: string): string {
  switch (firstDigit) {
    case '1':
    case '2':
      return 'North Zone';
    case '5':
    case '6':
      return 'South Zone';
    case '7':
    case '8':
      return 'East Zone';
    case '3':
    case '4':
    default:
      return 'West Zone';
  }
}

function getStateFromDigit(firstDigit: string): string {
  switch (firstDigit) {
    case '1':
      return 'Delhi / Haryana / Punjab';
    case '2':
      return 'Uttar Pradesh / Uttarakhand';
    case '3':
      return 'Rajasthan / Gujarat';
    case '4':
      return 'Maharashtra / Goa';
    case '5':
      return 'Andhra Pradesh / Karnataka';
    case '6':
      return 'Tamil Nadu / Kerala';
    case '7':
      return 'West Bengal / Odisha';
    case '8':
      return 'Bihar / Jharkhand';
    default:
      return 'India';
  }
}
