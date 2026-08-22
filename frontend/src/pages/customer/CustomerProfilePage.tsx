import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function CustomerProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menu = [
    { label: 'Personal Information', path: '/customer/profile', icon: '👤' },
    { label: 'Addresses', path: '/customer/addresses', icon: '📍' },
    { label: 'Payment Methods', path: '/customer/payments', icon: '💳' },
    { label: 'My Orders', path: '/customer/orders', icon: '📦' },
    { label: 'Notifications', path: '/customer/notifications', icon: '🔔' },
    { label: 'Help & Support', path: '/customer/support', icon: '💬' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-16">
      {/* Profile Header Card */}
      <div className="delivero-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#5046e4] text-white flex items-center justify-center text-2xl font-black shadow-sm">
            {user?.name.charAt(0) || 'D'}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{user?.name || 'Deepak Shukla'}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email || 'deepakshukla@gmail.com'}</p>
            <p className="text-3xs text-slate-400 font-mono mt-0.5">+91 9123456789</p>
          </div>
        </div>

        <button className="btn-secondary text-xs font-bold">
          Edit Profile
        </button>
      </div>

      {/* Profile Menu List */}
      <div className="delivero-card divide-y divide-slate-100 overflow-hidden">
        {menu.map((m) => (
          <Link
            key={m.label}
            to={m.path}
            className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700 block"
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
            className="w-full py-2.5 text-center text-xs font-extrabold text-rose-600 hover:text-rose-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
