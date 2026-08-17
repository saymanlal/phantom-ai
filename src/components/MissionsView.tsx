'use client';
import { useState } from 'react';
import type { Mission, Project } from '@/types';
import { MissionCard } from './MissionCard';
import { MissionDetail } from './MissionDetail';

type Props = {
  missions: Mission[];
  projects: Project[];
  onRefresh: () => Promise<void>;
};

const STATUS_FILTERS = ['ALL', 'RUNNING', 'QUEUED', 'COMPLETED', 'FAILED', 'PAUSED'] as const;

export function MissionsView({ missions, projects, onRefresh }: Props) {
  const [filter, setFilter] = useState<string>('ALL');
  const [selected, setSelected] = useState<Mission | null>(null);

  const filtered = filter === 'ALL' ? missions : missions.filter(m => m.status === filter);

  const getProjectName = (projectId: string) =>
    projects.find(p => p.id === projectId)?.name ?? 'Unknown';

  if (selected) {
    return (
      <MissionDetail
        mission={selected}
        projectName={getProjectName(selected.projectId)}
        onBack={() => setSelected(null)}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)' }}>Missions</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{missions.length} total</div>
        </div>
        <button className="phantom-btn phantom-btn-ghost" onClick={onRefresh} id="missions-refresh-btn">
          ↺ Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
              background: filter === f ? 'var(--accent-dim)' : 'transparent',
              color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.12s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Mission list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No missions{filter !== 'ALL' ? ` with status ${filter}` : ''} yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(m => (
            <MissionCard
              key={m.id}
              mission={m}
              onClick={() => setSelected(m)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
