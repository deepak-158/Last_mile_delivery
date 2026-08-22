import React from 'react';

interface Package3DVisualizerProps {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  billableWeightKg: number;
}

export default function Package3DVisualizer({
  lengthCm,
  breadthCm,
  heightCm,
  actualWeightKg,
  volumetricWeightKg,
  billableWeightKg,
}: Package3DVisualizerProps) {
  const maxDim = Math.max(lengthCm || 10, breadthCm || 10, heightCm || 10, 1);
  const scale = 110 / maxDim;

  const visualL = Math.max(40, Math.min(130, (lengthCm || 20) * scale));
  const visualB = Math.max(30, Math.min(100, (breadthCm || 15) * scale));
  const visualH = Math.max(30, Math.min(120, (heightCm || 10) * scale));

  const volumeLiters = ((lengthCm * breadthCm * heightCm) / 1000).toFixed(2);
  const isVolumetricHeavier = volumetricWeightKg > actualWeightKg;

  return (
    <div className="delivero-card p-6 overflow-hidden relative space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span className="text-[#5046e4]">📦</span> 3D Package Volumetric Visualizer
          </h4>
          <p className="text-3xs text-slate-500 font-medium">Real-time $(L \times B \times H)/5000$ volumetric density calculation</p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-indigo-50 text-[#5046e4] border border-indigo-100">
          {volumeLiters} Liters
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Isometric 3D Box Simulation */}
        <div className="h-44 flex items-center justify-center relative bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />

          {/* 3D Box Canvas */}
          <div
            className="relative transition-all duration-500 animate-float"
            style={{
              width: `${visualL}px`,
              height: `${visualH}px`,
              transform: 'rotateX(-20deg) rotateY(35deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Front Face */}
            <div className="absolute inset-0 bg-indigo-500/20 border-2 border-[#5046e4] rounded-sm flex items-center justify-center text-2xs font-mono text-[#5046e4] font-black shadow-sm">
              {lengthCm}×{heightCm}
            </div>

            {/* Top Face */}
            <div
              className="absolute bg-indigo-400/20 border-2 border-[#818cf8]"
              style={{
                width: `${visualL}px`,
                height: `${visualB}px`,
                top: `-${visualB}px`,
                left: '0px',
                transformOrigin: 'bottom',
                transform: 'rotateX(90deg)',
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-3xs font-mono text-[#5046e4] font-bold">
                {lengthCm}×{breadthCm}
              </div>
            </div>

            {/* Right Face */}
            <div
              className="absolute bg-purple-500/20 border-2 border-purple-500"
              style={{
                width: `${visualB}px`,
                height: `${visualH}px`,
                top: '0px',
                right: `-${visualB}px`,
                transformOrigin: 'left',
                transform: 'rotateY(90deg)',
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-3xs font-mono text-purple-700 font-bold">
                {breadthCm}×{heightCm}
              </div>
            </div>
          </div>

          <div className="absolute bottom-2 left-3 text-3xs font-mono font-bold text-slate-500">
            {lengthCm}cm (L) × {breadthCm}cm (B) × {heightCm}cm (H)
          </div>
        </div>

        {/* Volumetric Weight Matrix */}
        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-3xs font-bold text-slate-500 uppercase">Actual Physical Weight</p>
              <p className="text-sm font-black text-slate-900">{actualWeightKg || 0} kg</p>
            </div>
            <span className="text-3xs px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold">Scale Reading</span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-3xs font-bold text-indigo-700 uppercase">Volumetric Weight ((L×B×H)/5000)</p>
              <p className="text-sm font-black text-[#5046e4]">{volumetricWeightKg || 0} kg</p>
            </div>
            <span className="text-3xs px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-[#5046e4] font-bold font-mono">Formula Tier</span>
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isVolumetricHeavier
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div>
              <p className="text-3xs font-extrabold uppercase tracking-wider">Billable Applied Weight (Max)</p>
              <p className="text-base font-black">{billableWeightKg || 0} kg</p>
            </div>
            <span className="text-3xs font-extrabold px-2.5 py-1 rounded-full uppercase bg-white border border-current">
              {isVolumetricHeavier ? '⚠️ Volumetric Applied' : '✅ Actual Applied'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
