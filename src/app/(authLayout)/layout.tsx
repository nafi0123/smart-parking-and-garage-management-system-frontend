'use client';

import Link from 'next/link';
import type React from 'react';

const miniMapSlots = [
  { id: 's1', color: 'green' },
  { id: 's2', color: 'red' },
  { id: 's3', color: 'green' },
  { id: 's4', color: 'green' },
  { id: 's5', color: 'red' },
  { id: 's6', color: 'amber' },
  { id: 's7', color: 'green' },
  { id: 's8', color: 'red' },
  { id: 's9', color: 'red' },
  { id: 's10', color: 'green' },
  { id: 's11', color: 'green' },
  { id: 's12', color: 'red' },
  { id: 's13', color: 'green' },
  { id: 's14', color: 'green' },
  { id: 's15', color: 'amber' },
  { id: 's16', color: 'green' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-container">
      {/* Left Brand / Hero Section */}
      <div className="auth-brand-side">
        <Link href="/" className="brand-logo">
          <span className="dot" /> ParkWise
        </Link>

        <div className="auth-hero">
          <h2>Monitor Every Spot in Real-Time.</h2>
          <p>
            Log in to the sensor-driven smart parking platform to manage live zone status, access
            logs, and automated billing in one place.
          </p>
          <div className="mini-map-grid">
            {miniMapSlots.map((slot) => (
              <i
                key={slot.id}
                style={{ background: `var(--${slot.color})` }}
                title={`Slot ${slot.id}: ${slot.color}`}
              />
            ))}
          </div>
        </div>

        <div className="quote">© {new Date().getFullYear()} ParkWise · Central Parking Network</div>
      </div>

      {/* Right Form Area */}
      <div className="auth-form-wrapper">{children}</div>
    </div>
  );
}
