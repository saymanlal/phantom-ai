'use client';
import type { PhantomNotification } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

type Props = {
  notifications: PhantomNotification[];
  onMarkRead: () => Promise<void>;
};

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: 'var(--danger)',
  HIGH: 'var(--warning)',
  MEDIUM: 'var(--accent)',
  LOW: 'var(--text-muted)',
};

export function NotificationsView({ notifications, onMarkRead }: Props) {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)' }}>Notifications</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{unread} unread</div>
        </div>
        {unread > 0 && (
          <button id="mark-all-read-btn" className="phantom-btn phantom-btn-ghost" onClick={onMarkRead} style={{ fontSize: '12px' }}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No notifications yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              background: n.read ? 'var(--surface)' : 'var(--surface-2)',
              border: `1px solid ${n.read ? 'var(--border)' : 'var(--border-active)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
              opacity: n.read ? 0.7 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: URGENCY_COLORS[n.urgency] ?? 'var(--text-muted)', fontSize: '14px', marginTop: '1px' }}>△</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>{n.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{n.body}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatRelativeTime(n.createdAt)}</div>
                </div>
                {!n.read && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '5px' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
