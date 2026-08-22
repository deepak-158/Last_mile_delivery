import React, { useState } from 'react';

export default function CustomerPaymentMethodsPage() {
  const [methods, setMethods] = useState([
    { id: 1, name: 'UPI - PhonePe', detail: 'deepak@upi', isDefault: true, icon: '📱' },
    { id: 2, name: 'UPI - Google Pay', detail: 'deepakshukla@okaxis', isDefault: false, icon: '⚡' },
    { id: 3, name: 'Debit Card', detail: '•••• •••• •••• 1234 (VISA)', isDefault: false, icon: '💳' },
    { id: 4, name: 'Credit Card', detail: '•••• •••• •••• 5678 (Mastercard)', isDefault: false, icon: '💳' },
  ]);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Methods</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage saved UPI VPA handles, debit/credit cards, and checkout defaults</p>
        </div>
        <button className="btn-primary text-xs shadow-sm font-bold">
          + Add New Payment Method
        </button>
      </div>

      <div className="delivero-card divide-y divide-slate-100 overflow-hidden">
        {methods.map((m) => (
          <div key={m.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                {m.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-900">{m.name}</h4>
                  {m.isDefault && (
                    <span className="badge badge-active text-3xs font-bold">Default</span>
                  )}
                </div>
                <p className="text-3xs text-slate-500 font-mono mt-0.5">{m.detail}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              {!m.isDefault && (
                <button
                  onClick={() =>
                    setMethods((prev) =>
                      prev.map((item) => ({ ...item, isDefault: item.id === m.id }))
                    )
                  }
                  className="text-slate-500 hover:text-slate-900"
                >
                  Set as Default
                </button>
              )}
              <button className="text-[#5046e4] hover:underline">Edit</button>
              <button className="text-rose-600 hover:underline">Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-slate-100 text-xs text-slate-500 flex items-center gap-2">
        <span>🔒</span>
        <span>Your payment information is end-to-end encrypted and PCI-DSS compliant.</span>
      </div>
    </div>
  );
}
