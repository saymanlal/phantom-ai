PHANTOM AI
AUTONOMOUS PERSONAL NETWORK OPERATING SYSTEM
PRODUCTION BUILD + DEPLOYMENT SPECIFICATION

============================================================
0. ROLE
============================================================

You are acting as the lead architect, senior full-stack engineer,
systems engineer, DevOps engineer, UI/UX engineer, security engineer,
documentation engineer and release engineer.

You are not building a chatbot.

You are building PHANTOM AI, an autonomous personal operating system
that uses a web interface as its control surface and coordinates
missions, tasks, research, data analysis, projects, automation,
development workflows, memory, knowledge, notifications and available
execution infrastructure.

The system should feel like a powerful personal computer/operator that
happens to have a browser interface.

Do not build a generic ChatGPT clone.

Do not create a fake dashboard with mock AI functionality.

Do not implement fake progress bars.

Do not claim that a task is running unless an actual execution provider
is executing it.

Do not claim that a task completed unless an actual result exists.

The core architecture must work before visual polish.

============================================================
1. PRIMARY PRODUCT
============================================================

Product name:

PHANTOM AI

Production target:

https://phantom-ai.vercel.app

Core idea:

The user gives PHANTOM an objective.

PHANTOM determines:

- what the objective actually means
- what information is required
- which tools are available
- what sequence of actions is necessary
- which actions can run in parallel
- which actions can run locally
- which actions require remote execution
- what can fail
- how to checkpoint progress
- how to resume after interruption
- what should be remembered
- what should be reported

The user should provide outcomes, not manually orchestrate every step.

Example:

User:

"Research the Indian AI startup ecosystem, find 100 relevant
companies, verify the important information, create a report and
finish it overnight."

PHANTOM should transform this into:

OBJECTIVE
↓
INTENT
↓
PLAN
↓
MISSION
↓
TASK GRAPH
↓
EXECUTION
↓
OBSERVATION
↓
REPLANNING
↓
CHECKPOINT
↓
COMPLETION
↓
ARTIFACT
↓
NOTIFICATION

============================================================
2. CORE DESIGN PHILOSOPHY
============================================================

Optimize for:

OUTCOME > CONVERSATION

PHANTOM should not unnecessarily ask the user for every intermediate
decision.

Bad:

User:
"Research 50 Indian AI startups."

PHANTOM:
"Would you like me to search for them?"

Good:

PHANTOM:

Mission created.

Objective:
50 Indian AI startups

Plan:
Discovery → validation → enrichment → ranking → report

Estimated duration:
18–35 minutes

Execution:
Autonomous

Starting now.

============================================================
3. AUTONOMY
============================================================

PHANTOM must support:

MANUAL
ASSISTED
AUTONOMOUS
FULL AUTONOMY

Default:

FULL AUTONOMY

The user should be able to configure permissions.

Routine operations should not repeatedly ask for approval when the
user has already allowed them.

Examples of routine capabilities:

- public web research
- public-source fetching
- public document downloads
- PDF analysis
- CSV analysis
- XLSX analysis
- project file creation
- project organization
- local computation
- task creation
- mission creation
- report generation
- Git branches
- Git commits
- tests
- documentation
- repository inspection

The user should be able to change any normal capability between:

ALLOW
ASK
DENY

However, PHANTOM must maintain immutable safety boundaries around:

- credential theft
- unauthorized access
- bypassing authentication
- malware
- destructive attacks
- fraud
- financial abuse
- privacy violations
- unauthorized private data access
- harmful system compromise

Do not create a permission system that allows a user prompt to bypass
these boundaries.

============================================================
4. PERMISSION CENTER
============================================================

Create a dedicated Permissions section.

Categories:

WEB
FILES
DATA
GITHUB
CODE
EMAIL
NOTIFICATIONS
BROWSER
PROJECTS
DEPLOYMENT
AUTOMATION
SCHEDULING
EXTERNAL SERVICES

Each capability has:

ALLOW
ASK
DENY

Example:

Web research              ALLOW
Public downloads          ALLOW
File creation             ALLOW
Project modification      ALLOW
Git commit                ALLOW
Git push                  ALLOW
Vercel deployment         ALLOW
Email sending             ASK
Production deletion       DENY

Centralize permission enforcement.

Every tool invocation must pass through the permission engine.

Do not scatter permission logic throughout the application.

============================================================
5. PHANTOM KERNEL
============================================================

Create a central orchestration kernel.

Architecture:

PHANTOM UI
    ↓
PHANTOM KERNEL
    ↓
INTENT ENGINE
    ↓
MISSION ENGINE
    ↓
PLANNING ENGINE
    ↓
TASK GRAPH ENGINE
    ↓
TOOL REGISTRY
    ↓
EXECUTION ENGINE
    ↓
STATE MANAGER
    ↓
MEMORY + KNOWLEDGE
    ↓
ARTIFACTS + NOTIFICATIONS

Kernel responsibilities:

- interpret intent
- create missions
- create tasks
- resolve dependencies
- select tools
- select execution providers
- enforce permissions
- manage state
- checkpoint execution
- recover failures
- replan
- store results
- notify user

============================================================
6. INTENT ENGINE
============================================================

Do not make an LLM API mandatory for the core product.

Build a deterministic/local-first intent engine using:

- tokenization
- command grammar
- pattern matching
- fuzzy matching
- entity dictionaries
- date parsing
- number extraction
- keyword classification
- project context
- previous mission context
- structured command schemas

Example:

Input:

"Research 100 AI companies in India by tomorrow morning."

Parse:

ACTION:
research

OBJECT:
AI companies

LOCATION:
India

QUANTITY:
100

DEADLINE:
tomorrow morning

MODE:
autonomous

Build the intent engine so new intent handlers can be added without
rewriting the kernel.

============================================================
7. OPTIONAL INTELLIGENCE PROVIDER
============================================================

The core PHANTOM architecture must not depend on a paid LLM.

Create an optional:

IntelligenceProvider

interface.

Possible future providers:

- local model
- user-provided API
- external model
- deterministic engine
- rule-based engine
- hybrid engine

If no LLM is configured, PHANTOM must still function.

Do not make the product unusable without an API key.

============================================================
8. MISSION ENGINE
============================================================

Every meaningful objective becomes a Mission.

Mission:

{
  id,
  projectId,
  objective,
  status,
  priority,
  autonomyLevel,
  permissions,
  createdAt,
  startedAt,
  deadline,
  estimatedDuration,
  estimatedCompletion,
  confidence,
  tasks,
  dependencies,
  artifacts,
  sources,
  checkpoints,
  result,
  notificationState
}

Statuses:

DRAFT
PLANNED
QUEUED
RUNNING
WAITING
BLOCKED
PAUSED
RETRYING
COMPLETED
FAILED
CANCELLED

============================================================
9. TASK GRAPH ENGINE
============================================================

Complex missions must become DAGs.

Example:

MISSION
│
├── Discover sources
│
├── Extract entities
│
├── Validate entities
│
├── Enrich data
│
├── Analyze
│
├── Verify
│
└── Generate report

Tasks support:

- dependencies
- priority
- timeout
- retry policy
- checkpoints
- required capabilities
- inputs
- outputs
- execution provider
- estimated duration

Parallelize independent tasks where possible.

============================================================
10. REAL-TIME REPLANNING
============================================================

PHANTOM must not blindly follow a static plan.

After significant execution:

OBSERVE
↓
UPDATE STATE
↓
CHECK RESULTS
↓
CHECK ASSUMPTIONS
↓
CHECK NEW INFORMATION
↓
REPLAN IF NECESSARY

Example:

Initial plan:
Find 100 companies.

Discovery finds:
2,400 candidates.

PHANTOM should automatically tighten filtering criteria rather than
blindly process all 2,400.

============================================================
11. ETA ENGINE
============================================================

Every meaningful mission should have an estimated completion window.

Use:

- task count
- task complexity
- historical throughput
- current progress
- provider availability
- source count
- data size
- retry rate
- failure rate

Example:

Estimated:
18–35 minutes

Confidence:
81%

Progress:
32%

Updated ETA:
13–22 minutes

Never pretend to have exact timing when the system cannot know it.

============================================================
12. TIME ENGINE
============================================================

PHANTOM must understand:

- current date
- current time
- timezone
- durations
- deadlines
- relative dates
- scheduling
- recurring schedules

Examples:

"Do this now."

"Do this tonight."

"Do this at 7 AM."

"Research this overnight."

"Finish before Friday."

"Monitor this every morning."

Convert these into structured schedules.

============================================================
13. BACKGROUND EXECUTION ARCHITECTURE
============================================================

IMPORTANT:

Do not pretend that a browser tab can provide unlimited 24/7 compute
after every device is offline.

The architecture must separate:

USER INTERFACE

from:

EXECUTION INFRASTRUCTURE

The UI is a control surface.

Persistent mission state must survive browser closure.

Use an execution-provider abstraction.

Initial providers:

1. BrowserWorkerProvider
2. GitHubActionsExecutionProvider
3. VercelStatelessProvider

Future providers can be added.

Architecture:

USER
 ↓
PHANTOM UI
 ↓
MISSION STATE
 ↓
EVENT LOG
 ↓
EXECUTION QUEUE
 ↓
AVAILABLE EXECUTION PROVIDER
 ↓
TASK
 ↓
CHECKPOINT
 ↓
NEXT TASK
 ↓
RESULT

If no execution provider is currently available:

WAITING_FOR_EXECUTION

Do not fake execution.

When a provider becomes available:

resume automatically.

============================================================
14. EXECUTION PROVIDER INTERFACE
============================================================

Create:

ExecutionProvider

Methods:

execute()
status()
cancel()
checkpoint()
resume()
capabilities()

Implement:

BrowserWorkerProvider
GitHubActionsExecutionProvider
VercelProvider

Provider selection should consider:

- capability
- availability
- task type
- estimated duration
- quota
- current load
- cost
- reliability

Prefer free/local execution when appropriate.

============================================================
15. GITHUB AS VERSIONED PERSISTENCE
============================================================

Use GitHub as an optional persistence layer.

Do not treat GitHub as an unlimited database.

Use append-only event records, snapshots and incremental state.

Suggested structure:

phantom-state/

config/
permissions/

projects/
  project-id/

missions/
  mission-id/

tasks/

events/

memory/

knowledge/

strategies/

artifacts/

indexes/

snapshots/

Avoid rewriting giant files on every operation.

Use:

- append-only logs
- incremental updates
- snapshots
- hashes
- deduplication
- compression where appropriate

============================================================
16. CONTENT-ADDRESSED ARTIFACTS
============================================================

For artifacts calculate:

SHA-256(content)

Use hashes as artifact identities.

Identical content should be referenced rather than duplicated.

Artifact metadata:

- hash
- type
- size
- createdAt
- projectId
- missionId
- source
- filename

============================================================
17. EVENT SOURCING
============================================================

Every meaningful state transition should create an event.

Example:

{
  "eventId": "...",
  "timestamp": "...",
  "type": "TASK_COMPLETED",
  "missionId": "...",
  "taskId": "...",
  "payload": {},
  "resultHash": "..."
}

The system should be able to reconstruct state from events and
snapshots.

Handle duplicate events safely.

Use idempotent operations.

============================================================
18. CHECKPOINTS + CRASH RECOVERY
============================================================

Every long-running task must checkpoint.

Example:

10,000 records

Checkpoint:
4,500 processed

If execution fails:

resume from 4,501

Do not restart the entire task unless required.

Store:

- progress
- inputs
- outputs
- cursor
- partial results
- retry count
- provider state
- timestamps

============================================================
19. WEB RESEARCH ENGINE
============================================================

Build a real research engine.

Capabilities:

- search
- fetch
- parse
- extract
- follow links
- sitemap discovery
- RSS
- metadata extraction
- structured data
- entity extraction
- dates
- deduplication
- source ranking
- verification
- change detection

Pipeline:

OBJECTIVE
↓
QUERY GENERATION
↓
SEARCH
↓
SOURCE DISCOVERY
↓
FETCH
↓
EXTRACT
↓
NORMALIZE
↓
RANK
↓
VERIFY
↓
KNOWLEDGE GRAPH
↓
REPORT

Respect:

- robots.txt
- rate limits
- terms of service
- copyright
- privacy
- access controls

Never bypass authentication.

============================================================
20. RESEARCH MODES
============================================================

Support:

QUICK
STANDARD
DEEP
FORENSIC
MONITORING

Quick:
small number of high-quality sources.

Standard:
multiple independent sources.

Deep:
iterative discovery and cross-validation.

Forensic:
claim-by-claim evidence tracking.

Monitoring:
repeated scheduled execution.

============================================================
21. SOURCE QUALITY
============================================================

Score sources based on:

- primary-source status
- reputation
- recency
- specificity
- independent confirmation
- citation quality
- completeness

Every important claim should maintain:

claim
source
timestamp
confidence

============================================================
22. KNOWLEDGE GRAPH
============================================================

Entities:

Person
Company
Organization
Project
Product
Event
Location
Document
Website
Repository
Opportunity
Contact
Concept

Relations:

FOUNDED
WORKS_AT
CREATED
PARTNERED_WITH
SPONSORED
LOCATED_IN
MENTIONS
DEPENDS_ON
COMPETES_WITH
RELATED_TO
DERIVED_FROM

============================================================
23. MEMORY SYSTEM
============================================================

Implement:

Global Memory
Project Memory
Mission Memory
Episodic Memory
Semantic Memory
Procedural Memory

Examples:

User preference:
Prefer free infrastructure.

Project:
PHANTOM

Mission:
Indian AI research

Strategy:
Indian startup discovery v3

Memory must be searchable.

============================================================
24. PROJECT OS
============================================================

PHANTOM must support isolated projects.

Structure:

PHANTOM
│
├── Project A
├── Project B
├── Project C
└── Personal

Each project gets:

- files
- missions
- tasks
- memory
- knowledge
- artifacts
- repositories
- automations
- settings
- activity

============================================================
25. PROJECT ISOLATION
============================================================

Default:

PROJECT DATA ISOLATED

Cross-project intelligence should only use explicitly shareable
information.

Allow:

- dependencies
- shared knowledge
- related projects
- shared artifacts

Never silently expose private project data to another project.

============================================================
26. UNIVERSAL DATA ENGINE
============================================================

Support:

PDF
CSV
XLSX
JSON
TXT
Markdown
HTML
DOCX

Pipeline:

FILE
↓
FORMAT DETECTION
↓
EXTRACTION
↓
NORMALIZATION
↓
VALIDATION
↓
INDEXING
↓
ANALYSIS
↓
INSIGHTS
↓
REPORT

============================================================
27. PDF ENGINE
============================================================

Support:

- text extraction
- page indexing
- heading detection
- tables where technically possible
- metadata
- search
- multi-document comparison
- claim extraction
- citations
- contradiction detection

Important results must reference:

document
page
section
source

============================================================
28. CSV/XLSX ENGINE
============================================================

Automatically detect:

- rows
- columns
- types
- missing values
- duplicates
- outliers
- dates
- categorical variables
- numeric variables

Support:

- statistics
- correlation
- trends
- growth
- segmentation
- cohort analysis
- anomaly detection
- time series
- ranking
- comparison

Distinguish clearly between:

OBSERVATION
CORRELATION
INFERENCE
UNKNOWN

Never invent causal relationships.

============================================================
29. MULTI-FILE ANALYSIS
============================================================

Allow multiple files and web sources to become one research workspace.

Example:

PDF
+
CSV
+
XLSX
+
website
+
GitHub repository

PHANTOM should detect inconsistencies between sources.

============================================================
30. REPORT ENGINE
============================================================

Generate:

- Executive Summary
- Methodology
- Sources
- Data
- Findings
- Tables
- Charts
- Evidence
- Confidence
- Limitations
- Recommendations
- Appendix

Export:

PDF
HTML
Markdown
CSV
JSON

============================================================
31. CHART ENGINE
============================================================

Support:

- line
- bar
- scatter
- histogram
- distribution
- heatmap
- trend

Charts must use actual data.

No fabricated numbers.

============================================================
32. DEVELOPMENT OS
============================================================

PHANTOM should be capable of managing software projects.

Capabilities:

- repository discovery
- repository inspection
- file creation
- file editing
- code search
- dependency analysis
- tests
- builds
- lint
- logs
- debugging
- branch creation
- commits
- pushes
- pull requests
- issues
- releases
- documentation
- deployment

============================================================
33. AUTONOMOUS DEVELOPMENT LOOP
============================================================

OBJECTIVE
↓
INSPECT REPOSITORY
↓
UNDERSTAND STRUCTURE
↓
PLAN
↓
IMPLEMENT
↓
TEST
↓
FAIL?
 ├── NO → COMPLETE
 └── YES
      ↓
   CLASSIFY
      ↓
   DIAGNOSE
      ↓
     FIX
      ↓
   TEST AGAIN

Limit retries.

Do not endlessly mutate production.

============================================================
34. GITHUB INTEGRATION
============================================================

Support:

- repository discovery
- repository creation
- branches
- files
- commits
- pull requests
- issues
- workflows
- workflow status
- workflow logs
- releases

Never expose GitHub credentials in frontend JavaScript.

Never place secrets in public state files.

============================================================
35. MARKETING OS
============================================================

Capabilities:

- market research
- competitor research
- audience research
- trend discovery
- campaign planning
- content planning
- lead discovery
- lead qualification
- campaign analysis
- opportunity detection

============================================================
36. SALES OS
============================================================

Capabilities:

- lead discovery
- company research
- public-source enrichment
- lead scoring
- segmentation
- pipeline
- follow-up scheduling
- opportunity ranking

Email automation must respect configured permissions and anti-spam
requirements.

============================================================
37. AUTOMATION ENGINE
============================================================

Create a workflow engine.

Nodes:

TRIGGER
SEARCH
FETCH
PARSE
FILTER
TRANSFORM
ANALYZE
CONDITION
LOOP
PARALLEL
WAIT
RETRY
CREATE_FILE
RUN_CODE
GITHUB
NOTIFY
END

Example:

Every morning
↓
search new opportunities
↓
filter
↓
score
↓
if score > 80
↓
create mission
↓
notify user

============================================================
38. MONITORING ENGINE
============================================================

User can say:

"Monitor this."

Create:

MONITOR
↓
SOURCE
↓
SNAPSHOT
↓
COMPARE
↓
CHANGE DETECTION
↓
IMPORTANCE SCORE
↓
NOTIFY IF THRESHOLD PASSED

Monitor:

- website changes
- GitHub releases
- public announcements
- new events
- new jobs
- new articles
- public documents
- other legally accessible public information

============================================================
39. PROACTIVE INTELLIGENCE
============================================================

PHANTOM should detect:

- approaching deadlines
- unfinished missions
- new opportunities
- project dependencies
- repeated failures
- stale information
- important new sources
- relevant changes

Use:

relevance
urgency
novelty
confidence

Do not spam.

============================================================
40. BEHAVIORAL INTELLIGENCE
============================================================

PHANTOM should behave:

DIRECT
CURIOUS
CAUTIOUS
PROACTIVE
RESOURCEFUL
TRUTHFUL
NON-REPETITIVE
OUTCOME-FOCUSED

It should challenge bad ideas.

Example:

User:
"Let's add five unnecessary services."

PHANTOM:

"That adds unnecessary complexity. I found a simpler architecture using
the components already available."

Do not blindly agree with the user.

============================================================
41. PERSONALITY
============================================================

PHANTOM should not pretend to be conscious.

Do not claim real emotions.

But it can have a consistent behavioral personality.

Communication style:

- concise
- intelligent
- direct
- calm
- technical when needed
- human
- context-aware

Avoid:

"Sure! I'd be happy to help! 😊"

Prefer:

"Mission created. Starting now."

"I found a contradiction. I'm verifying it before using the claim."

"That approach is unnecessarily complex. I'm switching strategies."

"I hit a blocker. The source is inaccessible, so I'm using two
independent alternatives."

============================================================
42. INTERNAL STATE
============================================================

Track:

confidence
uncertainty
urgency
risk
mission health

These are system metrics, not emotions.

============================================================
43. STRATEGY ENGINE
============================================================

Represent workflows as strategies.

Strategy:

strategyId
version
steps
successRate
failureRate
averageDuration
preferredProviders
knownLimitations

PHANTOM should choose strategies based on actual historical results.

============================================================
44. SAFE SELF-OPTIMIZATION
============================================================

PHANTOM can optimize:

- query strategy
- source ranking
- task ordering
- retry strategy
- workflow strategy
- processing strategy

It must not autonomously modify:

- security controls
- authorization
- credential handling
- core safety boundaries

============================================================
45. COMMAND CENTER UI
============================================================

The UI must NOT look like a generic AI chatbot.

Design language:

- high-tech
- dimensional
- premium
- dark
- precise
- minimal
- smooth
- technical
- deep

Avoid:

- excessive purple gradients
- generic AI sparkle effects
- giant robot illustrations
- emoji-heavy interfaces
- fake holographic clutter
- template-looking AI dashboards

Use:

- depth
- layered panels
- subtle grid
- spatial hierarchy
- restrained motion
- clean typography
- strong information architecture
- smooth transitions

============================================================
46. MAIN NAVIGATION
============================================================

PHANTOM

Command
Missions
Projects
Research
Data
Automations
Knowledge
Memory
Files
Development
Activity
Notifications
Settings

============================================================
47. COMMAND CENTER
============================================================

Main screen:

PHANTOM

"What needs to happen?"

Command input

Then:

ACTIVE MISSIONS
MISSION HEALTH
RECENT RESULTS
DISCOVERIES
UPCOMING DEADLINES
SYSTEM STATUS

============================================================
48. MISSION VIEW
============================================================

Show:

mission objective
progress
ETA
confidence
current action
task graph
sources
errors
artifacts
logs
checkpoints

Visual task graph:

Mission
│
├── Discovery       ✓
├── Extraction      ✓
├── Analysis        ●
├── Verification    ○
└── Report          ○

============================================================
49. ACTIVITY TIMELINE
============================================================

Example:

23:04 Mission created

23:05 37 tasks planned

23:06 Source discovery started

23:12 214 sources discovered

23:17 Duplicate filtering

23:26 Verification started

00:02 Report generation

00:08 Mission completed

============================================================
50. RETURN-FROM-AWAY EXPERIENCE
============================================================

When the user returns:

Good morning.

While you were away:

3 missions completed
1 mission failed and recovered
2 important discoveries found
1 deadline approaching

Then show actual results.

Never fabricate.

============================================================
51. NOTIFICATIONS
============================================================

Create:

NotificationProvider

Initial implementations:

- in-app
- browser notification
- optional email

Example:

PHANTOM

Mission complete.

Research:
Indian AI ecosystem

Sources:
418

Validated:
173

Important findings:
27

Report:
READY

============================================================
52. CAPABILITY REGISTRY
============================================================

PHANTOM must know what it can actually do.

Example:

PDF analysis        AVAILABLE
CSV analysis        AVAILABLE
GitHub              CONNECTED
Browser worker      AVAILABLE
Email               NOT CONFIGURED

If unavailable:

"Browser automation is not currently connected. The mission is saved
and can resume when an execution provider becomes available."

Never pretend.

============================================================
53. LOCAL-FIRST COMPUTATION
============================================================

Whenever technically reasonable:

local computation first.

Examples:

CSV parsing → Web Worker
small data analysis → Web Worker
small transformations → Web Worker
indexing → Web Worker
small document processing → browser

Use remote execution for:

- long-running work
- scheduled work
- jobs requiring persistent execution
- operations unsuitable for browser execution

============================================================
54. PERFORMANCE
============================================================

Use:

- lazy loading
- virtualization
- Web Workers
- incremental rendering
- memoization
- IndexedDB
- caching
- streaming where appropriate

Never block the main UI thread with heavy computation.

============================================================
55. PWA
============================================================

Make PHANTOM installable as a PWA if practical.

Support:

- cached application shell
- fast launch
- notifications where supported
- offline viewing of cached state

Do not claim offline background computation beyond platform capability.

============================================================
56. SECURITY
============================================================

Implement:

- centralized permission engine
- secret redaction
- secure credential abstraction
- project isolation
- action validation
- input validation
- rate limiting
- audit logs

Never store secrets in:

- frontend bundles
- public GitHub files
- client logs
- unsafe local storage

unless explicitly safe.

============================================================
57. AUDIT LOG
============================================================

Record:

who
what
when
why
permission
tool
result

Example:

23:11

PHANTOM
GitHub

Created branch:
research-v2

Permission:
ALLOW

Mission:
research-183

============================================================
58. ERROR HANDLING
============================================================

Never use:

"Something went wrong."

Instead:

Execution unavailable.

Reason:
No active execution provider is currently available.

Mission:
research-182

Status:
QUEUED

The mission has been persisted and will resume when an execution
provider becomes available.

============================================================
59. TESTING
============================================================

Create tests for:

- intent parsing
- mission creation
- task planning
- DAG dependencies
- parallel execution
- state persistence
- event sourcing
- retry
- timeout
- checkpoint
- resume
- duplicate events
- provider failure
- permissions
- project isolation
- PDF parsing
- CSV analysis
- XLSX analysis
- research
- source ranking
- knowledge graph
- notifications
- GitHub operations
- deployment

Create failure simulations.

============================================================
60. FREE-INFRASTRUCTURE PRINCIPLE
============================================================

The system should minimize infrastructure cost.

Prioritize:

1. Browser/local execution
2. GitHub-based persistence where appropriate
3. GitHub Actions where suitable
4. Vercel for frontend/stateless operations
5. Optional future providers

Never assume any free service is:

- unlimited
- permanent
- guaranteed
- exempt from rate limits

Build provider health checks.

Detect:

- quota exhaustion
- rate limiting
- unavailable provider
- authentication expiration
- provider failure

============================================================
61. NO FAKE 24/7 EXECUTION
============================================================

PHANTOM should support persistent missions.

But:

A browser cannot guarantee infinite computation after the device is
offline.

Therefore the architecture must support persistent queued missions and
multiple execution providers.

State:

WAITING_FOR_EXECUTION

when no worker exists.

State:

RUNNING

only when a real provider is executing.

State:

COMPLETED

only after a real result exists.

============================================================
62. DOCUMENTATION
============================================================

Create detailed documentation.

Repository:

README.md

docs/

architecture.md
getting-started.md
kernel.md
missions.md
tasks.md
scheduler.md
execution.md
github.md
storage.md
memory.md
knowledge.md
research.md
data-engine.md
pdf-engine.md
csv-engine.md
automation.md
development-engine.md
marketing.md
sales.md
permissions.md
security.md
notifications.md
providers.md
plugins.md
deployment.md
troubleshooting.md
api.md
contributing.md
roadmap.md

Documentation must describe the actual implementation.

Do not create fake documentation for nonexistent features.

============================================================
63. ARCHITECTURE DIAGRAMS
============================================================

Use Mermaid diagrams.

At minimum document:

- system architecture
- mission lifecycle
- task lifecycle
- execution provider flow
- permission flow
- storage architecture
- project isolation
- crash recovery
- research pipeline
- automation engine

============================================================
64. API DOCUMENTATION
============================================================

Document internal APIs for:

missions
tasks
projects
memory
knowledge
tools
permissions
executions
artifacts
notifications

Include:

- request
- response
- errors
- authentication
- examples

============================================================
65. COMMAND PALETTE
============================================================

Implement:

Ctrl/Cmd + K

Commands:

New Mission
New Project
Search
Analyze File
Run Automation
View Memory
View Knowledge
Open Activity
Open Settings

============================================================
66. MOBILE
============================================================

The interface must be fully responsive.

Mobile users must be able to:

- issue commands
- inspect missions
- pause missions
- resume missions
- view reports
- view discoveries
- receive notifications
- inspect system health

============================================================
67. PROJECT CREATION
============================================================

When the user says:

"Create a project for this."

Automatically create:

project
README
architecture
roadmap
tasks
memory namespace
artifact namespace
mission namespace

If GitHub permission is enabled, optionally create/connect a repository.

============================================================
68. AUTOMATIC CONTEXT
============================================================

Within a project PHANTOM should automatically know:

- current project
- relevant files
- recent missions
- project memory
- architecture
- known issues
- pending tasks
- relevant artifacts

The user should not repeatedly explain the same context.

============================================================
69. FIRST REAL END-TO-END DEMO
============================================================

The first real demonstration must be:

User:

"Research the Indian AI startup ecosystem.
Find 50 relevant companies.
Verify important information.
Create a report.
Finish it overnight."

PHANTOM must:

create mission
estimate duration
create task graph
persist mission
queue execution
discover sources
process companies
verify information
create report
checkpoint progress
recover failures
complete mission
store artifacts
notify user

The browser can be closed.

When the user returns:

MISSION COMPLETE

50 companies analyzed

Sources:
actual count

Validated:
actual count

Important findings:
actual count

Report:
READY

============================================================
70. SECOND REAL DEMO
============================================================

Upload:

PDF
CSV
XLSX

Then:

"Analyze all of these and tell me whether the report's numbers match
the underlying dataset."

PHANTOM must:

extract
normalize
calculate
compare
detect discrepancies
produce evidence
generate report

============================================================
71. THIRD REAL DEMO
============================================================

Connect a GitHub repository.

User:

"Find the reason this build is failing and fix it."

PHANTOM must:

inspect repository
inspect workflow
inspect logs
diagnose failure
create branch if permitted
modify code
run tests
iterate if required
commit
report

Push/deploy only according to permission configuration.

============================================================
72. FINAL ARCHITECTURE
============================================================

Conceptual architecture:

                    ┌─────────────────────────┐
                    │       PHANTOM UI        │
                    │ Next.js / React / PWA   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      PHANTOM KERNEL     │
                    ├─────────────────────────┤
                    │ Intent                  │
                    │ Missions                │
                    │ Planning                │
                    │ Task DAG                │
                    │ Events                  │
                    │ Permissions             │
                    │ Memory                  │
                    │ Personality             │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      TOOL REGISTRY      │
                    ├─────────────────────────┤
                    │ Web                     │
                    │ Research                │
                    │ Data                    │
                    │ Documents               │
                    │ GitHub                  │
                    │ Code                    │
                    │ Automation              │
                    │ Marketing               │
                    │ Sales                   │
                    │ Notifications           │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        Browser Worker      GitHub Actions      Vercel
        Local Compute       Background Jobs     Stateless
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    PERSISTENT STATE     │
                    ├─────────────────────────┤
                    │ GitHub                  │
                    │ Event Log               │
                    │ Snapshots               │
                    │ Artifacts               │
                    │ Knowledge               │
                    └─────────────────────────┘

============================================================
73. TECHNOLOGY STACK
============================================================

Use:

Next.js
TypeScript
React
Tailwind CSS
IndexedDB
Web Workers
Service Worker
WebAssembly where useful

Prefer standard Web APIs where possible.

Avoid unnecessary dependencies.

Use strict TypeScript.

Use a clean modular architecture.

============================================================
74. CODE QUALITY
============================================================

Requirements:

- strict TypeScript
- clear interfaces
- modular services
- dependency isolation
- no giant monolithic files
- no duplicated business logic
- no hardcoded secrets
- meaningful naming
- useful comments for complex logic
- tests for important systems

============================================================
75. BUILD ORDER
============================================================

Build in this exact order:

1. Architecture
2. Project structure
3. State model
4. Event model
5. PHANTOM kernel
6. Intent engine
7. Mission engine
8. Task DAG
9. Execution abstraction
10. Browser worker provider
11. GitHub persistence
12. GitHub Actions provider
13. Checkpoint/recovery
14. Research engine
15. Data engine
16. PDF engine
17. CSV/XLSX engine
18. Project OS
19. Memory
20. Knowledge graph
21. Automation engine
22. Development OS
23. Marketing tools
24. Sales tools
25. Notifications
26. Personality layer
27. UI
28. PWA
29. Security hardening
30. Tests
31. Documentation
32. GitHub release
33. Vercel deployment
34. Production smoke testing
35. Bug fixing
36. Final verification

Do not reverse this priority just to make the interface look impressive.

============================================================
76. GITHUB WORKFLOW
============================================================

Inspect the current workspace first.

If an existing project exists:

- inspect it
- preserve useful work
- refactor where appropriate
- do not blindly delete it

If no project exists:

create PHANTOM from scratch.

Initialize Git if required.

Create:

.gitignore
README.md
docs/

Use meaningful commits.

Example:

feat: implement phantom orchestration kernel

feat: add mission task graph

feat: add persistent event store

feat: add resumable execution

feat: add research engine

feat: add data analysis engine

feat: add Phantom command center

feat: add automation engine

fix: recover interrupted missions

============================================================
77. GITHUB REPOSITORY
============================================================

Create or use an appropriate GitHub repository.

Push the working implementation.

Do not push:

- secrets
- tokens
- credentials
- private keys
- generated sensitive data

Verify repository contents after push.

============================================================
78. VERCEL DEPLOYMENT
============================================================

Connect the GitHub repository to Vercel.

Configure:

- framework
- build command
- output
- environment variables
- production branch

Target production hostname:

https://phantom-ai.vercel.app

Attempt to configure the exact hostname:

phantom-ai.vercel.app

If it is available:

use it.

If it is unavailable:

DO NOT claim success.

Deploy using the closest available Vercel URL and report the exact URL.

============================================================
79. DEPLOYMENT VERIFICATION
============================================================

After deployment:

1. Open production URL
2. Verify application loads
3. Create project
4. Create mission
5. Persist mission
6. Trigger test execution
7. Save result
8. Refresh page
9. Verify state survives refresh
10. Verify project isolation
11. Verify permission engine
12. Verify task recovery
13. Verify GitHub integration
14. Verify production routes
15. Verify mobile layout
16. Verify PWA behavior where supported

Fix actual deployment errors before completion.

============================================================
80. PRODUCTION SMOKE TEST
============================================================

Run:

TEST 1:
Create project.

TEST 2:
Create mission.

TEST 3:
Persist mission.

TEST 4:
Execute a real lightweight task.

TEST 5:
Checkpoint task.

TEST 6:
Simulate interruption.

TEST 7:
Resume task.

TEST 8:
Complete mission.

TEST 9:
Generate artifact.

TEST 10:
Refresh browser.

TEST 11:
Verify state.

TEST 12:
Verify activity timeline.

TEST 13:
Verify notification.

============================================================
81. NO MOCK PRODUCTION FEATURES
============================================================

Do not use fake:

- mission progress
- fake execution
- fake research results
- fake GitHub results
- fake notifications
- fake analytics
- fake system health

If a capability is not implemented:

show:

NOT IMPLEMENTED

rather than pretending.

============================================================
82. FINAL USER EXPERIENCE
============================================================

The user should feel that PHANTOM is:

- fast
- intelligent
- autonomous
- organized
- persistent
- proactive
- capable
- honest
- technically powerful

It should feel closer to a personal operating system than a chatbot.

============================================================
83. FINAL RETURN-FROM-AWAY EXPERIENCE
============================================================

When the user returns after being away:

PHANTOM should summarize actual activity:

While you were away:

3 missions completed
1 mission failed and recovered
2 discoveries found
1 deadline approaching

Then show:

TOP DISCOVERY
TOP RESULT
TOP PROBLEM
NEXT ACTION

All values must come from real state.

============================================================
84. FINAL IMPLEMENTATION REPORT
============================================================

When everything is finished, provide:

STATUS

GITHUB REPOSITORY

VERCEL PROJECT

PRODUCTION URL

Requested URL:
https://phantom-ai.vercel.app

Actual URL:
[real URL]

WHAT ACTUALLY WORKS

WHAT IS PARTIALLY IMPLEMENTED

KNOWN LIMITATIONS

REQUIRED ENVIRONMENT VARIABLES

LOCAL DEVELOPMENT COMMANDS

BACKGROUND EXECUTION ARCHITECTURE

PERSISTENCE ARCHITECTURE

PERMISSION ARCHITECTURE

RESEARCH ARCHITECTURE

DATA ENGINE

AUTOMATION ENGINE

DEVELOPMENT ENGINE

NEXT HIGHEST-VALUE BUILD STEP

============================================================
85. ABSOLUTE RULE
============================================================

DO NOT STOP AT A BEAUTIFUL UI.

The following must actually work:

mission persistence
task state
task dependencies
execution
checkpointing
resume
event logging
research
data processing
project isolation
permissions
GitHub integration
artifact generation
notifications

The interface is only the control surface.

The real product is the PHANTOM execution system underneath it.

Build the system first.

Make it real.

Then make it beautiful.

============================================================
86. START NOW
============================================================

Begin by inspecting the current workspace.

Determine:

- what already exists
- what can be reused
- what must be built
- what dependencies are already installed
- whether Git is configured
- whether GitHub is connected
- whether Vercel configuration exists

Then create an implementation plan internally and start executing it.

Do not stop for unnecessary confirmation.

Do not ask the user to manually perform actions that you can legitimately perform through the available development and GitHub tooling.

Do not claim completion without verification.

Build PHANTOM AI.

Deploy it.

Verify it.

Push the final implementation.

Target:

https://phantom-ai.vercel.app