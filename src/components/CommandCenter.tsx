'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Mission, Project, PhantomNotification } from '@/types';
import type { ViewType } from './PhantomApp';
import type { ProcessCommandResult } from '@/kernel/PhantomKernel';
import { MissionCard } from './MissionCard';
import { useVoiceInterface } from '@/hooks/useVoiceInterface';
import { NeuralSphere } from './NeuralSphere';

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

interface DialogueTurn {
  id: string;
  sender: 'USER' | 'PHANTOM';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
  isMission?: boolean;
}

const SYSTEM_CLOCK = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export function CommandCenter({
  initialized,
  activeProject,
  missions,
  providerAvailable,
  systemStatus,
  sendCommand,
  onNavigate,
}: Props) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueTurn[]>([
    {
      id: 'init_0',
      sender: 'PHANTOM',
      text: 'PHANTOM Kernel online. All subsystems initialized — research engine, memory store, execution provider, permission layer. Say or type a directive to begin.',
      timestamp: SYSTEM_CLOCK(),
      suggestedQuestions: [
        'Research 50 Indian AI startups and create report',
        'What can you do?',
        'Analyze CSV revenue data for anomalies',
        'Kaise ho Phantom?',
      ],
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);

  const activeMissions = missions.filter(m => m.status === 'RUNNING' || m.status === 'QUEUED');
  const recentMissions = missions.slice(0, 4);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [dialogueHistory]);

  const executeCommand = useCallback(async (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setError(null);

    const userTurn: DialogueTurn = {
      id: `u_${Date.now()}`,
      sender: 'USER',
      text: trimmed,
      timestamp: SYSTEM_CLOCK(),
    };
    setDialogueHistory(prev => [...prev, userTurn]);
    setInput('');

    try {
      const result = await sendCommand(trimmed);

      if (result.isConversation && result.directReply) {
        const phantomTurn: DialogueTurn = {
          id: `p_${Date.now()}`,
          sender: 'PHANTOM',
          text: result.directReply,
          timestamp: SYSTEM_CLOCK(),
          suggestedQuestions: result.suggestedQuestions,
          isMission: false,
        };
        setDialogueHistory(prev => [...prev, phantomTurn]);

        // Speak the shorter version if available
        const spokenText = (result as { spokenReply?: string }).spokenReply ?? result.directReply;
        voice.speak(spokenText);
      } else if (!result.isConversation) {
        const missionTurn: DialogueTurn = {
          id: `pm_${Date.now()}`,
          sender: 'PHANTOM',
          text: `Mission initialized. Executing task DAG autonomously — multi-source verification + synthesis in progress.`,
          timestamp: SYSTEM_CLOCK(),
          suggestedQuestions: ['View task graph', 'Check mission status'],
          isMission: true,
        };
        setDialogueHistory(prev => [...prev, missionTurn]);
        voice.speak('Mission created. Executing now.');
        setTimeout(() => onNavigate('missions'), 800);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      const errTurn: DialogueTurn = {
        id: `e_${Date.now()}`,
        sender: 'PHANTOM',
        text: `Execution error: ${msg}`,
        timestamp: SYSTEM_CLOCK(),
      };
      setDialogueHistory(prev => [...prev, errTurn]);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendCommand, onNavigate]);

  // Voice hook — voice command feeds into executeCommand
  const voice = useVoiceInterface(useCallback((spoken: string) => {
    executeCommand(spoken);
  }, [executeCommand]));

  const handleSubmit = () => executeCommand(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    // Auto-grow textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  if (!initialized) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <NeuralSphere isListening={false} isSpeaking={false} audioLevel={0} />
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Initializing PHANTOM Kernel…
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Top Header ─────────────────────────────────────────── */}
      <header style={{
        padding: '12px 28px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Logo mark */}
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, #4f8ef7 0%, #3ecf8e 100%)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '15px', color: '#fff',
            boxShadow: '0 0 18px rgba(79,142,247,0.35)',
            letterSpacing: '-0.02em',
          }}>Ψ</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
              PHANTOM OS
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              {activeProject?.name ?? 'Personal'} · Autonomous Kernel
            </div>
          </div>
        </div>

        {/* Voice + language controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Mic pill */}
          <button
            onClick={voice.toggleListening}
            title={voice.isMuted ? 'Click to unmute voice' : 'Click to mute voice (or say "Phantom stop")'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: voice.isListening
                ? 'rgba(62,207,142,0.12)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${voice.isListening ? 'rgba(62,207,142,0.4)' : 'var(--border)'}`,
              borderRadius: '999px',
              padding: '5px 13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: voice.isListening ? 'var(--success)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: '500',
              outline: 'none',
            }}
          >
            <span style={{ fontSize: '13px' }}>{voice.isListening ? '🎙' : '🔇'}</span>
            <span>{voice.isListening ? 'Listening' : 'Muted'}</span>
            {voice.isListening && (
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 6px var(--success)',
                animation: 'pulse 1.4s infinite',
                flexShrink: 0,
              }} />
            )}
          </button>

          {/* Language selector */}
          <select
            value={voice.language}
            onChange={e => voice.setLanguage(e.target.value as 'en-IN' | 'hi-IN' | 'en-US')}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              padding: '5px 9px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="en-IN">English (IN)</option>
            <option value="hi-IN">Hindi / Hinglish</option>
            <option value="en-US">English (US)</option>
          </select>

          {/* System status dot */}
          <div title={`System: ${systemStatus}`} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: systemStatus === 'READY'
              ? (providerAvailable ? 'var(--success)' : 'var(--warning)')
              : systemStatus === 'ERROR' ? 'var(--danger)' : 'var(--text-muted)',
            boxShadow: systemStatus === 'READY' && providerAvailable
              ? '0 0 8px var(--success)' : 'none',
          }} />
        </div>
      </header>

      {/* ── Main Body ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Dialogue + Input */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>

          {/* Live voice transcript banner */}
          {voice.transcript && (
            <div style={{
              background: 'rgba(79,142,247,0.1)',
              borderBottom: '1px solid rgba(79,142,247,0.25)',
              padding: '7px 24px',
              fontSize: '12px',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'pulse 0.8s infinite',
                flexShrink: 0,
              }} />
              <span style={{ fontStyle: 'italic' }}>"{voice.transcript}"</span>
            </div>
          )}

          {/* Dialogue stream */}
          <div
            ref={chatScrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {dialogueHistory.map(turn => (
              <div
                key={turn.id}
                style={{
                  alignSelf: turn.sender === 'USER' ? 'flex-end' : 'flex-start',
                  maxWidth: turn.sender === 'USER' ? '72%' : '88%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  animation: 'fadeSlideIn 0.22s ease-out',
                }}
              >
                {/* Sender label */}
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.07em',
                  display: 'flex',
                  gap: '5px',
                  alignSelf: turn.sender === 'USER' ? 'flex-end' : 'flex-start',
                }}>
                  <span style={{ fontWeight: '600', color: turn.sender === 'USER' ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {turn.sender === 'USER' ? 'YOU' : 'PHANTOM'}
                  </span>
                  <span>·</span>
                  <span>{turn.timestamp}</span>
                  {turn.isMission && (
                    <>
                      <span>·</span>
                      <span style={{ color: 'var(--warning)' }}>MISSION</span>
                    </>
                  )}
                </div>

                {/* Bubble */}
                <div style={{
                  background: turn.sender === 'USER'
                    ? 'linear-gradient(135deg, rgba(79,142,247,0.22) 0%, rgba(79,142,247,0.12) 100%)'
                    : turn.isMission
                      ? 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(62,207,142,0.08) 100%)'
                      : 'var(--surface-2)',
                  border: `1px solid ${turn.sender === 'USER'
                    ? 'rgba(79,142,247,0.35)'
                    : turn.isMission
                      ? 'rgba(245,166,35,0.25)'
                      : 'var(--border)'}`,
                  borderRadius: turn.sender === 'USER'
                    ? '14px 14px 4px 14px'
                    : '4px 14px 14px 14px',
                  padding: '13px 17px',
                  fontSize: '13.5px',
                  lineHeight: '1.65',
                  color: 'var(--text-primary)',
                  boxShadow: turn.sender === 'PHANTOM'
                    ? '0 2px 16px rgba(0,0,0,0.18)'
                    : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {turn.text}
                </div>

                {/* Suggestion pills */}
                {turn.suggestedQuestions && turn.suggestedQuestions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                    {turn.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => executeCommand(q)}
                        disabled={isProcessing}
                        style={{
                          background: 'rgba(79,142,247,0.08)',
                          border: '1px solid rgba(79,142,247,0.22)',
                          borderRadius: '999px',
                          padding: '4px 11px',
                          color: 'var(--accent)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          opacity: isProcessing ? 0.5 : 1,
                        }}
                        onMouseEnter={e => {
                          (e.target as HTMLButtonElement).style.background = 'rgba(79,142,247,0.18)';
                        }}
                        onMouseLeave={e => {
                          (e.target as HTMLButtonElement).style.background = 'rgba(79,142,247,0.08)';
                        }}
                      >
                        → {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Processing indicator */}
            {isProcessing && (
              <div style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                fontSize: '12px',
                padding: '8px 14px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '4px 14px 14px 14px',
              }}>
                <span className="status-dot status-running" />
                Processing…
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              padding: '10px 24px',
              background: 'rgba(239,68,68,0.08)',
              borderTop: '1px solid rgba(239,68,68,0.2)',
              fontSize: '12px',
              color: 'var(--danger)',
              flexShrink: 0,
            }}>
              {error}
            </div>
          )}

          {/* Input area */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            background: 'rgba(10,10,15,0.7)',
            flexShrink: 0,
          }}>
            <div style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '10px',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(79,142,247,0.5)')}
              onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Say or type a directive in Hindi, English, or Hinglish…"
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  maxHeight: '120px',
                  overflow: 'auto',
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={isProcessing || !input.trim()}
                style={{
                  background: isProcessing || !input.trim()
                    ? 'rgba(79,142,247,0.25)'
                    : 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: isProcessing || !input.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                  outline: 'none',
                }}
              >
                {isProcessing ? '…' : 'Execute'}
              </button>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '5px',
              fontSize: '10px',
              color: 'var(--text-muted)',
              paddingLeft: '2px',
            }}>
              <span>Say "Phantom stop" to mute · "Phantom suno" to wake</span>
              <span>⌘↵ to send</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Telemetry + Sphere */}
        <div style={{
          width: '290px',
          flexShrink: 0,
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          overflowY: 'auto',
        }}>

          {/* Neural Sphere */}
          <div style={{
            padding: '28px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid var(--border)',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.06) 0%, transparent 70%)',
          }}>
            <NeuralSphere
              isListening={voice.isListening}
              isSpeaking={voice.isSpeaking}
              audioLevel={voice.audioLevel}
            />
            <div style={{
              fontSize: '11px',
              color: voice.isSpeaking ? 'var(--success)' : voice.isListening ? 'var(--accent)' : 'var(--text-muted)',
              letterSpacing: '0.08em',
              fontWeight: '600',
              textAlign: 'center',
              transition: 'color 0.3s',
            }}>
              {voice.isSpeaking ? '▲  SPEAKING' : voice.isListening ? 'Ψ  LISTENING' : '■  STANDBY'}
            </div>
            {!voice.supported && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Voice not supported in this browser
              </div>
            )}
          </div>

          {/* Metrics */}
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '10px' }}>
              KERNEL METRICS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'Kernel', value: 'ONLINE', color: 'var(--success)' },
                { label: 'Provider', value: providerAvailable ? 'Browser Worker' : 'UNAVAILABLE', color: providerAvailable ? 'var(--success)' : 'var(--warning)' },
                { label: 'Voice', value: voice.isListening ? 'ACTIVE' : 'MUTED', color: voice.isListening ? 'var(--accent)' : 'var(--text-muted)' },
                { label: 'Missions', value: String(activeMissions.length) + ' active', color: activeMissions.length > 0 ? 'var(--warning)' : 'var(--text-muted)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active missions */}
          {activeMissions.length > 0 && (
            <div style={{ padding: '16px 16px 0' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px' }}>
                ACTIVE EXECUTION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {activeMissions.map(m => (
                  <MissionCard key={m.id} mission={m} compact onClick={() => onNavigate('missions')} />
                ))}
              </div>
            </div>
          )}

          {/* Recent missions */}
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: '700' }}>
                RECENT MISSIONS
              </div>
              <button
                onClick={() => onNavigate('missions')}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10px', cursor: 'pointer' }}
              >
                View all →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {recentMissions.length === 0
                ? <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '10px 0' }}>No missions yet. Give PHANTOM a directive.</div>
                : recentMissions.map(m => (
                  <MissionCard key={m.id} mission={m} compact onClick={() => onNavigate('missions')} />
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
