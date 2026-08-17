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

interface DialogueTurn {
  id: string;
  sender: 'USER' | 'PHANTOM';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
}

export function CommandCenter({ initialized, activeProject, missions, notifications, providerAvailable, systemStatus, sendCommand, onNavigate }: Props) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueTurn[]>([
    {
      id: 'init_1',
      sender: 'PHANTOM',
      text: "PHANTOM Autonomous Kernel initialized. Always-on bilingual voice listener active. Say 'Phantom suno' or speak any operational directive directly.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        "Research 50 AI startups in India and create report",
        "Analyze CSV revenue data",
        "What are the top Indic AI models?",
        "Kaise ho Phantom? Aaj kya update hai?",
      ],
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const activeMissions = missions.filter(m => m.status === 'RUNNING' || m.status === 'QUEUED');
  const recentMissions = missions.slice(0, 4);

  // Autonomous continuous voice hook
  const voice = useVoiceInterface(async (spokenText) => {
    if (!spokenText.trim() || isProcessing) return;
    executeCommand(spokenText);
  });

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [dialogueHistory]);

  const executeCommand = async (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed || isProcessing) return;
    setError(null);
    setIsProcessing(true);

    const userTurn: DialogueTurn = {
      id: `user_${Date.now()}`,
      sender: 'USER',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDialogueHistory(prev => [...prev, userTurn]);
    setInput('');

    try {
      const result = await sendCommand(trimmed);

      if (result.isConversation && result.directReply) {
        const phantomTurn: DialogueTurn = {
          id: `ph_${Date.now()}`,
          sender: 'PHANTOM',
          text: result.directReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuestions: result.suggestedQuestions,
        };
        setDialogueHistory(prev => [...prev, phantomTurn]);

        // Speak reply via TTS
        voice.speak(result.directReply);
      } else {
        const missionTurn: DialogueTurn = {
          id: `ph_m_${Date.now()}`,
          sender: 'PHANTOM',
          text: `Mission initialized: "${trimmed}". Executing task DAG, multi-source verification, and synthesis.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuestions: ["View task graph in Missions", "Export report"],
        };
        setDialogueHistory(prev => [...prev, missionTurn]);
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

  if (!initialized) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '13px', marginBottom: '8px' }}>Initializing Multidimensional OS Kernel...</div>
          <div className="status-dot status-queued" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Header Bar */}
      <header style={{
        padding: '16px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(15,15,24,0.7)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #4f8ef7 0%, #3ecf8e 100%)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '14px', color: '#fff',
            boxShadow: '0 0 16px rgba(79,142,247,0.3)',
          }}>
            Ψ
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
              PHANTOM OS
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Multidimensional Neural Surface • {activeProject ? activeProject.name : 'Personal Workspace'}
            </div>
          </div>
        </div>

        {/* Audio / Voice State Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            onClick={voice.toggleListening}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: voice.isListening ? 'rgba(62,207,142,0.1)' : 'var(--surface-2)',
              border: `1px solid ${voice.isListening ? 'rgba(62,207,142,0.3)' : 'var(--border)'}`,
              borderRadius: '999px',
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '12px' }}>{voice.isListening ? '🎙️ Always-On Mic' : '🔇 Mic Muted'}</span>
            {voice.isListening && (
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 8px var(--success)',
                animation: 'pulse 1.5s infinite',
              }} />
            )}
          </div>

          <select
            value={voice.language}
            onChange={(e) => voice.setLanguage(e.target.value as any)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              padding: '6px 10px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi / Hinglish</option>
            <option value="en-US">English (US)</option>
          </select>
        </div>
      </header>

      {/* Main Multidimensional Workspace Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT / CENTER: Neural Interactive Dialogue Stream */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--border)' }}>
          {/* Real-time Voice Live Transcript Banner */}
          {voice.transcript && (
            <div style={{
              background: 'rgba(79,142,247,0.12)',
              borderBottom: '1px solid rgba(79,142,247,0.3)',
              padding: '8px 24px',
              fontSize: '12px',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-dot status-running" />
                <span>Heard: "{voice.transcript}"</span>
              </div>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>Pausing sends command automatically...</span>
            </div>
          )}

          {/* Dialogue turns stream */}
          <div
            ref={chatScrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {dialogueHistory.map(turn => (
              <div
                key={turn.id}
                style={{
                  alignSelf: turn.sender === 'USER' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
                className="animate-in"
              >
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  alignSelf: turn.sender === 'USER' ? 'flex-end' : 'flex-start',
                  display: 'flex',
                  gap: '6px',
                }}>
                  <span>{turn.sender === 'USER' ? 'YOU' : 'PHANTOM OPERATOR'}</span>
                  <span>•</span>
                  <span>{turn.timestamp}</span>
                </div>

                <div style={{
                  background: turn.sender === 'USER'
                    ? 'linear-gradient(135deg, rgba(79,142,247,0.2) 0%, rgba(79,142,247,0.1) 100%)'
                    : 'var(--surface-2)',
                  border: `1px solid ${turn.sender === 'USER' ? 'rgba(79,142,247,0.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 18px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  boxShadow: turn.sender === 'PHANTOM' ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {turn.text}
                </div>

                {/* Suggested Questions / Next Directives */}
                {turn.suggestedQuestions && turn.suggestedQuestions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {turn.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => executeCommand(q)}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '999px',
                          padding: '4px 12px',
                          color: 'var(--accent)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        → {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Floating Command Bar */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            <div style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Speak in Hindi/English, ask a question, or command a research mission..."
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
                  lineHeight: '1.4',
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={isProcessing || !input.trim()}
                className="phantom-btn phantom-btn-primary"
                style={{ padding: '6px 14px', fontSize: '12px', opacity: isProcessing || !input.trim() ? 0.4 : 1 }}
              >
                {isProcessing ? 'Processing...' : 'Execute'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>Say "Phantom stop" or "Phantom wake up" anytime to toggle voice</span>
              <span>⌘↵ to send</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Multidimensional Telemetry & Active Missions Sidebar */}
        <div style={{ width: '320px', background: 'var(--surface)', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Mission Health Metrics */}
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '600' }}>
              OPERATIONAL METRICS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Kernel State</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--success)' }}>ONLINE 🟢</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Cloud Sync</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>ACTIVE 🌐</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Voice Engine</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: voice.isListening ? 'var(--success)' : 'var(--text-muted)' }}>
                  {voice.isListening ? 'LISTENING 🎙️' : 'MUTED 🔇'}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Active Missions</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{activeMissions.length}</div>
              </div>
            </div>
          </div>

          {/* Active Missions */}
          {activeMissions.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
                ACTIVE EXECUTION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeMissions.map(m => (
                  <MissionCard key={m.id} mission={m} compact onClick={() => onNavigate('missions')} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Missions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: '600' }}>
                RECENT MISSIONS
              </div>
              <button onClick={() => onNavigate('missions')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer' }}>
                View all →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentMissions.map(m => (
                <MissionCard key={m.id} mission={m} compact onClick={() => onNavigate('missions')} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
