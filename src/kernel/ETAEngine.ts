import type { Mission, Task, ETAEstimate } from '@/types';

export class ETAEngine {
  estimate(mission: Mission, tasks: Task[]): ETAEstimate {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const failed = tasks.filter(t => t.status === 'FAILED').length;
    const running = tasks.filter(t => t.status === 'RUNNING').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const startedAt = mission.startedAt ? new Date(mission.startedAt).getTime() : null;
    const elapsed = startedAt ? Date.now() - startedAt : 0;
    const throughput = elapsed > 0 && completed > 0 ? completed / elapsed : null;
    const remaining = total - completed - failed;

    let minMs = mission.estimatedDurationMs ?? 300000;
    let maxMs = (mission.estimatedDurationMs ?? 300000) * 1.5;
    let confidence = 0.5;
    const factors: string[] = ['task count', 'task complexity'];

    if (throughput && remaining > 0) {
      const estimatedRemaining = remaining / throughput;
      minMs = estimatedRemaining * 0.8;
      maxMs = estimatedRemaining * 1.3;
      confidence = 0.75;
      factors.push('actual throughput', 'progress rate');
    } else if (mission.estimatedDurationMs && progress > 0) {
      const totalEstimated = mission.estimatedDurationMs;
      const remainingEstimated = totalEstimated * (1 - progress / 100);
      minMs = remainingEstimated * 0.7;
      maxMs = remainingEstimated * 1.4;
      confidence = 0.6;
      factors.push('estimated duration', 'progress %');
    }

    if (failed > 0) {
      confidence -= 0.1 * (failed / total);
      factors.push('retry rate');
    }

    return {
      minMs: Math.max(0, minMs),
      maxMs: Math.max(minMs, maxMs),
      confidence: Math.max(0, Math.min(1, confidence)),
      progress,
      updatedAt: new Date().toISOString(),
      basisFactors: factors,
    };
  }

  formatWindow(eta: ETAEstimate): string {
    const { minMs, maxMs } = eta;
    if (minMs < 60000) return '< 1 minute';
    const minMin = Math.round(minMs / 60000);
    const maxMin = Math.round(maxMs / 60000);
    if (minMin === maxMin) return `~${minMin} min`;
    if (maxMin < 60) return `${minMin}–${maxMin} min`;
    const minH = Math.round(minMs / 3600000);
    const maxH = Math.round(maxMs / 3600000);
    return `${minH}–${maxH} hr`;
  }
}

export const etaEngine = new ETAEngine();
