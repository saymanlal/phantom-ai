'use client';
import { useState, useRef } from 'react';
import type { Mission, Project, PhantomNotification } from '@/types';
import type { ViewType } from './PhantomApp';
import type { ProcessCommandResult } from '@/kernel/PhantomKernel';
import { MissionCard } from './MissionCard';
import { formatRelativeTime } from '@/lib/utils';

type Props = {
  initialized: boolean;
  activeProject: Project | null;
  projects: Project[];
  missions: Mission[];
  notifications: PhantomNotification[];
  providerAvailable: boolean;
  systemStatus: 'READY' | 'INITIALIZING' | 'ERROR';
  sendCommand: (input: string) => Promise<ProcessCommandResult>;
  onNavigate: (view: ViewType) => void;
};

export function CommandCenter({ initialized, activeProject, missions, notifications, providerAvailable, systemStatus, sendCommand, onNavigate }: Props) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [directResponse, setDirectResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeMissions = missions.filter(m => m.status === 'RUNNING' || m.status === 'QUEUED');
  const recentMissions = missions.slice(0, 4);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    setError(null);
    setDirectResponse(null);
    setIsProcessing(true);
    try {
      const result = await sendCommand(trimmed);
      setInput('');
      if (result.isConversation && result.directReply) {
        setDirectResponse(result.directReply);
      } else {
        onNavigate('missions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const EXAMPLE_COMMANDS = [
    'Research the Indian AI startup ecosystem. Find 50 companies. Create a report.',
    'Analyze this CSV and find anomalies in the revenue data.',
    'Monitor TechCrunch for new AI funding announcements every morning.',
    'Find the reason this build is failing and fix it.',
  ];

  if (!initialized) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '13px', marginBottom: '8px' }}>Initializing PHANTOM...</div>
          <div className="status-dot status-queued" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '300', color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          What needs to happen?
        </h1>
        {activeProject && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Project: <span style={{ color: 'var(--text-secondary)' }}>{activeProject.name}</span>
          </div>
        )}
      </div>

      {/* Command Input */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
        marginBottom: '28px',
        transition: 'border-color 0.15s',
      }}>
        <textarea
          ref={textareaRef}
          id="phantom-command-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe an objective, ask about system capabilities, or trigger a research mission..."
          rows={3}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '15px',
            lineHeight: '1.6',
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {!providerAvailable && (
              <span style={{ fontSize: '11px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="status-dot status-queued" /> No execution provider — missions will be queued
              </span>
            )}
            {providerAvailable && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>⌘↵ to execute · Browser worker active</span>
            )}
          </div>
          <button
            id="phantom-execute-btn"
            className="phantom-btn phantom-btn-primary"
            onClick={handleSubmit}
            disabled={isProcessing || !input.trim()}
            style={{ opacity: !input.trim() || isProcessing ? 0.4 : 1 }}
          >
            {isProcessing ? 'Processing...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Direct Conversational / Capability Reply Box */}
      {directResponse && (
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '28px',
          boxShadow: '0 0 16px rgba(79,142,247,0.1)',
        }} className="animate-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>PHANTOM</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Operator Response</span>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {directResponse}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '24px',
          color: 'var(--danger)',
          fontSize: '13px',
        }}>
          <strong>Execution error:</strong> {error}
        </div>
      )}

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot status-running" />
            ACTIVE MISSIONS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeMissions.map(m => (
              <MissionCard key={m.id} mission={m} compact onClick={() => onNavigate('missions')} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Missions */}
      {recentMissions.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>RECENT MISSIONS</div>
            <button onClick={() => onNavigate('missions')} style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentMissions.map(m => (
              <MissionCard key={m.id} mission={m} compact onClick={() => onNavigate('missions')} />
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {missions.length === 0 && !directResponse && (
        <section>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '12px' }}>EXAMPLE MISSIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {EXAMPLE_COMMANDS.map((cmd, i) => (
              <button
                key={i}
                onClick={() => setInput(cmd)}
                style={{
                  textAlign: 'left',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {cmd}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
