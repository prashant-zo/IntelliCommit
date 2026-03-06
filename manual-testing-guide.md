# Manual Testing Guide for Research Data Collection

## 🧪 How to Collect Experimental Data

### **Step 1: Prepare Test Environment**

1. **Start your development server:**
   ```bash
   cd intellicommit
   npm run dev
   ```

2. **Open browser with Developer Tools:**
   - Chrome/Edge: F12 or Ctrl+Shift+I
   - Go to Network tab
   - Check "Preserve log" to keep requests across page reloads

### **Step 2: Create Test Dataset**

Create 50 different git diffs representing:
- **Feature additions (15)**: New functions, components, API endpoints
- **Bug fixes (12)**: Error handling, validation fixes, null checks
- **Refactoring (8)**: Code restructuring, import changes
- **Documentation (7)**: README updates, comments
- **Configuration (5)**: package.json, build configs
- **Styling (3)**: CSS updates, UI changes

### **Step 3: Test Our System (IntelliCommit)**

For each of the 50 test cases:

1. **Navigate to:** `http://localhost:3000/diff`
2. **Paste the git diff** in the textarea
3. **Click "Generate Commit Message"**
4. **Record in spreadsheet:**
   - Response time (from Network tab)
   - Success/failure
   - Generated message quality
   - Provider used (from response)
   - Whether cached (if shown)

### **Step 4: Create Baseline Implementations**

#### **Baseline A: Single Provider (Gemini Only)**

Create a simple API endpoint that only uses Gemini:

```javascript
// Add to app/api/generate-baseline-a/route.ts
export async function POST(req) {
  const startTime = Date.now();
  const { diff } = await req.json();
  
  try {
    // Only try Gemini with 30s timeout
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate commit message: ${diff}` }] }]
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      commitMessage: data.candidates?.[0]?.content?.parts?.[0]?.text,
      responseTime,
      provider: 'gemini'
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message, responseTime: Date.now() - startTime },
      { status: 500 }
    );
  }
}
```

#### **Baseline B: Sequential Fallback**

```javascript
// Add to app/api/generate-baseline-b/route.ts
export async function POST(req) {
  const startTime = Date.now();
  const { diff } = await req.json();
  
  // Try Gemini first (8s timeout)
  try {
    const response = await fetch(GEMINI_API_URL, {
      // ... Gemini config with 8s timeout
      signal: AbortSignal.timeout(8000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        commitMessage: data.candidates?.[0]?.content?.parts?.[0]?.text,
        responseTime: Date.now() - startTime,
        provider: 'gemini'
      });
    }
  } catch (error) {
    // Continue to Hugging Face fallback
  }
  
  // Try Hugging Face as fallback (20s timeout)
  try {
    const response = await fetch(HUGGING_FACE_API_URL, {
      // ... Hugging Face config with 20s timeout
      signal: AbortSignal.timeout(20000)
    });
    
    const data = await response.json();
    return NextResponse.json({
      commitMessage: data.generated_text,
      responseTime: Date.now() - startTime,
      provider: 'huggingface'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'All providers failed', responseTime: Date.now() - startTime },
      { status: 500 }
    );
  }
}
```

### **Step 5: Test Baselines**

Repeat the same 50 test cases for:
- Baseline A: `http://localhost:3000` (using baseline-a endpoint)
- Baseline B: `http://localhost:3000` (using baseline-b endpoint)

### **Step 6: Data Collection Spreadsheet**

Create a spreadsheet with columns:

| Test # | Diff Type | Our System Time (ms) | Our Success | Our Provider | Baseline A Time | Baseline A Success | Baseline B Time | Baseline B Success |
|--------|-----------|----------------------|-------------|--------------|-----------------|-------------------|-----------------|-------------------|
| 1      | feature   | 3400                 | ✓           | gemini       | 8200            | ✓                 | 12500           | ✓                 |
| 2      | bugfix    | 2800                 | ✓           | aiml         | TIMEOUT         | ✗                 | 25000           | ✓                 |
| ...    | ...       | ...                  | ...         | ...          | ...             | ...               | ...             | ...               |

### **Step 7: Calculate Statistics**

Use this JavaScript code in browser console:

```javascript
// Paste your response times arrays
const ourTimes = [3400, 2800, 3100, ...]; // Your collected data
const baselineATimes = [8200, 15000, 7500, ...];
const baselineBTimes = [12500, 25000, 18000, ...];

function calculateStats(times) {
  const sorted = times.sort((a, b) => a - b);
  const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  
  return {
    mean: Math.round(mean),
    median: Math.round(median),
    p95: Math.round(p95)
  };
}

console.log('Our System:', calculateStats(ourTimes));
console.log('Baseline A:', calculateStats(baselineATimes));
console.log('Baseline B:', calculateStats(baselineBTimes));
```

### **Step 8: Update Research Paper**

Replace all `[TO BE MEASURED]` placeholders with your actual data:

```markdown
| **Success Rate (%)** | 96.0 | 72.0 | 84.0 |
| **Mean Latency (s)** | 3.2 | 9.1 | 7.8 |
| **Median Latency (s)** | 3.1 | 8.2 | 6.9 |
| **P95 Latency (s)** | 4.8 | 15.2 | 18.5 |
| **Cost per Request ($)** | 0.000 | 0.002 | 0.002 |
```

## 📊 Expected Results Pattern

Based on your system design, you should see:

- **Our System**: 3-5 second response times, 95-100% success rate, $0 cost
- **Baseline A**: 8-15 second response times, 70-80% success rate, ~$0.002/request
- **Baseline B**: 6-20 second response times, 80-90% success rate, ~$0.002/request

The parallel racing should consistently outperform both baselines!
