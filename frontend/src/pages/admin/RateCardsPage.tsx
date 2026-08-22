import React, { useState, useEffect } from 'react';
import { rateCardApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';

export default function RateCardsPage() {
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [baseCharge, setBaseCharge] = useState('');
  const [perKgCharge, setPerKgCharge] = useState('');
  const [orderType, setOrderType] = useState('B2C');
  const [rateType, setRateType] = useState('INTRA_ZONE');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Live Tariff Simulator State
  const [simWeight, setSimWeight] = useState('3.5');
  const [simDistance, setSimDistance] = useState('25');
  const [simOrderType, setSimOrderType] = useState('B2C');
  const [simRateType, setSimRateType] = useState('INTRA_ZONE');

  useEffect(() => {
    loadRateCards();
  }, []);

  const loadRateCards = async () => {
    setLoading(true);
    try {
      const res = await rateCardApi.getAll();
      setRateCards(res.data);
    } catch (err) {
      console.error('Failed to load rate cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCard(null);
    setOrderType('B2C');
    setRateType('INTRA_ZONE');
    setBaseCharge('');
    setPerKgCharge('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (card: any) => {
    setEditingCard(card);
    setOrderType(card.orderType);
    setRateType(card.rateType);
    setBaseCharge(card.baseCharge.toString());
    setPerKgCharge(card.perKgCharge.toString());
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingCard) {
        await rateCardApi.update(editingCard.id, {
          baseCharge: parseFloat(baseCharge),
          perKgCharge: parseFloat(perKgCharge),
        });
      } else {
        await rateCardApi.create({
          orderType,
          rateType,
          baseCharge: parseFloat(baseCharge),
          perKgCharge: parseFloat(perKgCharge),
        });
      }
      setShowModal(false);
      await loadRateCards();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save rate card.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate simulated tariff
  const matchingCard = rateCards.find((c) => c.orderType === simOrderType && c.rateType === simRateType);
  const simW = parseFloat(simWeight) || 0;
  const simD = parseFloat(simDistance) || 0;
  const baseT = matchingCard ? matchingCard.baseCharge : 50;
  const weightT = matchingCard ? simW * matchingCard.perKgCharge : simW * 20;
  const distT = simRateType === 'INTRA_ZONE' ? Math.max(0, simD - 5) * 1.8 : simD * 0.4;
  const simTotal = Math.round((baseT + weightT + distT) * 100) / 100;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-300 bg-clip-text text-transparent">
            Tariff & Rate Card Engineering
          </h1>
          <p className="text-slate-400 mt-1">Configure multi-tier shipping matrices and simulate customer pricing in real time</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary text-xs py-3 px-5 shadow-glow font-bold">
          + Add New Rate Card
        </button>
      </div>

      {/* Live Interactive Tariff Simulator */}
      <div className="glass-panel p-6 mb-8 border-2 border-indigo-500/30 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span className="text-indigo-400">⚡</span> Live Dynamic Tariff Simulator
            </h3>
            <p className="text-xs text-slate-400">Test how tariff parameters calculate total freight for any package</p>
          </div>
          <span className="badge bg-indigo-500/20 text-indigo-300 text-xs">
            Interactive Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1">Order Mode</label>
            <select
              value={simOrderType}
              onChange={(e) => setSimOrderType(e.target.value)}
              className="input-field py-2 text-xs font-semibold text-slate-200"
            >
              <option value="B2C">🛍️ B2C (Retail)</option>
              <option value="B2B">🏢 B2B (Enterprise)</option>
            </select>
          </div>

          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1">Corridor</label>
            <select
              value={simRateType}
              onChange={(e) => setSimRateType(e.target.value)}
              className="input-field py-2 text-xs font-semibold text-slate-200"
            >
              <option value="INTRA_ZONE">🏠 Intra-Zone (Regional)</option>
              <option value="INTER_ZONE">🌐 Inter-Zone (Express)</option>
            </select>
          </div>

          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1">Billable Weight (kg)</label>
            <input
              type="number"
              step="0.5"
              min="0.1"
              value={simWeight}
              onChange={(e) => setSimWeight(e.target.value)}
              className="input-field py-2 text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1">Route Distance (km)</label>
            <input
              type="number"
              step="5"
              min="1"
              value={simDistance}
              onChange={(e) => setSimDistance(e.target.value)}
              className="input-field py-2 text-xs font-mono font-bold"
            />
          </div>
        </div>

        {/* Calculated Simulation Output */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-3xs text-slate-500 uppercase">Base Tariff:</span>
              <p className="font-bold font-mono text-slate-200">{formatCurrency(baseT)}</p>
            </div>
            <div>
              <span className="text-3xs text-slate-500 uppercase">Weight Charge:</span>
              <p className="font-bold font-mono text-slate-200">{formatCurrency(weightT)}</p>
            </div>
            <div>
              <span className="text-3xs text-slate-500 uppercase">Distance Charge:</span>
              <p className="font-bold font-mono text-slate-200">{formatCurrency(distT)}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xs text-indigo-400 font-bold uppercase">Estimated Total Customer Fare</span>
            <p className="text-2xl font-black text-indigo-300 font-mono">{formatCurrency(simTotal)}</p>
          </div>
        </div>
      </div>

      {/* Configured Rate Cards Grid */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
        Active Production Rate Cards ({rateCards.length})
      </h3>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="w-9 h-9 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading rate cards...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rateCards.map((card) => (
            <div key={card.id} className="glass-panel p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl shadow-glow">
                      {card.rateType === 'INTRA_ZONE' ? '🏠' : '🌐'}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-100">
                        {card.orderType} • {card.rateType === 'INTRA_ZONE' ? 'Intra-Zone' : 'Inter-Zone'}
                      </h3>
                      <p className="text-2xs text-slate-400">
                        {card.rateType === 'INTRA_ZONE' ? 'Within Same Distribution Zone' : 'Cross-Zone Long-Haul Interstate'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(card)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold border border-slate-700"
                  >
                    ✏️ Edit Tariff
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <span className="text-3xs font-bold uppercase text-slate-400">Base Handling Charge</span>
                    <p className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">{formatCurrency(card.baseCharge)}</p>
                  </div>
                  <div>
                    <span className="text-3xs font-bold uppercase text-slate-400">Per Additional Kg</span>
                    <p className="text-xl font-extrabold text-indigo-300 font-mono mt-0.5">{formatCurrency(card.perKgCharge)} / kg</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 animate-scale-in border-2 border-indigo-500/40">
            <h3 className="text-xl font-bold text-slate-100 mb-4">
              {editingCard ? 'Modify Rate Card Tariff' : 'Create New Tariff Matrix'}
            </h3>
            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingCard && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-2xs font-bold uppercase text-slate-400 mb-1.5">Order Type</label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="input-field text-xs"
                    >
                      <option value="B2C">B2C (Retail)</option>
                      <option value="B2B">B2B (Enterprise)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-bold uppercase text-slate-400 mb-1.5">Rate Type</label>
                    <select
                      value={rateType}
                      onChange={(e) => setRateType(e.target.value)}
                      className="input-field text-xs"
                    >
                      <option value="INTRA_ZONE">Intra-Zone</option>
                      <option value="INTER_ZONE">Inter-Zone</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-2xs font-bold uppercase text-slate-400 mb-1.5">Base Charge (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={baseCharge}
                  onChange={(e) => setBaseCharge(e.target.value)}
                  className="input-field font-mono font-bold text-sm"
                  placeholder="e.g. 50.00"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase text-slate-400 mb-1.5">Per Kg Charge (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={perKgCharge}
                  onChange={(e) => setPerKgCharge(e.target.value)}
                  className="input-field font-mono font-bold text-sm"
                  placeholder="e.g. 20.00"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save Tariff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
