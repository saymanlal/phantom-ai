'use client';
import { useState, useRef, useEffect } from 'react';
import type { Mission, Project, PhantomNotification } from '@/types';
import type { ViewType } from './PhantomApp';
import type { ProcessCommandResult } from '@/kernel/PhantomKernel';
import { MissionCard } from './MissionCard';
import { useVoiceInterface } from '@/hooks/useVoiceInterface';

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
  const [directResponse, setDirectResponse] = useState<{ reply: string; questions?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeMissions = missions.filter(m => m.status === 'RUNNING' || m.status === 'QUEUED');
  const recentMissions = missions.slice(0, 4);

  // Voice Engine setup
  const voice = useVoiceInterface(async (spokenCommand) => {
    if (!spokenCommand.trim() || isProcessing) return;
    executeCommand(spokenCommand);
  });

  const executeCommand = async (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed || isProcessing) return;
    setError(null);
    setDirectResponse(null);
    setIsProcessing(true);

    try {
      const result = await sendCommand(trimmed);
      setInput('');

      if (result.isConversation && result.directReply) {
        setDirectResponse({
          reply: result.directReply,
          questions: result.suggestedQuestions,
        });

        // Proactive voice reply
        voice.speak(result.directReply);
      } else {
        voice.speak("Mission created. Executing autonomous workflow now.");
        onNavigate('missions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    executeCommand(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const EXAMPLE_COMMANDS = [
    'Research 50 Indian AI startups and create an executive report',
    'Kaise ho Phantom? Aaj kya update hai?',
    'Analyze CSV dataset for revenue anomalies',
    'Tell me something interesting about Indic LLMs',
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
      {/* Header & Voice Toggle Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '300', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            What needs to happen?
          </h1>
          {activeProject && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Workspace: <span style={{ color: 'var(--text-secondary)' }}>{activeProject.name}</span>
            </div>
          )}
        </div>

        {/* Voice Control Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '6px 12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <button
            onClick={voice.toggleListening}
            title={voice.isListening ? "Voice Active (Click to mute)" : "Voice Muted (Click to activate)"}
            style={{
              background: voice.isListening ? 'rgba(62,207,142,0.15)' : 'var(--surface-2)',
              border: `1px solid ${voice.isListening ? 'var(--success)' : 'var(--border)'}`,
              color: voice.isListening ? 'var(--success)' : 'var(--text-muted)',
              borderRadius: '999px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '12px' }}>{voice.isListening ? '🎙️ Listening' : '🔇 Mic Off'}</span>
            {voice.isSpeaking && <span style={{ color: 'var(--accent)', fontSize: '10px' }}>• Speaking</span>}
          </button>
          
          <select
            value={voice.language}
            onChange={(e) => voice.setLanguage(e.target.value as any)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="en-IN" style={{ background: '#111' }}>English (India)</option>
            <option value="hi-IN" style={{ background: '#111' }}>Hindi / Hinglish</option>
            <option value="en-US" style={{ background: '#111' }}>English (US)</option>
          </select>
        </div>
      </div>

      {/* Real-time Voice Live Transcript Bubble */}
      {voice.transcript && (
        <div style={{
          background: 'rgba(79,142,247,0.08)',
          border: '1px solid rgba(79,142,247,0.2)',
          borderRadius: 'var(--radius)',
          padding: '8px 14px',
          marginBottom: '16px',
          fontSize: '12px',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span className="status-dot status-running" />
          <span>Heard: "{voice.transcript}"</span>
        </div>
      )}

      {/* Main Command Input */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
        marginBottom: '24px',
        transition: 'border-color 0.15s',
      }}>
        <textarea
          ref={textareaRef}
          id="phantom-command-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Speak or type a command in English, Hindi, or Hinglish (e.g. '50 Indian AI startups dhundo aur report banao')..."
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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ⌘↵ to execute · Voice in-between commands supported
            </span>
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

      {/* Direct Conversational & Questioning Container */}
      {directResponse && (
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          marginBottom: '28px',
          boxShadow: '0 0 20px rgba(79,142,247,0.12)',
        }} className="animate-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>PHANTOM OPERATOR</span>
              <span style={{ fontSize: '10px', color: 'var(--success)', background: 'rgba(62,207,142,0.1)', padding: '1px 6px', borderRadius: '999px' }}>Active Response</span>
            </div>
            {voice.isSpeaking && (
              <button
                onClick={() => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
              >
                ■ Stop audio
              </button>
            )}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: directResponse.questions?.length ? '14px' : '0' }}>
            {directResponse.reply}
          </div>

          {/* Proactive Suggested Follow-ups / Questions */}
          {directResponse.questions && directResponse.questions.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                SUGGESTED NEXT DIRECTIVES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {directResponse.questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => executeCommand(q)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '6px 12px',
                      color: 'var(--accent)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s',
                    }}
                  >
                    → {q}
                  </button>
                ))}
              </div>
            </div>
          )}
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
