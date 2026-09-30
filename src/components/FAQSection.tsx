'use client';

import Link from 'next/link';
import { useState } from 'react';
import Container from './Container';

interface IFAQItem {
  id: string;
  category: 'booking' | 'pricing' | 'iot' | 'operator';
  question: string;
  answer: string;
  badge?: string;
}

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'booking', label: 'Booking & Slots' },
  { id: 'pricing', label: 'Pricing & Tariffs' },
  { id: 'iot', label: 'IoT & Telemetry' },
  { id: 'operator', label: 'For Garage Owners' },
];

const FAQ_ITEMS: IFAQItem[] = [
  {
    id: 'faq-1',
    category: 'booking',
    question: 'How does live slot reservation work on ParkWise?',
    answer:
      'Browse verified garages across your destination city, check live occupancy in real time, and click "Reserve Spot". You can select your preferred parking bay (e.g. Bay P12) or let our IoT guidance system automatically assign the nearest open spot. You will receive an instant digital reservation pass with QR code access.',
    badge: 'Popular',
  },
  {
    id: 'faq-2',
    category: 'iot',
    question: 'How accurate is the live vacant slot telemetry?',
    answer:
      'Our partner facilities are equipped with ultrasonic and magnetic vehicle presence sensors at every designated parking bay. Telemetry data synchronizes with our cloud platform within sub-second intervals, providing 99.8% live accuracy for drivers looking for parking spots.',
    badge: 'IoT Tech',
  },
  {
    id: 'faq-3',
    category: 'pricing',
    question: 'How are hourly tariffs calculated and are there hidden fees?',
    answer:
      'Parking rates are transparently displayed per hour (e.g. ৳40/hr or ৳60/hr) set by verified operators. You only pay for the duration you select or occupy. There are zero reservation deposit surcharges or hidden convenience fees.',
  },
  {
    id: 'faq-4',
    category: 'booking',
    question: 'Can I cancel or modify my reservation before arrival?',
    answer:
      'Yes, you can cancel your parking reservation free of charge up to 15 minutes before your selected start time directly from your driver dashboard. Once cancelled, the reserved bay immediately returns to the public vacancy pool.',
  },
  {
    id: 'faq-5',
    category: 'iot',
    question: 'How does automated ANPR & QR gate clearance work?',
    answer:
      'When you arrive at the garage entrance, the automated barrier reads your vehicle license plate (ANPR) or you can scan your digital QR booking receipt. The system verifies your active session and opens the boom barrier automatically within 2 seconds.',
  },
  {
    id: 'faq-6',
    category: 'pricing',
    question: 'What happens if I stay longer than my reserved parking duration?',
    answer:
      'If your stay exceeds your estimated duration, our sensor telemetry will automatically track the extra time at the facility’s standard hourly rate without penalties. You can settle any overtime balance at the exit gate or via your dashboard.',
  },
  {
    id: 'faq-7',
    category: 'operator',
    question: 'How can garage owners and facility managers list their spaces?',
    answer:
      'Facility owners can register for a Manager Account on ParkWise, submit garage details (address, capacity, pricing, photos, and coordinates), and connect their smart IoT gate hardware or utilize our intuitive operator terminal dashboard.',
  },
  {
    id: 'faq-8',
    category: 'booking',
    question: 'Is my vehicle safe and monitored while parked?',
    answer:
      'All listed garages undergo strict identity and facility verification. They are equipped with 24/7 CCTV surveillance, manned security guards, weatherproof sheltered bays, and designated lighting for maximum vehicle safety.',
  },
];

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<string[]>(['faq-1']); // 1st item open by default

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const filteredFAQs =
    activeCategory === 'all'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <section className="py-12 sm:py-16 md:py-20 border-t border-[var(--line)] bg-[var(--bg)]">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Got Questions? We Have Answers
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--ink)]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[var(--sub)] leading-relaxed">
            Find quick answers to common questions about spot reservations, smart telemetry, gate clearance, and facility management.
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {FAQ_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0f2a6b] text-white shadow-xs'
                    : 'border border-[var(--line)] bg-[var(--card)] text-[var(--sub)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion Grid */}
        <div className="max-w-3xl mx-auto space-y-3">
          {filteredFAQs.map((item, idx) => {
            const isOpen = openIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`rounded-md border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-blue-500/40 bg-[var(--card)] shadow-xs ring-1 ring-blue-500/10'
                    : 'border-[var(--line)] bg-[var(--card)] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Accordion Question Trigger */}
                <button
                  type="button"
                  onClick={() => toggleFAQ(item.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono shrink-0">
                      0{idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--ink)]">
                      {item.question}
                    </span>
                    {item.badge && (
                      <span className="hidden sm:inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Animated Toggle Icon */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isOpen
                        ? 'bg-[#0f2a6b] text-white border-[#0f2a6b] rotate-180'
                        : 'border-[var(--line)] text-[var(--sub)] bg-[var(--bg)]'
                    }`}
                  >
                    <svg
                      className="w-3.5 h-3.5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Accordion Answer Content */}
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-[var(--sub)] leading-relaxed border-t border-[var(--line)]/50 mt-1 animate-in fade-in duration-200">
                    <p className="pt-3">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions? Support Banner */}
        <div className="max-w-3xl mx-auto mt-10 p-5 sm:p-6 rounded-md border border-[var(--line)] bg-gradient-to-r from-blue-900/10 via-[var(--card)] to-indigo-900/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-2xs">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--ink)]">
              Still have questions about smart parking?
            </h3>
            <p className="text-xs text-[var(--sub)]">
              Our 24/7 technical operations desk is ready to assist drivers and garage operators.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/garages"
              className="rounded-md bg-[#0f2a6b] hover:bg-[#1e40af] px-4 py-2 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              Explore Garages →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
