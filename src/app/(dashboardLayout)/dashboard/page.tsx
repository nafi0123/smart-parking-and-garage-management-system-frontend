'use client';

import DataTable from '@/components/DataTable';

const zoneA = [
  { id: 'A1', status: 'free' },
  { id: 'A2', status: 'used' },
  { id: 'A3', status: 'free' },
  { id: 'A4', status: 'res' },
  { id: 'A5', status: 'used' },
  { id: 'A6', status: 'free' },
  { id: 'A7', status: 'used' },
  { id: 'A8', status: 'free' },
  { id: 'A9', status: 'free' },
  { id: 'A10', status: 'used' },
  { id: 'A11', status: 'free' },
  { id: 'A12', status: 'res' },
  { id: 'A13', status: 'free' },
  { id: 'A14', status: 'used' },
  { id: 'A15', status: 'used' },
  { id: 'A16', status: 'free' },
  { id: 'A17', status: 'free' },
  { id: 'A18', status: 'used' },
];

const activity = [
  { plate: 'DHA-15-4471', meta: 'Slot A9 · 3 mins ago', type: 'in' },
  { plate: 'DHA-11-2093', meta: 'Slot B4 · 8 mins ago', type: 'out' },
  { plate: 'CTG-02-8871', meta: 'Slot A2 · 14 mins ago', type: 'in' },
  { plate: 'DHA-33-1120', meta: 'Slot C7 · 22 mins ago', type: 'out' },
];

export default function DashboardPage() {
  return (
    <>
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="lbl">Total Slots</div>
          <div className="val">240</div>
          <div className="sub">Across 4 Zones</div>
        </div>

        <div className="stat-card">
          <div className="lbl">Available</div>
          <div className="val green">86</div>
          <div className="sub">36% Vacant</div>
        </div>

        <div className="stat-card">
          <div className="lbl">Occupied</div>
          <div className="val red">142</div>
          <div className="sub">59% Full</div>
        </div>

        <div className="stat-card">
          <div className="lbl">Today&apos;s Revenue</div>
          <div className="val">$1,842</div>
          <div className="sub text-emerald-600 dark:text-emerald-400 font-medium">
            +12% vs yesterday
          </div>
        </div>
      </div>

      {/* Panels Grid */}
      <div className="panels-grid">
        {/* Live Slot Map */}
        <div className="panel-card">
          <h2>Zone A — Live Map</h2>
          <div className="zone-grid">
            {zoneA.map((s) => (
              <div key={s.id} className={`slot ${s.status}`} title={`Slot ${s.id} (${s.status})`}>
                {s.id}
              </div>
            ))}
          </div>
          <div className="legend">
            <span>
              <i style={{ background: 'var(--green)' }} /> Available
            </span>
            <span>
              <i style={{ background: 'var(--red)' }} /> Occupied
            </span>
            <span>
              <i style={{ background: 'var(--amber)' }} /> Reserved
            </span>
          </div>
        </div>

        {/* Recent Entry / Exit Activity */}
        <div className="panel-card">
          <h2>Recent Entry / Exit</h2>
          <div className="activity-list">
            {activity.map((a) => (
              <div key={a.plate} className="activity-row">
                <div>
                  <div className="who">{a.plate}</div>
                  <div className="meta">{a.meta}</div>
                </div>
                <span className={`status-badge ${a.type}`}>
                  {a.type === 'in' ? 'Entry' : 'Exit'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable title="Recent Registered Users" subtitle="Live records from Central Parking Network" badgeLabel="Total" />
    </>
  );
}
