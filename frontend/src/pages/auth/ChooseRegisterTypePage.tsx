import React from 'react';
import { Link } from 'react-router-dom';
import DeliveroAuthTruckIllustration from '../../components/DeliveroAuthTruckIllustration';

export default function ChooseRegisterTypePage() {
  const roles = [
    {
      title: 'I am a Customer',
      desc: 'Book orders, track deliveries and enjoy our services.',
      path: '/register/customer',
      icon: '👤',
      color: 'bg-indigo-50 text-[#5046e4] border-indigo-100',
    },
    {
      title: 'I am a Delivery Agent',
      desc: 'Deliver orders and earn with Delivero.',
      path: '/register/agent',
      icon: '🛵',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'I am an Admin',
      desc: 'Manage operations, users and all deliveries.',
      path: '/register/admin',
      icon: '🛡️',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#5046e4] flex items-center justify-center text-white font-black text-base shadow-[0_2px_10px_rgba(80,70,228,0.35)]">
            ✦
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">Delivero</span>
        </Link>
      </header>

      {/* Main Two-Column Layout */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
              Join Delivero <br />
              <span className="text-[#5046e4]">Today!</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed font-medium">
              Create your account and start your seamless delivery experience.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-base shrink-0">
                🛰️
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Real-time Tracking</h4>
                <p className="text-2xs text-slate-500 font-medium">Track your orders in real-time with live GPS</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-base shrink-0">
                🛡️
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Secure & Reliable</h4>
                <p className="text-2xs text-slate-500 font-medium">Your deliveries are safe with us</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-base shrink-0">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Fast & On-time</h4>
                <p className="text-2xs text-slate-500 font-medium">We deliver on our promise</p>
              </div>
            </div>
          </div>

          <DeliveroAuthTruckIllustration />

          <div className="flex items-center gap-2 text-2xs font-semibold text-slate-500">
            <span>🛡️</span>
            <span>Your data is 100% secure with us</span>
          </div>
        </div>

        {/* Right Column: Choose Registration Type */}
        <div className="lg:col-span-5">
          <div className="delivero-card p-7 sm:p-9 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Choose how you want to register
              </p>
            </div>

            <div className="space-y-3.5">
              {roles.map((r) => (
                <Link
                  key={r.title}
                  to={r.path}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-[#5046e4] hover:shadow-md transition-all flex items-center justify-between gap-4 group block bg-white"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${r.color}`}>
                      {r.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#5046e4] transition-colors">
                        {r.title}
                      </h4>
                      <p className="text-3xs text-slate-500 mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 group-hover:text-[#5046e4] group-hover:translate-x-1 transition-all text-sm">
                    →
                  </span>
                </Link>
              ))}
            </div>

            <div className="text-center pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-[#5046e4] font-bold hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
