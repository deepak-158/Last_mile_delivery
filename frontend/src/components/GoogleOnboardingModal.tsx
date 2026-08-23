import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, UserProfile } from '../services/authService';

interface GoogleOnboardingModalProps {
  user: UserProfile;
  onComplete: (profile: UserProfile) => void;
  onCancel: () => void;
}

export default function GoogleOnboardingModal({ user, onComplete, onCancel }: GoogleOnboardingModalProps) {
  const navigate = useNavigate();
  const [role, setRole] = useState<'CUSTOMER' | 'AGENT'>('CUSTOMER');
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [vehicleType, setVehicleType] = useState('Two Wheeler / Motorcycle');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [zoneId, setZoneId] = useState('zone-north-zone');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please provide a valid contact phone number.');
      return;
    }

    if (role === 'AGENT' && !vehicleNumber.trim()) {
      setError('Please provide your vehicle registration number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updatedProfile = await authService.completeOnboarding(user.id, {
        name: name.trim() || user.name,
        phone: phone.trim(),
        role,
        vehicleType,
        vehicleNumber: vehicleNumber.trim(),
        zoneId,
        city: city.trim(),
        state: state.trim(),
      });

      onComplete(updatedProfile);

      if (role === 'AGENT') {
        alert('🎉 Welcome to Delivero! Your Delivery Agent application has been submitted for Admin approval. You will receive active delivery jobs once verified.');
        navigate('/agent/dashboard');
      } else {
        navigate('/customer/home');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete registration onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="delivero-card max-w-lg w-full p-6 sm:p-8 animate-scale-in space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-xl font-black">
              ✦
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Complete Your Profile</h2>
              <p className="text-xs text-slate-500">Welcome, {user.email}! Please provide a few quick details.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Role Selection */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  role === 'CUSTOMER'
                    ? 'border-[#5046e4] bg-indigo-50/50 shadow-sm ring-2 ring-[#5046e4]/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl block mb-1">📦</span>
                <span className="text-xs font-black text-slate-900 block">Customer</span>
                <span className="text-3xs text-slate-500 font-medium">Send & track parcel deliveries</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('AGENT')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  role === 'AGENT'
                    ? 'border-[#5046e4] bg-indigo-50/50 shadow-sm ring-2 ring-[#5046e4]/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl block mb-1">🛵</span>
                <span className="text-xs font-black text-slate-900 block">Delivery Agent</span>
                <span className="text-3xs text-slate-500 font-medium">Deliver orders & earn per trip</span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="delivero-input text-xs"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Contact Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="delivero-input text-xs"
            />
          </div>

          {/* Delivery Agent Specific Details */}
          {role === 'AGENT' && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-fade-in">
              <div className="flex items-center gap-2 text-2xs font-black uppercase tracking-wider text-slate-700">
                <span>🛡️</span> Vehicle & Dispatch Verification
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-600 mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="delivero-input text-xs bg-white"
                >
                  <option value="Two Wheeler / Motorcycle">🏍️ Two Wheeler / Motorcycle</option>
                  <option value="Electric Bike / EV Scooter">⚡ Electric Bike / EV Scooter</option>
                  <option value="Three Wheeler / Auto Cargo">🛺 Three Wheeler / Auto Cargo</option>
                  <option value="Four Wheeler / Mini Van">🚐 Four Wheeler / Mini Van</option>
                </select>
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-600 mb-1">
                  Vehicle Registration Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. DL 01 AB 1234"
                  className="delivero-input text-xs font-mono bg-white uppercase"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-600 mb-1">Primary Operating Zone</label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="delivero-input text-xs bg-white"
                >
                  <option value="zone-north-zone">North Zone (Delhi NCR, UP, Haryana, Punjab)</option>
                  <option value="zone-south-zone">South Zone (Bengaluru, Chennai, Hyderabad, Kerala)</option>
                  <option value="zone-east-zone">East Zone (Kolkata, Odisha, Bihar, Jharkhand)</option>
                  <option value="zone-west-zone">West Zone (Mumbai, Pune, Ahmedabad, Rajasthan)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-3xs font-medium leading-relaxed">
                ℹ️ <strong>Note:</strong> New delivery courier accounts require Admin verification before active delivery assignments are dispatched to you.
              </div>
            </div>
          )}

          {/* Customer Specific Details */}
          {role === 'CUSTOMER' && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div>
                <label className="block text-3xs font-bold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New Delhi"
                  className="delivero-input text-xs"
                />
              </div>
              <div>
                <label className="block text-3xs font-bold text-slate-600 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Delhi"
                  className="delivero-input text-xs"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-xs font-bold shadow-md mt-4"
          >
            {loading ? 'Setting up Profile...' : 'Complete & Launch Delivero 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
