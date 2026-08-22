import React, { useState } from 'react';

export default function CustomerReferEarnPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'DEEPAK100';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Refer & Earn Rewards</h1>
        <p className="text-xs text-slate-500 mt-0.5">Invite your friends & colleagues to Delivero and earn delivery credits</p>
      </div>

      <div className="delivero-card p-8 text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-indigo-50 text-[#5046e4] flex items-center justify-center text-5xl shadow-sm">
          🎁
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-2xl font-black text-slate-900">
            You get <span className="text-[#5046e4]">₹100</span> on their first order
          </h2>
          <p className="text-xs text-slate-500">
            Your friend gets <span className="font-bold text-emerald-600">₹75 OFF</span> their first delivery when they sign up with your unique code.
          </p>
        </div>

        {/* Code Box */}
        <div className="max-w-sm mx-auto p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-[#5046e4]/40 flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-3xs font-bold uppercase text-slate-400 block">Your Referral Code</span>
            <span className="font-mono text-xl font-black text-slate-900 tracking-wider">{referralCode}</span>
          </div>

          <button
            onClick={handleCopy}
            className="btn-primary py-2 px-4 text-xs font-bold shadow-sm"
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* Share Buttons */}
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Join Delivero',
                  text: `Use my referral code ${referralCode} on Delivero for ₹75 OFF your first delivery!`,
                  url: window.location.origin,
                });
              } else {
                handleCopy();
              }
            }}
            className="btn-primary px-8 py-3 font-bold text-xs shadow-md"
          >
            Share Code with Friends 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
