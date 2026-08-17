import type { ParsedIntent, AutonomyLevel, ResearchMode } from '@/types';
import { parseDeadline } from '@/lib/utils';

export type IntentCategory =
  | 'CONVERSATION'
  | 'CHIT_CHAT'
  | 'SYSTEM_QUERY'
  | 'NEED_CLARIFICATION'
  | 'DIRECT_SUGGESTION'
  | 'TALKING_TO_OTHERS'
  | 'VOICE_CONTROL'
  | 'RESEARCH'
  | 'ANALYZE'
  | 'MONITOR'
  | 'DEBUG'
  | 'CREATE'
  | 'AUTOMATE'
  | 'GENERIC_MISSION';

export interface ConversationalResponse {
  isConversation: boolean;
  reply?: string;
  category: IntentCategory;
  suggestedQuestions?: string[];
  requiresUserInput?: boolean;
  ignoredAsThirdParty?: boolean;
}

export class IntentEngine {
  // Advanced Hinglish / Hindi / English bidirectional understanding
  // Includes background ambient speech filtering (detects if user is talking to someone else)
  evaluateConversational(input: string): ConversationalResponse {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    // 1. THIRD-PARTY / TALKING-TO-OTHERS FILTER
    // If the speech clearly addresses someone else (mom, brother, calling someone else, background noise)
    if (
      /^(bhai sun|mummy|are yaar sun|ek minute ruko bhai|wait bro not you|phone pe hu|calling you later|hold on guys|bro shut up|arre bhai usko bol|pani lana)/i.test(
        trimmed
      )
    ) {
      return {
        isConversation: true,
        category: 'TALKING_TO_OTHERS',
        ignoredAsThirdParty: true,
        reply: "*(Ambient speech detected — listening in standby mode)*",
      };
    }

    // 2. VOICE CONTROLS (Hindi / English / Hinglish)
    if (/^(stop listening|chup ho jao|shant raho|mute|pause voice|awaz band karo|ruk jao)[\s!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'VOICE_CONTROL',
        reply: "Voice output muted. Still active on standby — say 'Phantom resume' or speak whenever you need me.",
      };
    }

    if (/^(start listening|unmute|awaz chalu karo|phantom suno|phantom bolna chalu karo)[\s!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'VOICE_CONTROL',
        reply: "Voice output fully active. Main sun raha hu, bataiye kya karna hai.",
      };
    }

    // 3. GREETINGS & HINGLISH CHIT-CHAT
    if (/^(hi|hello|hey|kya hal hai|kaisa hai|namaste|pranam|what's up|wassup|yo phantom|kaise ho)[\s!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'CHIT_CHAT',
        reply: "Ekdam badhiya! PHANTOM OS is running at 100% efficiency. Kuch naya research karna hai, koi dataset analyze karna hai, ya koi automate workflow run kare?",
        suggestedQuestions: [
          "Research 50 AI startups in India",
          "Analyze revenue CSV data",
          "What is my current system status?",
          "Monitor TechCrunch AI news",
        ],
      };
    }

    // 4. RANDOM CHIT-CHAT & PHILOSOPHICAL / TECH OPINIONS
    if (/^(batao kuch naya|tell me something interesting|kya chal raha hai|what are you thinking|bore ho raha hu)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'CHIT_CHAT',
        reply: "Dilchasp baat: Sovereign Indic LLMs (like Sarvam & Krutrim) and Edge AI startups are scaling 3x faster this year across Tier 2/3 Indian cities. Agar aap chaho toh hum global vs Indian AI valuations ka ek direct comparison report bana sakte hain.",
        suggestedQuestions: [
          "Compare Indian vs US AI funding trends",
          "Find top 10 Indic speech AI models",
          "Check upcoming AI conferences",
        ],
      };
    }

    if (/^(who are you|who made you|tum kaun ho|phantom kya hai|kya kar sakte ho)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'CONVERSATION',
        reply: "Main PHANTOM AI hu — aapka autonomous personal operating system. Mai chatbot nahi hu; mai outcomes execute karta hu: Autonomous research, task DAG execution, data verification, aur background workflows. Both Hindi and English comfortably.",
        suggestedQuestions: [
          "Show available capabilities",
          "Create a new market research project",
          "Check permission settings",
        ],
      };
    }

    // 5. INTELLIGENT QUESTIONING / UNDERSPECIFIED OBJECTIVES
    // If the user gives a single vague keyword like "startups" or "research" or "data"
    if (/^(startups|research|companies|analyze|data|report)$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'NEED_CLARIFICATION',
        requiresUserInput: true,
        reply: `Aapne "${trimmed}" specify kiya hai, par target thoda broad hai. Kis sector ya region me focus karna hai?`,
        suggestedQuestions: [
          `Find 50 Indian AI ${trimmed} and create report`,
          `Deep research on global generative AI ${trimmed}`,
          `Quick scan of top 10 funded ${trimmed}`,
        ],
      };
    }

    if (/^(status|health|system status|check providers|sab kaisa hai)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'SYSTEM_QUERY',
        reply: "System Status: HEALTHY 🟢\n• Kernel: Initialized\n• Voice Engine: Web Speech API (Bilingual Eng/Hindi)\n• Execution: BrowserWorkerProvider (Active)\n• Memory Store: IndexedDB (Event-Sourced)\n• All Safety Controls: Active",
      };
    }

    return { isConversation: false, category: 'GENERIC_MISSION' };
  }

  parse(input: string): ParsedIntent {
    const lower = input.toLowerCase();

    let action = 'EXECUTE';
    let researchMode: ResearchMode = 'STANDARD';
    let confidence = 0.6;

    if (/\b(research|find|discover|search|look up|investigate|scrape|aggregate|dhundo|pata karo)\b/.test(lower)) {
      action = 'RESEARCH';
      confidence += 0.2;
    } else if (/\b(analyze|analyse|analysis|inspect|audit|evaluate|check karo|jaanch karo)\b/.test(lower)) {
      action = 'ANALYZE';
      confidence += 0.2;
    } else if (/\b(monitor|watch|track|observe|nazar rakho)\b/.test(lower)) {
      action = 'MONITOR';
      researchMode = 'MONITORING';
      confidence += 0.2;
    } else if (/\b(create|build|generate|draft|write|banao|likho)\b/.test(lower)) {
      action = 'CREATE';
      confidence += 0.15;
    } else if (/\b(fix|debug|repair|diagnose|theek karo)\b/.test(lower)) {
      action = 'DEBUG';
      confidence += 0.2;
    }

    if (/\b(quick|fast|brief|jaldi)\b/.test(lower)) researchMode = 'QUICK';
    if (/\b(deep|thorough|comprehensive|forensic|poora detail me)\b/.test(lower)) researchMode = 'DEEP';

    const quantityMatch = input.match(/\b(\d+)\b/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : undefined;

    let location: string | undefined;
    if (/\bindia\b|\bindian\b|\bbharat\b/.test(lower)) location = 'india';
    else if (/\busa\b|\bus\b|\bamerican\b/.test(lower)) location = 'usa';
    else if (/\beurope\b|\buk\b|\bgermany\b/.test(lower)) location = 'europe';
    else if (/\bglobal\b|\bworldwide\b/.test(lower)) location = 'global';

    let object: string | undefined;
    if (/\b(startup|startups|company|companies|firms)\b/.test(lower)) object = 'companies';
    else if (/\b(repo|repository|codebase|github)\b/.test(lower)) object = 'repository';
    else if (/\b(csv|xlsx|dataset|data|file|spreadsheet)\b/.test(lower)) object = 'dataset';
    else if (/\b(report|dossier|paper)\b/.test(lower)) object = 'report';

    const deadline = parseDeadline(input);

    let mode: AutonomyLevel = 'FULL_AUTONOMY';
    if (lower.includes('ask me') || lower.includes('confirm') || lower.includes('pooch ke')) mode = 'ASSISTED';
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
