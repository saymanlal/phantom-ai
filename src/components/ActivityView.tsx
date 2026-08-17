'use client';
import { useEffect, useState } from 'react';
import type { PhantomEvent } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

const EVENT_ICONS: Record<string, string> = {
  MISSION_CREATED: '⊕',
  MISSION_STARTED: '▶',
  MISSION_COMPLETED: '✓',
  MISSION_FAILED: '✗',
  MISSION_PAUSED: '⏸',
  TASK_COMPLETED: '·',
  TASK_FAILED: '·',
  TASK_CHECKPOINTED: '◷',
  PROJECT_CREATED: '⬡',
  ARTIFACT_CREATED: '◻',
  PERMISSION_CHANGED: '⚙',
  NOTIFICATION_SENT: '△',
};

const EVENT_COLORS: Record<string, string> = {
  MISSION_CREATED: 'var(--accent)',
  MISSION_STARTED: 'var(--accent)',
  MISSION_COMPLETED: 'var(--success)',
  MISSION_FAILED: 'var(--danger)',
  TASK_COMPLETED: 'var(--success)',
  TASK_FAILED: 'var(--danger)',
  PROJECT_CREATED: 'var(--accent)',
};

export function ActivityView() {
  const [events, setEvents] = useState<PhantomEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { eventStore } = await import('@/kernel/EventStore');
      if (eventStore) {
        const all = await eventStore.getAll();
        setEvents(all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Activity</h2>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '28px' }}>Event sourced timeline. Every state transition is recorded.</div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>No events yet. Create a mission to get started.</div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '6px', top: 0, bottom: 0, width: '1px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {events.map((event, i) => (
              <div key={event.eventId} style={{ display: 'flex', gap: '16px', paddingBottom: '16px', paddingLeft: '28px', position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: 'var(--surface)',
                  border: `1px solid ${EVENT_COLORS[event.type] ?? 'var(--border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: EVENT_COLORS[event.type] ?? 'var(--text-muted)',
                }}>
                  {EVENT_ICONS[event.type] ?? '·'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {event.type.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatRelativeTime(event.timestamp)}
                    {event.missionId && <span style={{ marginLeft: '8px', color: 'var(--accent)', opacity: 0.6 }}>mission:{event.missionId.slice(0, 8)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
