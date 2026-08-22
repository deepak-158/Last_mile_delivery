import React, { useState } from 'react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('General');
  const [saved, setSaved] = useState(false);

  const tabs = [
    'General',
    'Business Information',
    'Payment Settings',
    'Commission Settings',
    'Notifications',
    'Cancellation Policy',
    'Privacy & Security',
    'API Settings',
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage global configuration, fee schedules, and support credentials</p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-slide-down">
          ✅ Settings saved successfully across production clusters.
        </div>
      )}

      <div className="delivero-card overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Left Vertical Sub-Tabs */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-1 shrink-0">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === t
                  ? 'bg-white text-[#5046e4] shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Right Settings Form */}
        <div className="flex-1 p-6 md:p-8">
          <h3 className="text-base font-extrabold text-slate-900 mb-6">{activeTab} Settings</h3>

          <form onSubmit={handleSave} className="space-y-5 max-w-xl">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Platform Name
              </label>
              <input type="text" defaultValue="Delivero" className="input-field font-semibold" required />
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Support Email
              </label>
              <input type="email" defaultValue="support@delivero.com" className="input-field" required />
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Support Phone
              </label>
              <input type="tel" defaultValue="+91 1234567890" className="input-field font-mono" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Timezone
                </label>
                <select defaultValue="Asia/Kolkata" className="input-field font-medium">
                  <option value="Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option>
                  <option value="UTC">(GMT+00:00) UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Date Format
                </label>
                <select defaultValue="DD MMM, YYYY" className="input-field font-medium">
                  <option value="DD MMM, YYYY">DD MMM, YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Currency
              </label>
              <input type="text" defaultValue="INR (₹)" className="input-field font-semibold" readOnly />
            </div>

            <div className="pt-4">
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
