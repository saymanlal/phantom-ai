import type { MemoryEntry, MemoryType } from '@/types';
import { generateId } from '@/lib/utils';
import { idbPut, idbGetAll, idbDelete } from './EventStore';

const STORE = 'phantom_memory';

export class MemoryEngine {
  async store(opts: {
    type: MemoryType;
    content: string;
    tags?: string[];
    projectId?: string;
    missionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: generateId(),
      type: opts.type,
      projectId: opts.projectId,
      missionId: opts.missionId,
      content: opts.content,
      tags: opts.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
      metadata: opts.metadata ?? {},
    };
    await idbPut(STORE, entry);
    return entry;
  }

  async search(query: string, projectId?: string): Promise<MemoryEntry[]> {
    const all = await idbGetAll<MemoryEntry>(STORE);
    const lower = query.toLowerCase();
    return all
      .filter(e => {
        if (projectId && e.projectId && e.projectId !== projectId) return false;
        return e.content.toLowerCase().includes(lower) ||
          e.tags.some(t => t.toLowerCase().includes(lower));
      })
      .sort((a, b) => b.accessCount - a.accessCount);
  }

  async getByProject(projectId: string): Promise<MemoryEntry[]> {
    const all = await idbGetAll<MemoryEntry>(STORE);
    return all.filter(e => e.projectId === projectId || e.type === 'GLOBAL');
  }

  async getByMission(missionId: string): Promise<MemoryEntry[]> {
    const all = await idbGetAll<MemoryEntry>(STORE);
    return all.filter(e => e.missionId === missionId);
  }

  async delete(id: string): Promise<void> {
    await idbDelete(STORE, id);
  }

  async getAll(): Promise<MemoryEntry[]> {
    return idbGetAll<MemoryEntry>(STORE);
  }
}

export const memoryEngine = new MemoryEngine();
