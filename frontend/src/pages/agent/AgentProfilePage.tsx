import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AgentProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Personal Information', icon: '👤' },
    { label: 'Bank Details', icon: '🏦' },
    { label: 'Documents & Verification', icon: '📄' },
    { label: 'Vehicle Information', icon: '🛵' },
    { label: 'Change Password', icon: '🔒' },
    { label: 'App Settings', icon: '⚙️' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      <div className="delivero-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#5046e4] text-white flex items-center justify-center text-2xl font-black shadow-md">
            {user?.name.charAt(0) || 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">{user?.name || 'Rahul Sharma'}</h2>
              <span className="badge badge-active text-3xs">Online</span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email || 'rahul.sharma@email.com'}</p>
            <p className="text-3xs text-slate-400 font-mono">+91 1234567890 • ID: AGT1024</p>
          </div>
        </div>

        <button className="btn-secondary text-xs font-bold">
          Edit Profile
        </button>
      </div>

      <div className="delivero-card divide-y divide-slate-100 overflow-hidden">
        {menuItems.map((item) => (
          <div
            key={item.label}
            className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <span className="text-slate-400">›</span>
          </div>
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
