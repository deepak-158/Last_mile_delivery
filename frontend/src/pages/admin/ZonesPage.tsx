import React, { useState, useEffect } from 'react';
import { zoneApi } from '../../api/endpoints';
import { MapPin, Trash2, Mail } from 'lucide-react';

export default function ZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState<string | null>(null); // zoneId
  const [zoneName, setZoneName] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await zoneApi.getAll();
      setZones(res.data || []);
    } catch (err) {
      console.error('Failed to load zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await zoneApi.create({ name: zoneName, description: zoneDesc });
      setShowZoneModal(false);
      setZoneName('');
      setZoneDesc('');
      await loadZones();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create zone.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAreaModal || !pincode) return;
    setSaving(true);
    setError('');
    try {
      await zoneApi.addArea(showAreaModal, { areaIdentifier: pincode, areaType: 'PINCODE' });
      setPincode('');
      setShowAreaModal(null);
      await loadZones();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add pincode.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete zone "${name}"?`)) return;
    try {
      await zoneApi.delete(id);
      await loadZones();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete zone.');
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#5046e4]" /> Zone & Pincode Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure operational delivery regions and map service postal PIN codes
          </p>
        </div>
        <button
          onClick={() => {
            setShowZoneModal(true);
            setError('');
          }}
          className="btn-primary text-xs font-bold shadow-sm cursor-pointer"
        >
          + Add New Zone
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-[#5046e4]/30 border-t-[#5046e4] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#5046e4]" /> {zone.name}
                    </h3>
                    <p className="text-2xs text-slate-500 font-medium mt-0.5">{zone.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteZone(zone.id, zone.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Mapped Pincodes */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Mapped PIN Codes ({zone.areas?.length || 0})
                    </span>
                    <button
                      onClick={() => {
                        setShowAreaModal(zone.id);
                        setError('');
                      }}
                      className="text-xs font-bold text-[#5046e4] hover:text-[#4338ca] transition-colors cursor-pointer"
                    >
                      + Add Pincode
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 min-h-[90px] flex flex-wrap gap-2 items-start content-start">
                    {zone.areas && zone.areas.length > 0 ? (
                      zone.areas.map((a: any) => (
                        <span
                          key={a.id || a.areaIdentifier}
                          className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 shadow-2xs flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3 text-slate-400" /> {a.areaIdentifier}
                        </span>
                      ))
                    ) : (
                      <p className="text-2xs text-slate-400 font-medium py-3 text-center w-full">
                        No individual PIN codes pinned. Automatically serves regional state postal zones.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scale-up text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Add Operational Zone</h3>
              <button
                onClick={() => setShowZoneModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateZone} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Zone Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Central Zone"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Description / States Covered
                </label>
                <input
                  type="text"
                  placeholder="e.g. Madhya Pradesh, Chhattisgarh"
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowZoneModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs font-bold px-5 py-2 shadow-md cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pincode Modal */}
      {showAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scale-up text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Map Service Postal Pincode</h3>
              <button
                onClick={() => setShowAreaModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddArea} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  6-Digit Postal PIN Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 462001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-base text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAreaModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs font-bold px-5 py-2 shadow-md cursor-pointer"
                >
                  {saving ? 'Adding...' : 'Add Pincode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
