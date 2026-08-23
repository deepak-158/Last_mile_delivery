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
      setRateCards(res.data || []);
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
  const distT = simRateType === 'INTRA_ZONE' ? Math.max(0, simD - 5) * 5.0 : Math.max(0, simD - 50) * 3.0;
  const simTotal = Math.round((baseT + weightT + distT) * 100) / 100;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>💳</span> Tariff & Rate Card Engineering
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure multi-tier shipping matrices and simulate customer pricing in real time
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-primary text-xs font-bold shadow-sm cursor-pointer"
        >
          + Add New Rate Card
        </button>
      </div>

      {/* Live Interactive Tariff Simulator Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-indigo-800/40">
          <div>
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
              <span>⚡</span> Live Dynamic Tariff Simulator
            </h3>
            <p className="text-2xs text-slate-300 font-medium mt-0.5">
              Test how tariff parameters calculate total customer freight for any package
            </p>
          </div>
          <span className="text-3xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            Realtime Matrix Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Order Mode
            </label>
            <select
              value={simOrderType}
              onChange={(e) => setSimOrderType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold"
            >
              <option value="B2C">🛍️ B2C (Retail)</option>
              <option value="B2B">🏢 B2B (Enterprise)</option>
            </select>
          </div>

          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Corridor
            </label>
            <select
              value={simRateType}
              onChange={(e) => setSimRateType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold"
            >
              <option value="INTRA_ZONE">🏠 Intra-Zone (Regional)</option>
              <option value="INTER_ZONE">🌐 Inter-Zone (Express)</option>
            </select>
          </div>

          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Billable Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.1"
              value={simWeight}
              onChange={(e) => setSimWeight(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Route Distance (km)
            </label>
            <input
              type="number"
              step="5"
              min="1"
              value={simDistance}
              onChange={(e) => setSimDistance(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-bold"
            />
          </div>
        </div>

        {/* Calculated Simulation Output */}
        <div className="p-4 rounded-2xl bg-black/40 border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6 text-xs">
            <div>
              <span className="text-3xs text-slate-400 uppercase font-bold">Base Tariff:</span>
              <p className="font-bold font-mono text-white text-sm">{formatCurrency(baseT)}</p>
            </div>
            <div>
              <span className="text-3xs text-slate-400 uppercase font-bold">Weight Charge:</span>
              <p className="font-bold font-mono text-white text-sm">{formatCurrency(weightT)}</p>
            </div>
            <div>
              <span className="text-3xs text-slate-400 uppercase font-bold">Distance Charge:</span>
              <p className="font-bold font-mono text-white text-sm">{formatCurrency(distT)}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xs text-indigo-300 font-bold uppercase tracking-wider">
              Estimated Total Customer Fare
            </span>
            <p className="text-3xl font-black text-amber-300 font-mono">{formatCurrency(simTotal)}</p>
          </div>
        </div>
      </div>

      {/* Production Rate Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Active Production Rate Cards ({rateCards.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-8 h-8 border-3 border-[#5046e4]/30 border-t-[#5046e4] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rateCards.map((card) => (
              <div
                key={card.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-2xs">
                        {card.rateType === 'INTRA_ZONE' ? '🏠' : '🌐'}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">
                          {card.orderType} • {card.rateType === 'INTRA_ZONE' ? 'Intra-Zone' : 'Inter-Zone'}
                        </h3>
                        <p className="text-2xs text-slate-500 font-medium">
                          {card.rateType === 'INTRA_ZONE'
                            ? 'Within Same Distribution Zone'
                            : 'Cross-Zone Long-Haul Interstate'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEdit(card)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
                    >
                      ✏️ Edit Tariff
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">
                        Base Handling Charge
                      </span>
                      <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                        {formatCurrency(card.baseCharge)}
                      </p>
                    </div>
                    <div>
                      <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">
                        Per Additional Kg
                      </span>
                      <p className="text-2xl font-black text-[#5046e4] font-mono mt-0.5">
                        {formatCurrency(card.perKgCharge)}{' '}
                        <span className="text-xs text-slate-500 font-sans font-semibold">/ kg</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scale-up text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingCard ? 'Modify Rate Card Tariff' : 'Create New Tariff Matrix'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {!editingCard && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Order Type
                    </label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                    >
                      <option value="B2C">B2C (Retail)</option>
                      <option value="B2B">B2B (Enterprise)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Rate Type
                    </label>
                    <select
                      value={rateType}
                      onChange={(e) => setRateType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                    >
                      <option value="INTRA_ZONE">Intra-Zone</option>
                      <option value="INTER_ZONE">Inter-Zone</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Base Charge (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baseCharge}
                    onChange={(e) => setBaseCharge(e.target.value)}
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-sm"
                    placeholder="50.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Per Additional Kg Charge (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={perKgCharge}
                    onChange={(e) => setPerKgCharge(e.target.value)}
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-sm"
                    placeholder="20.00"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs font-bold px-5 py-2 shadow-md cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Rate Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
