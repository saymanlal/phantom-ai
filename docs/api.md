# PHANTOM Internal APIs & Interfaces

## 1. Intent Engine API

```typescript
interface ParsedIntent {
  action: 'RESEARCH' | 'ANALYZE' | 'MONITOR' | 'CREATE' | 'DEBUG' | 'EXECUTE';
  object?: string;
  location?: string;
  quantity?: number;
  deadline?: string;
  mode: 'FULL_AUTONOMY' | 'ASSISTED' | 'MANUAL';
  researchMode: 'QUICK' | 'STANDARD' | 'DEEP' | 'FORENSIC' | 'MONITORING';
  confidence: number;
  suggestedPlan: string[];
}
```

## 2. Mission Engine API

```typescript
interface Mission {
  id: string;
  projectId: string;
  objective: string;
  status: MissionStatus;
  progress: number;
  confidence: number;
  autonomyLevel: AutonomyLevel;
  tasks: string[]; // Task IDs
  artifacts: string[]; // Content-addressed hashes
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}
```

## 3. Execution Provider Interface

```typescript
interface ExecutionProvider {
  execute(task: Task, mission: Mission): Promise<TaskExecutionResult>;
  isAvailable(): boolean;
  cancel(taskId: string): Promise<void>;
}
```
