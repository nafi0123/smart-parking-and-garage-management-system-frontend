'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface Slide {
  id: number;
  tag: string;
  tagColor: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  image: string;
  statValue: string;
  statLabel: string;
  statBadge: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  features: string[];
}

const SLIDES: Slide[] = [
  {
    id: 1,
    tag: 'REAL-TIME SENSOR NETWORK',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    title: 'Smart Parking Made',
    titleHighlight: 'Effortless & Instant',
    subtitle:
      'Locate, monitor, and reserve guaranteed vacant parking spots across top city zones with real-time IoT sensor guidance.',
    image: '/images/banner/slide-1.jpg',
    statValue: '142',
    statLabel: 'Live Vacant Bays',
    statBadge: '99.4% Sensor Accuracy',
    primaryBtnText: 'Book a Spot Now',
    primaryBtnLink: '/garages',
    secondaryBtnText: 'View Live Map',
    secondaryBtnLink: '/garages?onlyAvailable=true',
    features: ['Real-Time IoT Telemetry', 'Instant QR Entry', 'Automated Plate Reader'],
  },
  {
    id: 2,
    tag: 'AUTOMATED MULTI-LEVEL HUBS',
    tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    title: 'Next-Gen Robotic',
    titleHighlight: 'Parking Garages',
    subtitle:
      'Experience zero-hassle parking in high-capacity automated towers featuring fast robotic elevators and 24/7 security.',
    image: '/images/banner/slide-2.jpg',
    statValue: '840+',
    statLabel: 'Total Tower Capacity',
    statBadge: 'Avg. 45s Retrieval Time',
    primaryBtnText: 'Explore Garages',
    primaryBtnLink: '/garages',
    secondaryBtnText: 'Check Hourly Rates',
    secondaryBtnLink: '/garages?sortBy=pricePerHour&sortOrder=asc',
    features: ['High-Speed Elevators', 'ANPR Auto-Gate', '24/7 Monitored CCTV'],
  },
  {
    id: 3,
    tag: 'ECO-FRIENDLY MOBILITY',
    tagColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    title: 'High-Speed EV Fast Charging',
    titleHighlight: 'Dedicated Bays',
    subtitle:
      'Power up your electric vehicle effortlessly while parked. Equipped with Level-3 DC ultra-fast chargers and smart billing.',
    image: '/images/banner/slide-3.jpg',
    statValue: '38',
    statLabel: 'EV Fast Chargers Active',
    statBadge: 'Up to 350kW DC Fast',
    primaryBtnText: 'Reserve EV Bay',
    primaryBtnLink: '/garages',
    secondaryBtnText: 'Explore All',
    secondaryBtnLink: '/garages',
    features: ['CCS & Type-2 Connectors', 'App Battery Tracking', 'Priority Parking'],
  },
];

export interface BannerProps {
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function Banner({ onPrimaryClick, onSecondaryClick }: BannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-play timer with pause-on-hover
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Smart Parking Highlights"
      className="group relative w-full overflow-hidden rounded-sm border border-slate-700/50 bg-slate-950 shadow-2xl transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Carousel with Cross-Fade & subtle Ken-Burns */}
      <div className="absolute inset-0 z-0">
        {SLIDES.map((item, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: '1000ms',
              }}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority={index === 0}
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
          );
        })}

        {/* High-end Multi-Layer Dark Gradient Overlay for Maximum Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/40" />

        {/* Subtle Tech Grid Pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Main Banner Content */}
      <div className="relative z-10 flex min-h-[280px] sm:min-h-[380px] md:min-h-[460px] lg:min-h-[480px] flex-col justify-between p-3.5 sm:p-6 md:p-8 lg:p-10">
        {/* Top Bar inside Banner: Category Tag & Auto-play / Live Stats */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${slide.tagColor}`}
          >
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500" />
            </span>
            {slide.tag}
          </div>

          {/* Compact Telemetry badge on mobile / Status on desktop */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-emerald-400 backdrop-blur-md bg-emerald-950/40 border border-emerald-500/30 rounded-md px-2 py-0.5 sm:px-2.5 sm:py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">{slide.statValue}</span>
            <span className="text-slate-300 hidden sm:inline">{slide.statLabel}</span>
            <span className="text-slate-300 inline sm:hidden">Free</span>
          </div>
        </div>

        {/* Middle Body: Headline, Subtitle, Features & Live Metric Counter */}
        <div className="my-2 sm:my-4 grid grid-cols-1 items-center gap-4 sm:gap-6 lg:grid-cols-12">
          {/* Left Column: Text & CTAs */}
          <div className="space-y-2.5 sm:space-y-4 lg:col-span-8">
            <div className="space-y-1 sm:space-y-1.5">
              <h1 className="text-lg font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl leading-snug sm:leading-tight">
                {slide.title}{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                  {slide.titleHighlight}
                </span>
              </h1>
              <p className="max-w-xl text-[11px] sm:text-xs md:text-sm font-normal leading-relaxed text-slate-300 line-clamp-2 sm:line-clamp-none">
                {slide.subtitle}
              </p>
            </div>

            {/* Feature Pills (Hidden on small mobile for clean compact view, visible on sm+) */}
            <div className="hidden sm:flex flex-wrap items-center gap-1.5 pt-0.5">
              {slide.features.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 text-[11px] font-medium text-slate-300 backdrop-blur-sm"
                >
                  <svg
                    className="h-3 w-3 text-cyan-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </span>
              ))}
            </div>

            {/* Action Buttons (Compact & Horizontal on Mobile) */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 pt-0.5 sm:pt-1">
              {onPrimaryClick ? (
                <button
                  type="button"
                  onClick={onPrimaryClick}
                  className="group/btn relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-md bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                >
                  <span>{slide.primaryBtnText}</span>
                  <svg
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 group-hover/btn:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              ) : (
                <Link
                  href={slide.primaryBtnLink}
                  className="group/btn relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-md bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                >
                  <span>{slide.primaryBtnText}</span>
                  <svg
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 group-hover/btn:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              )}

              {onSecondaryClick ? (
                <button
                  type="button"
                  onClick={onSecondaryClick}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-slate-500 hover:bg-slate-800/80 hover:text-white active:scale-[0.98]"
                >
                  {slide.secondaryBtnText}
                </button>
              ) : (
                <Link
                  href={slide.secondaryBtnLink}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-slate-500 hover:bg-slate-800/80 hover:text-white active:scale-[0.98]"
                >
                  {slide.secondaryBtnText}
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Live Telemetry Widget Card (Visible only on lg+ screens to keep mobile sleek) */}
          <div className="hidden lg:col-span-4 lg:flex lg:justify-end">
            <div className="w-full max-w-sm rounded-md border border-slate-800/80 bg-slate-900/70 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Live Telemetry
                  </span>
                </div>
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Online
                </span>
              </div>

              <div className="py-3">
                <div className="text-4xl font-extrabold tracking-tight text-white">
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                    {slide.statValue}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-slate-300">{slide.statLabel}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{slide.statBadge}</p>
              </div>

              {/* Slot status mini indicator bars */}
              <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Occupancy Rate</span>
                  <span className="font-semibold text-slate-200">28% Low</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-[28%] rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Slider Navigation Controls and Progress Indicators */}
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 sm:pt-3">
          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((item, index) => {
              const isActive = index === currentSlide;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  className={`group/indicator relative h-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-5 sm:w-7 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                      : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              );
            })}
          </div>

          {/* Slide Numbers & Prev/Next Arrows */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-xs font-mono text-slate-400 mr-1">
              0{currentSlide + 1} <span className="text-slate-600">/</span> 0{SLIDES.length}
            </span>

            <button
              type="button"
              onClick={prevSlide}
              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded border border-slate-700/80 bg-slate-900/60 text-slate-300 backdrop-blur-sm transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-white active:scale-95"
              aria-label="Previous Slide"
            >
              <svg
                className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded border border-slate-700/80 bg-slate-900/60 text-slate-300 backdrop-blur-sm transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-white active:scale-95"
              aria-label="Next Slide"
            >
              <svg
                className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
