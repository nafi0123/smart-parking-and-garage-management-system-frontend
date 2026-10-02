'use client';

import { LuBuilding2, LuCar, LuClock, LuZap } from 'react-icons/lu';

const STATS = [
  {
    value: '50,000+',
    label: 'Verified Parking Trips',
    subtitle: 'Processed with instant gate entry',
    icon: LuCar,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    value: '120+',
    label: 'Smart Garages & Towers',
    subtitle: 'Connected in prime city zones',
    icon: LuBuilding2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    value: '15 Mins',
    label: 'Avg. Time Saved per Trip',
    subtitle: 'Zero cruising for vacant spots',
    icon: LuClock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    value: '35+',
    label: 'EV Fast Charging Hubs',
    subtitle: 'Ultra-fast DC power integrated',
    icon: LuZap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
];

export default function StatsCounterSection() {
  return (
    <section className="py-6 sm:py-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1f52] via-[#0f2a6b] to-[#081538] p-8 sm:p-12 text-white shadow-xl border border-blue-400/20">
        {/* Glow Accents */}
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold tracking-wider uppercase backdrop-blur-md border border-white/10">
              Live Network Metrics
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Platform Impact & Live Network Scale
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80">
              Connecting modern city commuters with guaranteed, sensor-monitored parking spaces every day.
            </p>
          </div>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: Stats item
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-center space-y-3 hover:bg-white/10 transition-all duration-200 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center border text-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 shadow-sm`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs font-bold text-slate-200">
                      {stat.label}
                    </p>
                    <p className="text-[11px] text-blue-200/70">
                      {stat.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
