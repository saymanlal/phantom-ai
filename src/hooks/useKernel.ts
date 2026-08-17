'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Mission, Project, PhantomNotification } from '@/types';

type KernelHookState = {
  initialized: boolean;
  activeProject: Project | null;
  projects: Project[];
  missions: Mission[];
  notifications: PhantomNotification[];
  unreadCount: number;
  providerAvailable: boolean;
  systemStatus: 'READY' | 'INITIALIZING' | 'ERROR';
};

export function useKernel() {
  const [state, setState] = useState<KernelHookState>({
    initialized: false,
    activeProject: null,
    projects: [],
    missions: [],
    notifications: [],
    unreadCount: 0,
    providerAvailable: false,
    systemStatus: 'INITIALIZING',
  });

  const [kernel, setKernel] = useState<import('@/kernel/PhantomKernel').PhantomKernel | null>(null);

  const refresh = useCallback(async (k: import('@/kernel/PhantomKernel').PhantomKernel) => {
    const { missionEngine } = await import('@/kernel/MissionEngine');
    const { projectEngine } = await import('@/kernel/ProjectEngine');
    const { notificationEngine } = await import('@/kernel/NotificationEngine');

    const [missions, projects, notifications] = await Promise.all([
      missionEngine.getAll(),
      projectEngine.getAll(),
      notificationEngine.getAll(),
    ]);

    const ks = k.getState();
    const activeProject = projects.find(p => p.id === ks.activeProjectId) ?? projects[0] ?? null;

    setState(prev => ({
      ...prev,
      initialized: true,
      activeProject,
      projects,
      missions: missions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
      providerAvailable: ks.providerAvailable,
      systemStatus: ks.systemStatus,
    }));
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsub: (() => void) | undefined;

    (async () => {
      const { getKernel } = await import('@/kernel/PhantomKernel');
      const k = getKernel();
      setKernel(k);
      await k.initialize();

      if (!mounted) return;

      await refresh(k);

      unsub = k.on(async () => {
        if (mounted) await refresh(k);
      });
    })();

    return () => {
      mounted = false;
      unsub?.();
    };
  }, [refresh]);

  const sendCommand = useCallback(async (input: string): Promise<{ mission: Mission }> => {
    if (!kernel) throw new Error('Kernel not initialized');
    const result = await kernel.processCommand(input, state.activeProject?.id);
    await refresh(kernel);
    return result;
  }, [kernel, state.activeProject, refresh]);

  const createProject = useCallback(async (name: string, description: string): Promise<Project> => {
    const { projectEngine } = await import('@/kernel/ProjectEngine');
    const project = await projectEngine.create(name, description);
    if (kernel) {
      kernel.setActiveProject(project.id);
      await refresh(kernel);
    }
    return project;
  }, [kernel, refresh]);

  const setActiveProject = useCallback((id: string) => {
    if (!kernel) return;
    kernel.setActiveProject(id);
    setState(prev => ({
      ...prev,
      activeProject: prev.projects.find(p => p.id === id) ?? prev.activeProject,
    }));
  }, [kernel]);

  const markNotificationsRead = useCallback(async () => {
    const { notificationEngine } = await import('@/kernel/NotificationEngine');
    await notificationEngine.markAllRead();
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  }, []);

  return {
    ...state,
    sendCommand,
    createProject,
    setActiveProject,
    markNotificationsRead,
    refreshState: () => kernel ? refresh(kernel) : Promise.resolve(),
  };
}
