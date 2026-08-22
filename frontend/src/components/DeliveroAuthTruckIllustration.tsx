import React from 'react';

export default function DeliveroAuthTruckIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto h-72 flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 460 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background City Skyline */}
        <g opacity="0.3">
          <rect x="60" y="80" width="45" height="170" rx="3" fill="#c7d2fe" />
          <rect x="115" y="50" width="55" height="200" rx="3" fill="#ddd6fe" />
          <rect x="180" y="90" width="50" height="160" rx="3" fill="#c7d2fe" />
          <rect x="240" y="40" width="60" height="210" rx="3" fill="#ddd6fe" />
          <rect x="310" y="70" width="50" height="180" rx="3" fill="#c7d2fe" />
          <rect x="370" y="100" width="45" height="150" rx="3" fill="#e0e7ff" />
        </g>

        {/* Smartphone Route Tracker on Left */}
        <g transform="translate(25, 40)">
          <rect x="0" y="0" width="105" height="195" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="4" />
          <rect x="35" y="8" width="35" height="4" rx="2" fill="#cbd5e1" />
          <rect x="8" y="20" width="89" height="160" rx="10" fill="#f8fafc" />

          {/* Map Grid */}
          <line x1="8" y1="60" x2="97" y2="60" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="8" y1="110" x2="97" y2="110" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="50" y1="20" x2="50" y2="180" stroke="#e2e8f0" strokeWidth="2" />

          {/* Dotted Polyline */}
          <path
            d="M 25 150 Q 50 120 40 80 T 70 45"
            fill="none"
            stroke="#5046e4"
            strokeWidth="3"
            strokeDasharray="4 4"
          />
          <circle cx="70" cy="45" r="7" fill="#5046e4" />
          <circle cx="70" cy="45" r="3" fill="#ffffff" />
          <circle cx="25" cy="150" r="4" fill="#10b981" />

          {/* Simulated Info Box */}
          <rect x="14" y="28" width="77" height="24" rx="6" fill="#ffffff" stroke="#e2e8f0" />
          <text x="20" y="42" fontSize="7" fontWeight="bold" fill="#1e293b">Your Order</text>
          <text x="20" y="48" fontSize="5" fill="#64748b">1.2 km away</text>
        </g>

        {/* Ground Road Line */}
        <line x1="10" y1="260" x2="450" y2="260" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />

        {/* Purple Foliage */}
        <g opacity="0.6">
          <path d="M 420 255 C 440 230, 435 190, 415 210 C 405 230, 415 255, 420 255 Z" fill="#c7d2fe" />
          <path d="M 15 255 C 5 235, 10 200, 25 215 C 35 230, 25 255, 15 255 Z" fill="#c7d2fe" />
        </g>

        {/* Delivery Van (Purple Delivero Truck) */}
        <g transform="translate(145, 95)">
          {/* Van Wheels */}
          <circle cx="60" cy="150" r="22" fill="#1e293b" />
          <circle cx="60" cy="150" r="13" fill="#ffffff" stroke="#64748b" strokeWidth="4" />

          <circle cx="190" cy="150" r="22" fill="#1e293b" />
          <circle cx="190" cy="150" r="13" fill="#ffffff" stroke="#64748b" strokeWidth="4" />

          {/* Van Main Cargo Body */}
          <rect x="20" y="55" width="150" height="95" rx="10" fill="#5046e4" />
          <rect x="25" y="60" width="140" height="85" rx="8" fill="#5850ec" />

          {/* "Delivero" White Logo Text on Van */}
          <text x="50" y="112" fontSize="22" fontWeight="900" fill="#ffffff" letterSpacing="0.5">
            Delivero
          </text>

          {/* Cabin Front */}
          <path
            d="M 170 75 L 210 90 L 225 120 L 225 150 L 170 150 Z"
            fill="#4338ca"
          />
          {/* Windshield Window */}
          <path
            d="M 175 82 L 205 95 L 215 120 L 175 120 Z"
            fill="#e0e7ff"
            opacity="0.9"
          />
          {/* Headlight */}
          <circle cx="222" cy="132" r="5" fill="#fef08a" />
          {/* Bumper */}
          <rect x="215" y="142" width="14" height="8" rx="2" fill="#334155" />

          {/* Parcel Boxes in Foreground */}
          <g transform="translate(205, 120)">
            <rect x="0" y="15" width="22" height="20" rx="3" fill="#d97706" />
            <rect x="5" y="15" width="12" height="20" fill="#b45309" opacity="0.4" />
            <rect x="18" y="5" width="26" height="30" rx="3" fill="#f59e0b" />
            <line x1="18" y1="20" x2="44" y2="20" stroke="#b45309" strokeWidth="2" />
          </g>
        </g>
      </svg>
    </div>
  );
}
