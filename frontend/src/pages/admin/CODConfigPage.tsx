import React, { useState, useEffect } from 'react';
import { codConfigApi } from '../../api/endpoints';

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
      setConfigs(res.data || []);
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
    <div className="animate-fade-in max-w-4xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>💵</span> Cash on Delivery (COD) Surcharge Controls
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure cash-handling fees and risk mitigation surcharges per business model
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-slide-down">
          ✅ {message}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-slide-down">
          ❌ {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="w-8 h-8 border-3 border-[#5046e4]/30 border-t-[#5046e4] rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading COD configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* B2C Surcharge */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🛍️</span>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Retail B2C COD Surcharge</h3>
                      <p className="text-3xs text-slate-500 font-medium">Applied to consumer doorstep cash orders</p>
                    </div>
                  </div>
                  <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5046e4] border border-indigo-100">
                    Consumer Tier
                  </span>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Surcharge Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500 font-bold text-base">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={b2cAmount}
                      onChange={(e) => setB2cAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-300 bg-white font-mono font-black text-xl text-slate-900 shadow-2xs"
                      placeholder="25.00"
                      required
                    />
                  </div>
                  <p className="text-3xs text-slate-400 font-medium mt-1.5">Industry standard: ₹25 - ₹40 per consignment</p>
                </div>
              </div>

              {/* B2B Surcharge */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🏢</span>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Enterprise B2B COD Surcharge</h3>
                      <p className="text-3xs text-slate-500 font-medium">Applied to commercial freight cash orders</p>
                    </div>
                  </div>
                  <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    Enterprise Tier
                  </span>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Surcharge Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500 font-bold text-base">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={b2bAmount}
                      onChange={(e) => setB2bAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-300 bg-white font-mono font-black text-xl text-slate-900 shadow-2xs"
                      placeholder="50.00"
                      required
                    />
                  </div>
                  <p className="text-3xs text-slate-400 font-medium mt-1.5">Industry standard: ₹40 - ₹80 per consignment</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs font-bold px-8 py-3 shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>💾</span> {saving ? 'Deploying Rules...' : 'Save & Deploy COD Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
