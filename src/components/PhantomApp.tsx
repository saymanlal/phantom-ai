'use client';
import { useState } from 'react';
import { useKernel } from '@/hooks/useKernel';
import { Sidebar } from './Sidebar';
import { CommandCenter } from './CommandCenter';
import { MissionsView } from './MissionsView';
import { ProjectsView } from './ProjectsView';
import { SettingsView } from './SettingsView';
import { NotificationsView } from './NotificationsView';
import { DataStudioView } from './DataStudioView';
import { ActivityView } from './ActivityView';
import { CommandPalette } from './CommandPalette';

export type ViewType = 'command' | 'missions' | 'projects' | 'data' | 'activity' | 'settings' | 'notifications';

export function PhantomApp() {
  const kernelState = useKernel();
  const [activeView, setActiveView] = useState<ViewType>('command');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setPaletteOpen(true);
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--background)' }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        unreadCount={kernelState.unreadCount}
        systemStatus={kernelState.systemStatus}
        providerAvailable={kernelState.providerAvailable}
        activeMissions={kernelState.missions.filter(m => m.status === 'RUNNING').length}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'command' && (
          <CommandCenter
            {...kernelState}
            onNavigate={setActiveView}
          />
        )}
        {activeView === 'missions' && (
          <MissionsView
            missions={kernelState.missions}
            projects={kernelState.projects}
            onRefresh={kernelState.refreshState}
          />
        )}
        {activeView === 'data' && (
          <DataStudioView />
        )}
        {activeView === 'projects' && (
          <ProjectsView
            projects={kernelState.projects}
            missions={kernelState.missions}
            onCreateProject={kernelState.createProject}
            onSelectProject={kernelState.setActiveProject}
            activeProjectId={kernelState.activeProject?.id}
          />
        )}
        {activeView === 'activity' && (
          <ActivityView />
        )}
        {activeView === 'notifications' && (
          <NotificationsView
            notifications={kernelState.notifications}
            onMarkRead={kernelState.markNotificationsRead}
          />
        )}
        {activeView === 'settings' && (
          <SettingsView />
        )}
      </main>

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onCommand={async (cmd) => {
            setPaletteOpen(false);
            if (cmd.startsWith('/')) {
              if (cmd === '/missions') setActiveView('missions');
              else if (cmd === '/projects') setActiveView('projects');
              else if (cmd === '/settings') setActiveView('settings');
              else if (cmd === '/activity') setActiveView('activity');
            } else {
              await kernelState.sendCommand(cmd);
              setActiveView('missions');
            }
          }}
        />
      )}
    </div>
  );
}
