'use client';

import { LuQrCode, LuRadio, LuShieldCheck, LuSparkles, LuZap } from 'react-icons/lu';

const FEATURES = [
  {
    title: 'Real-Time IoT Telemetry',
    description:
      'Ultrasonic bay sensors and magnetic loop detectors report live vacant spot status with 99.4% precision.',
    icon: LuRadio,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    title: 'EV Fast Charging Bays',
    description:
      'Integrated Level-3 DC fast chargers up to 350kW for electric vehicles with automated billing alongside your parking.',
    icon: LuZap,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    title: '24/7 Monitored CCTV & ANPR',
    description:
      'Automated Number Plate Recognition (ANPR), high-definition security cameras, and round-the-clock on-site security.',
    icon: LuShieldCheck,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    title: '100% Contactless QR Gate Entry',
    description:
      'Zero paper tickets. Simply scan your digital QR parking pass on your phone screen for instant 3-second barrier entry.',
    icon: LuQrCode,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-10 sm:py-16 border-t border-[var(--line)]">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
        <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <LuSparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Next-Gen Parking Infrastructure</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
          Why Choose ParkWise
        </h2>
        <p className="text-xs sm:text-sm text-[var(--sub)]">
          Engineered for maximum reliability, speed, and safety across prime city zones and multi-level parking towers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Feature list
              key={idx}
              className="p-6 rounded-md border border-[var(--line)] bg-[var(--card)] shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div
                  className={`w-11 h-11 rounded-md flex items-center justify-center border text-xl shadow-xs transition-transform group-hover:scale-110 ${feature.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--ink)] tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-[var(--sub)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
