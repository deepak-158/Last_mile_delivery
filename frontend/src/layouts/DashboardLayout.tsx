import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Zap,
  MapPin,
  CreditCard,
  Banknote,
  Users,
  Bike,
  Radio,
  TrendingUp,
  BarChart3,
  Scale,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  Search,
  Gift,
  Wallet,
  Tag,
  User,
  MessageSquare,
  Sparkles,
  X,
  Menu,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentOnline, setAgentOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user.role === 'ADMIN';
  const isAgent = user.role === 'AGENT';
  const isCustomer = user.role === 'CUSTOMER';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;

    if (isCustomer) {
      navigate(`/customer/track?id=${encodeURIComponent(clean)}`);
    } else if (isAdmin) {
      navigate(`/admin/orders?search=${encodeURIComponent(clean)}`);
    } else if (isAgent) {
      navigate(`/agent/orders?search=${encodeURIComponent(clean)}`);
    }
  };

  const adminNav = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Orders', path: '/admin/orders', icon: Package },
    { label: 'Assignments', path: '/admin/assignments', icon: Zap },
    { label: 'Zones & Areas', path: '/admin/zones', icon: MapPin },
    { label: 'Rate Cards', path: '/admin/rate-cards', icon: CreditCard },
    { label: 'COD Config', path: '/admin/cod-config', icon: Banknote },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Delivery Agents', path: '/admin/agents', icon: Bike },
    { label: 'Live Tracking', path: '/admin/live-tracking', icon: Radio },
    { label: 'Earnings', path: '/admin/earnings', icon: TrendingUp },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Disputes / Failed', path: '/admin/disputes', icon: Scale },
    { label: 'Activity Logs', path: '/admin/activity-logs', icon: ClipboardList },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const agentNav = [
    { label: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
    { label: 'Deliveries', path: '/agent/orders', icon: Bike },
    { label: 'Delivery Flow', path: '/agent/delivery-flow', icon: Zap },
    { label: 'Earnings', path: '/agent/earnings', icon: TrendingUp },
    { label: 'Wallet', path: '/agent/wallet', icon: Wallet },
    { label: 'Profile', path: '/agent/profile', icon: User },
    { label: 'Notifications', path: '/agent/notifications', icon: Bell },
    { label: 'Help & Support', path: '/agent/support', icon: MessageSquare },
    { label: 'Settings', path: '/agent/settings', icon: Settings },
  ];

  const customerNav = [
    { label: 'Dashboard', path: '/customer/home', icon: LayoutDashboard },
    { label: 'Book Parcel', path: '/customer/orders/new', icon: Zap },
    { label: 'My Orders', path: '/customer/orders', icon: Package },
    { label: 'Track Order', path: '/customer/track', icon: Radio },
    { label: 'Saved Addresses', path: '/customer/addresses', icon: MapPin },
    { label: 'Payment Methods', path: '/customer/payments', icon: CreditCard },
    { label: 'Wallet', path: '/customer/wallet', icon: Wallet },
    { label: 'Offers', path: '/customer/offers', icon: Tag },
    { label: 'Refer & Earn', path: '/customer/refer', icon: Gift },
    { label: 'Profile', path: '/customer/profile', icon: User },
    { label: 'Help & Support', path: '/customer/support', icon: MessageSquare },
  ];

  const navItems = isAdmin ? adminNav : isAgent ? agentNav : customerNav;
  const roleTitle = isAdmin ? 'Admin Panel' : isAgent ? 'Agent Panel' : 'Customer';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* ─── Dark Navy Delivero Sidebar (#141724) ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#141724] border-r border-[#1e2235] flex flex-col transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1e2235]">
          <div className="w-8 h-8 rounded-xl bg-[#5046e4] flex items-center justify-center text-white font-black text-lg shadow-[0_2px_10px_rgba(80,70,228,0.4)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Delivero <span className="text-xs text-[#818cf8] font-semibold">{roleTitle}</span>
            </h1>
          </div>
        </div>

        {/* Role Identity Card in Sidebar */}
        <div className="p-3.5 mx-3 mt-3 rounded-2xl bg-[#1c2033] border border-[#272c44]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5046e4] text-white flex items-center justify-center font-black text-sm shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-3xs text-slate-400 font-mono">{user.role} • {user.email.split('@')[0]}</p>
            </div>
          </div>

          {/* Delivery Agent Live Status Toggle */}
          {isAgent && (
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#272c44]">
              <span className="text-2xs text-slate-300 font-medium flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${agentOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {agentOnline ? 'Online Dispatch' : 'Offline'}
              </span>
              <button
                type="button"
                onClick={() => setAgentOnline(!agentOnline)}
                className={`w-9 h-5 rounded-full transition-colors relative ${agentOnline ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    agentOnline ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && item.path !== '/customer/home' && location.pathname.startsWith(item.path + '/'));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={isActive ? 'delivero-sidebar-item-active' : 'delivero-sidebar-item'}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Customer Refer & Earn promo card in sidebar */}
        {isCustomer && (
          <div className="mx-3 mb-2 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-center">
            <Gift className="w-5 h-5 mx-auto text-indigo-400 mb-1" />
            <p className="text-2xs font-bold text-indigo-200">Refer & Earn</p>
            <p className="text-3xs text-indigo-300">Invite friends & earn ₹100</p>
            <Link
              to="/customer/refer"
              className="mt-2 block w-full py-1 rounded-lg bg-[#5046e4] text-white text-3xs font-bold hover:bg-[#4338ca] transition-colors"
            >
              Refer Now
            </Link>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#1e2235]">
          <button
            onClick={handleLogout}
            className="w-full delivero-sidebar-item text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer flex items-center gap-2.5"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Input with Enter handler */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isCustomer ? 'Track ID, consignment # (Press Enter)...' : 'Search orders, couriers, zones...'}
                className="pl-8 pr-8 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-400 rounded-xl text-xs text-slate-800 placeholder-slate-400 w-72 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>

            {/* Notification icon */}
            <Link
              to={isAdmin ? '/admin/notifications' : isAgent ? '/agent/notifications' : '/customer/notifications'}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </Link>

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#5046e4] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
                <p className="text-3xs text-slate-400 font-semibold mt-0.5">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
