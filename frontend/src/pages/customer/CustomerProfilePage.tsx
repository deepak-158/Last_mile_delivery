import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function CustomerProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const menu = [
    { label: 'Saved Addresses', path: '/customer/addresses', icon: '📍' },
    { label: 'Payment Methods & Cards', path: '/customer/payments', icon: '💳' },
    { label: 'My Consignments & Orders', path: '/customer/orders', icon: '📦' },
    { label: 'Notifications & Alerts', path: '/customer/notifications', icon: '🔔' },
    { label: 'Customer Support', path: '/customer/support', icon: '💬' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name cannot be blank.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({ name, phone });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>👤</span> Account Profile
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Manage your personal details, contact mobile number, and delivery settings
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold animate-slide-down ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Card & Editor */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        {!isEditing ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#5046e4] text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{user?.name || 'Customer'}</h2>
                  <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5046e4] border border-indigo-100">
                    {user?.role || 'CUSTOMER'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{user?.email}</p>
                <p className="text-xs text-slate-700 font-mono font-bold mt-1">
                  📱 {user?.phone || 'No phone number added'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary text-xs font-bold py-2.5 px-4 cursor-pointer self-start sm:self-center"
            >
              ✏️ Edit Details
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Edit Personal Information</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Deepak Shukla"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number (For Twilio SMS Alerts)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Email Address (Account Identifier)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-500 text-xs cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs font-bold px-6 py-2 shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>💾</span> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Profile Menu List */}
      <div className="bg-white border border-slate-200 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-sm">
        {menu.map((m) => (
          <Link
            key={m.label}
            to={m.path}
            className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 block"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{m.icon}</span>
              <span>{m.label}</span>
            </div>
            <span className="text-slate-400">›</span>
          </Link>
        ))}

        <div className="p-4 px-6">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 text-center text-xs font-extrabold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
