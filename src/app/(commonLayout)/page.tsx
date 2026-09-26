import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Smart Parking & Garage Management System
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] leading-tight">
        Next-Generation Parking, <br className="hidden sm:inline" />
        <span className="text-[var(--navy-2)] dark:text-blue-400">Streamlined in Real-Time</span>
      </h1>

      <p className="mt-4 max-w-2xl mx-auto text-lg text-[var(--sub)]">
        Live spot monitoring, automated gate logs, and comprehensive billing analytics built for
        modern smart garage infrastructure.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/dashboard" className="btn-primary-custom !w-auto px-6 py-3">
          Explore Dashboard →
        </Link>
        <Link href="/login" className="btn-ghost-custom !w-auto px-6 py-3">
          Sign In to Portal
        </Link>
      </div>
    </div>
  );
}
