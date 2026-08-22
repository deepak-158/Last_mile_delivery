import React from 'react';
import { Link } from 'react-router-dom';

export default function CustomerOffersPage() {
  const offers = [
    { title: 'FLAT 25% OFF', subtitle: 'Up to ₹100 on orders above ₹199', code: 'SAVE25', bg: 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200' },
    { title: 'FREE DELIVERY', subtitle: 'On your next 3 orders', code: 'FREEDEL', bg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' },
    { title: '₹75 OFF', subtitle: 'On orders above ₹499', code: 'BIG75', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Best Offers for You</h1>
        <p className="text-xs text-slate-500 mt-0.5">Claim promotional discounts and complimentary shipping coupons</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map((off) => (
          <div key={off.code} className={`delivero-card p-6 border flex flex-col justify-between space-y-6 ${off.bg}`}>
            <div>
              <span className="text-3xs font-extrabold uppercase tracking-wider text-[#5046e4]">Special Voucher</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{off.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{off.subtitle}</p>

              <div className="mt-4 p-2.5 rounded-xl bg-white border border-slate-200/80 inline-flex items-center gap-2">
                <span className="text-3xs font-bold text-slate-400">CODE:</span>
                <span className="font-mono font-black text-xs text-[#5046e4]">{off.code}</span>
              </div>
            </div>

            <div>
              <Link to="/customer/stores" className="btn-primary w-full text-center block text-xs font-bold shadow-sm">
                Order Now
              </Link>
              <p className="text-3xs text-slate-400 text-center mt-2 font-mono">Valid till 31 May, 2024</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
