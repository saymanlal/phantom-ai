'use client';
import { useState, useEffect } from 'react';
import type { CapabilityKey, PermissionValue } from '@/types';

const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  WEB_RESEARCH: 'Web Research',
  PUBLIC_DOWNLOADS: 'Public Downloads',
  FILE_CREATION: 'File Creation',
  FILE_MODIFICATION: 'File Modification',
  PROJECT_MODIFICATION: 'Project Modification',
  GIT_BRANCH: 'Git Branch',
  GIT_COMMIT: 'Git Commit',
  GIT_PUSH: 'Git Push',
  GITHUB_PR: 'GitHub Pull Requests',
  GITHUB_ISSUES: 'GitHub Issues',
  VERCEL_DEPLOY: 'Vercel Deploy',
  EMAIL_SEND: 'Email Sending',
  PRODUCTION_DELETE: 'Production Deletion',
  AUTOMATION_RUN: 'Automation Execution',
  SCHEDULING: 'Task Scheduling',
  BROWSER_CONTROL: 'Browser Control',
  DATA_ANALYSIS: 'Data Analysis',
  PDF_ANALYSIS: 'PDF Analysis',
  CODE_EXECUTION: 'Code Execution',
  EXTERNAL_API: 'External APIs',
};

const CAPABILITY_GROUPS: { label: string; keys: CapabilityKey[] }[] = [
  { label: 'Web', keys: ['WEB_RESEARCH', 'PUBLIC_DOWNLOADS'] },
  { label: 'Files', keys: ['FILE_CREATION', 'FILE_MODIFICATION', 'PROJECT_MODIFICATION'] },
  { label: 'GitHub', keys: ['GIT_BRANCH', 'GIT_COMMIT', 'GIT_PUSH', 'GITHUB_PR', 'GITHUB_ISSUES'] },
  { label: 'Deployment', keys: ['VERCEL_DEPLOY', 'PRODUCTION_DELETE'] },
  { label: 'Communication', keys: ['EMAIL_SEND'] },
  { label: 'Automation', keys: ['AUTOMATION_RUN', 'SCHEDULING', 'BROWSER_CONTROL'] },
  { label: 'Data', keys: ['DATA_ANALYSIS', 'PDF_ANALYSIS', 'CODE_EXECUTION'] },
  { label: 'External', keys: ['EXTERNAL_API'] },
];

export function SettingsView() {
  const [permissions, setPermissions] = useState<Record<CapabilityKey, PermissionValue>>({} as Record<CapabilityKey, PermissionValue>);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<CapabilityKey | null>(null);

  useEffect(() => {
    (async () => {
      const { permissionEngine } = await import('@/kernel/PermissionEngine');
      await permissionEngine.load();
      setPermissions(permissionEngine.getAll().capabilities);
      setLoaded(true);
    })();
  }, []);

  const handleChange = async (key: CapabilityKey, value: PermissionValue) => {
    setSaving(key);
    const { permissionEngine } = await import('@/kernel/PermissionEngine');
    await permissionEngine.set(key, value);
    setPermissions(prev => ({ ...prev, [key]: value }));
    setSaving(null);
  };

  if (!loaded) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        Loading permissions...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Settings</h2>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>Configure PHANTOM's capability permissions. All changes persist automatically.</div>

      {/* Safety notice */}
      <div style={{
        background: 'rgba(79,142,247,0.06)',
        border: '1px solid rgba(79,142,247,0.15)',
        borderRadius: 'var(--radius)',
        padding: '12px 16px',
        marginBottom: '28px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        <strong style={{ color: 'var(--accent)' }}>Safety boundaries</strong> — credential theft, unauthorized access, malware, fraud, and privacy violations are permanently blocked regardless of any configuration.
      </div>

      {CAPABILITY_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '10px' }}>{group.label.toUpperCase()}</div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {group.keys.map((key, i) => (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: i < group.keys.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{CAPABILITY_LABELS[key]}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['ALLOW', 'ASK', 'DENY'] as PermissionValue[]).map(v => (
                    <button
                      key={v}
                      id={`perm-${key}-${v}`}
                      onClick={() => handleChange(key, v)}
                      disabled={saving === key}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid',
                        fontSize: '11px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                        borderColor: permissions[key] === v
                          ? v === 'ALLOW' ? 'var(--success)' : v === 'DENY' ? 'var(--danger)' : 'var(--warning)'
                          : 'var(--border)',
                        background: permissions[key] === v
                          ? v === 'ALLOW' ? 'rgba(62,207,142,0.12)' : v === 'DENY' ? 'rgba(239,68,68,0.12)' : 'rgba(245,166,35,0.12)'
                          : 'transparent',
                        color: permissions[key] === v
                          ? v === 'ALLOW' ? 'var(--success)' : v === 'DENY' ? 'var(--danger)' : 'var(--warning)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
