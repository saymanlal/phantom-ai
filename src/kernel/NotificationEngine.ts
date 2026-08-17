import type { PhantomNotification } from '@/types';
import { generateId } from '@/lib/utils';
import { idbPut, idbGetAll } from './EventStore';

const STORE = 'phantom_notifications';

type NotificationListener = (n: PhantomNotification) => void;

export class NotificationEngine {
  private listeners: NotificationListener[] = [];

  async send(opts: {
    title: string;
    body: string;
    missionId?: string;
    projectId?: string;
    urgency?: PhantomNotification['urgency'];
    action?: PhantomNotification['action'];
  }): Promise<PhantomNotification> {
    const notification: PhantomNotification = {
      id: generateId(),
      type: 'IN_APP',
      title: opts.title,
      body: opts.body,
      missionId: opts.missionId,
      projectId: opts.projectId,
      createdAt: new Date().toISOString(),
      read: false,
      urgency: opts.urgency ?? 'MEDIUM',
      action: opts.action,
    };

    await idbPut(STORE, notification);
    this.listeners.forEach(l => { try { l(notification); } catch { /* ignore */ } });

    // Browser notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, { body: notification.body });
    }

    return notification;
  }

  async getAll(): Promise<PhantomNotification[]> {
    const all = await idbGetAll<PhantomNotification>(STORE);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markRead(id: string): Promise<void> {
    const all = await this.getAll();
    const n = all.find(x => x.id === id);
    if (n) await idbPut(STORE, { ...n, read: true });
  }

  async markAllRead(): Promise<void> {
    const all = await this.getAll();
    for (const n of all) {
      if (!n.read) await idbPut(STORE, { ...n, read: true });
    }
  }

  onNotification(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.requestPermission();
  }

  getUnreadCount(notifications: PhantomNotification[]): number {
    return notifications.filter(n => !n.read).length;
  }
}

export const notificationEngine = new NotificationEngine();
