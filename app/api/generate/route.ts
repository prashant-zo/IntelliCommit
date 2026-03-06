import { NextResponse } from "next/server";

// Advanced, fault-tolerant AI system for commit message generation
// ================================================================

// AI Provider URLs
// HF Inference Providers (new router - replaces deprecated api-inference.huggingface.co)
const HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";
const HUGGING_FACE_MODEL_ORDER = [
  "meta-llama/Llama-3.2-3B-Instruct",   // Free tier friendly
  "google/gemma-2-2b-it",               // Small, cheap
  "Qwen/Qwen2.5-7B-Instruct",           // Good quality
  "mistralai/Mistral-7B-Instruct-v0.3"  // Fallback
];
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const AIML_API_URL = "https://api.aimlapi.com/v1/chat/completions";

// Free/cheap HF models (uses HF token - $0.10 free credits/month)
const FREE_HF_MODELS = [
  "google/gemma-2-2b-it",
  "meta-llama/Llama-3.2-3B-Instruct"
];

// 🧠 INTELLIGENT PROVIDER HEALTH MONITORING
interface ProviderHealth {
  name: string;
  isHealthy: boolean;
  successRate: number;
  avgResponseTime: number;
  lastSuccess: number;
  consecutiveFailures: number;
  priority: number;
}

const providerHealth: Record<string, ProviderHealth> = {
  aiml: { name: 'AIML', isHealthy: true, successRate: 0.95, avgResponseTime: 2500, lastSuccess: Date.now(), consecutiveFailures: 0, priority: 1 },
  gemini: { name: 'Gemini', isHealthy: true, successRate: 0.90, avgResponseTime: 3000, lastSuccess: Date.now(), consecutiveFailures: 0, priority: 2 },
  huggingface: { name: 'HuggingFace', isHealthy: true, successRate: 0.85, avgResponseTime: 5000, lastSuccess: Date.now(), consecutiveFailures: 0, priority: 3 },
  freehf: { name: 'FreeHF', isHealthy: true, successRate: 0.70, avgResponseTime: 4000, lastSuccess: Date.now(), consecutiveFailures: 0, priority: 4 },
  openai: { name: 'OpenAI', isHealthy: true, successRate: 0.95, avgResponseTime: 2000, lastSuccess: Date.now(), consecutiveFailures: 0, priority: 5 },
  local: { name: 'LocalAI', isHealthy: true, successRate: 1.0, avgResponseTime: 100, lastSuccess: Date.now(), consecutiveFailures: 0, priority: 6 }
};

// Cooldowns for providers (e.g., OpenAI/Gemini 429 rate limit)
const providerCooldownUntil: Record<string, number> = {};
const COOLDOWN_429_MS = 5 * 60 * 1000; // 5 minutes

// Diff analysis shape (from analyzeDiff)
type DiffAnalysis = {
  fileName: string;
  fileExtension?: string;
  addedLines?: number;
  removedLines?: number;
  totalChanges?: number;
  fileCount?: number;
  changeType: string;
  confidence?: number;
  complexity?: string;
  patterns?: string[];
};

// 🎯 INTELLIGENT CACHING SYSTEM
const responseCache = new Map<string, { response: string; timestamp: number; analysis: DiffAnalysis }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Configuration
const AIML_TIMEOUT = 8000;
const OPENAI_TIMEOUT = 8000;
const GEMINI_TIMEOUT = 8000;
const HF_TIMEOUT = 20000; // HF can cold-start
const MAX_RETRIES = 2;
const CIRCUIT_BREAKER_THRESHOLD = 3;

export async function POST(req: Request) {
  try {
    const { diff } = await req.json();

    if (!diff) {
      return NextResponse.json(
        { error: "Git diff is required" },
        { status: 400 }
      );
    }

    // 🧠 INTELLIGENT CACHE CHECK
    const cacheKey = generateCacheKey(diff);
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log("🚀 Cache hit - instant response!");
      return NextResponse.json({
        commitMessage: cached.response,
        analysis: cached.analysis,
        provider: "cache",
        cached: true
      });
    }

    // Sanitize and truncate diff
    const redacted = redactSecrets(diff);
    const safeDiff = truncateDiff(redacted, 12000);

    // 🔍 ADVANCED DIFF ANALYSIS
    const analysis = analyzeDiff(safeDiff);
    
    // 🚀 PARALLEL AI EXECUTION WITH SMART ROUTING
    const { result: rawMessage, provider: usedProvider } = await executeIntelligentAIStrategy(safeDiff, analysis);

    // 📤 OUTPUT: API → sanitize. Local → use as-is (already structured, no sanitizer).
    let commitMessage: string;
    let finalAnalysis = analysis;
    if (usedProvider === 'local') {
      commitMessage = rawMessage;
      finalAnalysis = { ...analysis, ...getLocalAnalysis(safeDiff) };
    } else {
      commitMessage = sanitizeCommitMessage(rawMessage, safeDiff);
    }

    // 💾 CACHE THE RESPONSE
    responseCache.set(cacheKey, {
      response: commitMessage,
      timestamp: Date.now(),
      analysis: finalAnalysis
    });

    // 🎯 CLEANUP OLD CACHE ENTRIES
    cleanupCache();

    return NextResponse.json({
      commitMessage,
      analysis: {
        complexity: finalAnalysis.complexity,
        changeType: finalAnalysis.changeType,
        confidence: finalAnalysis.confidence,
        provider: usedProvider,
        fileName: finalAnalysis.fileName,
        totalChanges: finalAnalysis.totalChanges,
        cacheHit: false
      }
    });

  } catch (error) {
    console.error("Advanced system error:", error);
    return NextResponse.json(
      { error: "Failed to generate commit message" },
      { status: 500 }
    );
  }
}

// 🧠 INTELLIGENT AI STRATEGY EXECUTOR
async function executeIntelligentAIStrategy(diff: string, analysis: DiffAnalysis): Promise<{ result: string; provider: string }> {
  // Get healthy providers sorted by priority
  const nowTs = Date.now();
  const healthyProviders = Object.entries(providerHealth)
    .filter(([key, health]) => health.isHealthy && health.consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD && (!providerCooldownUntil[key] || providerCooldownUntil[key] < nowTs))
    .sort(([, a], [, b]) => a.priority - b.priority);

  console.log(`🧠 Intelligent routing: ${healthyProviders.length} healthy providers available`);

  // 🚀 PARALLEL EXECUTION STRATEGY
  const promises: Promise<{ provider: string, result: string }>[] = [];

  // Add AIML if available and healthy (priority 1)
  if (process.env.AIML_API_KEY && providerHealth.aiml.isHealthy) {
    promises.push(executeWithRetry('aiml', () => tryAIML(diff, analysis)));
  }

  // Add Gemini if available and healthy (priority 2)
  if (process.env.GEMINI_API_KEY && providerHealth.gemini.isHealthy) {
    promises.push(executeWithRetry('gemini', () => tryGemini(diff, analysis)));
  }

  // Add Hugging Face if available and healthy
  if (process.env.HUGGING_FACE_TOKEN && providerHealth.huggingface.isHealthy) {
    promises.push(executeWithRetry('huggingface', () => tryHuggingFaceModels(diff, analysis)));
  }

  // Add Free Hugging Face (cheap models, uses HF token - $0.10 free credits/month)
  if (process.env.HUGGING_FACE_TOKEN && providerHealth.freehf.isHealthy) {
    promises.push(executeWithRetry('freehf', () => tryFreeHuggingFace(diff, analysis)));
  }

  // Add OpenAI (after HF), if available and healthy and not cooled down
  if (process.env.OPENAI_API_KEY && providerHealth.openai.isHealthy && (!providerCooldownUntil['openai'] || providerCooldownUntil['openai'] < nowTs)) {
    promises.push(executeWithRetry('openai', () => tryOpenAI(diff, analysis)));
  }

  // 🎯 FIRST SUCCESS WINS (ignore failures)
  const wrapped = promises.map(p => p.then(v => v).catch(() => Promise.reject(null)));
  try {
    // Use Promise.any to resolve on first fulfilled
    const winner = await Promise.any(wrapped);
    updateProviderHealth(winner.provider, true);
    console.log(`✅ ${winner.provider} won the race!`);
    return winner;
  } catch {
    console.log("🏁 All AI providers failed, falling back to intelligent local engine");
  }

  // 🧠 INTELLIGENT LOCAL FALLBACK (Local Pattern-Based Engine)
  return { result: generateLocalPatternBasedCommit(diff), provider: 'local' };
}

// 🔄 INTELLIGENT RETRY WITH CIRCUIT BREAKER
async function executeWithRetry(providerName: string, fn: () => Promise<string>): Promise<{ provider: string, result: string }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const startTime = Date.now();
      const result = await fn();
      const responseTime = Date.now() - startTime;
      
      updateProviderHealth(providerName, true, responseTime);
      return { provider: providerName, result };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${providerName} attempt ${attempt} failed:`, errMsg);

      // 429 rate limit: pause provider for 5 min to avoid hammering
      if (errMsg.includes('429')) {
        providerCooldownUntil[providerName] = Date.now() + COOLDOWN_429_MS;
        console.log(`⏸️ ${providerName} rate limited, cooldown until ${new Date(providerCooldownUntil[providerName]).toLocaleTimeString()}`);
      }

      if (attempt === MAX_RETRIES) {
        updateProviderHealth(providerName, false);
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error(`${providerName} failed after ${MAX_RETRIES} attempts`);
}

// 📊 PROVIDER HEALTH MONITORING
function updateProviderHealth(providerName: string, success: boolean, responseTime?: number) {
  const health = providerHealth[providerName];
  if (!health) return;

  if (success) {
    health.consecutiveFailures = 0;
    health.isHealthy = true;
    health.lastSuccess = Date.now();
    health.successRate = Math.min(1.0, health.successRate + 0.01);
    if (responseTime) {
      health.avgResponseTime = (health.avgResponseTime + responseTime) / 2;
    }
  } else {
    health.consecutiveFailures++;
    health.successRate = Math.max(0.0, health.successRate - 0.05);
    
    if (health.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      health.isHealthy = false;
      console.log(`🚨 Circuit breaker opened for ${providerName}`);
    }
  }
}

// 🧠 Local Pattern-Based Engine (deterministic fallback) - works without any API
function generateLocalPatternBasedCommit(diff: string): string {
  // Use same parse+infer logic for both single and multi-file (accurate classification)
  return generateMultiFileLocalCommit(diff);
}

// 📂 PARSE MULTI-FILE DIFF into per-file chunks
function parseDiffIntoFiles(diff: string): Array<{ fileName: string; addedLines: string[]; removedLines: string[]; content: string }> {
  const chunks = diff.split(/(?=^diff --git )/m).filter(Boolean);
  const files: Array<{ fileName: string; addedLines: string[]; removedLines: string[]; content: string }> = [];
  for (const chunk of chunks) {
    const m = chunk.match(/diff --git a\/([^\s]+)/);
    if (!m) continue;
    const fileName = m[1];
    const added = chunk.split('\n').filter(l => l.startsWith('+')).map(l => l.substring(1));
    const removed = chunk.split('\n').filter(l => l.startsWith('-')).map(l => l.substring(1));
    files.push({ fileName, addedLines: added, removedLines: removed, content: chunk.toLowerCase() });
  }
  return files;
}

// 🎯 Infer change type from file content (order matters - more specific first)
function inferChangeType(content: string, fileName: string, addedLines: string[], removedLines: string[]): string {
  const added = addedLines.join(' ');

  // Component/UI addition: path has "component" + adding const/export with props
  if (/component|components/.test(fileName) && /const\s+\w+\s*=.*\(.*\).*=>|export\s+default/.test(added)) {
    return 'feature';
  }
  // New component: const X = ({ ... }) => or export default X
  if (/const\s+\w+\s*=\s*\(\s*\{[^}]*\}\s*\)\s*=>|export\s+default\s+\w+/.test(added) && addedLines.length > removedLines.length) {
    return 'feature';
  }

  const patterns: Array<[string, RegExp]> = [
    ['bugFix', /\.trim\(\)|\.toLowerCase\(\)|\.toUpperCase\(\)|null|undefined|error|exception|catch|try|fix|bug/i],
    ['security', /password|auth|token|secret|key|encrypt|decrypt|hash|salt|jwt|oauth/i],
    ['performance', /optimize|performance|speed|memory|cache|lazy|memo|debounce|throttle/i],
    ['refactor', /axios|apiClient|restructure|reorganize|replace\s+\w+\s+with/i],
    ['api', /api|endpoint|route|controller|service|fetch|\.get\(|\.post\(/i],
    ['test', /test|spec|describe|it\(|expect|assert/i],
    ['styling', /style|className|class=|color|font|margin|padding|css/i],
    ['config', /package\.json|dependencies|webpack|babel|eslint|tsconfig/i],
    ['database', /sql|query|database|db|migration|schema|table|index/i],
    ['docs', /readme|\.md|doc|comment|\/\//i],
    ['feature', /const\s+\w+\s*=|function\s+\w+|export\s+default|component|interface|class\s+\w+/i],
  ];
  for (const [type, re] of patterns) {
    if (re.test(content)) return type;
  }
  if (addedLines.length > removedLines.length + 3) return 'feature';
  if (removedLines.length > addedLines.length + 3) return 'chore';
  return 'chore';
}

// 🎯 Context-aware description inference from actual code changes
function inferDescription(fileName: string, addedLines: string[], removedLines: string[], changeType: string): string {
  const added = addedLines.join(' ');
  const removed = removedLines.join(' ');
  const baseName = fileName.split('/').pop() || fileName;
  const baseNoExt = baseName.replace(/\.(js|jsx|ts|tsx|vue)$/, '');

  if (changeType === 'bugFix') {
    if (/\.trim\(\)/.test(added)) return `trim input before validation in ${baseName}`;
    if (/validation|validate/.test(added) || /validation|validate/.test(fileName)) return `improve validation in ${baseName}`;
    if (/catch|try|error/.test(added)) return `add error handling in ${baseName}`;
    if (/null|undefined/.test(added)) return `add null/undefined check in ${baseName}`;
    return `fix issue in ${baseName}`;
  }
  if (changeType === 'refactor' || changeType === 'api') {
    if (/axios/.test(removed) && /apiClient|fetch/.test(added)) return `replace axios with apiClient in ${baseName}`;
    if (/import.*from/.test(added) && /import.*from/.test(removed)) return `update imports in ${baseName}`;
    return `refactor ${baseName}`;
  }
  if (changeType === 'feature') {
    const componentMatch = added.match(/const\s+(\w+)\s*=\s*\(|export\s+default\s+(\w+)|class\s+(\w+)\s+extends/);
    const compName = componentMatch ? (componentMatch[1] || componentMatch[2] || componentMatch[3] || baseNoExt) : baseNoExt;
    if (/component/.test(fileName) || /const\s+\w+\s*=.*=>|export\s+default/.test(added)) {
      if (/variant|onClick|children|props|className/.test(added)) return `add ${compName} component with props support`;
      return `add ${compName} component`;
    }
    if (/export\s+(const|function|default|class)/.test(added)) return `add ${baseNoExt}`;
    if (addedLines.length > removedLines.length + 2) return `add functionality to ${baseName}`;
    return `add ${baseNoExt}`;
  }
  if (changeType === 'test') return `add tests for ${baseNoExt}`;
  if (changeType === 'config') return `update config in ${baseName}`;
  if (changeType === 'styling') return `update styling in ${baseName}`;
  if (changeType === 'docs') return `update docs in ${baseName}`;
  if (baseName.endsWith('.txt') && addedLines.length === 1) {
    const line = addedLines[0].trim();
    if (line && line.length < 50) return `add ${line} to ${baseName}`;
  }
  if (removedLines.length > addedLines.length + 2) return `remove code from ${baseName}`;
  return `update ${baseName}`;
}

// 🎯 Build subject line for multi-file (short summary)
function buildMultiFileSubject(fileAnalyses: Array<{ changeType: string; desc: string; baseName?: string }>): string {
  const typeMap: Record<string, string> = { bugFix: 'fix', feature: 'feat', refactor: 'refactor', api: 'refactor', chore: 'chore', test: 'test', config: 'chore', styling: 'style', docs: 'docs' };
  const types = [...new Set(fileAnalyses.map(f => f.changeType))];
  if (types.length === 1) {
    return `${typeMap[types[0]] || 'chore'}: ${fileAnalyses.length} files`;
  }
  const names = fileAnalyses.map(a => a.baseName || a.desc.split(' ').pop() || 'file');
  const subj = `chore: ${names.join(', ')}`;
  return subj.length <= 72 ? subj : `chore: update ${fileAnalyses.length} files`;
}

// Extract analysis metadata from local engine (for response when provider is 'local')
function getLocalAnalysis(diff: string): { changeType: string; fileName: string; confidence: number } {
  const files = parseDiffIntoFiles(diff);
  if (files.length === 0) return { changeType: 'chore', fileName: 'unknown', confidence: 0.8 };
  const f = files[0];
  const changeType = inferChangeType(f.content, f.fileName, f.addedLines, f.removedLines);
  return { changeType, fileName: f.fileName, confidence: 0.9 };
}

// 🎯 Generate powerful multi-file local commit
function generateMultiFileLocalCommit(diff: string): string {
  const files = parseDiffIntoFiles(diff);
  if (files.length === 0) return 'chore: update files';
  if (files.length === 1) {
    const f = files[0];
    const changeType = inferChangeType(f.content, f.fileName, f.addedLines, f.removedLines);
    const desc = inferDescription(f.fileName, f.addedLines, f.removedLines, changeType);
    const typeMap: Record<string, string> = { bugFix: 'fix', feature: 'feat', refactor: 'refactor', api: 'refactor', chore: 'chore', test: 'test', config: 'chore', styling: 'style', docs: 'docs' };
    const type = typeMap[changeType] || 'chore';
    return `${type}: ${desc}`;
  }
  const analyses = files.map(f => {
    const changeType = inferChangeType(f.content, f.fileName, f.addedLines, f.removedLines);
    const desc = inferDescription(f.fileName, f.addedLines, f.removedLines, changeType);
    const baseName = f.fileName.split('/').pop() || f.fileName;
    return { changeType, desc, baseName };
  });
  const subject = buildMultiFileSubject(analyses);
  const bullets = analyses.map(a => `- ${a.desc}`);
  return `${subject}\n\n${bullets.join('\n')}`;
}

// 🔧 UTILITY FUNCTIONS
function generateCacheKey(diff: string): string {
  // Create a hash of the diff for caching
  let hash = 0;
  for (let i = 0; i < diff.length; i++) {
    const char = diff.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `commit_${Math.abs(hash)}`;
}

function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}

// 🔍 ADVANCED DIFF ANALYSIS (Enhanced)
function analyzeDiff(diff: string) {
  const lines = diff.split('\n');
  const addedLines = lines.filter(line => line.startsWith('+')).length;
  const removedLines = lines.filter(line => line.startsWith('-')).length;
  const totalChanges = addedLines + removedLines;
  
  // Extract file information
  const fileMatch = diff.match(/diff --git a\/([^\s]+)/);
  const fileName = fileMatch ? fileMatch[1] : 'unknown';
  const fileExtension = fileName.split('.').pop() || '';
  
  // Analyze content patterns
  const content = diff.toLowerCase();
  const patterns: Record<string, RegExp> = {
    // Bug fixes
    bugFix: /\.trim\(\)|\.toLowerCase\(\)|\.toUpperCase\(\)|null|undefined|error|exception|catch|try|fix|bug/i,
    
    // Security
    security: /password|auth|token|secret|key|encrypt|decrypt|hash|salt|jwt|oauth/i,
    
    // Performance
    performance: /optimize|performance|speed|memory|cache|lazy|memo|debounce|throttle/i,
    
    // Features (prioritize this for component changes)
    feature: /const\s+\w+\s*=|function\s+\w+|export\s+default|component|interface|class\s+\w+|new\s+\w+|add|create|implement/i,
    
    // Refactoring
    refactor: /refactor|clean|optimize|import|require|restructure|reorganize/i,
    
    // Styling
    styling: /style|format|lint|css|className|class=|color|font|margin|padding/i,
    
    // Tests
    test: /test|spec|\.test\.|\.spec\.|describe|it\(|expect|assert/i,
    
    // Documentation
    docs: /doc|readme|comment|\/\/|\/\*|md|\.md/i,
    
    // Configuration
    config: /config|package\.json|dependencies|webpack|babel|eslint|tsconfig/i,
    
    // Database (more specific patterns)
    database: /sql|query|database|db|migration|schema|table|index|select|insert|update|delete/i,
    
    // API
    api: /api|endpoint|route|controller|service|fetch|axios|http/i
  };
  
  // Determine change type and complexity
  let changeType = 'chore';
  let confidence = 0.5;
  let complexity = 'low';
  
  // Priority order for pattern matching (higher priority first)
  const priorityOrder = ['feature', 'bugFix', 'security', 'performance', 'refactor', 'styling', 'test', 'docs', 'config', 'database', 'api'];
  
  // Check patterns in priority order
  for (const type of priorityOrder) {
    if (patterns[type] && patterns[type].test(content)) {
      changeType = type;
      confidence = Math.min(0.9, confidence + 0.3);
      break; // Stop at first match to respect priority
    }
  }
  
  // Assess complexity
  if (totalChanges > 50) complexity = 'high';
  else if (totalChanges > 20) complexity = 'medium';
  
  // Multi-file changes increase complexity
  const fileCount = (diff.match(/diff --git/g) || []).length;
  if (fileCount > 1) complexity = 'high';
  
  return {
    fileName,
    fileExtension,
    addedLines,
    removedLines,
    totalChanges,
    fileCount,
    changeType,
    confidence,
    complexity,
    patterns: Object.keys(patterns).filter(p => patterns[p].test(content))
  };
}

// Shared prompt: concise, git-standard output (good for GitHub/git)
function buildCommitPrompt(diff: string, analysis: DiffAnalysis): string {
  const multi = (analysis.fileCount ?? 1) > 1;
  const multiNote = multi
    ? `\nIMPORTANT: ${analysis.fileCount ?? 0} files changed. Use this EXACT format:
Subject line (max 50 chars, short summary)
(blank line)
- First file: what changed
- Second file: what changed
- etc. - one bullet per file, cover ALL files
\n`
    : '';
  return `Generate a git commit message for this diff.
${multiNote}
File(s): ${analysis.fileName}${multi ? ` (${analysis.fileCount ?? 0} files)` : ''}

Diff:
${diff}

Rules:
- Conventional: type: description (feat, fix, refactor, chore)
- Subject max 50 chars. Use imperative. Multi-file: short subject, then bullets
- Output ONLY the message. No preamble, no backticks.`;
}

function getMaxTokens(analysis: DiffAnalysis): number {
  return (analysis.fileCount ?? 1) > 1 ? 220 : 100;
}

// AI Provider Functions (Enhanced with better error handling)
async function tryOpenAI(diff: string, analysis: DiffAnalysis): Promise<string> {
  const prompt = buildCommitPrompt(diff, analysis);

  const response = await fetchWithTimeout(OPENAI_API_URL, OPENAI_TIMEOUT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: getMaxTokens(analysis),
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  
  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

async function tryAIML(diff: string, analysis: DiffAnalysis): Promise<string> {
  const prompt = buildCommitPrompt(diff, analysis);

  const response = await fetchWithTimeout(AIML_API_URL, AIML_TIMEOUT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemma-3-4b-it", // Free tier on AIML
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: getMaxTokens(analysis),
      temperature: 0.5
    }),
  });

  if (!response.ok) {
    throw new Error(`AIML API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  
  if (!content) {
    throw new Error('No content in AIML response');
  }

  return content;
}

async function tryGemini(diff: string, analysis: DiffAnalysis): Promise<string> {
  const prompt = buildCommitPrompt(diff, analysis);

  const response = await fetchWithTimeout(GEMINI_API_URL, GEMINI_TIMEOUT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': process.env.GEMINI_API_KEY!,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: getMaxTokens(analysis),
        temperature: 0.6,
      }
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  
  const data = await response.json();
  // Join ALL parts (Gemini can split response; 2.5-flash also has truncation bug)
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const fullText = parts.map((p: { text?: string }) => p.text || '').join('').trim();
  return fullText || '';
}

// HF Router - cheap models (uses fewer credits from $0.10/month free tier)
async function tryFreeHuggingFace(diff: string, analysis: DiffAnalysis): Promise<string> {
  const prompt = buildCommitPrompt(diff, analysis);

  for (const model of FREE_HF_MODELS) {
    try {
      const response = await fetchWithTimeout(HF_ROUTER_URL, HF_TIMEOUT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: getMaxTokens(analysis),
          temperature: 0.6,
        }),
      });
      if (!response.ok) continue;
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim() || '';
      if (text.length > 10) return text;
    } catch { continue; }
  }
  throw new Error('All free HF models failed');
}

// HF Inference Providers (router.huggingface.co) - OpenAI-compatible chat completions
async function tryHuggingFaceModels(diff: string, analysis: DiffAnalysis): Promise<string> {
  const prompt = buildCommitPrompt(diff, analysis);

  let lastError: Error | null = null;
  for (const model of HUGGING_FACE_MODEL_ORDER) {
    try {
      const response = await fetchWithTimeout(HF_ROUTER_URL, HF_TIMEOUT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: getMaxTokens(analysis),
          temperature: 0.6,
        }),
      });
      if (!response.ok) {
        lastError = new Error(`HF ${model} error: ${response.status}`);
        continue;
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim() || '';
      if (text) return text;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      continue;
    }
  }
  throw lastError || new Error('All Hugging Face models failed');
}

// Utility function for timeout
function fetchWithTimeout(url: string, timeout: number, options: RequestInit): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// Basic utilities: truncation and secret redaction
function truncateDiff(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  return input.slice(0, maxChars);
}

function redactSecrets(input: string): string {
  // Redact common secrets/tokens/passwords
  let out = input;
  const patterns: RegExp[] = [
    /(api|secret|password|token|key)\s*[:=]\s*["']?[A-Za-z0-9_\-\.]{16,}["']?/gi,
    /(Bearer)\s+[A-Za-z0-9\-_.]{16,}/gi
  ];
  for (const re of patterns) {
    out = out.replace(re, '[REDACTED]');
  }
  return out;
}

// Strip preamble/meta lines (e.g. "This commit message follows...", "Type: feat", "Subject: ...")
function isMetaLine(line: string): boolean {
  const t = line.toLowerCase();
  return (
    /^this commit message|^type:\s*(feat|fix|refactor|etc)/i.test(t) ||
    /^subject:|^description:|^body:/i.test(t) ||
    /conventional (guidelines|commit|format)/i.test(t) ||
    /^(imperative|within the \d+ char limit|a short description)/i.test(t) ||
    /^rules?:|^output only|^no preamble/i.test(t)
  );
}

// Sanitize AI output: extract clean commit message (concise, no preamble/backticks)
function sanitizeCommitMessage(raw: string, diff?: string): string {
  if (!raw?.trim()) return raw || '';
  const s = raw
    .replace(/```\w*\n?/g, '')
    .replace(/```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
  // Strip leading preamble before conventional line
  const conventionalMatch = s.match(/(feat|fix|refactor|chore|style|test|docs|perf|ci|build)(\([^)]*\))?!?:\s*[^\n]+/i);
  if (conventionalMatch) {
    const subject = conventionalMatch[0].trim();
    const rest = s.slice(s.indexOf(subject) + subject.length).trim();
    const bodyLines = rest.split(/\r?\n/).map(l => l.replace(/^[-*]\s*/, '').trim())
      .filter(l => l.length > 2)
      .filter(l => !/^(here|the|commit|body):?\s*$/i.test(l))
      .filter(l => !isMetaLine(l));
    const truncateAtWord = (str: string, max: number) => str.length <= max ? str : (str.slice(0, max).replace(/\s+\S*$/, '') || str.slice(0, max));
    let finalSubject = truncateAtWord(subject, 72);
    // Correct feat→fix when diff shows bug-fix (.trim in validation, null check, etc.)
    if (diff && /^feat:/i.test(finalSubject) && /\.trim\(\)|\.toLowerCase\(\)|\.toUpperCase\(\)|validation|validate|null\s*[=!]|undefined\s*[=!]|catch\s*\(|error\s*handling/i.test(diff)) {
      finalSubject = finalSubject.replace(/^feat:/i, 'fix:');
    }
    if (bodyLines.length) return `${finalSubject}\n\n${bodyLines.slice(0, 5).map(l => truncateAtWord(l, 72)).join('\n')}`;
    return finalSubject;
  }
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const skip = /^(here'?s?\s|here is\s|the commit message|commit message:|body:)\s*$/i;
  const valid = lines.filter(l => !skip.test(l)).map(l => /^[-*]\s/.test(l) ? l.slice(2).trim() : l);
  if (valid.length === 0) return s;
  const truncateAtWord = (str: string, max: number) => {
    if (str.length <= max) return str;
    const cut = str.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  };
  const subject = truncateAtWord(valid[0], 72);
  const body = valid.slice(1, 6).map(l => truncateAtWord(l, 72)).filter(Boolean);
  return body.length ? [subject, '', ...body].join('\n') : subject;
}