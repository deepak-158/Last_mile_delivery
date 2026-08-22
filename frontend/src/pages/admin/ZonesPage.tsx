import React, { useState, useEffect } from 'react';
import { zoneApi } from '../../api/endpoints';

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
      setZones(res.data);
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
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title text-3xl">Zone & Pincode Management</h1>
          <p className="text-surface-500 mt-1">Configure delivery regions and assign service pincodes</p>
        </div>
        <button onClick={() => { setShowZoneModal(true); setError(''); }} className="btn-primary">
          + Add New Zone
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zones.map((zone) => (
            <div key={zone.id} className="glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-surface-100 flex items-center gap-2">
                      <span>🗺️</span> {zone.name}
                    </h3>
                    <p className="text-xs text-surface-400 mt-1">{zone.description || 'No description'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteZone(zone.id, zone.name)}
                    className="text-red-400 hover:text-red-300 text-xs p-1"
                    title="Delete Zone"
                  >
                    🗑️
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                      Mapped Pincodes ({zone.areaMappings?.length || 0})
                    </span>
                    <button
                      onClick={() => { setShowAreaModal(zone.id); setError(''); }}
                      className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      + Add Pincode
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-surface-900/60 border border-surface-700/30">
                    {zone.areaMappings?.length > 0 ? (
                      zone.areaMappings.map((m: any) => (
                        <span
                          key={m.id}
                          className="px-2.5 py-1 rounded-lg bg-surface-800 text-xs font-mono text-brand-300 border border-surface-700/50"
                        >
                          {m.areaIdentifier}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-surface-500 italic p-2">No pincodes mapped yet</span>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-surface-100 mb-4">Create New Delivery Zone</h3>
            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">{error}</div>}
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Zone Name</label>
                <input
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Central Zone"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Description</label>
                <input
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  className="input-field"
                  placeholder="e.g. MP, Chhattisgarh regions"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowZoneModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Creating...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Area Pincode Modal */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-surface-100 mb-2">Map Pincode to Zone</h3>
            <p className="text-xs text-surface-400 mb-4">Assign a 6-digit postal code to this regional distribution zone.</p>

            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">{error}</div>}
            
            <form onSubmit={handleAddArea} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">6-Digit Indian Pincode</label>
                <input
                  value={pincode}
                  maxLength={6}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPincode(val);
                  }}
                  className="input-field font-mono font-bold text-base"
                  placeholder="e.g. 110001, 560001, 400001"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAreaModal(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving || pincode.length !== 6} className="btn-primary flex-1">
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
