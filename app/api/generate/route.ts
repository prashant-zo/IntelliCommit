import { NextResponse } from "next/server";

// Advanced, fault-tolerant AI system for commit message generation
// ================================================================

// AI Provider URLs
// Primary HF model + fallbacks (token required)
const HUGGING_FACE_MODEL_ORDER = [
  "Qwen/Qwen2.5-7B-Instruct",  // Not gated - should work
  "microsoft/DialoGPT-medium",  // Fallback
  "gpt2"                        // Fallback
];
// Default points to first in the order
const HUGGING_FACE_API_URL = `https://api-inference.huggingface.co/models/${HUGGING_FACE_MODEL_ORDER[0]}`;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const AIML_API_URL = "https://api.aimlapi.com/chat/completions";

// Free Hugging Face Models (No API key required)
const FREE_HF_MODELS = [
  "microsoft/DialoGPT-medium",
  "gpt2",
  "distilgpt2"
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

// Cooldowns for providers (e.g., OpenAI 429)
const providerCooldownUntil: Record<string, number> = {};

// 🎯 INTELLIGENT CACHING SYSTEM
const responseCache = new Map<string, { response: string, timestamp: number, analysis: any }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Configuration
const AIML_TIMEOUT = 8000;
const OPENAI_TIMEOUT = 8000;
const GEMINI_TIMEOUT = 8000;
const HF_TIMEOUT = 20000; // HF can cold-start
const FALLBACK_TO_LOCAL = true;
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
    const { result: commitMessage, provider: usedProvider } = await executeIntelligentAIStrategy(safeDiff, analysis);
    
    // 💾 CACHE THE RESPONSE
    responseCache.set(cacheKey, {
      response: commitMessage,
      timestamp: Date.now(),
      analysis: analysis
    });

    // 🎯 CLEANUP OLD CACHE ENTRIES
    cleanupCache();

    return NextResponse.json({
      commitMessage,
      analysis: {
        complexity: analysis.complexity,
        changeType: analysis.changeType,
        confidence: analysis.confidence,
        provider: usedProvider,
        fileName: analysis.fileName,
        totalChanges: analysis.totalChanges,
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
async function executeIntelligentAIStrategy(diff: string, analysis: any): Promise<{ result: string, provider: string }> {
  // Get healthy providers sorted by priority
  const nowTs = Date.now();
  const healthyProviders = Object.entries(providerHealth)
    .filter(([key, health]) => health.isHealthy && health.consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD && (!providerCooldownUntil[key] || providerCooldownUntil[key] < nowTs))
    .sort(([_, a], [__, b]) => a.priority - b.priority);

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

  // Add Free Hugging Face (always available)
  if (providerHealth.freehf.isHealthy) {
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
  } catch (_) {
    console.log("🏁 All AI providers failed, falling back to intelligent local engine");
  }

  // 🧠 INTELLIGENT LOCAL FALLBACK (Local Pattern-Based Engine)
  return { result: generateLocalPatternBasedCommit(diff, analysis), provider: 'local' };
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
      console.log(`❌ ${providerName} attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
      
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

// 🧠 Local Pattern-Based Engine (deterministic fallback)
function generateLocalPatternBasedCommit(diff: string, analysis: any): string {
  const { changeType, fileName, complexity, patterns } = analysis;
  
  // 🎯 CONTEXT-AWARE COMMIT GENERATION
  const context = analyzeCommitContext(diff, analysis);
  
  // 🧠 INTELLIGENT TEMPLATE SELECTION
  const templates = {
    bugFix: () => generateBugFixCommit(fileName, context),
    security: () => generateSecurityCommit(fileName, context),
    performance: () => generatePerformanceCommit(fileName, context),
    feature: () => generateFeatureCommit(fileName, context),
    refactor: () => generateRefactorCommit(fileName, context),
    styling: () => generateStylingCommit(fileName, context),
    test: () => generateTestCommit(fileName, context),
    docs: () => generateDocsCommit(fileName, context),
    config: () => generateConfigCommit(fileName, context),
    database: () => generateDatabaseCommit(fileName, context),
    api: () => generateApiCommit(fileName, context),
    chore: () => generateChoreCommit(fileName, context)
  };
  
  const generator = templates[changeType as keyof typeof templates] || templates.chore;
  return generator();
}

// 🔍 ADVANCED CONTEXT ANALYSIS
function analyzeCommitContext(diff: string, analysis: any) {
  const lines = diff.split('\n');
  const addedLines = lines.filter(line => line.startsWith('+')).map(line => line.substring(1));
  const removedLines = lines.filter(line => line.startsWith('-')).map(line => line.substring(1));
  
  return {
    addedLines,
    removedLines,
    fileType: analysis.fileExtension,
    complexity: analysis.complexity,
    patterns: analysis.patterns,
    isNewFile: !removedLines.length && addedLines.length > 5,
    isDeletion: !addedLines.length && removedLines.length > 0,
    isModification: addedLines.length > 0 && removedLines.length > 0
  };
}

// 🎯 INTELLIGENT COMMIT GENERATORS
function generateFeatureCommit(fileName: string, context: any): string {
  const isComponent = fileName.includes('component') || context.addedLines.some((line: string) => 
    line.includes('const ') && line.includes('=') && line.includes('{')
  );
  
  if (isComponent) {
    return `feat: implement ${extractComponentName(fileName)} component

- Add reusable component with props support
- Implement interactive functionality
- Enhance user experience with new features`;
  }
  
  return `feat: add new functionality to ${fileName}

- Implement new feature as requested
- Add necessary components and logic
- Enhance user experience`;
}

function generateBugFixCommit(fileName: string, context: any): string {
  const hasValidation = context.addedLines.some((line: string) => 
    line.includes('.trim()') || line.includes('validation') || line.includes('check')
  );
  
  if (hasValidation) {
    return `fix: improve validation in ${fileName}

- Add input sanitization to prevent edge cases
- Handle whitespace and formatting issues
- Improve data validation reliability`;
  }
  
  return `fix: resolve issue in ${fileName}

- Address the problem identified in the code
- Improve error handling and validation
- Ensure proper functionality`;
}

function generateRefactorCommit(fileName: string, context: any): string {
  return `refactor: improve code structure in ${fileName}

- Clean up code organization
- Optimize performance and readability
- Maintain existing functionality`;
}

function generateStylingCommit(fileName: string, context: any): string {
  return `style: update formatting and styling

- Apply consistent code formatting
- Fix linting issues
- Improve code readability`;
}

function generateTestCommit(fileName: string, context: any): string {
  return `test: add test coverage for ${fileName}

- Add comprehensive test cases
- Ensure proper test coverage
- Validate functionality`;
}

function generateDocsCommit(fileName: string, context: any): string {
  return `docs: update documentation

- Improve code documentation
- Add helpful comments and examples
- Update README and guides`;
}

function generateConfigCommit(fileName: string, context: any): string {
  return `chore: update configuration and dependencies

- Update package dependencies
- Modify configuration settings
- Maintain project setup`;
}

function generateDatabaseCommit(fileName: string, context: any): string {
  return `db: update database schema or queries

- Modify database structure or queries
- Improve data handling and storage
- Optimize database performance`;
}

function generateApiCommit(fileName: string, context: any): string {
  return `api: update API endpoints or services

- Modify API functionality
- Improve request/response handling
- Enhance service integration`;
}

function generateSecurityCommit(fileName: string, context: any): string {
  return `security: enhance security in ${fileName}

- Implement security improvements
- Address potential vulnerabilities
- Strengthen authentication/authorization`;
}

function generatePerformanceCommit(fileName: string, context: any): string {
  return `perf: optimize performance in ${fileName}

- Improve code efficiency and speed
- Reduce memory usage and processing time
- Enhance overall application performance`;
}

function generateChoreCommit(fileName: string, context: any): string {
  return `chore: update ${fileName}

- Make necessary changes to improve functionality
- Update code as required
- Maintain project standards`;
}

// 🔧 UTILITY FUNCTIONS
function extractComponentName(fileName: string): string {
  const name = fileName.split('/').pop()?.replace(/\.(js|jsx|ts|tsx)$/, '') || 'component';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

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

// AI Provider Functions (Enhanced with better error handling)
async function tryOpenAI(diff: string, analysis: any): Promise<string> {
  const prompt = `You are an expert programmer. Generate a conventional commit message for this git diff.

File: ${analysis.fileName}
Change Type: ${analysis.changeType}
Complexity: ${analysis.complexity}

Git Diff:
${diff}

Requirements:
1. Use conventional commit format (type: description)
2. Keep subject line under 50 characters
3. Add body explaining what and why
4. Be specific and professional

Commit Message:`;

  const response = await fetchWithTimeout(OPENAI_API_URL, OPENAI_TIMEOUT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  
  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

async function tryAIML(diff: string, analysis: any): Promise<string> {
  const prompt = `You are an expert programmer. Generate a conventional commit message for this git diff.

File: ${analysis.fileName}
Change Type: ${analysis.changeType}
Complexity: ${analysis.complexity}

Git Diff:
${diff}

Requirements:
1. Use conventional commit format (type: description)
2. Keep subject line under 50 characters
3. Add body explaining what and why
4. Be specific and professional

Commit Message:`;

  const response = await fetchWithTimeout(AIML_API_URL, AIML_TIMEOUT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemma-2-2b-it",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
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

async function tryGemini(diff: string, analysis: any): Promise<string> {
  const prompt = `You are an expert programmer. Generate a conventional commit message for this git diff.

File: ${analysis.fileName}
Change Type: ${analysis.changeType}
Complexity: ${analysis.complexity}

Git Diff:
${diff}

Requirements:
1. Use conventional commit format (type: description)
2. Keep subject line under 50 characters
3. Add body explaining what and why
4. Be specific and professional

Commit Message:`;

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
        maxOutputTokens: 150,
        temperature: 0.7,
      }
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function tryFreeHuggingFace(diff: string, analysis: any): Promise<string> {
  // Try different free models
  for (const model of FREE_HF_MODELS) {
    try {
      const prompt = `Generate commit message for: ${diff.substring(0, 500)}`;
      
      const response = await fetchWithTimeout(`https://api-inference.huggingface.co/models/${model}`, HF_TIMEOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedText = (Array.isArray(data) ? data[0]?.generated_text : (data?.generated_text || data?.text))?.trim() || '';
        if (generatedText) {
          // Clean up the response
          const cleaned = generatedText
            .replace(prompt, '')
            .trim()
            .split('\n')[0]; // Take first line
          
          if (cleaned.length > 10) {
            return cleaned;
          }
        }
      }
    } catch (error) {
      // Try next model
      continue;
    }
  }
  
  throw new Error('All free models failed');
}

async function tryHuggingFace(diff: string, analysis: any): Promise<string> {
  const prompt = `Generate a conventional commit message for this git diff:

${diff}

Format: type: short description

Body:
- What changed
- Why it changed

Commit message:`;

  const response = await fetchWithTimeout(HUGGING_FACE_API_URL, HF_TIMEOUT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 150,
        temperature: 0.7,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 403 || response.status === 404) {
      throw new Error(`Hugging Face API error: ${response.status} (model unavailable or access required)`);
    }
    throw new Error(`Hugging Face API error: ${response.status}`);
  }
  
  const data = await response.json();
  const text = (Array.isArray(data) ? data[0]?.generated_text : (data?.generated_text || data?.text))?.trim() || '';
  return text;
}

// Try multiple HF models (token required) in the preferred order
async function tryHuggingFaceModels(diff: string, analysis: any): Promise<string> {
  let lastError: any = null;
  for (const model of HUGGING_FACE_MODEL_ORDER) {
    try {
      const url = `https://api-inference.huggingface.co/models/${model}`;
      const prompt = `Generate a conventional commit message for this git diff:\n\n${diff}\n\nFormat: type: short description\n\nBody:\n- What changed\n- Why it changed\n\nCommit message:`;
      const response = await fetchWithTimeout(url, HF_TIMEOUT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.5,
            return_full_text: false,
          },
        }),
      });
      if (!response.ok) {
        lastError = new Error(`HF ${model} error: ${response.status}`);
        continue;
      }
      const data = await response.json();
      const text = (Array.isArray(data) ? data[0]?.generated_text : (data?.generated_text || data?.text))?.trim() || '';
      if (text) return text;
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  throw lastError || new Error('All Hugging Face models failed');
}

// Utility function for timeout
function fetchWithTimeout(url: string, timeout: number, options: any): Promise<Response> {
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