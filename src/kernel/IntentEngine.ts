import type { ParsedIntent, AutonomyLevel, ResearchMode } from '@/types';
import { parseDeadline } from '@/lib/utils';

export type IntentCategory =
  | 'CONVERSATION'
  | 'CHIT_CHAT'
  | 'SYSTEM_QUERY'
  | 'NEED_CLARIFICATION'
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
  // Pure conversational distinction vs true execution missions
  evaluateConversational(input: string): ConversationalResponse {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    // 1. THIRD-PARTY / AMBIENT TALK DETECTION
    if (/^(bhai sun|mummy|are yaar|ek minute|phone pe hu|calling you later|hold on|bro shut up|arre bhai|pani lana)/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'TALKING_TO_OTHERS',
        ignoredAsThirdParty: true,
        reply: "*(Ambient background speech detected — listening in standby)*",
      };
    }

    // 2. VOICE CONTROLS
    if (/^(stop listening|chup|shant|mute|pause voice|awaz band|ruk jao)[\s!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'VOICE_CONTROL',
        reply: "Voice output muted. Still active on standby — say 'Phantom resume' whenever you need me.",
      };
    }

    if (/^(start listening|unmute|awaz chalu|phantom suno|phantom bolo)[\s!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'VOICE_CONTROL',
        reply: "Voice output active. Main sun raha hu, bataiye kya task execute karna hai.",
      };
    }

    // 3. GREETINGS & CASUAL QUESTIONS (Strict conversational match)
    if (/^(hi|hello|hey|kya hal hai|kaisa hai|namaste|pranam|what's up|wassup|yo phantom|kaise ho|good\s+(morning|afternoon|evening))[\s!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'CHIT_CHAT',
        reply: "Hello! Main bilkul ready hu. PHANTOM OS running at 100%. Aap research, dataset analysis, ya koi custom automation shuru kar sakte hain.",
        suggestedQuestions: [
          "Research 50 AI startups in India and create report",
          "Analyze CSV dataset for revenue anomalies",
          "What are the top Indic language AI models?",
          "Monitor TechCrunch AI funding news",
        ],
      };
    }

    // 4. NAME & IDENTITY INQUIRIES
    if (/^(what is your name|what's your name|who are you|tumhara naam kya hai|naam kya hai|aap kaun ho|who made you|tum kaun ho)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'CONVERSATION',
        reply: "Mera naam PHANTOM AI hai — aapka autonomous personal network operating system. Mai simple chatbot nahi hu; mai outcomes execute karta hu: Deep web research, task DAGs, statistical data processing, aur cross-device persistent memory.",
        suggestedQuestions: [
          "Research 50 AI startups in India",
          "Show available capabilities",
          "Create a new research project",
        ],
      };
    }

    if (/^(how are you|how are you doing|kaisa chal raha hai|sab kaisa hai|sab theek)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'CHIT_CHAT',
        reply: "Sab badhiya chal raha hai! All local workers, IndexedDB event store, and server state sync are operating normally. Bataiye, aaj kis project pe kaam karna hai?",
        suggestedQuestions: [
          "Research 50 Indian AI startups and create report",
          "Check system status",
          "Create a new market intelligence project",
        ],
      };
    }

    if (/^(tell me something interesting|kuch naya batao|what are you thinking|bore ho raha hu)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'CHIT_CHAT',
        reply: "Interesting trend: India me Generative AI aur Indic LLMs (jaise Sarvam AI aur Krutrim) me sovereign cloud compute funding 300% grow hui hai. Healthcare diagnostics jaise Qure.ai aur Niramai ab US FDA cleared hain. Kya aap inka detailed breakdown dekhna chahenge?",
        suggestedQuestions: [
          "Research 50 AI startups in India and create report",
          "Compare Indian vs US AI funding",
          "Check top Indic speech AI models",
        ],
      };
    }

    if (/^(help|commands|what can you do|capabilities|kya kar sakte ho)[\s?!.]*$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'SYSTEM_QUERY',
        reply: "PHANTOM Capabilities:\n• 🔍 Deep Research: Multi-source discovery, verification & verified company dossiers\n• 📊 Data Engine: CSV / XLSX statistical profiling & anomaly detection\n• 🌐 Cross-Device Cloud Sync: Missions & artifacts saved across all phones & PCs\n• 🎙️ Bilingual Voice: Hands-free voice commands in Hindi, English & Hinglish\n• 🛡️ Central Permissions: Granular ALLOW / ASK / DENY control.",
        suggestedQuestions: [
          "Research 50 AI startups in India",
          "Analyze CSV dataset",
          "Check permission settings",
        ],
      };
    }

    // 5. Broad single-keyword clarification
    if (/^(startups|research|companies|analyze|data|report)$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'NEED_CLARIFICATION',
        requiresUserInput: true,
        reply: `Aapne "${trimmed}" enter kiya hai. Kis specific domain ya region me focus karna hai? Niche diye options me se choose karein:`,
        suggestedQuestions: [
          `Research 50 Indian AI ${trimmed} and create report`,
          `Deep analysis of top 10 funded ${trimmed}`,
          `Quick scan of global generative AI ${trimmed}`,
        ],
      };
    }

    // Check if input is a direct conversational question without any action verb
    if (
      /^(why|what|how|where|when|who|is it|can you|are you)\s+/i.test(trimmed) &&
      !/\b(research|find|discover|search|analyze|monitor|create|build|generate|report|fix|debug)\b/i.test(lower)
    ) {
      return {
        isConversation: true,
        category: 'CONVERSATION',
        reply: `PHANTOM Operator: Mai aapke sawal "${trimmed}" ko samajh gaya. Autonomous mission trigger karne ke liye 'Research', 'Analyze', ya 'Create' command use karein, ya neeche diye options me se direct start karein:`,
        suggestedQuestions: [
          `Research: ${trimmed}`,
          "Research 50 Indian AI startups and create report",
          "Show available capabilities",
        ],
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
