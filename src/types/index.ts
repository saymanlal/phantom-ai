// ============================================================
// PHANTOM AI — CORE TYPE DEFINITIONS
// ============================================================

export type MissionStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING'
  | 'BLOCKED'
  | 'PAUSED'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'WAITING_FOR_EXECUTION';

export type TaskStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'BLOCKED'
  | 'RETRYING'
  | 'CANCELLED';

export type AutonomyLevel = 'MANUAL' | 'ASSISTED' | 'AUTONOMOUS' | 'FULL_AUTONOMY';
export type PermissionValue = 'ALLOW' | 'ASK' | 'DENY';
export type ProviderType = 'BROWSER_WORKER' | 'GITHUB_ACTIONS' | 'VERCEL' | 'NONE';
export type ResearchMode = 'QUICK' | 'STANDARD' | 'DEEP' | 'FORENSIC' | 'MONITORING';
export type NotificationType = 'IN_APP' | 'BROWSER' | 'EMAIL';
export type MemoryType = 'GLOBAL' | 'PROJECT' | 'MISSION' | 'EPISODIC' | 'SEMANTIC' | 'PROCEDURAL';

export type EventType =
  | 'MISSION_CREATED' | 'MISSION_STARTED' | 'MISSION_COMPLETED'
  | 'MISSION_FAILED' | 'MISSION_PAUSED' | 'MISSION_RESUMED' | 'MISSION_CANCELLED'
  | 'TASK_CREATED' | 'TASK_STARTED' | 'TASK_COMPLETED' | 'TASK_FAILED'
  | 'TASK_RETRIED' | 'TASK_CHECKPOINTED'
  | 'PROJECT_CREATED' | 'ARTIFACT_CREATED' | 'PERMISSION_CHANGED'
  | 'PROVIDER_CONNECTED' | 'PROVIDER_DISCONNECTED' | 'NOTIFICATION_SENT'
  | 'MEMORY_STORED' | 'KNOWLEDGE_UPDATED' | 'AUTOMATION_TRIGGERED' | 'REPLAN_TRIGGERED';

export type CapabilityKey =
  | 'WEB_RESEARCH' | 'PUBLIC_DOWNLOADS' | 'FILE_CREATION' | 'FILE_MODIFICATION'
  | 'PROJECT_MODIFICATION' | 'GIT_BRANCH' | 'GIT_COMMIT' | 'GIT_PUSH'
  | 'GITHUB_PR' | 'GITHUB_ISSUES' | 'VERCEL_DEPLOY' | 'EMAIL_SEND'
  | 'PRODUCTION_DELETE' | 'AUTOMATION_RUN' | 'SCHEDULING' | 'BROWSER_CONTROL'
  | 'DATA_ANALYSIS' | 'PDF_ANALYSIS' | 'CODE_EXECUTION' | 'EXTERNAL_API';

export type EntityType =
  | 'PERSON' | 'COMPANY' | 'ORGANIZATION' | 'PROJECT' | 'PRODUCT'
  | 'EVENT' | 'LOCATION' | 'DOCUMENT' | 'WEBSITE' | 'REPOSITORY'
  | 'OPPORTUNITY' | 'CONTACT' | 'CONCEPT';

export type RelationType =
  | 'FOUNDED' | 'WORKS_AT' | 'CREATED' | 'PARTNERED_WITH' | 'SPONSORED'
  | 'LOCATED_IN' | 'MENTIONS' | 'DEPENDS_ON' | 'COMPETES_WITH'
  | 'RELATED_TO' | 'DERIVED_FROM';

export type AutomationNodeType =
  | 'TRIGGER' | 'SEARCH' | 'FETCH' | 'PARSE' | 'FILTER' | 'TRANSFORM'
  | 'ANALYZE' | 'CONDITION' | 'LOOP' | 'PARALLEL' | 'WAIT' | 'RETRY'
  | 'CREATE_FILE' | 'RUN_CODE' | 'GITHUB' | 'NOTIFY' | 'END';

// ── Mission ──────────────────────────────────────────────────

export interface Mission {
  id: string;
  projectId: string;
  objective: string;
  status: MissionStatus;
  priority: number;
  autonomyLevel: AutonomyLevel;
  permissions: Record<CapabilityKey, PermissionValue>;
  createdAt: string;
  startedAt?: string;
  deadline?: string;
  estimatedDurationMs?: number;
  estimatedCompletionAt?: string;
  confidence?: number;
  tasks: string[];
  dependencies: string[];
  artifacts: string[];
  sources: Source[];
  checkpoints: Checkpoint[];
  result?: MissionResult;
  notificationState: NotificationState;
  errorMessage?: string;
  progress: number;
  planSummary?: string;
  tags: string[];
}

export interface Task {
  id: string;
  missionId: string;
  projectId: string;
  name: string;
  description: string;
  status: TaskStatus;
  type: string;
  dependencies: string[];
  priority: number;
  timeoutMs?: number;
  retryPolicy: RetryPolicy;
  checkpoints: Checkpoint[];
  requiredCapabilities: CapabilityKey[];
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  executionProvider?: ProviderType;
  estimatedDurationMs?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
  progress: number;
  logs: TaskLog[];
}

export interface RetryPolicy {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

export interface TaskLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

export interface Checkpoint {
  id: string;
  taskId?: string;
  missionId: string;
  timestamp: string;
  progress: number;
  cursor?: string | number;
  partialResults?: unknown;
  retryCount: number;
  providerState?: unknown;
  metadata: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  missions: string[];
  artifacts: string[];
  repositories: string[];
  memoryNamespace: string;
  settings: ProjectSettings;
  tags: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'PAUSED';
}

export interface ProjectSettings {
  autonomyLevel: AutonomyLevel;
  defaultPermissions: Record<CapabilityKey, PermissionValue>;
  githubRepo?: string;
  vercelProject?: string;
  timezone?: string;
}

export interface Artifact {
  hash: string;
  type: string;
  size: number;
  createdAt: string;
  projectId: string;
  missionId?: string;
  source: string;
  filename: string;
  contentType: string;
  description?: string;
  tags: string[];
}

export interface PhantomEvent {
  eventId: string;
  timestamp: string;
  type: EventType;
  missionId?: string;
  taskId?: string;
  projectId?: string;
  payload: Record<string, unknown>;
  resultHash?: string;
  processed: boolean;
}

export interface Source {
  url: string;
  title?: string;
  domain?: string;
  fetchedAt?: string;
  qualityScore?: number;
  isPrimary?: boolean;
  isVerified?: boolean;
  contentHash?: string;
  claims?: Claim[];
}

export interface Claim {
  text: string;
  source: string;
  timestamp: string;
  confidence: number;
  verified: boolean;
  contradictions?: string[];
}

export interface MissionResult {
  summary: string;
  findings: Finding[];
  artifactHashes: string[];
  sources: Source[];
  completedAt: string;
  duration: number;
  taskCount: number;
  successRate: number;
}

export interface Finding {
  title: string;
  description: string;
  confidence: number;
  sources: string[];
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tags: string[];
}

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  projectId?: string;
  missionId?: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  relevanceScore?: number;
  metadata: Record<string, unknown>;
}

export interface KnowledgeEntity {
  id: string;
  type: EntityType;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
  sources: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  tags: string[];
}

export interface KnowledgeRelation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationType;
  properties: Record<string, unknown>;
  confidence: number;
  sources: string[];
  createdAt: string;
}

export interface PhantomNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  missionId?: string;
  projectId?: string;
  createdAt: string;
  read: boolean;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  href: string;
}

export interface NotificationState {
  notified: boolean;
  notifiedAt?: string;
  channels: NotificationType[];
}

export interface PermissionConfig {
  capabilities: Record<CapabilityKey, PermissionValue>;
  updatedAt: string;
  projectOverrides: Record<string, Record<CapabilityKey, PermissionValue>>;
}

export interface ProviderCapabilities {
  type: ProviderType;
  maxDurationMs: number;
  supportedTaskTypes: string[];
  available: boolean;
  quotaRemaining?: number;
  costPerTask?: number;
}

export interface ExecutionResult {
  taskId: string;
  success: boolean;
  outputs: Record<string, unknown>;
  error?: string;
  durationMs: number;
  providerType: ProviderType;
  checkpoint?: Checkpoint;
}

export interface ParsedIntent {
  action: string;
  object?: string;
  location?: string;
  quantity?: number;
  deadline?: string;
  mode?: AutonomyLevel;
  researchMode?: ResearchMode;
  rawInput: string;
  confidence: number;
  entities: Record<string, unknown>;
  suggestedPlan?: string[];
}

export interface Strategy {
  strategyId: string;
  name: string;
  version: number;
  steps: StrategyStep[];
  successRate: number;
  failureRate: number;
  averageDurationMs: number;
  preferredProviders: ProviderType[];
  knownLimitations: string[];
  usageCount: number;
  lastUsedAt?: string;
}

export interface StrategyStep {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  optional: boolean;
  estimatedDurationMs: number;
}

export interface AutomationNode {
  id: string;
  type: AutomationNodeType;
  name: string;
  config: Record<string, unknown>;
  nextNodes: string[];
  conditionNodes?: Record<string, string>;
}

export interface AutomationTrigger {
  type: 'SCHEDULE' | 'EVENT' | 'MANUAL' | 'WEBHOOK';
  schedule?: string;
  eventType?: EventType;
  webhookUrl?: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  projectId: string;
  nodes: AutomationNode[];
  trigger: AutomationTrigger;
  enabled: boolean;
  createdAt: string;
  lastRunAt?: string;
  runCount: number;
  status: 'IDLE' | 'RUNNING' | 'DISABLED' | 'ERROR';
}

export interface ETAEstimate {
  minMs: number;
  maxMs: number;
  confidence: number;
  progress: number;
  updatedAt: string;
  basisFactors: string[];
}

export interface SystemHealth {
  overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  providers: Record<ProviderType, ProviderHealth>;
  storage: StorageHealth;
  activeMissions: number;
  queuedMissions: number;
  lastUpdated: string;
}

export interface ProviderHealth {
  available: boolean;
  latencyMs?: number;
  errorRate?: number;
  quotaRemaining?: number;
  lastChecked: string;
}

export interface StorageHealth {
  indexedDBAvailable: boolean;
  usedBytes: number;
  quotaBytes?: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: 'PHANTOM' | 'USER';
  tool: string;
  action: string;
  permission: PermissionValue;
  missionId?: string;
  projectId?: string;
  result: 'SUCCESS' | 'FAILED' | 'DENIED';
  details: Record<string, unknown>;
}
