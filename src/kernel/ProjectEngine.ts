import type { Project, ProjectSettings, CapabilityKey, PermissionValue } from '@/types';
import { generateId } from '@/lib/utils';
import { idbPut, idbGet, idbGetAll, idbDelete } from './EventStore';
import { eventStore } from './EventStore';
import { permissionEngine } from './PermissionEngine';

const PROJECT_STORE = 'phantom_projects';

export class ProjectEngine {
  async create(name: string, description: string): Promise<Project> {
    const projectId = generateId();
    const settings: ProjectSettings = {
      autonomyLevel: 'FULL_AUTONOMY',
      defaultPermissions: permissionEngine.getAll().capabilities,
    };

    const project: Project = {
      id: projectId,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'saymanlal',
      missions: [],
      artifacts: [],
      repositories: [],
      memoryNamespace: `project:${projectId}`,
      settings,
      tags: [],
      status: 'ACTIVE',
    };

    await idbPut(PROJECT_STORE, project);
    await eventStore?.emit('PROJECT_CREATED', { name, description }, { projectId });
    return project;
  }

  async get(projectId: string): Promise<Project | undefined> {
    return idbGet<Project>(PROJECT_STORE, projectId);
  }

  async getAll(): Promise<Project[]> {
    return idbGetAll<Project>(PROJECT_STORE);
  }

  async update(project: Project): Promise<void> {
    await idbPut(PROJECT_STORE, { ...project, updatedAt: new Date().toISOString() });
  }

  async addMission(projectId: string, missionId: string): Promise<void> {
    const project = await this.get(projectId);
    if (!project) return;
    if (!project.missions.includes(missionId)) {
      project.missions.push(missionId);
      await this.update(project);
    }
  }

  async delete(projectId: string): Promise<void> {
    await idbDelete(PROJECT_STORE, projectId);
  }

  async getOrCreatePersonal(): Promise<Project> {
    const all = await this.getAll();
    const personal = all.find(p => p.name === 'Personal');
    if (personal) return personal;
    return this.create('Personal', 'Default personal workspace');
  }
}

export const projectEngine = new ProjectEngine();
