import type { ParsedIntent, AutonomyLevel, ResearchMode } from '@/types';
import { parseDeadline } from '@/lib/utils';

export type IntentCategory = 'CONVERSATION' | 'SYSTEM_QUERY' | 'RESEARCH' | 'ANALYZE' | 'MONITOR' | 'DEBUG' | 'CREATE' | 'AUTOMATE' | 'GENERIC_MISSION';

export interface ConversationalResponse {
  isConversation: boolean;
  reply?: string;
  category: IntentCategory;
}

export class IntentEngine {
  // Direct conversational & intent resolution without mandating an LLM API
  evaluateConversational(input: string): ConversationalResponse {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    // Greetings & status inquiries
    if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day)|howdy|sup)[\s!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'CONVERSATION',
        reply: "PHANTOM online. All local kernel systems and background providers are active. Provide an objective, research directive, file dataset, or target to execute.",
      };
    }

    if (/^(who are you|what are you|what is phantom|introduce yourself)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'CONVERSATION',
        reply: "I am PHANTOM AI, an autonomous personal network operating system. I operate on an Outcome > Conversation philosophy: transforming high-level goals into executable task graphs, conducting multi-source research, analyzing structured data, and managing persistent background workflows.",
      };
    }

    if (/^(help|commands|what can you do|capabilities)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'SYSTEM_QUERY',
        reply: "Available capabilities:\n• Deep Web Research: 'Research 50 AI startups in India and create a report'\n• Dataset Analysis: 'Analyze CSV revenue anomalies and produce summary metrics'\n• Project Workspaces: 'Create a new project for Q3 Market Intelligence'\n• Automation & Monitoring: 'Monitor repository releases and track changes'\n• Permission Center: Configure ALLOW / ASK / DENY rules in Settings.",
      };
    }

    if (/^(status|health|system status|provider status)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'SYSTEM_QUERY',
        reply: "System Status: HEALTHY\n• Kernel: Initialized\n• Execution Provider: BrowserWorkerProvider (Active)\n• State Store: IndexedDB (Event-Sourced)\n• Permission Engine: Active (Safety Boundaries Enforced)",
      };
    }

    return { isConversation: false, category: 'GENERIC_MISSION' };
  }

  parse(input: string): ParsedIntent {
    const lower = input.toLowerCase();

    let action = 'EXECUTE';
    let researchMode: ResearchMode = 'STANDARD';
    let confidence = 0.6;

    if (/\b(research|find|discover|search|look up|investigate|scrape|aggregate)\b/.test(lower)) {
      action = 'RESEARCH';
      confidence += 0.2;
    } else if (/\b(analyze|analyse|analysis|inspect|audit|evaluate)\b/.test(lower)) {
      action = 'ANALYZE';
      confidence += 0.2;
    } else if (/\b(monitor|watch|track|observe)\b/.test(lower)) {
      action = 'MONITOR';
      researchMode = 'MONITORING';
      confidence += 0.2;
    } else if (/\b(create|build|generate|draft|write)\b/.test(lower)) {
      action = 'CREATE';
      confidence += 0.15;
    } else if (/\b(fix|debug|repair|diagnose)\b/.test(lower)) {
      action = 'DEBUG';
      confidence += 0.2;
    }

    // Detect depth
    if (/\b(quick|fast|brief)\b/.test(lower)) researchMode = 'QUICK';
    if (/\b(deep|thorough|comprehensive|forensic)\b/.test(lower)) researchMode = 'DEEP';

    // Quantity extraction
    const quantityMatch = input.match(/\b(\d+)\b/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : undefined;

    // Location extraction
    let location: string | undefined;
    if (/\bindia\b|\bindian\b/.test(lower)) location = 'india';
    else if (/\busa\b|\bus\b|\bamerican\b/.test(lower)) location = 'usa';
    else if (/\beurope\b|\buk\b|\bgermany\b/.test(lower)) location = 'europe';
    else if (/\bglobal\b|\bworldwide\b/.test(lower)) location = 'global';

    // Object entity
    let object: string | undefined;
    if (/\b(startup|startups|company|companies|firms)\b/.test(lower)) object = 'companies';
    else if (/\b(repo|repository|codebase|github)\b/.test(lower)) object = 'repository';
    else if (/\b(csv|xlsx|dataset|data|file|spreadsheet)\b/.test(lower)) object = 'dataset';
    else if (/\b(report|dossier|paper)\b/.test(lower)) object = 'report';

    const deadline = parseDeadline(input);

    let mode: AutonomyLevel = 'FULL_AUTONOMY';
    if (lower.includes('ask me') || lower.includes('confirm')) mode = 'ASSISTED';
    else if (lower.includes('manual')) mode = 'MANUAL';

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
          `Generate search queries for ${object ?? 'entities'}${location ? ` in ${location}` : ''}`,
          'Discover primary sources',
          'Fetch and extract content',
          'Deduplicate and normalize entities',
          quantity ? `Filter to top ${quantity} verified results` : 'Rank by quality & relevance',
          'Verify claims across citations',
          'Generate executive intelligence dossier',
        ];
      case 'ANALYZE':
        return [
          'Ingest data source',
          'Inspect schemas & data types',
          'Calculate descriptive statistics',
          'Detect outliers and anomalies',
          'Generate findings & visualization',
        ];
      case 'DEBUG':
        return [
          'Inspect workflow logs & error traces',
          'Diagnose root cause',
          'Propose remediation strategy',
          'Run regression verification',
        ];
      default:
        return [
          'Ingest objective',
          'Determine prerequisites',
          'Execute operational steps',
          'Synthesize outcome artifact',
        ];
    }
  }
}

export const intentEngine = new IntentEngine();
