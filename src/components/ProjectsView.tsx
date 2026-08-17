'use client';
import { useState } from 'react';
import type { Project, Mission } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

type Props = {
  projects: Project[];
  missions: Mission[];
  onCreateProject: (name: string, description: string) => Promise<Project>;
  onSelectProject: (id: string) => void;
  activeProjectId?: string;
};

export function ProjectsView({ projects, missions, onCreateProject, onSelectProject, activeProjectId }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const getProjectMissions = (projectId: string) => missions.filter(m => m.projectId === projectId);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreateProject(name.trim(), description.trim());
      setName('');
      setDescription('');
      setCreating(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)' }}>Projects</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</div>
        </div>
        <button id="create-project-btn" className="phantom-btn phantom-btn-primary" onClick={() => setCreating(true)}>
          + New Project
        </button>
      </div>

      {creating && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '20px',
        }} className="animate-in">
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '16px', color: 'var(--text-primary)' }}>New Project</div>
          <input
            id="project-name-input"
            className="phantom-input"
            placeholder="Project name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <input
            id="project-description-input"
            className="phantom-input"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button id="create-project-confirm-btn" className="phantom-btn phantom-btn-primary" onClick={handleCreate} disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button className="phantom-btn phantom-btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {projects.map(project => {
          const projectMissions = getProjectMissions(project.id);
          const isActive = project.id === activeProjectId;
          return (
            <div
              key={project.id}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{project.name}</span>
                    {isActive && (
                      <span style={{ fontSize: '10px', color: 'var(--accent)', background: 'var(--accent-dim)', padding: '1px 6px', borderRadius: '999px' }}>active</span>
                    )}
                  </div>
                  {project.description && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{project.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{projectMissions.length} missions</span>
                    <span>Created {formatRelativeTime(project.createdAt)}</span>
                    <span className="tag">{project.status}</span>
                  </div>
                </div>
                {!isActive && (
                  <button
                    className="phantom-btn phantom-btn-ghost"
                    onClick={() => onSelectProject(project.id)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Set active
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
