import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { seedService } from '../../services/seedService';
import DeliveroAuthTruckIllustration from '../../components/DeliveroAuthTruckIllustration';
import GoogleOnboardingModal from '../../components/GoogleOnboardingModal';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'Customer' | 'Delivery Agent' | 'Admin'>('Customer');
  const [identifier, setIdentifier] = useState('customer@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [onboardingUser, setOnboardingUser] = useState<any>(null);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (role: 'Customer' | 'Delivery Agent' | 'Admin') => {
    setSelectedRole(role);
    if (role === 'Customer') {
      setIdentifier('customer@example.com');
      setPassword('password123');
    } else if (role === 'Delivery Agent') {
      setIdentifier('agent.north@lastmile.dev');
      setPassword('password123');
    } else if (role === 'Admin') {
      setIdentifier('admin@lastmile.dev');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let loginEmail = identifier.trim();
      if (!loginEmail.includes('@')) {
        if (selectedRole === 'Admin') loginEmail = 'admin@lastmile.dev';
        else if (selectedRole === 'Delivery Agent') loginEmail = 'agent.north@lastmile.dev';
        else loginEmail = 'customer@example.com';
      }

      await login(loginEmail, password || 'password123');

      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed.role === 'ADMIN') {
          navigate('/admin/dashboard');
          return;
        }
        if (parsed.role === 'AGENT') {
          navigate('/agent/dashboard');
          return;
        }
      }
      navigate('/customer/home');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Left Column: Branding, Benefits & Truck Illustration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
              Smart Delivery. <br />
              <span className="text-[#5046e4]">Simplified.</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed font-medium">
              Delivering packages, building trust. Every mile, on time.
            </p>
          </div>

          {/* 3 Value Bullets */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-base shrink-0">
                🛰️
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Real-time Tracking</h4>
                <p className="text-2xs text-slate-500 font-medium">Track your orders in real-time with live GPS radar</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-base shrink-0">
                🛡️
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Secure & Reliable</h4>
                <p className="text-2xs text-slate-500 font-medium">Your deliveries and payments are always protected</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-base shrink-0">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Fast & On-time</h4>
                <p className="text-2xs text-slate-500 font-medium">We deliver on our promise with 99.9% on-time rate</p>
              </div>
            </div>
          </div>

          {/* Delivero Truck Illustration */}
          <DeliveroAuthTruckIllustration />

          <div className="flex items-center gap-2 text-2xs font-semibold text-slate-500">
            <span>🛡️</span>
            <span>Your data is 100% secure with us</span>
          </div>
        </div>

        {/* Right Column: Form Card with Role Tabs (5 cols) */}
        <div className="lg:col-span-5">
          <div className="delivero-card p-7 sm:p-9 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Welcome Back 👋
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Login to your Delivero account
              </p>
            </div>

            {/* Role Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              {(['Customer', 'Delivery Agent', 'Admin'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`py-2 rounded-lg transition-all text-2xs ${
                    selectedRole === role
                      ? 'bg-white text-[#5046e4] shadow-xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-slide-down">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-2xs font-bold text-slate-600 mb-1.5">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">✉️</span>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your email or phone number"
                    className="input-field pl-9 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field pl-9 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-2xs">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#5046e4] focus:ring-[#5046e4]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[#5046e4] font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-sm font-extrabold shadow-md mt-2"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            {/* Social Logins */}
            <div className="space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-3xs font-bold uppercase text-slate-400 absolute">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      const targetRole = selectedRole === 'Admin' ? 'ADMIN' : selectedRole === 'Delivery Agent' ? 'AGENT' : 'CUSTOMER';
                      await loginWithGoogle(targetRole);

                      const savedUserStr = localStorage.getItem('user');
                      if (savedUserStr) {
                        const parsed = JSON.parse(savedUserStr);
                        // Admin accounts bypass onboarding completely
                        if (parsed.role === 'ADMIN') {
                          navigate('/admin/dashboard');
                          return;
                        }
                        // If new user or missing phone for customer/agent, show onboarding modal
                        if (parsed.isNewUser || !parsed.phone) {
                          setOnboardingUser(parsed);
                          return;
                        }
                        if (parsed.role === 'AGENT') {
                          navigate('/agent/dashboard');
                          return;
                        }
                      }
                      navigate('/customer/home');
                    } catch (err: any) {
                      setError(err?.message || 'Google Sign-In failed.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-2xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors w-full col-span-2 sm:col-span-1"
                >
                  <span className="text-sm font-bold text-red-500">G</span>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('Customer')}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-2xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="text-sm"></span>
                  <span>Apple</span>
                </button>
              </div>
            </div>

            {/* Switch to Register & Demo Seed */}
            <div className="text-center pt-2 space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#5046e4] font-bold hover:underline">
                  Register Now
                </Link>
              </p>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError('');
                  const res = await seedService.initializeDemoData();
                  setLoading(false);
                  if (res.success) {
                    alert('✅ Firebase demo data (Zones, Rate Cards, Demo Accounts) initialized successfully!');
                  } else {
                    setError(res.message);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-2xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <span>🌱</span>
                <span>Initialize Firebase Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Google Sign-In New User Onboarding Modal */}
      {onboardingUser && (
        <GoogleOnboardingModal
          user={onboardingUser}
          onComplete={(profile) => {
            setOnboardingUser(null);
            if (profile.role === 'ADMIN') navigate('/admin/dashboard');
            else if (profile.role === 'AGENT') navigate('/agent/dashboard');
            else navigate('/customer/home');
          }}
          onCancel={() => setOnboardingUser(null)}
        />
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card max-w-sm w-full p-6 text-center animate-scale-in space-y-3">
            <span className="text-3xl block">🔑</span>
            <h3 className="text-base font-extrabold text-slate-900">Reset Password</h3>
            <p className="text-xs text-slate-500">
              Demo passwords for all seeded roles are set to <span className="font-mono font-bold text-[#5046e4]">password123</span>
            </p>
            <button onClick={() => setShowForgotModal(false)} className="btn-primary w-full text-xs font-bold">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
