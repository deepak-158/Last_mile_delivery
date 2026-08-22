import React, { useState, useEffect } from 'react';
import { codConfigApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';

export default function CODConfigPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [b2cAmount, setB2cAmount] = useState('');
  const [b2bAmount, setB2bAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await codConfigApi.getAll();
      setConfigs(res.data);
      const b2c = res.data.find((c: any) => c.orderType === 'B2C');
      const b2b = res.data.find((c: any) => c.orderType === 'B2B');
      if (b2c) setB2cAmount(b2c.surchargeAmount.toString());
      if (b2b) setB2bAmount(b2b.surchargeAmount.toString());
    } catch (err) {
      console.error('Failed to load COD config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await Promise.all([
        codConfigApi.upsert({ orderType: 'B2C', surchargeAmount: parseFloat(b2cAmount || '0') }),
        codConfigApi.upsert({ orderType: 'B2B', surchargeAmount: parseFloat(b2bAmount || '0') }),
      ]);
      setMessage('Cash on Delivery (COD) surcharges successfully updated across production routes.');
      await loadConfig();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-300 bg-clip-text text-transparent">
          Cash on Delivery (COD) Surcharge Controls
        </h1>
        <p className="text-slate-400 mt-1">Configure cash-handling fees and risk mitigation surcharges per business model</p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm mb-6 animate-slide-down">
          ✅ {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm mb-6 animate-slide-down">
          ❌ {error}
        </div>
      )}

      <div className="glass-panel p-8 border border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading COD configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* B2C Surcharge */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛍️</span>
                    <div>
                      <h3 className="font-extrabold text-slate-100 text-sm">Retail B2C COD Surcharge</h3>
                      <p className="text-3xs text-slate-400">Applied to consumer doorstep cash orders</p>
                    </div>
                  </div>
                  <span className="badge bg-indigo-500/20 text-indigo-300 text-3xs">
                    Consumer Tier
                  </span>
                </div>

                <div className="relative pt-2">
                  <span className="absolute left-4 top-5 text-slate-500 font-bold text-lg">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={b2cAmount}
                    onChange={(e) => setB2cAmount(e.target.value)}
                    className="input-field pl-9 font-mono font-black text-xl text-indigo-300"
                    placeholder="30.00"
                    required
                  />
                </div>
                <p className="text-3xs text-slate-500">Industry standard: ₹25 - ₹40 per consignment</p>
              </div>

              {/* B2B Surcharge */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏢</span>
                    <div>
                      <h3 className="font-extrabold text-slate-100 text-sm">Enterprise B2B COD Surcharge</h3>
                      <p className="text-3xs text-slate-400">Applied to high-volume commercial cash orders</p>
                    </div>
                  </div>
                  <span className="badge bg-purple-500/20 text-purple-300 text-3xs">
                    Enterprise Tier
                  </span>
                </div>

                <div className="relative pt-2">
                  <span className="absolute left-4 top-5 text-slate-500 font-bold text-lg">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={b2bAmount}
                    onChange={(e) => setB2bAmount(e.target.value)}
                    className="input-field pl-9 font-mono font-black text-xl text-purple-300"
                    placeholder="50.00"
                    required
                  />
                </div>
                <p className="text-3xs text-slate-500">Industry standard: ₹40 - ₹80 per consignment</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 shadow-glow"
              >
                {saving && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? 'Updating Production Tariffs...' : '💾 Save & Deploy COD Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
