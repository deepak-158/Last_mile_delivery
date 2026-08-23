import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DeliveroAuthTruckIllustration from '../../components/DeliveroAuthTruckIllustration';
import { User, Zap, ShieldCheck, Mail, Sparkles } from 'lucide-react';

export default function CustomerRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim() || `${phone.trim()}@customer.local`,
        password,
        phone: phone.trim(),
      });
      navigate('/customer/home');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
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
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">Delivero</span>
        </Link>
        <span className="px-3 py-1 bg-indigo-50 text-[#5046e4] font-bold text-xs rounded-xl flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Customer Registration
        </span>
      </header>

      {/* Main Two-Column Layout */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-6">
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Create Your <br />
              <span className="text-[#5046e4]">Customer Account</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Join Delivero and enjoy a seamless delivery experience.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5046e4] flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Real-time Tracking</h4>
                <p className="text-2xs text-slate-500">Track your orders in real-time with live ETA</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5046e4] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Secure & Reliable</h4>
                <p className="text-2xs text-slate-500">Your packages and payments are protected</p>
              </div>
            </div>
          </div>

          <DeliveroAuthTruckIllustration />
        </div>

        <div className="lg:col-span-6">
          <div className="delivero-card p-7 sm:p-9 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-4">
            <h2 className="text-xl font-black text-slate-900">Register as Customer</h2>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-3xs font-bold uppercase text-slate-500 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="input-field pl-9 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input-field pl-9 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shrink-0">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="input-field font-medium flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-bold uppercase text-slate-500 mb-1">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-bold uppercase text-slate-500 mb-1">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded text-[#5046e4]"
                />
                <label htmlFor="agree" className="text-3xs text-slate-600 font-medium">
                  I agree to the <a href="#" className="underline font-bold">Terms of Service</a> and <a href="#" className="underline font-bold">Privacy Policy</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-xs font-black shadow-md mt-2"
              >
                {loading ? 'Registering...' : 'Register as Customer'}
              </button>
            </form>

            <div className="text-center pt-2 text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#5046e4] font-bold hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
