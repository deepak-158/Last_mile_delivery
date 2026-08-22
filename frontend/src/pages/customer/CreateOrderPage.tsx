import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderApi, addressApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import Package3DVisualizer from '../../components/Package3DVisualizer';
import RouteMapVisualizer from '../../components/RouteMapVisualizer';

interface PreviewData {
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  pickupLocation: {
    pincode: string;
    locality: string;
    city: string;
    state: string;
    formatted: string;
  };
  dropLocation: {
    pincode: string;
    locality: string;
    city: string;
    state: string;
    formatted: string;
  };
  pickupZone: { id: string; name: string };
  dropZone: { id: string; name: string };
  rateType: string;
  dimensions: {
    lengthCm: number;
    breadthCm: number;
    heightCm: number;
  };
  volumetricWeightKg: number;
  billableWeightKg: number;
  actualWeightKg: number;
  estimatedDistanceKm: number;
  rateCard: { baseCharge: number; perKgCharge: number };
  fareBreakdown: {
    baseTariff: number;
    weightCharge: number;
    distanceCharge: number;
    subtotal: number;
    codSurcharge: number;
    totalCharge: number;
  };
  baseCharge: number;
  codSurcharge: number;
  totalCharge: number;
}

interface PincodeInfo {
  valid: boolean;
  city?: string;
  district?: string;
  state?: string;
  localities?: string[];
  selectedLocality?: string;
  formattedLocation?: string;
  zone?: { id: string; name: string } | null;
  loading?: boolean;
  message?: string;
}

export default function CreateOrderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Initialize with real user info and clean, empty destination fields
  const [form, setForm] = useState({
    // Sender Information
    senderName: user?.name || '',
    senderPhone: user?.phone || '',
    pickupPincode: '',
    pickupCity: '',
    pickupState: '',
    pickupLocality: '',
    pickupAddress: '',
    savePickupAddress: false,
    pickupAddressLabel: 'Primary Hub',

    // Receiver Information
    receiverName: '',
    receiverPhone: '',
    dropPincode: '',
    dropCity: '',
    dropState: '',
    dropLocality: '',
    dropAddress: '',
    saveDropAddress: false,
    dropAddressLabel: 'Client Address',

    // Package Dimensions & Shipping Options
    lengthCm: '30',
    breadthCm: '20',
    heightCm: '15',
    actualWeightKg: '2.5',
    orderType: 'B2C',
    paymentType: 'PREPAID',
  });

  const [pickupInfo, setPickupInfo] = useState<PincodeInfo | null>(null);
  const [dropInfo, setDropInfo] = useState<PincodeInfo | null>(null);

  // Load Saved Addresses on mount
  useEffect(() => {
    addressApi.getAll()
      .then((res) => setSavedAddresses(res.data || []))
      .catch(() => {});
  }, []);

  // Auto-fetch City, State & Localities when Pickup Pincode is entered
  useEffect(() => {
    const pin = form.pickupPincode.trim();
    if (pin.length === 6 && /^[1-9][0-9]{5}$/.test(pin)) {
      setPickupInfo({ valid: false, loading: true });
      orderApi.lookupPincode(pin)
        .then((res) => {
          const data = res.data;
          setPickupInfo(data);
          if (data.valid) {
            setForm((prev) => ({
              ...prev,
              pickupCity: data.city || prev.pickupCity,
              pickupState: data.state || prev.pickupState,
              pickupLocality: prev.pickupLocality || data.selectedLocality || (data.localities?.[0] || ''),
            }));
          }
        })
        .catch(() => {
          setPickupInfo({ valid: false, message: 'Could not fetch location data for this pincode.' });
        });
    } else if (pin.length > 0 && pin.length < 6) {
      setPickupInfo(null);
    }
  }, [form.pickupPincode]);

  // Auto-fetch City, State & Localities when Drop Pincode is entered
  useEffect(() => {
    const pin = form.dropPincode.trim();
    if (pin.length === 6 && /^[1-9][0-9]{5}$/.test(pin)) {
      setDropInfo({ valid: false, loading: true });
      orderApi.lookupPincode(pin)
        .then((res) => {
          const data = res.data;
          setDropInfo(data);
          if (data.valid) {
            setForm((prev) => ({
              ...prev,
              dropCity: data.city || prev.dropCity,
              dropState: data.state || prev.dropState,
              dropLocality: prev.dropLocality || data.selectedLocality || (data.localities?.[0] || ''),
            }));
          }
        })
        .catch(() => {
          setDropInfo({ valid: false, message: 'Could not fetch location data for this pincode.' });
        });
    } else if (pin.length > 0 && pin.length < 6) {
      setDropInfo(null);
    }
  }, [form.dropPincode]);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplySavedAddress = (type: 'pickup' | 'drop', addr: any) => {
    if (type === 'pickup') {
      setForm((prev) => ({
        ...prev,
        senderName: addr.contactName,
        senderPhone: addr.contactPhone,
        pickupPincode: addr.pincode,
        pickupCity: addr.city,
        pickupState: addr.state,
        pickupLocality: addr.locality || '',
        pickupAddress: addr.address,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        receiverName: addr.contactName,
        receiverPhone: addr.contactPhone,
        dropPincode: addr.pincode,
        dropCity: addr.city,
        dropState: addr.state,
        dropLocality: addr.locality || '',
        dropAddress: addr.address,
      }));
    }
  };

  const numL = parseFloat(form.lengthCm) || 0;
  const numB = parseFloat(form.breadthCm) || 0;
  const numH = parseFloat(form.heightCm) || 0;
  const numActual = parseFloat(form.actualWeightKg) || 0;
  const liveVolumetric = Math.round(((numL * numB * numH) / 5000) * 100) / 100;
  const liveBillable = Math.max(numActual, liveVolumetric);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.senderName || !form.senderPhone) {
      setError('Please provide Sender Contact Name and Phone Number.');
      return;
    }
    if (!form.receiverName || !form.receiverPhone) {
      setError('Please provide Receiver Contact Name and Phone Number.');
      return;
    }
    if (!form.pickupPincode || form.pickupPincode.length !== 6) {
      setError('Please enter a valid 6-digit pickup pincode.');
      return;
    }
    if (!form.dropPincode || form.dropPincode.length !== 6) {
      setError('Please enter a valid 6-digit drop pincode.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        lengthCm: parseFloat(form.lengthCm) || 1,
        breadthCm: parseFloat(form.breadthCm) || 1,
        heightCm: parseFloat(form.heightCm) || 1,
        actualWeightKg: parseFloat(form.actualWeightKg) || 0.1,
      };
      const res = await orderApi.preview(payload);
      setPreview(res.data);
      setStep('preview');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to calculate delivery fare.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        lengthCm: parseFloat(form.lengthCm) || 1,
        breadthCm: parseFloat(form.breadthCm) || 1,
        heightCm: parseFloat(form.heightCm) || 1,
        actualWeightKg: parseFloat(form.actualWeightKg) || 0.1,
      };
      const res = await orderApi.create(payload);
      setConfirmedOrderId(res.data?.id || '');
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Order booking failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // STEP 3: ORDER CONFIRMATION SUCCESS VIEW
  // ─────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6 animate-scale-in">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl shadow-sm border border-emerald-200">
          ✓
        </div>
        <div className="space-y-2">
          <span className="text-3xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Booking Confirmed
          </span>
          <h2 className="text-2xl font-black text-slate-900">Parcel Dispatched Successfully!</h2>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            Your consignment <span className="font-mono font-bold text-slate-900">#{confirmedOrderId.slice(0, 8)}</span> has been registered and scheduled for courier pickup.
          </p>
        </div>

        <div className="delivero-card p-6 text-left space-y-3 text-xs bg-slate-50/50">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Pickup From:</span>
            <span className="font-bold text-slate-900">{form.pickupCity} ({form.pickupPincode})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Deliver To:</span>
            <span className="font-bold text-slate-900">{form.dropCity} ({form.dropPincode})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Billable Weight:</span>
            <span className="font-bold text-slate-900">{liveBillable} kg</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
            <span className="text-slate-800">Total Charge:</span>
            <span className="text-base text-[#5046e4] font-mono">{formatCurrency(preview?.totalCharge || 0)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/customer/orders" className="btn-secondary flex-1 py-3 text-xs font-bold">
            View in My Orders
          </Link>
          <Link to={`/customer/orders/${confirmedOrderId}`} className="btn-primary flex-1 py-3 text-xs font-bold shadow-md">
            Track Consignment →
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 2: CHARGE PREVIEW & ITEMIZATION VIEW
  // ─────────────────────────────────────────────────────────────
  if (step === 'preview' && preview) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in pb-16 space-y-6">
        {/* Stepper Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-3xs font-black flex items-center justify-center">✓</span>
              <span className="text-3xs font-bold text-emerald-600">Details</span>
              <span className="text-slate-300">→</span>
              <span className="w-5 h-5 rounded-full bg-[#5046e4] text-white text-3xs font-black flex items-center justify-center">2</span>
              <span className="text-3xs font-bold text-[#5046e4]">Preview</span>
              <span className="text-slate-300">→</span>
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-3xs font-black flex items-center justify-center">3</span>
              <span className="text-3xs font-bold text-slate-400">Confirm</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Review Consignment & Delivery Fare</h1>
          </div>
          <button onClick={() => setStep('form')} className="btn-secondary text-xs py-2 px-4 flex items-center gap-1 font-bold">
            ← Modify Details
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Sender & Receiver Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="delivero-card p-5 border-l-4 border-l-emerald-500">
            <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-700">
              📍 Sender (Origin)
            </span>
            <p className="font-bold text-slate-900 text-sm mt-1">{form.senderName}</p>
            <p className="text-xs text-slate-500 font-mono">📞 {form.senderPhone}</p>
            <p className="text-xs text-slate-700 mt-2 font-medium">{form.pickupAddress}</p>
            <p className="text-3xs text-slate-400 font-mono mt-0.5">
              {preview.pickupLocation.locality || ''} {preview.pickupLocation.city} (PIN: {preview.pickupLocation.pincode})
            </p>
          </div>

          <div className="delivero-card p-5 border-l-4 border-l-purple-500">
            <span className="text-3xs font-extrabold uppercase tracking-wider text-purple-700">
              🏁 Consignee (Destination)
            </span>
            <p className="font-bold text-slate-900 text-sm mt-1">{form.receiverName}</p>
            <p className="text-xs text-slate-500 font-mono">📞 {form.receiverPhone}</p>
            <p className="text-xs text-slate-700 mt-2 font-medium">{form.dropAddress}</p>
            <p className="text-3xs text-slate-400 font-mono mt-0.5">
              {preview.dropLocation.locality || ''} {preview.dropLocation.city} (PIN: {preview.dropLocation.pincode})
            </p>
          </div>
        </div>

        {/* Spatial Route Map Visualizer */}
        <RouteMapVisualizer
          pickupLocation={preview.pickupLocation}
          dropLocation={preview.dropLocation}
          pickupZone={preview.pickupZone.name}
          dropZone={preview.dropZone.name}
          distanceKm={preview.estimatedDistanceKm}
          rateType={preview.rateType}
        />

        {/* 3D Package Spatial Geometry */}
        <Package3DVisualizer
          lengthCm={preview.dimensions.lengthCm}
          breadthCm={preview.dimensions.breadthCm}
          heightCm={preview.dimensions.heightCm}
          actualWeightKg={preview.actualWeightKg}
          volumetricWeightKg={preview.volumetricWeightKg}
          billableWeightKg={preview.billableWeightKg}
        />

        {/* Itemized Delivery Fare Card */}
        <div className="delivero-card p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-emerald-500">💰</span> Itemized Delivery Fare Breakdown
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Base Processing Tariff</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(preview.fareBreakdown.baseTariff)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>
                Billable Weight Charge ({preview.billableWeightKg} kg × {formatCurrency(preview.rateCard.perKgCharge)}/kg)
              </span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(preview.fareBreakdown.weightCharge)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>
                Geodesic Distance Charge ({preview.estimatedDistanceKm} km spatial route)
              </span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(preview.fareBreakdown.distanceCharge)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-700 border-t border-slate-100 pt-2 font-bold">
              <span>Freight Subtotal</span>
              <span className="font-mono">{formatCurrency(preview.fareBreakdown.subtotal)}</span>
            </div>

            {preview.codSurcharge > 0 && (
              <div className="flex justify-between items-center text-amber-700 font-semibold">
                <span>Cash on Delivery (COD) Surcharge</span>
                <span className="font-mono">+ {formatCurrency(preview.codSurcharge)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-black pt-4 border-t border-slate-200">
              <span className="text-slate-900">Total All-Inclusive Fare</span>
              <span className="text-2xl font-black text-[#5046e4] font-mono">
                {formatCurrency(preview.totalCharge)}
              </span>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button onClick={() => setStep('form')} className="btn-secondary flex-1 py-3.5 text-xs font-bold">
              ← Modify Details
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="btn-primary flex-1 py-3.5 text-xs font-black shadow-md flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Dispatching...' : '🚀 Confirm & Dispatch Consignment'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 1: PARCEL DETAILS FORM VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-16 space-y-6">
      {/* Header with 3-Step Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-[#5046e4] text-white text-3xs font-black flex items-center justify-center">1</span>
            <span className="text-3xs font-bold text-[#5046e4]">Details</span>
            <span className="text-slate-300">→</span>
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-3xs font-black flex items-center justify-center">2</span>
            <span className="text-3xs font-bold text-slate-400">Preview</span>
            <span className="text-slate-300">→</span>
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-3xs font-black flex items-center justify-center">3</span>
            <span className="text-3xs font-bold text-slate-400">Confirm</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Book Last-Mile Delivery</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Fill in sender and receiver address details to calculate dynamic delivery rates.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-slide-down">
          {error}
        </div>
      )}

      <form onSubmit={handlePreview} className="space-y-6">
        {/* 1. SENDER & PICKUP ORIGIN */}
        <div className="delivero-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">📍</span>
              1. Sender & Pickup Origin Details
            </h2>

            {savedAddresses.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-3xs font-bold uppercase text-slate-400">Auto-fill:</span>
                <select
                  onChange={(e) => {
                    const found = savedAddresses.find((a) => a.id === e.target.value);
                    if (found) handleApplySavedAddress('pickup', found);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  <option value="">-- Address Book --</option>
                  {savedAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      📖 {a.label} ({a.contactName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Sender Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.senderName}
                  onChange={(e) => updateField('senderName', e.target.value)}
                  className="input-field font-semibold text-slate-900"
                  placeholder="Enter sender contact name"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Sender Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={form.senderPhone}
                  onChange={(e) => updateField('senderPhone', e.target.value)}
                  className="input-field font-mono font-semibold text-slate-900"
                  placeholder="+91 Phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Pickup Pincode (6-digit) *
                </label>
                <div className="relative">
                  <input
                    value={form.pickupPincode}
                    maxLength={6}
                    onChange={(e) => updateField('pickupPincode', e.target.value.replace(/\D/g, ''))}
                    className="input-field font-mono font-bold text-slate-900"
                    placeholder="Enter 6-digit Pincode"
                    required
                  />
                  {pickupInfo?.loading && (
                    <span className="absolute right-3 top-3 w-4 h-4 border-2 border-[#5046e4]/30 border-t-[#5046e4] rounded-full animate-spin" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  City / District *
                </label>
                <input
                  value={form.pickupCity}
                  onChange={(e) => updateField('pickupCity', e.target.value)}
                  className="input-field font-semibold text-slate-900 bg-slate-50"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  State / Union Territory *
                </label>
                <input
                  value={form.pickupState}
                  onChange={(e) => updateField('pickupState', e.target.value)}
                  className="input-field font-semibold text-slate-900 bg-slate-50"
                  placeholder="State"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Area / Locality / Sub-Post Office
              </label>
              {pickupInfo?.localities && pickupInfo.localities.length > 1 ? (
                <select
                  value={form.pickupLocality}
                  onChange={(e) => updateField('pickupLocality', e.target.value)}
                  className="input-field font-semibold text-slate-900"
                >
                  {pickupInfo.localities.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.pickupLocality}
                  onChange={(e) => updateField('pickupLocality', e.target.value)}
                  className="input-field font-medium text-slate-900"
                  placeholder="Locality / Area"
                />
              )}
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Doorstep / Flat / Building / Street Address *
              </label>
              <input
                value={form.pickupAddress}
                onChange={(e) => updateField('pickupAddress', e.target.value)}
                className="input-field text-slate-900 font-medium"
                placeholder="Doorstep / Flat / Street address"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="savePick"
                checked={form.savePickupAddress}
                onChange={(e) => updateField('savePickupAddress', e.target.checked)}
                className="rounded text-[#5046e4]"
              />
              <label htmlFor="savePick" className="text-3xs text-slate-600 font-medium cursor-pointer">
                Save pickup address to my Address Book
              </label>
            </div>
          </div>
        </div>

        {/* 2. RECEIVER & DROP DESTINATION */}
        <div className="delivero-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs">🏁</span>
              2. Receiver & Drop Destination Details
            </h2>

            {savedAddresses.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-3xs font-bold uppercase text-slate-400">Auto-fill:</span>
                <select
                  onChange={(e) => {
                    const found = savedAddresses.find((a) => a.id === e.target.value);
                    if (found) handleApplySavedAddress('drop', found);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  <option value="">-- Address Book --</option>
                  {savedAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      📖 {a.label} ({a.contactName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Receiver / Consignee Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.receiverName}
                  onChange={(e) => updateField('receiverName', e.target.value)}
                  className="input-field font-semibold text-slate-900"
                  placeholder="Enter receiver name"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Receiver Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={form.receiverPhone}
                  onChange={(e) => updateField('receiverPhone', e.target.value)}
                  className="input-field font-mono font-semibold text-slate-900"
                  placeholder="+91 Phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Drop Pincode (6-digit) *
                </label>
                <div className="relative">
                  <input
                    value={form.dropPincode}
                    maxLength={6}
                    onChange={(e) => updateField('dropPincode', e.target.value.replace(/\D/g, ''))}
                    className="input-field font-mono font-bold text-slate-900"
                    placeholder="Enter 6-digit Pincode"
                    required
                  />
                  {dropInfo?.loading && (
                    <span className="absolute right-3 top-3 w-4 h-4 border-2 border-[#5046e4]/30 border-t-[#5046e4] rounded-full animate-spin" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  City / District *
                </label>
                <input
                  value={form.dropCity}
                  onChange={(e) => updateField('dropCity', e.target.value)}
                  className="input-field font-semibold text-slate-900 bg-slate-50"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  State / Union Territory *
                </label>
                <input
                  value={form.dropState}
                  onChange={(e) => updateField('dropState', e.target.value)}
                  className="input-field font-semibold text-slate-900 bg-slate-50"
                  placeholder="State"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Area / Locality / Sub-Post Office
              </label>
              {dropInfo?.localities && dropInfo.localities.length > 1 ? (
                <select
                  value={form.dropLocality}
                  onChange={(e) => updateField('dropLocality', e.target.value)}
                  className="input-field font-semibold text-slate-900"
                >
                  {dropInfo.localities.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.dropLocality}
                  onChange={(e) => updateField('dropLocality', e.target.value)}
                  className="input-field font-medium text-slate-900"
                  placeholder="Locality / Area"
                />
              )}
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Doorstep / House / Building / Street Address *
              </label>
              <input
                value={form.dropAddress}
                onChange={(e) => updateField('dropAddress', e.target.value)}
                className="input-field text-slate-900 font-medium"
                placeholder="Doorstep / House / Street address"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="saveDrop"
                checked={form.saveDropAddress}
                onChange={(e) => updateField('saveDropAddress', e.target.checked)}
                className="rounded text-[#5046e4]"
              />
              <label htmlFor="saveDrop" className="text-3xs text-slate-600 font-medium cursor-pointer">
                Save receiver address to my Address Book
              </label>
            </div>
          </div>
        </div>

        {/* 3D Package Spatial Calculator */}
        <Package3DVisualizer
          lengthCm={numL}
          breadthCm={numB}
          heightCm={numH}
          actualWeightKg={numActual}
          volumetricWeightKg={liveVolumetric}
          billableWeightKg={liveBillable}
        />

        {/* 3. PACKAGE DIMENSIONS & OPTIONS */}
        <div className="delivero-card p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-[#5046e4] flex items-center justify-center text-xs">📐</span>
            3. Package Dimensions & Shipping Type
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">Length (cm)</label>
              <input type="number" step="0.1" min="0.1" value={form.lengthCm} onChange={(e) => updateField('lengthCm', e.target.value)} className="input-field font-mono font-bold" required />
            </div>
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">Breadth (cm)</label>
              <input type="number" step="0.1" min="0.1" value={form.breadthCm} onChange={(e) => updateField('breadthCm', e.target.value)} className="input-field font-mono font-bold" required />
            </div>
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">Height (cm)</label>
              <input type="number" step="0.1" min="0.1" value={form.heightCm} onChange={(e) => updateField('heightCm', e.target.value)} className="input-field font-mono font-bold" required />
            </div>
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">Actual Weight (kg)</label>
              <input type="number" step="0.1" min="0.1" value={form.actualWeightKg} onChange={(e) => updateField('actualWeightKg', e.target.value)} className="input-field font-mono font-bold text-[#5046e4]" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['B2C', 'B2B'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField('orderType', type)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      form.orderType === type
                        ? 'bg-[#5046e4] text-white border-[#5046e4] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type} {type === 'B2C' ? '(Consumer)' : '(Enterprise)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'PREPAID', label: '💳 Prepaid' },
                  { key: 'COD', label: '💵 COD (+Surcharge)' },
                ].map((pm) => (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => updateField('paymentType', pm.key)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      form.paymentType === pm.key
                        ? 'bg-[#5046e4] text-white border-[#5046e4] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-sm font-black shadow-md flex items-center justify-center gap-2"
        >
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Computing Dynamic Fare...' : 'Preview Delivery Charge →'}
        </button>
      </form>
    </div>
  );
}
