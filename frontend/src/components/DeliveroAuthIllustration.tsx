import React from 'react';

export default function DeliveroAuthIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto h-72 flex items-center justify-center">
      {/* Background Soft Pastel Clouds & Shapes */}
      <svg className="w-full h-full" viewBox="0 0 450 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background City Silhouettes */}
        <g opacity="0.35">
          <rect x="70" y="90" width="40" height="150" rx="4" fill="#c7d2fe" />
          <rect x="80" y="110" width="8" height="10" rx="1" fill="#ffffff" />
          <rect x="95" y="110" width="8" height="10" rx="1" fill="#ffffff" />
          <rect x="80" y="130" width="8" height="10" rx="1" fill="#ffffff" />
          <rect x="95" y="130" width="8" height="10" rx="1" fill="#ffffff" />
          <rect x="80" y="150" width="8" height="10" rx="1" fill="#ffffff" />
          <rect x="95" y="150" width="8" height="10" rx="1" fill="#ffffff" />

          <rect x="120" y="60" width="55" height="180" rx="4" fill="#ddd6fe" />
          <rect x="135" y="80" width="10" height="12" rx="1" fill="#ffffff" />
          <rect x="155" y="80" width="10" height="12" rx="1" fill="#ffffff" />
          <rect x="135" y="105" width="10" height="12" rx="1" fill="#ffffff" />
          <rect x="155" y="105" width="10" height="12" rx="1" fill="#ffffff" />
          <rect x="135" y="130" width="10" height="12" rx="1" fill="#ffffff" />
          <rect x="155" y="130" width="10" height="12" rx="1" fill="#ffffff" />

          <rect x="290" y="80" width="45" height="160" rx="4" fill="#c7d2fe" />
          <rect x="345" y="110" width="40" height="130" rx="4" fill="#e0e7ff" />
        </g>

        {/* Smartphone Route Visualizer on Left */}
        <g transform="translate(30, 40)">
          {/* Phone Frame */}
          <rect x="0" y="0" width="110" height="190" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="4" />
          <rect x="35" y="8" width="40" height="4" rx="2" fill="#cbd5e1" />
          {/* Map Grid Inside Phone */}
          <rect x="8" y="20" width="94" height="155" rx="10" fill="#f1f5f9" />
          <line x1="8" y1="60" x2="102" y2="60" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="8" y1="110" x2="102" y2="110" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="50" y1="20" x2="50" y2="175" stroke="#e2e8f0" strokeWidth="2" />

          {/* Dotted Route */}
          <path
            d="M 25 150 Q 50 120 40 80 T 70 45"
            fill="none"
            stroke="#5046e4"
            strokeWidth="3"
            strokeDasharray="4 4"
          />
          {/* Pin */}
          <circle cx="70" cy="45" r="7" fill="#5046e4" />
          <circle cx="70" cy="45" r="3" fill="#ffffff" />

          {/* Origin Dot */}
          <circle cx="25" cy="150" r="4" fill="#10b981" />
        </g>

        {/* Purple Foliage on Sides */}
        <g opacity="0.6">
          <path d="M 20 230 C 10 210, 15 180, 30 195 C 40 210, 30 230, 20 230 Z" fill="#c7d2fe" />
          <path d="M 420 230 C 435 210, 430 180, 415 195 C 405 210, 415 230, 420 230 Z" fill="#c7d2fe" />
        </g>

        {/* Road Base Ground */}
        <line x1="10" y1="260" x2="440" y2="260" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />

        {/* Delivery Scooter & Rider in Purple */}
        <g transform="translate(130, 95)">
          {/* Scooter Rear Wheel */}
          <circle cx="50" cy="145" r="22" fill="#334155" />
          <circle cx="50" cy="145" r="14" fill="#f8fafc" stroke="#64748b" strokeWidth="3" />

          {/* Scooter Front Wheel */}
          <circle cx="165" cy="145" r="22" fill="#334155" />
          <circle cx="165" cy="145" r="14" fill="#f8fafc" stroke="#64748b" strokeWidth="3" />

          {/* Scooter Body Frame (Purple) */}
          <path
            d="M 45 140 L 80 140 L 115 135 L 145 105 L 160 140"
            fill="none"
            stroke="#5046e4"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <rect x="75" y="115" width="45" height="15" rx="5" fill="#5046e4" />
          <rect x="65" y="105" width="40" height="10" rx="4" fill="#1e1b4b" />

          {/* Scooter Handlebar & Light */}
          <line x1="145" y1="105" x2="140" y2="70" stroke="#5046e4" strokeWidth="8" strokeLinecap="round" />
          <line x1="130" y1="70" x2="150" y2="70" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          <circle cx="152" cy="74" r="5" fill="#fef08a" />

          {/* Delivery Box Backpack on Back */}
          <rect x="42" y="70" width="34" height="34" rx="6" fill="#5046e4" stroke="#4338ca" strokeWidth="2" />
          <rect x="48" y="78" width="22" height="18" rx="2" fill="#6366f1" />

          {/* Delivery Rider (Sitting, Purple Uniform) */}
          {/* Legs */}
          <path d="M 85 110 L 105 115 L 115 135" fill="none" stroke="#1e1b4b" strokeWidth="10" strokeLinecap="round" />
          {/* Torso */}
          <path d="M 85 105 L 95 65" stroke="#5046e4" strokeWidth="16" strokeLinecap="round" />
          {/* Arm */}
          <path d="M 90 70 L 135 72" stroke="#5046e4" strokeWidth="8" strokeLinecap="round" />
          {/* Head & Cap */}
          <circle cx="102" cy="45" r="10" fill="#fed7aa" />
          <path d="M 92 42 C 92 32, 112 32, 112 42 Z" fill="#5046e4" />
          <path d="M 102 38 L 118 42" stroke="#5046e4" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
