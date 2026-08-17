'use client';
import type { ViewType } from './PhantomApp';

type NavItem = {
  id: ViewType;
  label: string;
  icon: string;
  badge?: number | string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'command', label: 'Command', icon: '⌘' },
  { id: 'missions', label: 'Missions', icon: '◉' },
  { id: 'projects', label: 'Projects', icon: '⬡' },
  { id: 'activity', label: 'Activity', icon: '⊞' },
  { id: 'notifications', label: 'Alerts', icon: '△' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

type Props = {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  unreadCount: number;
  systemStatus: 'READY' | 'INITIALIZING' | 'ERROR';
  providerAvailable: boolean;
  activeMissions: number;
};

export function Sidebar({ activeView, onNavigate, unreadCount, systemStatus, providerAvailable, activeMissions }: Props) {
  return (
    <aside style={{
      width: '220px',
      minWidth: '220px',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{
            width: '26px', height: '26px',
            background: 'var(--accent)',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: '#fff',
            letterSpacing: '-0.5px',
          }}>P</div>
          <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>PHANTOM</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', paddingLeft: '34px' }}>
          AUTONOMOUS OS
        </div>
      </div>

      {/* System status */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span className={`status-dot ${systemStatus === 'READY' ? 'status-completed' : systemStatus === 'INITIALIZING' ? 'status-queued' : 'status-failed'}`} />
          <span>{systemStatus === 'READY' ? (providerAvailable ? 'Provider ready' : 'No provider') : systemStatus.toLowerCase()}</span>
        </div>
        {activeMissions > 0 && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--accent)' }}>
            {activeMissions} mission{activeMissions > 1 ? 's' : ''} running
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onNavigate(item.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: 'pointer',
              background: activeView === item.id ? 'var(--accent-dim)' : 'transparent',
              color: activeView === item.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: activeView === item.id ? '500' : '400',
              textAlign: 'left',
              marginBottom: '2px',
              transition: 'all 0.12s',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.id === 'notifications' && unreadCount > 0 && (
              <span style={{
                background: 'var(--danger)',
                color: '#fff',
                borderRadius: '999px',
                fontSize: '10px',
                padding: '1px 5px',
                fontWeight: '600',
              }}>{unreadCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        fontSize: '10px',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>⌘K to search</span>
        <span style={{ color: 'var(--accent)', opacity: 0.6 }}>v0.1</span>
      </div>
    </aside>
  );
}
