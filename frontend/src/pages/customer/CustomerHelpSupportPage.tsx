import React, { useState } from 'react';

export default function CustomerHelpSupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showChat, setShowChat] = useState(false);

  const faqs = [
    {
      q: 'How do I track my order?',
      a: 'You can track your order in real-time from the "Track Order" page in your navigation menu. The interactive map shows the live location of your delivery partner, progress steps, and estimated time of arrival.',
    },
    {
      q: 'What is your delivery time?',
      a: 'HyperLocal store and food orders are delivered within 25-35 minutes. Intra-zone express parcel dispatches are completed same-day, and inter-zone interstate consignments arrive within 1-2 business days.',
    },
    {
      q: 'How can I cancel my order?',
      a: 'Orders can be canceled from your "My Orders" screen before the delivery partner picks up the consignment from the store or pickup location.',
    },
    {
      q: 'How do I apply a promo code?',
      a: 'On your Cart checkout page, enter your promo voucher code (such as FREEDEL or SAVE25) in the "Enter coupon code" box and click "Apply".',
    },
    {
      q: 'How do I change my address?',
      a: 'You can add, edit, or set default delivery destinations anytime from the "Saved Addresses" tab in your profile or directly at checkout.',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Help & Support</h1>
        <p className="text-xs text-slate-500 mt-0.5">24/7 dedicated customer assistance, incident resolution, and FAQs</p>
      </div>

      {/* 3 Quick Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setShowChat(true)}
          className="delivero-card p-5 text-left hover:border-[#5046e4]/40 hover:shadow-md transition-all space-y-2"
        >
          <span className="text-2xl">💬</span>
          <h3 className="font-extrabold text-sm text-slate-900">Live Chat</h3>
          <p className="text-2xs text-slate-500">Chat with support team (Instant reply)</p>
        </button>

        <a
          href="tel:+9118001234567"
          className="delivero-card p-5 text-left hover:border-[#5046e4]/40 hover:shadow-md transition-all space-y-2 block"
        >
          <span className="text-2xl">📞</span>
          <h3 className="font-extrabold text-sm text-slate-900">Call Support</h3>
          <p className="text-2xs text-slate-500 font-mono">+91 1800 123 4567 (Toll-Free)</p>
        </a>

        <div className="delivero-card p-5 text-left space-y-2">
          <span className="text-2xl">💡</span>
          <h3 className="font-extrabold text-sm text-slate-900">FAQs</h3>
          <p className="text-2xs text-slate-500">Find answers quickly below</p>
        </div>
      </div>

      {/* Common Topics Accordion */}
      <div className="delivero-card p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">Common Topics</h3>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, i) => (
            <div key={i} className="py-3.5 first:pt-0 last:pb-0">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-[#5046e4] transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-slate-400 font-normal text-sm">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <p className="text-xs text-slate-500 mt-2 leading-relaxed animate-fade-in pl-2 border-l-2 border-[#5046e4]">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Still Need Help Box */}
      <div className="p-6 rounded-2xl bg-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Still need help?</h4>
          <p className="text-xs text-slate-500 mt-0.5">Our support team is available 24/7 to resolve any delivery issues.</p>
        </div>
        <button onClick={() => setShowChat(true)} className="btn-primary text-xs whitespace-nowrap shadow-sm">
          Contact Support
        </button>
      </div>

      {/* Live Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="delivero-card max-w-md w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-sm text-slate-900">Delivero Customer Care Live Chat</h3>
              </div>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="h-48 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-xl mb-4 text-xs">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100 max-w-[80%]">
                <p className="font-bold text-3xs text-[#5046e4]">Support Agent (Sarah)</p>
                <p className="text-slate-700 mt-0.5">Hello Deepak! How can I help you with your order #DL48291 today?</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input type="text" placeholder="Type your message..." className="input-field" />
              <button className="btn-primary px-4 font-bold text-xs">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
