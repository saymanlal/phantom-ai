'use client';
import { useEffect, useState } from 'react';
import type { Mission, Task } from '@/types';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import { etaEngine } from '@/kernel/ETAEngine';

type Props = {
  mission: Mission;
  projectName: string;
  onBack: () => void;
  onRefresh: () => Promise<void>;
};

const TASK_STATUS_ICONS: Record<string, string> = {
  COMPLETED: '✓',
  RUNNING: '●',
  FAILED: '✗',
  PENDING: '○',
  QUEUED: '○',
  BLOCKED: '—',
  RETRYING: '↺',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'var(--success)',
  RUNNING: 'var(--accent)',
  FAILED: 'var(--danger)',
  PENDING: 'var(--text-muted)',
  QUEUED: 'var(--warning)',
  RETRYING: 'var(--warning)',
};

export function MissionDetail({ mission, projectName, onBack, onRefresh }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [mission.id]);

  const loadTasks = async () => {
    const { missionEngine } = await import('@/kernel/MissionEngine');
    const t = await missionEngine.getTasksForMission(mission.id);
    setTasks(t);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    await loadTasks();
    setRefreshing(false);
  };

  const eta = etaEngine.estimate(mission, tasks);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        ← Back to missions
      </button>

      {/* Mission header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{projectName}</div>
        <h2 style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.4' }}>
          {mission.objective}
        </h2>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span>Created {formatRelativeTime(mission.createdAt)}</span>
          {mission.startedAt && <span>Started {formatRelativeTime(mission.startedAt)}</span>}
          {mission.tasks.length > 0 && <span>{mission.tasks.length} tasks</span>}
          {mission.confidence && <span>Confidence: {Math.round(mission.confidence * 100)}%</span>}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { label: 'Status', value: mission.status.replace(/_/g, ' ') },
          { label: 'Progress', value: `${mission.progress}%` },
          { label: 'ETA', value: eta.progress < 100 ? etaEngine.formatWindow(eta) : 'Done' },
          { label: 'ETA Confidence', value: `${Math.round(eta.confidence * 100)}%` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 16px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="progress-bar" style={{ height: '3px', marginBottom: '28px' }}>
        <div className={`progress-fill ${mission.status === 'COMPLETED' ? 'complete' : mission.status === 'FAILED' ? 'failed' : ''}`}
          style={{ width: `${mission.progress}%` }} />
      </div>

      {/* Error */}
      {mission.errorMessage && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '24px',
          fontSize: '13px',
          color: 'var(--danger)',
        }}>
          <strong>Error:</strong> {mission.errorMessage}
        </div>
      )}

      {/* Task graph */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>TASK GRAPH</span>
          <button onClick={handleRefresh} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px' }}>
            {refreshing ? 'Refreshing...' : '↺ Refresh'}
          </button>
        </div>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          fontFamily: 'monospace',
        }}>
          {tasks.length === 0 ? (
            <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>No tasks loaded yet.</div>
          ) : (
            tasks.map((task, i) => (
              <div key={task.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 16px',
                borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ color: TASK_STATUS_COLORS[task.status] ?? 'var(--text-muted)', fontSize: '12px', marginTop: '1px' }}>
                  {TASK_STATUS_ICONS[task.status] ?? '?'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{task.name}</div>
                  {task.errorMessage && (
                    <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px' }}>{task.errorMessage}</div>
                  )}
                  {task.status === 'RUNNING' && (
                    <div className="progress-bar" style={{ marginTop: '4px' }}>
                      <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {task.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Result */}
      {mission.result && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '12px' }}>RESULT</div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>{mission.result.summary}</div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Tasks: {mission.result.taskCount}</span>
              <span>Success rate: {Math.round(mission.result.successRate * 100)}%</span>
              <span>Duration: {formatDuration(mission.result.duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
