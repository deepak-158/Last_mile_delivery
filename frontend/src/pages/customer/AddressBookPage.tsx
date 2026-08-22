import React, { useState, useEffect } from 'react';
import { addressApi, orderApi } from '../../api/endpoints';

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    label: 'Home',
    contactName: '',
    contactPhone: '',
    pincode: '',
    city: '',
    state: '',
    locality: '',
    address: '',
  });

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [localities, setLocalities] = useState<string[]>([]);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressApi.getAll();
      setAddresses(res.data || []);
    } catch (err) {
      console.error('Failed to load address book:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch city & localities when pincode is entered
  const handlePincodeChange = async (pin: string) => {
    const cleanPin = pin.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6 && /^[1-9][0-9]{5}$/.test(cleanPin)) {
      setPincodeLoading(true);
      try {
        const res = await orderApi.lookupPincode(cleanPin);
        if (res.data.valid) {
          setForm((prev) => ({
            ...prev,
            city: res.data.city || '',
            state: res.data.state || '',
            locality: res.data.selectedLocality || (res.data.localities?.[0] || ''),
          }));
          setLocalities(res.data.localities || []);
        }
      } catch (err) {
        console.error('Pincode lookup error:', err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await addressApi.save(form);
      setSuccess('Address successfully saved to your Address Book.');
      setShowModal(false);
      setForm({
        label: 'Home',
        contactName: '',
        contactPhone: '',
        pincode: '',
        city: '',
        state: '',
        locality: '',
        address: '',
      });
      await loadAddresses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this saved address?')) return;
    try {
      await addressApi.delete(id);
      await loadAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📖</span> Saved Address Book
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage frequent pickup & delivery destinations for 1-click order auto-fill
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs py-3 px-5 shadow-md font-bold flex items-center gap-2"
        >
          <span>+</span> Add New Address
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-slide-down">
          ✅ {success}
        </div>
      )}

      {/* Address Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="w-9 h-9 border-3 border-[#5046e4]/30 border-t-[#5046e4] rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your address book...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 delivero-card p-8 space-y-3">
          <p className="text-5xl mb-1">📍</p>
          <h3 className="text-base font-extrabold text-slate-900">No Saved Addresses Yet</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Save your frequent home, warehouse, or client addresses to auto-fill orders in 1 click.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs font-bold shadow-sm mt-2">
            + Save First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="delivero-card p-5 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[#5046e4] text-3xs font-black tracking-wide uppercase">
                    🏷️ {addr.label}
                  </span>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs transition-colors"
                    title="Delete Address"
                  >
                    🗑️
                  </button>
                </div>

                <h3 className="text-sm font-black text-slate-900">{addr.contactName}</h3>
                <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">
                  📞 {addr.contactPhone}
                </p>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <p className="text-slate-800 font-semibold">{addr.address}</p>
                  <p className="text-slate-500 text-3xs font-mono font-medium">
                    {addr.locality ? addr.locality + ', ' : ''}{addr.city}, {addr.state} (PIN: {addr.pincode})
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-3xs text-slate-400 font-mono">
                <span>Saved on {new Date(addr.createdAt).toLocaleDateString()}</span>
                <span className="text-[#5046e4] font-bold group-hover:underline cursor-pointer">Use for booking →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="delivero-card max-w-lg w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Add New Address</h3>
                <p className="text-3xs text-slate-500 font-medium">Enter address details with instant postal auto-verification</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Address Label / Identifier *
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['Home', 'Office', 'Warehouse', 'Client'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setForm({ ...form, label: tag })}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        form.label === tag
                          ? 'bg-[#5046e4] text-white border-[#5046e4]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Custom label (e.g. Bangalore Hub 2)"
                  className="input-field text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="e.g. Amit Verma"
                    className="input-field text-xs font-semibold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="input-field text-xs font-mono font-semibold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Pincode (6-digit) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={form.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="110001"
                      className="input-field text-xs font-mono font-bold text-slate-900"
                      required
                    />
                    {pincodeLoading && (
                      <span className="absolute right-2.5 top-2.5 w-3.5 h-3.5 border-2 border-[#5046e4]/30 border-t-[#5046e4] rounded-full animate-spin" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    City / District *
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="input-field text-xs text-slate-900 font-semibold bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="State"
                    className="input-field text-xs text-slate-900 font-semibold bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Area / Locality / Sub-Post Office
                </label>
                {localities.length > 1 ? (
                  <select
                    value={form.locality}
                    onChange={(e) => setForm({ ...form, locality: e.target.value })}
                    className="input-field text-xs font-semibold text-slate-900"
                  >
                    {localities.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.locality}
                    onChange={(e) => setForm({ ...form, locality: e.target.value })}
                    placeholder="e.g. Sector 15 / Connaught Place"
                    className="input-field text-xs font-medium text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Doorstep / Flat / Building / Street Address *
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Flat 102, Tower 4, Prestige Park, MG Road"
                  className="input-field text-xs font-medium text-slate-900"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-3 text-xs font-black shadow-md flex items-center justify-center gap-2"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving...' : 'Save to Address Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
