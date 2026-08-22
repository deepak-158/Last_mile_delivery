import prisma from '../config/database';

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

// State/Region coordinate centers for Indian states and union territories
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

// Major City specific coordinates
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
  'panaji': { lat: 15.4909, lng: 73.8278 },
};

// Known Fast Registry
const KNOWN_PINCODES: Record<string, { city: string; district: string; state: string; localities: string[]; lat: number; lng: number; zoneName: string }> = {
  // Delhi NCR
  '110001': { city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', localities: ['Connaught Place', 'Janpath', 'Barakhamba Road', 'Pragati Maidan'], lat: 28.6304, lng: 77.2177, zoneName: 'North Zone' },
  '110002': { city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', localities: ['Darya Ganj', 'Delhi Gate', 'Rajghat'], lat: 28.6448, lng: 77.2405, zoneName: 'North Zone' },
  '110003': { city: 'New Delhi', district: 'South Delhi', state: 'Delhi', localities: ['Aliganj', 'Lodhi Road', 'CGO Complex', 'Pragati Vihar'], lat: 28.5912, lng: 77.2285, zoneName: 'North Zone' },
  '110016': { city: 'New Delhi', district: 'South Delhi', state: 'Delhi', localities: ['Hauz Khas', 'Green Park', 'IIT Delhi', 'Safdarjung Enclave'], lat: 28.5494, lng: 77.2001, zoneName: 'North Zone' },
  '110020': { city: 'New Delhi', district: 'South Delhi', state: 'Delhi', localities: ['Okhla Industrial Area Phase 1', 'Okhla Phase 2', 'Tehkhand'], lat: 28.5307, lng: 77.2711, zoneName: 'North Zone' },
  '110034': { city: 'New Delhi', district: 'North West Delhi', state: 'Delhi', localities: ['Pitampura', 'Shakurpur', 'Saraswati Vihar'], lat: 28.6942, lng: 77.1352, zoneName: 'North Zone' },
  '110085': { city: 'New Delhi', district: 'North West Delhi', state: 'Delhi', localities: ['Rohini Sector 7', 'Rohini Sector 8', 'Madhuban Chowk'], lat: 28.7126, lng: 77.1182, zoneName: 'North Zone' },
  '122001': { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', localities: ['Old Gurgaon', 'Railway Road', 'Sector 4', 'Sector 7'], lat: 28.4595, lng: 77.0266, zoneName: 'North Zone' },
  '122002': { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', localities: ['DLF Phase 1', 'DLF Phase 2', 'Sikanderpur', 'Sector 28'], lat: 28.4817, lng: 77.0864, zoneName: 'North Zone' },
  '122018': { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', localities: ['Sohna Road', 'Sector 48', 'Sector 49', 'Vipul Greens'], lat: 28.4190, lng: 77.0420, zoneName: 'North Zone' },
  '201301': { city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', localities: ['Sector 1 to 12', 'Sector 15', 'Sector 16 Metro', 'Atta Market'], lat: 28.5800, lng: 77.3180, zoneName: 'North Zone' },
  '201303': { city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', localities: ['Sector 25', 'Sector 29', 'Golf Course', 'Sector 37'], lat: 28.5670, lng: 77.3480, zoneName: 'North Zone' },
  '302001': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', localities: ['M.I. Road', 'C-Scheme', 'Ajmeri Gate', 'Pink City'], lat: 26.9124, lng: 75.7873, zoneName: 'North Zone' },
  '226001': { city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', localities: ['Hazratganj', 'Lalbagh', 'Aminabad'], lat: 26.8467, lng: 80.9462, zoneName: 'North Zone' },
  '160017': { city: 'Chandigarh', district: 'Chandigarh', state: 'Chandigarh', localities: ['Sector 17 Plaza', 'Sector 17-C', 'ISBT 17'], lat: 30.7398, lng: 76.7827, zoneName: 'North Zone' },

  // South India
  '560001': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', localities: ['M.G. Road', 'Brigade Road', 'Cubbon Park', 'Bangalore GPO', 'Shivajinagar'], lat: 12.9767, lng: 77.5993, zoneName: 'South Zone' },
  '560002': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', localities: ['City Market', 'Chickpet', 'Kalasipalyam'], lat: 12.9647, lng: 77.5762, zoneName: 'South Zone' },
  '560004': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', localities: ['Basavanagudi', 'Gandhi Bazaar', 'Bull Temple Road'], lat: 12.9416, lng: 77.5739, zoneName: 'South Zone' },
  '560034': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', localities: ['Koramangala 1st Block', 'Koramangala 3rd Block', 'Koramangala 5th Block', 'Sony World Junction'], lat: 12.9352, lng: 77.6245, zoneName: 'South Zone' },
  '560038': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', localities: ['Indiranagar 100 Feet Road', 'HAL 2nd Stage', 'Defence Colony'], lat: 12.9784, lng: 77.6408, zoneName: 'South Zone' },
  '560066': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', localities: ['Whitefield', 'ITPL', 'Hope Farm', 'Kadugodi'], lat: 12.9698, lng: 77.7500, zoneName: 'South Zone' },
  '560100': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', localities: ['Electronic City Phase 1', 'Electronic City Phase 2', 'Konappana Agrahara'], lat: 12.8452, lng: 77.6602, zoneName: 'South Zone' },
  '560102': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', localities: ['HSR Layout Sector 1', 'HSR Layout Sector 2', 'HSR Layout Sector 4', 'Agara'], lat: 12.9121, lng: 77.6446, zoneName: 'South Zone' },
  '600001': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', localities: ['George Town', 'Parrys Corner', 'Chennai GPO', 'Broadway'], lat: 13.0891, lng: 80.2882, zoneName: 'South Zone' },
  '600002': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', localities: ['Mount Road', 'Anna Salai', 'Triplicane', 'Chintadripet'], lat: 13.0694, lng: 80.2725, zoneName: 'South Zone' },
  '600096': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', localities: ['Perungudi', 'OMR IT Express Highway', 'Kandanchavadi'], lat: 12.9654, lng: 80.2461, zoneName: 'South Zone' },
  '500001': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', localities: ['Abids', 'Hyderabad GPO', 'Koti', 'Gunfoundry'], lat: 17.3850, lng: 78.4867, zoneName: 'South Zone' },
  '500034': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', localities: ['Banjara Hills Road No 1', 'Banjara Hills Road No 12', 'Punjagutta'], lat: 17.4156, lng: 78.4350, zoneName: 'South Zone' },
  '500081': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', localities: ['Madhapur', 'Hitec City', 'Cyber Towers', 'Durgam Cheruvu'], lat: 17.4483, lng: 78.3915, zoneName: 'South Zone' },
  '682001': { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', localities: ['Fort Kochi', 'Mattancherry', 'Jew Town'], lat: 9.9656, lng: 76.2421, zoneName: 'South Zone' },

  // East India
  '700001': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', localities: ['BBD Bagh', 'Dalhousie Square', 'Kolkata GPO', 'Strand Road'], lat: 22.5726, lng: 88.3539, zoneName: 'East Zone' },
  '700016': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', localities: ['Park Street', 'Camac Street', 'Shakespeare Sarani'], lat: 22.5519, lng: 88.3577, zoneName: 'East Zone' },
  '700091': { city: 'Kolkata', district: 'North 24 Parganas', state: 'West Bengal', localities: ['Salt Lake Sector V', 'College More', 'Technopolis', 'Karunamoyee'], lat: 22.5804, lng: 88.4378, zoneName: 'East Zone' },
  '700156': { city: 'Kolkata', district: 'North 24 Parganas', state: 'West Bengal', localities: ['New Town Action Area 1', 'Eco Park', 'DLF 2'], lat: 22.5937, lng: 88.4682, zoneName: 'East Zone' },
  '751001': { city: 'Bhubaneswar', district: 'Khurda', state: 'Odisha', localities: ['Old Town', 'Unit 1 Market', 'Rajmahal'], lat: 20.2600, lng: 85.8300, zoneName: 'East Zone' },
  '800001': { city: 'Patna', district: 'Patna', state: 'Bihar', localities: ['Patna GPO', 'Fraser Road', 'Gandhi Maidan'], lat: 25.6093, lng: 85.1376, zoneName: 'East Zone' },
  '834001': { city: 'Ranchi', district: 'Ranchi', state: 'Jharkhand', localities: ['Main Road', 'Albert Ekka Chowk', 'Ranchi GPO'], lat: 23.3441, lng: 85.3096, zoneName: 'East Zone' },

  // West India
  '400001': { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', localities: ['Fort', 'Mumbai GPO', 'Ballard Estate', 'Flora Fountain', 'Colaba'], lat: 18.9388, lng: 72.8354, zoneName: 'West Zone' },
  '400013': { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', localities: ['Lower Parel', 'High Street Phoenix', 'Kamala Mills', 'Delisle Road'], lat: 18.9950, lng: 72.8300, zoneName: 'West Zone' },
  '400050': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Bandra West', 'Hill Road', 'Pali Hill', 'Carter Road', 'Bandra Bandstand'], lat: 19.0596, lng: 72.8295, zoneName: 'West Zone' },
  '400051': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Bandra Kurla Complex (BKC)', 'Kalanagar', 'Bharat Nagar'], lat: 19.0660, lng: 72.8680, zoneName: 'West Zone' },
  '400053': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Andheri West', 'Lokhandwala Complex', 'Oshiwara', 'Versova'], lat: 19.1363, lng: 72.8277, zoneName: 'West Zone' },
  '400069': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Andheri East', 'MIDC', 'Chakala', 'Marol', 'Saki Naka'], lat: 19.1197, lng: 72.8697, zoneName: 'West Zone' },
  '400076': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Powai', 'Hiranandani Gardens', 'IIT Bombay', 'Chandivali'], lat: 19.1176, lng: 72.9060, zoneName: 'West Zone' },
  '411001': { city: 'Pune', district: 'Pune', state: 'Maharashtra', localities: ['Camp', 'MG Road Pune', 'Pune Railway Station', 'Sassoon'], lat: 18.5204, lng: 73.8567, zoneName: 'West Zone' },
  '411014': { city: 'Pune', district: 'Pune', state: 'Maharashtra', localities: ['Viman Nagar', 'Phoenix Marketcity', 'Kharadi Bypass'], lat: 18.5679, lng: 73.9143, zoneName: 'West Zone' },
  '411057': { city: 'Pune', district: 'Pune', state: 'Maharashtra', localities: ['Hinjewadi Phase 1', 'Hinjewadi Phase 2', 'Maan', 'Wakad'], lat: 18.5913, lng: 73.7389, zoneName: 'West Zone' },
  '380001': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', localities: ['Bhadra', 'Lal Darwaja', 'Ahmedabad GPO', 'Relief Road'], lat: 23.0225, lng: 72.5714, zoneName: 'West Zone' },
  '380015': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', localities: ['Satellite', 'Vastrapur', 'IIM Road', 'Prahlad Nagar', 'SG Highway'], lat: 23.0300, lng: 72.5180, zoneName: 'West Zone' },
  '462001': { city: 'Bhopal', district: 'Bhopal', state: 'Madhya Pradesh', localities: ['Bhopal City', 'Hamidia Road', 'Old City'], lat: 23.2599, lng: 77.4126, zoneName: 'West Zone' },
  '452001': { city: 'Indore', district: 'Indore', state: 'Madhya Pradesh', localities: ['Rajwada', 'Sarafa', 'Chhoti Gwaltoli'], lat: 22.7196, lng: 75.8577, zoneName: 'West Zone' },
};

/**
 * Lookup Indian Pincode: Queries DB, fast registry, and India Post API.
 * Returns City, District, State, Localities list, and Latitude/Longitude for distance calculation.
 */
export async function lookupPincode(pincode: string): Promise<PincodeLookupResult> {
  const cleanPin = pincode.trim();

  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return {
      valid: false,
      message: 'Pincode must be a valid 6-digit Indian postal code.',
    };
  }

  // 1. Check local DB mapping
  const dbMapping = await prisma.zoneAreaMapping.findFirst({
    where: { areaIdentifier: cleanPin, areaType: 'PINCODE' },
    include: { zone: true },
  });

  // 2. Check offline pre-indexed database
  const known = KNOWN_PINCODES[cleanPin];
  if (known) {
    let zoneObj = dbMapping?.zone;
    if (!zoneObj) {
      const matchedZone = await prisma.zone.findUnique({ where: { name: known.zoneName } });
      if (matchedZone) {
        await prisma.zoneAreaMapping.create({
          data: { zoneId: matchedZone.id, areaIdentifier: cleanPin, areaType: 'PINCODE' },
        }).catch(() => {});
        zoneObj = matchedZone;
      }
    }

    return {
      valid: true,
      pincode: cleanPin,
      city: known.city,
      district: known.district,
      state: known.state,
      localities: known.localities,
      selectedLocality: known.localities[0],
      formattedLocation: `${known.localities[0]}, ${known.city}, ${known.state}`,
      latitude: known.lat,
      longitude: known.lng,
      zone: zoneObj ? { id: zoneObj.id, name: zoneObj.name } : null,
      isServiced: !!zoneObj,
    };
  }

  // 3. Query India Post API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data: any = await response.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffices = data[0].PostOffice;
        const firstPO = postOffices[0];
        const stateName = firstPO.State || '';
        const districtName = firstPO.District || '';
        const cityName = firstPO.Division || firstPO.District || districtName;
        const localities = postOffices.map((po: any) => po.Name).filter(Boolean);

        const stateLower = stateName.toLowerCase().trim();
        const cityLower = cityName.toLowerCase().trim();
        const districtLower = districtName.toLowerCase().trim();

        const stateCoords = STATE_COORDINATES[stateLower] || { lat: 20.5937, lng: 78.9629, zoneName: 'North Zone' };
        const cityCoords = CITY_COORDINATES[cityLower] || CITY_COORDINATES[districtLower] || stateCoords;
        const targetZoneName = stateCoords.zoneName || 'North Zone';

        let zoneObj = dbMapping?.zone;
        if (!zoneObj) {
          const matchedZone = await prisma.zone.findUnique({ where: { name: targetZoneName } });
          if (matchedZone) {
            await prisma.zoneAreaMapping.create({
              data: { zoneId: matchedZone.id, areaIdentifier: cleanPin, areaType: 'PINCODE' },
            }).catch(() => {});
            zoneObj = matchedZone;
          }
        }

        const primaryLocality = localities[0] || `${districtName} Central`;

        return {
          valid: true,
          pincode: cleanPin,
          city: cityName,
          district: districtName,
          state: stateName,
          localities: localities.length > 0 ? localities : [primaryLocality],
          selectedLocality: primaryLocality,
          formattedLocation: `${primaryLocality}, ${cityName}, ${stateName}`,
          latitude: cityCoords.lat,
          longitude: cityCoords.lng,
          zone: zoneObj ? { id: zoneObj.id, name: zoneObj.name } : null,
          isServiced: !!zoneObj,
        };
      }
    }
  } catch (err) {
    // Timeout or network error fallback
  }

  // 4. Fallback estimation based on postal circle
  const firstDigit = cleanPin.charAt(0);
  let fallbackZoneName = 'North Zone';
  let coords = { lat: 28.6139, lng: 77.2090 };
  let fallbackCity = 'North Region';

  if (firstDigit === '1' || firstDigit === '2' || firstDigit === '3') {
    fallbackZoneName = 'North Zone'; coords = { lat: 28.6139, lng: 77.2090 }; fallbackCity = 'Delhi NCR / North Region';
  } else if (firstDigit === '4') {
    fallbackZoneName = 'West Zone'; coords = { lat: 19.0760, lng: 72.8777 }; fallbackCity = 'Mumbai / West Region';
  } else if (firstDigit === '5' || firstDigit === '6') {
    fallbackZoneName = 'South Zone'; coords = { lat: 12.9716, lng: 77.5946 }; fallbackCity = 'Bengaluru / South Region';
  } else if (firstDigit === '7' || firstDigit === '8') {
    fallbackZoneName = 'East Zone'; coords = { lat: 22.5726, lng: 88.3639 }; fallbackCity = 'Kolkata / East Region';
  }

  let zoneObj = dbMapping?.zone;
  if (!zoneObj) {
    const matchedZone = await prisma.zone.findUnique({ where: { name: fallbackZoneName } });
    if (matchedZone) {
      await prisma.zoneAreaMapping.create({
        data: { zoneId: matchedZone.id, areaIdentifier: cleanPin, areaType: 'PINCODE' },
      }).catch(() => {});
      zoneObj = matchedZone;
    }
  }

  return {
    valid: true,
    pincode: cleanPin,
    city: fallbackCity,
    district: `${fallbackZoneName} District`,
    state: 'India',
    localities: [`Postal Area ${cleanPin}`],
    selectedLocality: `Area ${cleanPin}`,
    formattedLocation: `Postal Area ${cleanPin}, ${fallbackCity}`,
    latitude: coords.lat,
    longitude: coords.lng,
    zone: zoneObj ? { id: zoneObj.id, name: zoneObj.name } : null,
    isServiced: !!zoneObj,
  };
}
