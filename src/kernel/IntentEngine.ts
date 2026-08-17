import type { ParsedIntent, AutonomyLevel, ResearchMode } from '@/types';
import { parseDeadline } from '@/lib/utils';

type IntentPattern = {
  keywords: string[];
  action: string;
  taskType?: string;
  researchMode?: ResearchMode;
};

const INTENT_PATTERNS: IntentPattern[] = [
  { keywords: ['research', 'find', 'discover', 'search', 'look up', 'investigate'], action: 'RESEARCH', researchMode: 'STANDARD' },
  { keywords: ['analyze', 'analyse', 'analysis', 'examine', 'inspect'], action: 'ANALYZE' },
  { keywords: ['monitor', 'watch', 'track', 'observe'], action: 'MONITOR', researchMode: 'MONITORING' },
  { keywords: ['create', 'make', 'build', 'generate', 'write'], action: 'CREATE' },
  { keywords: ['fix', 'debug', 'repair', 'solve', 'resolve'], action: 'DEBUG' },
  { keywords: ['deploy', 'publish', 'release', 'ship'], action: 'DEPLOY' },
  { keywords: ['report', 'summarize', 'summary', 'document'], action: 'REPORT' },
  { keywords: ['compare', 'diff', 'contrast', 'versus', 'vs'], action: 'COMPARE' },
  { keywords: ['automate', 'schedule', 'recurring', 'every'], action: 'AUTOMATE' },
  { keywords: ['upload', 'process', 'parse', 'extract'], action: 'PROCESS' },
];

const OBJECT_PATTERNS: Record<string, string> = {
  'startup': 'COMPANY',
  'startups': 'COMPANY',
  'company': 'COMPANY',
  'companies': 'COMPANY',
  'repository': 'REPOSITORY',
  'repo': 'REPOSITORY',
  'codebase': 'REPOSITORY',
  'pdf': 'DOCUMENT',
  'csv': 'DATASET',
  'dataset': 'DATASET',
  'data': 'DATASET',
  'website': 'WEBSITE',
  'site': 'WEBSITE',
  'article': 'ARTICLE',
  'report': 'REPORT',
};

const LOCATION_PATTERNS = [
  'india', 'indian', 'usa', 'us', 'uk', 'europe', 'asia', 'global',
  'worldwide', 'china', 'singapore', 'germany', 'france', 'brazil',
];

const RESEARCH_DEPTH: Record<string, ResearchMode> = {
  'quick': 'QUICK',
  'fast': 'QUICK',
  'brief': 'QUICK',
  'deep': 'DEEP',
  'thorough': 'DEEP',
  'comprehensive': 'DEEP',
  'forensic': 'FORENSIC',
  'detailed': 'DEEP',
  'monitor': 'MONITORING',
  'track': 'MONITORING',
};

export class IntentEngine {
  parse(input: string): ParsedIntent {
    const lower = input.toLowerCase();
    const words = lower.split(/\s+/);

    // Detect action
    let action = 'EXECUTE';
    let researchMode: ResearchMode = 'STANDARD';
    let confidence = 0.5;

    for (const pattern of INTENT_PATTERNS) {
      if (pattern.keywords.some(k => lower.includes(k))) {
        action = pattern.action;
        if (pattern.researchMode) researchMode = pattern.researchMode;
        confidence += 0.2;
        break;
      }
    }

    // Detect research depth override
    for (const [keyword, mode] of Object.entries(RESEARCH_DEPTH)) {
      if (lower.includes(keyword)) {
        researchMode = mode;
        break;
      }
    }

    // Detect object
    let object: string | undefined;
    for (const [keyword, type] of Object.entries(OBJECT_PATTERNS)) {
      if (lower.includes(keyword)) {
        object = type;
        confidence += 0.1;
        break;
      }
    }

    // Detect location
    let location: string | undefined;
    for (const loc of LOCATION_PATTERNS) {
      if (lower.includes(loc)) {
        location = loc;
        confidence += 0.1;
        break;
      }
    }

    // Detect quantity
    const quantityMatch = input.match(/(\d+)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : undefined;
    if (quantity) confidence += 0.1;

    // Detect deadline
    const deadline = parseDeadline(input);
    if (deadline) confidence += 0.1;

    // Detect autonomy level
    let mode: AutonomyLevel = 'FULL_AUTONOMY';
    if (lower.includes('ask me') || lower.includes('confirm') || lower.includes('check with me')) {
      mode = 'ASSISTED';
    } else if (lower.includes('manual') || lower.includes('step by step')) {
      mode = 'MANUAL';
    } else if (lower.includes('autonomous') || lower.includes('automatically') || lower.includes('overnight') || lower.includes('background')) {
      mode = 'FULL_AUTONOMY';
    }

    // Generate suggested plan
    const suggestedPlan = this.buildPlan(action, object, quantity, location);

    return {
      action,
      object,
      location,
      quantity,
      deadline,
      mode,
      researchMode,
      rawInput: input,
      confidence: Math.min(1, confidence),
      entities: { object, location, quantity, deadline },
      suggestedPlan,
    };
  }

  private buildPlan(action: string, object?: string, quantity?: number, location?: string): string[] {
    switch (action) {
      case 'RESEARCH':
        return [
          `Generate search queries for ${object ?? 'topic'}${location ? ` in ${location}` : ''}`,
          'Discover primary sources',
          'Fetch and extract content',
          'Deduplicate and normalize',
          quantity ? `Filter to top ${quantity} results` : 'Rank by quality',
          'Verify important claims',
          'Generate report',
        ];
      case 'ANALYZE':
        return [
          'Detect file format',
          'Extract content',
          'Normalize data',
          'Run statistical analysis',
          'Detect anomalies',
          'Generate insights',
          'Generate report',
        ];
      case 'DEBUG':
        return [
          'Inspect repository structure',
          'Inspect workflow/build logs',
          'Classify failure type',
          'Diagnose root cause',
          'Create fix branch',
          'Implement fix',
          'Run tests',
          'Commit and report',
        ];
      case 'CREATE':
        return [
          'Understand requirements',
          'Plan structure',
          'Generate content',
          'Review output',
          'Save artifact',
        ];
      case 'MONITOR':
        return [
          'Configure source',
          'Take initial snapshot',
          'Schedule periodic checks',
          'Compare snapshots',
          'Score changes',
          'Notify on threshold breach',
        ];
      default:
        return ['Parse objective', 'Plan execution', 'Execute', 'Report results'];
    }
  }
}

export const intentEngine = new IntentEngine();
