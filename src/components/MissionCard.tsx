'use client';
import type { Mission } from '@/types';
import { formatRelativeTime, formatDuration, truncate } from '@/lib/utils';

type Props = {
  mission: Mission;
  compact?: boolean;
  onClick?: () => void;
};

const STATUS_COLORS: Record<string, string> = {
  RUNNING: 'var(--mission-running)',
  COMPLETED: 'var(--success)',
  FAILED: 'var(--danger)',
  QUEUED: 'var(--warning)',
  PLANNED: 'var(--text-muted)',
  WAITING: 'var(--warning)',
  WAITING_FOR_EXECUTION: 'var(--warning)',
  PAUSED: 'var(--text-muted)',
};

const STATUS_LABELS: Record<string, string> = {
  RUNNING: 'Running',
  COMPLETED: 'Complete',
  FAILED: 'Failed',
  QUEUED: 'Queued',
  PLANNED: 'Planned',
  WAITING: 'Waiting',
  WAITING_FOR_EXECUTION: 'Waiting for provider',
  PAUSED: 'Paused',
  RETRYING: 'Retrying',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
  DRAFT: 'Draft',
};

export function MissionCard({ mission, compact, onClick }: Props) {
  const statusColor = STATUS_COLORS[mission.status] ?? 'var(--text-muted)';
  const statusDotClass = (({
    RUNNING: 'status-running',
    COMPLETED: 'status-completed',
    FAILED: 'status-failed',
    QUEUED: 'status-queued',
  } as Record<string, string>)[mission.status]) ?? 'status-paused';

  return (
    <div
      className="animate-in"
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: compact ? '12px 16px' : '16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.12s, background 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span className={`status-dot ${statusDotClass}`} style={{ marginTop: '6px', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {truncate(mission.objective, 80)}
            </div>
            <span style={{ fontSize: '11px', color: statusColor, flexShrink: 0, fontWeight: '500' }}>
              {STATUS_LABELS[mission.status] ?? mission.status}
            </span>
          </div>

          {!compact && mission.planSummary && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {truncate(mission.planSummary, 100)}
            </div>
          )}

          {/* Progress bar */}
          {(mission.status === 'RUNNING' || mission.status === 'COMPLETED') && (
            <div className="progress-bar" style={{ marginBottom: '8px' }}>
              <div
                className={`progress-fill ${mission.status === 'COMPLETED' ? 'complete' : ''}`}
                style={{ width: `${mission.progress}%` }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>{formatRelativeTime(mission.createdAt)}</span>
            {mission.tasks.length > 0 && <span>{mission.tasks.length} tasks</span>}
            {mission.estimatedDurationMs && mission.status !== 'COMPLETED' && (
              <span>~{formatDuration(mission.estimatedDurationMs)}</span>
            )}
            {mission.progress > 0 && mission.progress < 100 && (
              <span style={{ color: 'var(--accent)' }}>{mission.progress}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
