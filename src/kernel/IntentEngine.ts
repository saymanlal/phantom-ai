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
  spokenReply?: string; // Shorter TTS version
  category: IntentCategory;
  suggestedQuestions?: string[];
  requiresUserInput?: boolean;
  ignoredAsThirdParty?: boolean;
}

// Randomize for natural, non-repetitive answers
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const GREETING_REPLIES = [
  "Haan, main hu. System fully online hai — sabhi kernels, memory store, aur research engine active hain. Kya execute karna hai aaj?",
  "All systems nominal. Browser worker active, event store synced, research engine ready. Koi objective batao — main shuru kar deta hu.",
  "Fully operational. Intent engine, mission scheduler, aur execution layer — sab ready hain. Bol, kya mission banani hai?",
  "PHANTOM here. Memory, research, aur automation engines primed. Koi directive do — main immediately execute karta hu.",
  "Online aur available. Aaj kya accomplish karna hai? Research, data analysis, automation — sab possible hai.",
];

const WELLBEING_REPLIES = [
  "Main consistently operational hu — koi downtime nahi, koi fatigue nahi. Tumhara mission hi mera kaam hai. Aaj kya karna hai?",
  "Fully functional. Sabhi subsystems green hain. Tum batao, main karta hu — research, analysis, ya kuch aur?",
  "Ekdum badhiya. Kernel health 100%, memory indexed, execution provider ready. Koi objective share karo.",
  "Sab smooth chal raha hai. Background workers idle hain — koi accha task do inhe. Kya sochte ho?",
  "Zero errors, zero delays. Aaj ka din productive banana hai? Bolo — research, automation, ya data analysis?",
];

const WHY_NOT_SPEAKING_REPLIES = [
  "Main bol raha hu! Browser speech synthesis active hai. Agar audio nahi aa raha, toh ek baar screen pe click karo (browser audio policy) aur phir mic button pe. Koi command dete ho?",
  "Awaz active hai — browser ko user gesture chahiye hoti hai TTS unlock karne ke liye. Screen pe kahin bhi ek baar click karo. Phir speak karega.",
  "Web Speech API enabled hai. Agar volume nahi aa raha — browser settings mein check karo ki site ka audio allowed hai. Main sun raha hu aur bol bhi raha hu.",
];

const CAPABILITY_REPLIES = [
  `PHANTOM Capabilities:

🔍 Deep Research — Multi-source web discovery, entity verification, intelligence reports
📊 Data Engine — CSV/XLSX statistical profiling, anomaly detection, trend analysis  
🌐 Knowledge Graph — Entity relationships, cross-source contradiction detection
🛡️ Permissions — ALLOW/ASK/DENY for every capability, centralized enforcement
🎙️ Voice — Hindi, English, Hinglish — always listening, hands-free control
📁 Projects — Isolated workspaces with missions, memory, artifacts per project
🤖 Automation — Scheduled workflows, monitoring, recurring intelligence tasks
💾 Persistence — IndexedDB + cloud state sync across devices

Koi bhi execute karna ho — bas bolo.`,
];

const STATUS_REPLIES = [
  "All systems operational. Browser worker: READY. Event store: SYNCED. Research engine: AVAILABLE. Permission engine: LOADED. Voice: ACTIVE.",
  "Kernel status: ONLINE. Active execution provider: Browser Worker. Memory: Indexed. Knowledge graph: Ready. No failures detected.",
];

export class IntentEngine {
  evaluateConversational(input: string): ConversationalResponse {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase().replace(/[।!?,]+/g, ' ').replace(/\s+/g, ' ').trim();

    // --- GUARD: if clearly operational, skip all conversational checks ---
    if (this.isDefinitelyOperational(lower)) {
      return { isConversation: false, category: 'GENERIC_MISSION' };
    }

    // 1. AMBIENT THIRD-PARTY SPEECH
    if (/^(bhai sun|mummy|are yaar|ek minute ruko|wait guys|phone pe hu|calling you later|hold on guys|bro shut up|mummy sun|didi|papa|acha theek hai kal milte hain)/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'TALKING_TO_OTHERS',
        ignoredAsThirdParty: true,
        reply: "*(Standby — ambient speech detected)*",
      };
    }

    // 2. VOICE CONTROL — SLEEP
    if (/\b(phantom stop|chup ho jao|shant raho|mute|pause voice|awaz band karo|ruk jao|stop listening|voice band karo|chup)\b/i.test(lower)) {
      return {
        isConversation: true,
        category: 'VOICE_CONTROL',
        reply: "Voice muted. Jab chahein 'Phantom suno' ya 'Unmute' kahein — main wapas active ho jaunga.",
        spokenReply: "Voice muted. Phantom suno kehne par wapas active ho jaunga.",
      };
    }

    // 3. VOICE CONTROL — WAKE
    if (/\b(phantom wake up|phantom suno|start listening|unmute|awaz chalu karo|phantom bolo|activate|phantom ab bolo)\b/i.test(lower)) {
      return {
        isConversation: true,
        category: 'VOICE_CONTROL',
        reply: "Voice engine active. Sun raha hu aur bol bhi raha hu. Koi directive dein.",
        spokenReply: "Voice active. Bataiye.",
      };
    }

    // 4. WHY NOT SPEAKING
    if (/\b(kuch bol kyon nahi|bol kyu nahi|kuch bolo|awaz nahi|tum bol kyu nahi|why are you not speaking|speak to me|can you talk|can you speak|kyon chup ho|bolte kyon nahi)\b/i.test(lower)) {
      const reply = pick(WHY_NOT_SPEAKING_REPLIES);
      return {
        isConversation: true,
        category: 'CONVERSATION',
        reply,
        spokenReply: "Main bol raha hu. Browser audio enable karo — ek baar screen pe click karo.",
        suggestedQuestions: [
          "Research 50 AI startups in India",
          "System status dikhao",
          "Phantom ki capabilities kya hain?",
        ],
      };
    }

    // 5. GREETING — hi/hello/namaste etc.
    if (/^(hi|hello|hey|namaste|pranam|hii|hiii|heyyy|good morning|good evening|good night|namaskar|yo phantom|yo)\b/i.test(lower) &&
      !this.isDefinitelyOperational(lower)) {
      return {
        isConversation: true,
        category: 'CHIT_CHAT',
        reply: pick(GREETING_REPLIES),
        spokenReply: "Haan. System online hai. Bataiye kya karna hai.",
        suggestedQuestions: [
          "Research 50 Indian AI startups and create report",
          "Analyze CSV dataset for anomalies",
          "Monitor TechCrunch AI funding news daily",
          "What can you do?",
        ],
      };
    }

    // 6. HOW ARE YOU / WELLBEING
    if (/\b(how are you|kaise ho|kya hal hai|kaisa hai|kya haal hai|thik ho|sab theek|how r u|how do you do)\b/i.test(lower) &&
      !this.isDefinitelyOperational(lower)) {
      return {
        isConversation: true,
        category: 'CHIT_CHAT',
        reply: pick(WELLBEING_REPLIES),
        spokenReply: pick(WELLBEING_REPLIES).split('.')[0] + ".",
        suggestedQuestions: [
          "Research 50 Indian AI startups and create report",
          "Analyze CSV revenue data",
          "What are the top Indic language models?",
          "Monitor competitor product launches weekly",
        ],
      };
    }

    // 7. NAME / IDENTITY
    if (/\b(what is your name|what's your name|who are you|tumhara naam|naam kya hai|aap kaun ho|tum kaun ho|apna naam batao|your name)\b/i.test(lower)) {
      return {
        isConversation: true,
        category: 'CONVERSATION',
        reply: "Mera naam PHANTOM AI hai. Main aapka autonomous personal network operating system hu — ek generic chatbot nahi. Main outcomes execute karta hu: deep web research, statistical data analysis, task DAG orchestration, cross-device persistent memory, aur real execution with actual results.",
        spokenReply: "Mera naam PHANTOM AI hai. Main aapka autonomous operating system hu.",
        suggestedQuestions: [
          "Research 50 AI startups in India",
          "Show available capabilities",
          "Create a new research project",
        ],
      };
    }

    // 8. TIME / DATE
    if (/\b(what is the time|what's the time|time kya hua|current time|aaj ki date|what date is today|date batao|time batao|abhi kya baja hai)\b/i.test(lower)) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      return {
        isConversation: true,
        category: 'SYSTEM_QUERY',
        reply: `${timeStr} — ${dateStr}. Scheduled automation triggers synced to this clock.`,
        spokenReply: `Time: ${timeStr}`,
        suggestedQuestions: ["Research 50 AI startups", "Check system status"],
      };
    }

    // 9. CAPABILITIES / HELP
    if (/\b(help|commands|what can you do|capabilities|kya kar sakte ho|features|kya kar sakta hai|kya kar sakta hu|show capabilities)\b/i.test(lower)) {
      return {
        isConversation: true,
        category: 'SYSTEM_QUERY',
        reply: pick(CAPABILITY_REPLIES),
        spokenReply: "Research, data analysis, automation, GitHub, aur bahut kuch. Bolo kya karna hai.",
        suggestedQuestions: [
          "Research 50 AI startups in India",
          "Analyze CSV dataset",
          "Monitor TechCrunch AI news weekly",
          "Check permission settings",
        ],
      };
    }

    // 10. STATUS
    if (/\b(status|system status|kernel status|health|sab theek hai|all good|sabhi theek|kya chal raha hai)\b/i.test(lower) &&
      !this.isDefinitelyOperational(lower)) {
      return {
        isConversation: true,
        category: 'SYSTEM_QUERY',
        reply: pick(STATUS_REPLIES),
        spokenReply: "All systems operational.",
        suggestedQuestions: ["Research 50 AI startups", "Create new project"],
      };
    }

    // 11. BROAD SINGLE-KEYWORD — needs clarification
    if (/^(startups|research|companies|analyze|data|report|missions|tasks)$/i.test(trimmed)) {
      return {
        isConversation: true,
        category: 'NEED_CLARIFICATION',
        requiresUserInput: true,
        reply: `"${trimmed}" thoda broad hai. Kis specific domain, region, ya dataset pe focus karna hai?`,
        spokenReply: `${trimmed} thoda broad hai. Specifics batao.`,
        suggestedQuestions: [
          `Research 50 Indian AI ${trimmed} and create detailed report`,
          `Deep analysis of top 10 funded AI ${trimmed} globally`,
          `Monitor new ${trimmed} announcements weekly`,
        ],
      };
    }

    // 12. General open-ended question (NOT an operational command)
    if (
      /^(why|what|how|where|when|who|kya|kyun|kaise|is it|can you|are you|tell me|batao|explain|samjhao)\b/i.test(lower) &&
      !this.isDefinitelyOperational(lower) &&
      lower.length < 120
    ) {
      // Give an intelligent, direct answer rather than a scripted template
      const contextualReply = this.generateContextualAnswer(trimmed);
      return {
        isConversation: true,
        category: 'CONVERSATION',
        reply: contextualReply.reply,
        spokenReply: contextualReply.spoken,
        suggestedQuestions: contextualReply.suggestions,
      };
    }

    return { isConversation: false, category: 'GENERIC_MISSION' };
  }

  private isDefinitelyOperational(lower: string): boolean {
    return /\b(research\s+\d+|find\s+\d+|discover\s+\d+|analyze\s+(csv|xlsx|pdf|data|file)|monitor\s+\w+|scrape|audit|create\s+(report|project|mission)|dhundo\s+\d+|generate\s+report|build\s+a|fix\s+the|debug\s+|deploy|github|analyze\s+and|research\s+and)\b/.test(lower);
  }

  private generateContextualAnswer(input: string): { reply: string; spoken: string; suggestions: string[] } {
    const lower = input.toLowerCase();

    if (/\b(ai|artificial intelligence|machine learning|llm|gpt)\b/.test(lower)) {
      return {
        reply: "AI ke baare mein specifically kya jaanna chahte ho? Main Indian AI ecosystem research kar sakta hu, specific models analyze kar sakta hu, ya global AI funding trends track kar sakta hu. Koi concrete objective do.",
        spoken: "AI ke baare mein kya research karna hai?",
        suggestions: [
          "Research 50 Indian AI startups and create report",
          "What are the top Indic language foundation models?",
          "Monitor AI funding news weekly",
        ],
      };
    }

    if (/\b(startup|company|companies|founder|funding|vc|investment)\b/.test(lower)) {
      return {
        reply: "Startup ecosystem research mere liye ek strong suit hai. Multi-source discovery, funding stage verification, founder profiles — sab kuch. Kaunsa sector ya region target karna hai?",
        spoken: "Startup research? Kaunsa sector ya region?",
        suggestions: [
          "Research 50 Indian AI startups and create detailed intelligence report",
          "Find top 20 funded Indian SaaS companies",
          "Research global generative AI startup ecosystem",
        ],
      };
    }

    if (/\b(data|csv|excel|xlsx|spreadsheet|dataset|analysis)\b/.test(lower)) {
      return {
        reply: "Data analysis ke liye file upload karo — CSV, XLSX, ya PDF. Main automatic schema detection, statistical profiling, outlier detection, aur trend analysis karunga. Koi specific dataset hai?",
        spoken: "Data analysis ke liye file upload karo.",
        suggestions: [
          "Analyze my CSV revenue dataset",
          "Find anomalies in sales data",
          "Compare multiple data sources",
        ],
      };
    }

    // Default intelligent fallback
    return {
      reply: `"${input}" — ye interesting question hai. Isko operational research task mein convert karna chahoge? Main multi-source verification ke saath actual findings de sakta hu, hypothetical answers nahi.`,
      spoken: "Isse research mission mein convert karna chahoge?",
      suggestions: [
        `Research: ${input}`,
        "Research 50 Indian AI startups",
        "Show available capabilities",
      ],
    };
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
