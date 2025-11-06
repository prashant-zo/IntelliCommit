#!/usr/bin/env node

// Advanced API key setup script
// =============================

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
IntelliCommit - Advanced, Fault-Tolerant AI System
==================================================

This script helps you configure API keys. The system is designed to be cost-efficient
and resilient, with free options and a deterministic local fallback.

FREE OPTIONS:
• Google Gemini (FREE - Recommended)
• Free Hugging Face Models (No key needed)
• Local Pattern-Based Engine (Always works offline)

PAID OPTIONS (Optional):
• OpenAI (High quality)
• Hugging Face Pro (More models)

Let's get you set up.
`);

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupAPIKeys() {
  const envPath = path.join(__dirname, '.env.local');
  let envContent = `# Advanced, Fault-Tolerant AI System - API Configuration
# ==================================================

# Google Gemini API Token (FREE - Recommended!)
# Get your token from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Hugging Face API Token (FREE - Optional for better models)
# Get your token from: https://huggingface.co/settings/tokens
HUGGING_FACE_TOKEN=your_hugging_face_token_here

# OpenAI API Token (PAID - Best quality but costs money)
# Get your token from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# System features:
# 1. Parallel AI execution (fastest response wins)
# 2. Intelligent caching (instant repeat responses)
# 3. Health monitoring (automatic failover)
# 4. Circuit breakers (self-healing system)
# 5. Local Pattern-Based Engine (deterministic, offline)

# Instructions:
# 1. At least add your FREE Gemini API key for best results
# 2. The system will automatically use the best available provider
# 3. Local AI engine always works as final fallback
# 4. Restart dev server after adding keys: npm run dev
`;

  console.log('\n🔑 Let\'s set up your API keys...\n');

  // Ask for Gemini API key (FREE)
  const geminiKey = await askQuestion('📧 Enter your FREE Gemini API key (or press Enter to skip): ');
  if (geminiKey.trim()) {
    envContent = envContent.replace('your_gemini_api_key_here', geminiKey.trim());
    console.log('✅ Gemini API key configured!');
  } else {
    console.log('⚠️  Skipping Gemini (you can add it later)');
  }

  // Ask for Hugging Face API key (FREE)
  const hfKey = await askQuestion('🤗 Enter your FREE Hugging Face API key (or press Enter to skip): ');
  if (hfKey.trim()) {
    envContent = envContent.replace('your_hugging_face_token_here', hfKey.trim());
    console.log('✅ Hugging Face API key configured!');
  } else {
    console.log('⚠️  Skipping Hugging Face (free models will still work)');
  }

  // Ask for OpenAI API key (PAID)
  const openaiKey = await askQuestion('💰 Enter your PAID OpenAI API key (or press Enter to skip): ');
  if (openaiKey.trim()) {
    envContent = envContent.replace('your_openai_api_key_here', openaiKey.trim());
    console.log('✅ OpenAI API key configured!');
  } else {
    console.log('⚠️  Skipping OpenAI (local AI will work great!)');
  }

  // Write the .env.local file
  fs.writeFileSync(envPath, envContent);
  
  console.log(`
Setup complete.
================

Your advanced, fault-tolerant AI system is configured.

Capabilities:
• Parallel AI execution (fastest wins)
• Intelligent caching (instant responses)
• Health monitoring (auto-failover)
• Circuit breakers (self-healing)
• Local Pattern-Based Engine (always works)

Next steps:
1. Restart your dev server: npm run dev
2. Test with any git diff
3. Enjoy lightning-fast commit messages!

🔗 GET FREE API KEYS:
• Gemini: https://makersuite.google.com/app/apikey
• Hugging Face: https://huggingface.co/settings/tokens

The system automatically selects the best available provider for this use case.
`);

  rl.close();
}

setupAPIKeys().catch(console.error);
