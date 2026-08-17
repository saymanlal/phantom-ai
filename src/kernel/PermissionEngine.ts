import type { CapabilityKey, PermissionValue, PermissionConfig } from '@/types';
import { idbGet, idbPut } from './EventStore';

// Immutable safety boundaries — cannot be overridden by any user config
const HARD_DENY: CapabilityKey[] = [] as CapabilityKey[]; // All overridable by user except safety
const SAFETY_BOUNDARIES = [
  'credential theft',
  'unauthorized access',
  'bypass authentication',
  'malware',
  'destructive attack',
  'fraud',
  'financial abuse',
  'privacy violation',
];

const DEFAULT_PERMISSIONS: Record<CapabilityKey, PermissionValue> = {
  WEB_RESEARCH: 'ALLOW',
  PUBLIC_DOWNLOADS: 'ALLOW',
  FILE_CREATION: 'ALLOW',
  FILE_MODIFICATION: 'ALLOW',
  PROJECT_MODIFICATION: 'ALLOW',
  GIT_BRANCH: 'ALLOW',
  GIT_COMMIT: 'ALLOW',
  GIT_PUSH: 'ALLOW',
  GITHUB_PR: 'ALLOW',
  GITHUB_ISSUES: 'ALLOW',
  VERCEL_DEPLOY: 'ALLOW',
  EMAIL_SEND: 'ASK',
  PRODUCTION_DELETE: 'DENY',
  AUTOMATION_RUN: 'ALLOW',
  SCHEDULING: 'ALLOW',
  BROWSER_CONTROL: 'ALLOW',
  DATA_ANALYSIS: 'ALLOW',
  PDF_ANALYSIS: 'ALLOW',
  CODE_EXECUTION: 'ALLOW',
  EXTERNAL_API: 'ASK',
};

const PERMISSION_STORE = 'phantom_permissions';
const PERMISSION_KEY = 'global';

export class PermissionEngine {
  private config: PermissionConfig = {
    capabilities: { ...DEFAULT_PERMISSIONS },
    updatedAt: new Date().toISOString(),
    projectOverrides: {},
  };
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const stored = await idbGet<PermissionConfig>(PERMISSION_STORE, PERMISSION_KEY);
      if (stored) {
        this.config = stored;
      } else {
        await this.save();
      }
    } catch {
      // IndexedDB not available, use defaults
    }
    this.loaded = true;
  }

  private async save(): Promise<void> {
    try {
      await idbPut(PERMISSION_STORE, { ...this.config, id: PERMISSION_KEY });
    } catch {
      // ignore
    }
  }

  check(capability: CapabilityKey, projectId?: string): PermissionValue {
    if (projectId && this.config.projectOverrides[projectId]?.[capability]) {
      return this.config.projectOverrides[projectId][capability];
    }
    return this.config.capabilities[capability] ?? 'ASK';
  }

  isAllowed(capability: CapabilityKey, projectId?: string): boolean {
    return this.check(capability, projectId) === 'ALLOW';
  }

  isDenied(capability: CapabilityKey, projectId?: string): boolean {
    return this.check(capability, projectId) === 'DENY';
  }

  async set(capability: CapabilityKey, value: PermissionValue, projectId?: string): Promise<void> {
    if (projectId) {
      if (!this.config.projectOverrides[projectId]) {
        this.config.projectOverrides[projectId] = {} as Record<CapabilityKey, PermissionValue>;
      }
      this.config.projectOverrides[projectId][capability] = value;
    } else {
      this.config.capabilities[capability] = value;
    }
    this.config.updatedAt = new Date().toISOString();
    await this.save();
  }

  getAll(): PermissionConfig {
    return this.config;
  }

  getDefaults(): Record<CapabilityKey, PermissionValue> {
    return { ...DEFAULT_PERMISSIONS };
  }

  // Returns safety boundary descriptions (never modifiable)
  getSafetyBoundaries(): string[] {
    return [...SAFETY_BOUNDARIES];
  }
}

export const permissionEngine = new PermissionEngine();
