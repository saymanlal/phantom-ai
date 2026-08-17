import type { Mission, Task, ParsedIntent, CapabilityKey, PermissionValue } from '@/types';
import { generateId } from '@/lib/utils';
import { idbPut, idbGet, idbGetAll, idbDelete } from './EventStore';
import { eventStore } from './EventStore';
import { permissionEngine } from './PermissionEngine';

const MISSION_STORE = 'phantom_missions';
const TASK_STORE = 'phantom_tasks';

function defaultPermissions(): Record<CapabilityKey, PermissionValue> {
  return permissionEngine.getAll().capabilities;
}

export class MissionEngine {
  async createFromIntent(intent: ParsedIntent, projectId: string): Promise<Mission> {
    const missionId = generateId();
    const tasks = this.buildTaskGraph(intent, missionId, projectId);
    
    // Estimate duration based on task count and type
    const estimatedDurationMs = this.estimateDuration(tasks, intent);

    const mission: Mission = {
      id: missionId,
      projectId,
      objective: intent.rawInput,
      status: 'PLANNED',
      priority: 50,
      autonomyLevel: intent.mode ?? 'FULL_AUTONOMY',
      permissions: defaultPermissions(),
      createdAt: new Date().toISOString(),
      deadline: intent.deadline,
      estimatedDurationMs,
      estimatedCompletionAt: estimatedDurationMs
        ? new Date(Date.now() + estimatedDurationMs).toISOString()
        : undefined,
      confidence: intent.confidence,
      tasks: tasks.map(t => t.id),
      dependencies: [],
      artifacts: [],
      sources: [],
      checkpoints: [],
      notificationState: { notified: false, channels: ['IN_APP'] },
      progress: 0,
      planSummary: intent.suggestedPlan?.join(' → '),
      tags: [intent.action, intent.object ?? '', intent.location ?? ''].filter(Boolean),
    };

    await idbPut(MISSION_STORE, mission);
    for (const task of tasks) {
      await idbPut(TASK_STORE, task);
    }

    await eventStore?.emit('MISSION_CREATED', {
      objective: mission.objective,
      taskCount: tasks.length,
      estimatedDurationMs,
    }, { missionId, projectId });

    return mission;
  }

  private buildTaskGraph(intent: ParsedIntent, missionId: string, projectId: string): Task[] {
    const plan = intent.suggestedPlan ?? ['Execute objective'];
    const tasks: Task[] = [];
    let prevId: string | undefined;

    for (let i = 0; i < plan.length; i++) {
      const taskId = generateId();
      const task: Task = {
        id: taskId,
        missionId,
        projectId,
        name: plan[i],
        description: plan[i],
        status: i === 0 ? 'QUEUED' : 'PENDING',
        type: this.classifyStep(plan[i], intent.action),
        dependencies: prevId ? [prevId] : [],
        priority: 50,
        timeoutMs: 300000, // 5 min default
        retryPolicy: { maxRetries: 3, delayMs: 2000, backoffMultiplier: 2 },
        checkpoints: [],
        requiredCapabilities: this.getCapabilities(intent.action),
        inputs: i === 0 ? { intent } : {},
        outputs: {},
        estimatedDurationMs: this.estimateTaskDuration(plan[i], intent),
        createdAt: new Date().toISOString(),
        retryCount: 0,
        progress: 0,
        logs: [],
      };
      tasks.push(task);
      prevId = taskId;
    }

    return tasks;
  }

  private classifyStep(step: string, action: string): string {
    const lower = step.toLowerCase();
    if (lower.includes('search') || lower.includes('query') || lower.includes('discover')) return 'SEARCH';
    if (lower.includes('fetch') || lower.includes('download') || lower.includes('source')) return 'FETCH';
    if (lower.includes('extract') || lower.includes('parse')) return 'EXTRACT';
    if (lower.includes('normalize') || lower.includes('dedup') || lower.includes('filter')) return 'TRANSFORM';
    if (lower.includes('rank') || lower.includes('score') || lower.includes('analy')) return 'ANALYZE';
    if (lower.includes('verify') || lower.includes('validate') || lower.includes('confirm')) return 'VERIFY';
    if (lower.includes('report') || lower.includes('generate') || lower.includes('create')) return 'REPORT';
    if (lower.includes('notify') || lower.includes('alert')) return 'NOTIFY';
    return action;
  }

  private getCapabilities(action: string): CapabilityKey[] {
    const caps: Record<string, CapabilityKey[]> = {
      RESEARCH: ['WEB_RESEARCH', 'PUBLIC_DOWNLOADS', 'DATA_ANALYSIS'],
      ANALYZE: ['DATA_ANALYSIS', 'PDF_ANALYSIS'],
      DEBUG: ['GIT_BRANCH', 'GIT_COMMIT', 'CODE_EXECUTION'],
      CREATE: ['FILE_CREATION'],
      DEPLOY: ['VERCEL_DEPLOY', 'GIT_PUSH'],
      MONITOR: ['WEB_RESEARCH', 'SCHEDULING'],
    };
    return caps[action] ?? ['FILE_CREATION'];
  }

  private estimateDuration(tasks: Task[], intent: ParsedIntent): number {
    const basePerTask = 120000; // 2 min
    const researchMultiplier = intent.action === 'RESEARCH' ? 3 : 1;
    const quantityFactor = intent.quantity ? Math.log10(intent.quantity + 1) : 1;
    return Math.round(tasks.length * basePerTask * researchMultiplier * quantityFactor);
  }

  private estimateTaskDuration(step: string, intent: ParsedIntent): number {
    const lower = step.toLowerCase();
    if (lower.includes('report') || lower.includes('generate')) return 60000;
    if (lower.includes('verify') || lower.includes('validate')) return 120000;
    if (lower.includes('analy')) return 90000;
    if (lower.includes('fetch') || lower.includes('search')) return 180000;
    return 60000;
  }

  async get(missionId: string): Promise<Mission | undefined> {
    return idbGet<Mission>(MISSION_STORE, missionId);
  }

  async getAll(): Promise<Mission[]> {
    return idbGetAll<Mission>(MISSION_STORE);
  }

  async update(mission: Mission): Promise<void> {
    await idbPut(MISSION_STORE, mission);
  }

  async updateStatus(missionId: string, status: Mission['status'], extras?: Partial<Mission>): Promise<Mission | undefined> {
    const mission = await this.get(missionId);
    if (!mission) return undefined;
    const updated: Mission = { ...mission, status, ...extras };
    if (status === 'RUNNING' && !mission.startedAt) {
      updated.startedAt = new Date().toISOString();
    }
    await this.update(updated);

    const eventTypeMap: Record<string, 'MISSION_STARTED' | 'MISSION_COMPLETED' | 'MISSION_FAILED' | 'MISSION_PAUSED' | 'MISSION_CANCELLED'> = {
      RUNNING: 'MISSION_STARTED',
      COMPLETED: 'MISSION_COMPLETED',
      FAILED: 'MISSION_FAILED',
      PAUSED: 'MISSION_PAUSED',
      CANCELLED: 'MISSION_CANCELLED',
    };
    const evType = eventTypeMap[status];
    if (evType) {
      await eventStore?.emit(evType, { status }, { missionId, projectId: mission.projectId });
    }
    return updated;
  }

  async getTasksForMission(missionId: string): Promise<Task[]> {
    const all = await idbGetAll<Task>(TASK_STORE);
    return all.filter(t => t.missionId === missionId);
  }

  async updateTask(task: Task): Promise<void> {
    await idbPut(TASK_STORE, task);
  }

  async delete(missionId: string): Promise<void> {
    await idbDelete(MISSION_STORE, missionId);
  }
}

export const missionEngine = new MissionEngine();
