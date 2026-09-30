import type React from 'react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function CommonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Dynamic Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Modern Footer with Container and subtle radius */}
      <Footer />
    </div>
  );
}
