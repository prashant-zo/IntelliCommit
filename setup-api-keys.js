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

FREE OPTIONS (all work with free tier):
• Google Gemini (FREE - Recommended, unlimited)
• Hugging Face (FREE $0.10/month credits - router API)
• AIML API (FREE - 10 req/hr on Gemma 3)
• Local Pattern-Based Engine (Always works offline)

PAID OPTIONS (Optional):
• OpenAI (best quality, has free tier limits)

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

# Google Gemini (FREE - Recommended!)
# https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Hugging Face (FREE $0.10/month - router.huggingface.co)
# Token needs "Inference Providers" permission: https://huggingface.co/settings/tokens
HUGGING_FACE_TOKEN=your_hugging_face_token_here

# AIML API (FREE - 10 req/hr on Gemma 3)
# https://aimlapi.com - sign up for free tier
AIML_API_KEY=your_aiml_api_key_here

# OpenAI (optional, has free tier limits)
# https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Instructions:
# 1. Add at least Gemini (free) for best results
# 2. HF + AIML = more free options
# 3. Local engine always works as fallback
# 4. Restart after adding keys: npm run dev
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
  const hfKey = await askQuestion('🤗 Enter your Hugging Face token (free $0.10/mo credits, or Enter to skip): ');
  if (hfKey.trim()) {
    envContent = envContent.replace('your_hugging_face_token_here', hfKey.trim());
    console.log('✅ Hugging Face configured!');
  } else {
    console.log('⚠️  Skipping Hugging Face');
  }

  // Ask for AIML API key (FREE)
  const aimlKey = await askQuestion('🔮 Enter your AIML API key (free 10 req/hr, or Enter to skip): ');
  if (aimlKey.trim()) {
    envContent = envContent.replace('your_aiml_api_key_here', aimlKey.trim());
    console.log('✅ AIML API configured!');
  } else {
    console.log('⚠️  Skipping AIML');
  }

  // Ask for OpenAI API key (optional)
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
• Hugging Face: https://huggingface.co/settings/tokens (fine-grained, enable "Inference Providers")
• AIML: https://aimlapi.com (free tier: Gemma 3)

All providers run in parallel - fastest response wins!
`);

  rl.close();
}

setupAPIKeys().catch(console.error);
