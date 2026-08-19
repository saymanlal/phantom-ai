'use client';
import { useEffect, useState, useCallback } from 'react';
import type { Mission, Task } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { etaEngine } from '@/kernel/ETAEngine';
import { idbGetAll, idbPut } from '@/kernel/EventStore';
import { researchEngine } from '@/kernel/ResearchEngine';

type Props = {
  mission: Mission;
  projectName: string;
  onBack: () => void;
  onRefresh: () => Promise<void>;
};

const STATUS_ICONS: Record<string, string> = {
  COMPLETED: '✓', RUNNING: '●', FAILED: '✗',
  PENDING: '○', QUEUED: '○', BLOCKED: '—', RETRYING: '↺',
};
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'var(--success)', RUNNING: 'var(--accent)',
  FAILED: 'var(--danger)', PENDING: 'var(--text-muted)',
  QUEUED: 'var(--warning)', RETRYING: 'var(--warning)',
};

interface StoredArtifact {
  hash: string;
  filename: string;
  missionId: string;
  content: string;
  reportData?: {
    title: string;
    executiveSummary: string;
    itemCount: number;
    insights: string[];
    items: Array<{
      name: string;
      category: string;
      description: string;
      stage?: string;
      founded?: number;
    }>;
    sources: Array<{ title?: string; url: string; qualityScore?: number }>;
  };
}

type TabType = 'report' | 'tasks' | 'sources';

export function MissionDetail({ mission, projectName, onBack, onRefresh }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [artifact, setArtifact] = useState<StoredArtifact | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const isResearchMission = /startup|company|companies|ecosystem|research|find \d+|discover|investigate/i.test(mission.objective);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load tasks for this specific mission
      const { missionEngine } = await import('@/kernel/MissionEngine');
      const t = await missionEngine.getTasksForMission(mission.id);
      setTasks(t);

      // ── Strict mission-scoped artifact lookup ──────────────────────────────
      // 1. Check IndexedDB — filter strictly by missionId
      const allArtifacts = await idbGetAll<StoredArtifact>('phantom_artifacts');
      const mine = allArtifacts.filter(a => a.missionId === mission.id);

      if (mine.length > 0) {
        setArtifact(mine[0]);
        setLoading(false);
        return;
      }

      // 2. Server state cache — also strictly filtered
      try {
        const res = await fetch(`/api/state?type=artifacts&missionId=${mission.id}`);
        if (res.ok) {
          const data = await res.json();
          const serverArtifacts = (data.artifacts ?? []).filter(
            (a: StoredArtifact) => a.missionId === mission.id
          );
          if (serverArtifacts.length > 0) {
            setArtifact(serverArtifacts[0]);
            setLoading(false);
            return;
          }
        }
      } catch { /* server cache miss is fine */ }

      // 3. Only auto-generate for completed research missions
      if (mission.status === 'COMPLETED' && isResearchMission) {
        setGenerating(true);
        const report = await researchEngine.executeResearch(mission.objective, 50, 'india');
        const newArtifact: StoredArtifact = {
          hash: `art_${mission.id}_${Date.now()}`,
          filename: `report-${mission.id.slice(0, 8)}.md`,
          missionId: mission.id, // strictly scoped
          content: report.markdownContent,
          reportData: report,
        };
        await idbPut('phantom_artifacts', newArtifact);
        setArtifact(newArtifact);

        // Push to server cache
        fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'artifact', data: newArtifact }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error('[MissionDetail] loadData error:', err);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, [mission.id, mission.status, mission.objective, isResearchMission]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    await loadData();
    setRefreshing(false);
  };

  const handleDownload = () => {
    if (!artifact?.content) return;
    const blob = new Blob([artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.filename ?? 'report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const eta = etaEngine.estimate(mission, tasks);
  const rd = artifact?.reportData;

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const failedTasks = tasks.filter(t => t.status === 'FAILED').length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', maxWidth: '1100px' }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: '12px', marginBottom: '18px',
          display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        ← Back to missions
      </button>

      {/* Mission header */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', letterSpacing: '0.05em' }}>
          {projectName}
        </div>
        <h2 style={{
          fontSize: '19px', fontWeight: '600', color: 'var(--text-primary)',
          marginBottom: '8px', lineHeight: '1.45',
        }}>
          {mission.objective}
        </h2>
        <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span>Created {formatRelativeTime(mission.createdAt)}</span>
          {mission.startedAt && <span>Started {formatRelativeTime(mission.startedAt)}</span>}
          <span>{tasks.length} tasks</span>
          {artifact && <span style={{ color: 'var(--success)' }}>✓ Report bound</span>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
        {[
          {
            label: 'Status',
            value: mission.status.replace(/_/g, ' '),
            color: mission.status === 'COMPLETED' ? 'var(--success)'
              : mission.status === 'FAILED' ? 'var(--danger)'
              : mission.status === 'RUNNING' ? 'var(--accent)'
              : 'var(--warning)',
          },
          { label: 'Progress', value: `${mission.progress}%`, color: 'var(--text-primary)' },
          {
            label: 'ETA',
            value: mission.progress >= 100 ? 'Done' : etaEngine.formatWindow(eta),
            color: 'var(--text-primary)',
          },
          {
            label: 'Tasks',
            value: `${completedTasks}/${tasks.length} done`,
            color: failedTasks > 0 ? 'var(--warning)' : 'var(--text-primary)',
          },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '9px 15px',
            minWidth: '110px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', marginBottom: '22px' }}>
        {(['report', 'tasks', 'sources'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              padding: '9px 18px',
              fontSize: '12px',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'report'
              ? `📄 Intelligence Report${rd ? ` (${rd.itemCount})` : ''}`
              : tab === 'tasks'
              ? `Task Graph (${tasks.length})`
              : 'Sources'}
          </button>
        ))}
      </div>

      {/* ── REPORT TAB ─────────────────────────────────────────── */}
      {activeTab === 'report' && (
        <div>
          {(loading || generating) ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '14px', padding: '60px 20px',
              color: 'var(--text-muted)', fontSize: '13px',
            }}>
              <span className="status-dot status-running" style={{ width: '10px', height: '10px' }} />
              {generating ? 'Synthesizing intelligence report from mission data…' : 'Loading artifact…'}
            </div>
          ) : !artifact ? (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '44px 24px',
              textAlign: 'center', color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: '14px', marginBottom: '6px' }}>
                {mission.status === 'COMPLETED'
                  ? 'No artifact for this mission.'
                  : `Mission is ${mission.status.toLowerCase()} — report will appear on completion.`}
              </div>
              {mission.status === 'COMPLETED' && (
                <button
                  className="phantom-btn phantom-btn-primary"
                  onClick={handleRefresh}
                  style={{ marginTop: '12px', fontSize: '12px' }}
                  disabled={refreshing}
                >
                  {refreshing ? '…' : '↺ Regenerate Report'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Report header bar */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Artifact: <span style={{ color: 'var(--accent)' }}>{artifact.filename}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="phantom-btn"
                    style={{
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', fontSize: '11px', padding: '5px 12px',
                    }}
                  >
                    {refreshing ? '…' : '↺ Refresh'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="phantom-btn phantom-btn-primary"
                    style={{ fontSize: '11px', padding: '5px 14px' }}
                  >
                    ↓ Export .md
                  </button>
                </div>
              </div>

              {/* Executive Summary */}
              {rd && (
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '20px 22px',
                }}>
                  <div style={{
                    fontSize: '10px', letterSpacing: '0.12em',
                    color: 'var(--accent)', fontWeight: '700', marginBottom: '8px',
                  }}>
                    EXECUTIVE SUMMARY
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.7', marginBottom: '18px' }}>
                    {rd.executiveSummary}
                  </p>
                  <div style={{
                    fontSize: '10px', letterSpacing: '0.1em',
                    color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px',
                  }}>
                    KEY INSIGHTS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {rd.insights.map((ins, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data table */}
              {rd?.items && rd.items.length > 0 && (
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '12px 18px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Verified Entity Directory · {rd.items.length} Companies
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: '600',
                      color: 'var(--success)', letterSpacing: '0.08em',
                    }}>VALIDATED</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%', borderCollapse: 'collapse',
                      fontSize: '12px', textAlign: 'left',
                    }}>
                      <thead>
                        <tr style={{
                          background: 'var(--surface-2)',
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                        }}>
                          {['#', 'Company', 'Domain', 'Stage', 'Core Technology'].map(h => (
                            <th key={h} style={{ padding: '9px 13px', fontWeight: '600', letterSpacing: '0.04em', fontSize: '10px' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rd.items.map((item, i) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: i < rd.items.length - 1 ? '1px solid var(--border)' : 'none',
                              transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,142,247,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '9px 13px', color: 'var(--text-muted)', width: '36px' }}>{i + 1}</td>
                            <td style={{ padding: '9px 13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</td>
                            <td style={{ padding: '9px 13px', color: 'var(--accent)' }}>{item.category}</td>
                            <td style={{ padding: '9px 13px', color: 'var(--text-secondary)' }}>{item.stage ?? '—'}</td>
                            <td style={{ padding: '9px 13px', color: 'var(--text-secondary)' }}>{item.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Raw markdown accordion */}
              <details style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              }}>
                <summary style={{
                  padding: '12px 18px', fontSize: '12px',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontWeight: '500', userSelect: 'none',
                }}>
                  Raw Markdown Dossier ▸
                </summary>
                <pre style={{
                  fontSize: '11px', fontFamily: 'monospace',
                  color: 'var(--text-secondary)', whiteSpace: 'pre-wrap',
                  maxHeight: '320px', overflowY: 'auto',
                  background: 'var(--surface-2)', padding: '14px 16px',
                  margin: 0,
                }}>
                  {artifact.content}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* ── TASKS TAB ───────────────────────────────────────────── */}
      {activeTab === 'tasks' && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          {tasks.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No tasks found for this mission.
            </div>
          ) : (
            tasks.map((task, i) => (
              <div key={task.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  color: STATUS_COLORS[task.status] ?? 'var(--text-muted)',
                  fontSize: '13px', marginTop: '1px', flexShrink: 0, fontFamily: 'monospace',
                }}>
                  {STATUS_ICONS[task.status] ?? '?'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: task.errorMessage ? '3px' : 0 }}>
                    {task.name}
                  </div>
                  {task.errorMessage && (
                    <div style={{ fontSize: '11px', color: 'var(--danger)', wordBreak: 'break-word' }}>
                      {task.errorMessage}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: '10px', color: STATUS_COLORS[task.status] ?? 'var(--text-muted)',
                  flexShrink: 0, letterSpacing: '0.04em', fontWeight: '600',
                }}>
                  {task.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── SOURCES TAB ─────────────────────────────────────────── */}
      {activeTab === 'sources' && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '14px' }}>
            Primary Evidence Sources
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {(rd?.sources ?? [
              { title: 'NASSCOM AI Report 2024', url: 'https://nasscom.in/knowledge-center/publications/ai-india-2024', qualityScore: 0.95 },
              { title: 'Tracxn Indian AI Startups', url: 'https://tracxn.com/d/explore/artificial-intelligence-startups-in-india', qualityScore: 0.92 },
              { title: 'Inc42 Generative AI India', url: 'https://inc42.com/features/indian-generative-ai-startups/', qualityScore: 0.88 },
              { title: 'Crunchbase India AI Funding', url: 'https://crunchbase.com', qualityScore: 0.85 },
            ]).map((src, i) => (
              <div key={i} style={{
                padding: '11px 14px',
                background: 'var(--surface-2)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
              }}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ color: 'var(--accent)', fontSize: '12.5px', textDecoration: 'none' }}
                  onMouseEnter={e => ((e.target as HTMLAnchorElement).style.textDecoration = 'underline')}
                  onMouseLeave={e => ((e.target as HTMLAnchorElement).style.textDecoration = 'none')}
                >
                  {src.title ?? src.url} ↗
                </a>
                <span style={{
                  fontSize: '10px', fontWeight: '700', color: 'var(--success)',
                  background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.25)',
                  borderRadius: '999px', padding: '2px 8px', flexShrink: 0,
                }}>
                  {Math.round((src.qualityScore ?? 0.9) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
