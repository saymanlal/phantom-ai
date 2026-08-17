'use client';
import { useState, useEffect, useRef } from 'react';

const COMMANDS = [
  { id: 'missions', label: 'View Missions', shortcut: '/missions', icon: '◉' },
  { id: 'projects', label: 'View Projects', shortcut: '/projects', icon: '⬡' },
  { id: 'settings', label: 'Open Settings', shortcut: '/settings', icon: '⚙' },
  { id: 'activity', label: 'Activity Timeline', shortcut: '/activity', icon: '⊞' },
];

type Props = {
  onClose: () => void;
  onCommand: (cmd: string) => Promise<void>;
};

export function CommandPalette({ onClose, onCommand }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') setSelected(s => Math.min(s + 1, filtered.length - 1));
    if (e.key === 'ArrowUp') setSelected(s => Math.max(s - 1, 0));
    if (e.key === 'Enter') {
      if (filtered[selected]) onCommand(filtered[selected].shortcut);
      else if (query.trim()) onCommand(query.trim());
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '120px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-in" style={{
        width: '560px',
        background: 'var(--surface)',
        border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <input
            ref={inputRef}
            id="command-palette-input"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
            placeholder="Search commands or type a mission objective..."
            style={{
              width: '100%', background: 'transparent', border: 'none',
              outline: 'none', color: 'var(--text-primary)', fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
          {filtered.length === 0 && query ? (
            <div
              onClick={() => onCommand(query)}
              style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span>⌘</span>
              <span>Execute: "{query}"</span>
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                id={`palette-cmd-${cmd.id}`}
                onClick={() => onCommand(cmd.shortcut)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: i === selected ? 'var(--surface-2)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ color: 'var(--text-muted)', width: '16px', textAlign: 'center' }}>{cmd.icon}</span>
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>{cmd.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cmd.shortcut}</span>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
          <span>↵ select</span>
          <span>↑↓ navigate</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
