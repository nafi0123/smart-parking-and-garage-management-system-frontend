'use client';

import { LuCompass, LuCreditCard, LuQrCode, LuSparkles } from 'react-icons/lu';

const STEPS = [
  {
    step: '01',
    title: 'Search & Locate',
    description:
      'Search by city area, price filter, or activate Live GPS Radar to find available parking spots closest to you in real-time.',
    icon: LuCompass,
    accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    border: 'hover:border-blue-500/50',
    gradient: 'from-blue-500/10 to-transparent',
  },
  {
    step: '02',
    title: 'Reserve & Pay Securely',
    description:
      'Select your time window, assign your saved vehicle license plate, and complete automated payment via SSLCommerz.',
    icon: LuCreditCard,
    accent: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    border: 'hover:border-cyan-500/50',
    gradient: 'from-cyan-500/10 to-transparent',
  },
  {
    step: '03',
    title: 'Scan QR & Park',
    description:
      'Drive up to the smart automated gate, scan your digital QR parking pass directly from your phone, and park stress-free.',
    icon: LuQrCode,
    accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    border: 'hover:border-emerald-500/50',
    gradient: 'from-emerald-500/10 to-transparent',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-10 sm:py-16 border-t border-[var(--line)]">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
        <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <LuSparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Simple 3-Step Process</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
          How ParkWise Works
        </h2>
        <p className="text-xs sm:text-sm text-[var(--sub)]">
          Zero congestion, zero searching in circles. Reserve guaranteed vacant parking spots in less than 60 seconds.
        </p>
      </div>

      {/* 3 Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className={`relative rounded-md border border-[var(--line)] bg-[var(--card)] p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-300 ${item.border} flex flex-col justify-between group`}
            >
              {/* Top Row: Step Tag & Icon */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors">
                  {item.step}
                </span>
                <div
                  className={`w-11 h-11 rounded-md flex items-center justify-center border text-xl shadow-xs transition-transform group-hover:scale-110 ${item.accent}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Content Body */}
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[var(--ink)] tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--sub)] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Step Progress Bar */}
              <div className="pt-5 mt-5 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-semibold text-[var(--sub)]">
                <span>Step {item.step} of 03</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">Guaranteed Spot →</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
