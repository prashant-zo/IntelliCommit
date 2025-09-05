"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Sparkles, Copy, Check, ArrowLeft, Wand2, LoaderCircle } from 'lucide-react';
import Link from 'next/link';

export default function DiffPage() {
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [diffInput, setDiffInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!diffInput.trim()) return;

    setIsLoading(true);
    setCommitMessage('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff: diffInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCommitMessage(data.commitMessage);
    } catch (error) {
      console.error("Failed to generate commit message:", error);
      setCommitMessage("Error: Could not generate a commit message. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (commitMessage) {
      await navigator.clipboard.writeText(commitMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-8"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                IntelliCommit
              </span>
            </motion.div>
          </Link>
          
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </motion.button>
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              Generate Your
            </span>
            <br />
            <span className="text-slate-700">Commit Message</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Paste your git diff below and let AI create a professional, conventional commit message for you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Paste your git diff
              </label>
              <textarea
                value={diffInput}
                onChange={(e) => setDiffInput(e.target.value)}
                placeholder="diff --git a/src/utils/validation.js b/src/utils/validation.js&#10;index 1234567..abcdefg 100644&#10;--- a/src/utils/validation.js&#10;+++ b/src/utils/validation.js&#10;@@ -5,7 +5,7 @@ export const validateEmail = (email) => {&#10;   if (!email) return false;&#10;   &#10;   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;&#10;-  return emailRegex.test(email);&#10;+  return emailRegex.test(email.trim());&#10; };&#10;"
                className="w-full h-64 p-4 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={isLoading || !diffInput.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Generate Commit Message</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {commitMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-8 bg-white rounded-2xl shadow-2xl p-8 border border-slate-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <span>Generated Commit Message</span>
                </h2>
                <button
                  onClick={() => setCommitMessage('')}
                  className="text-slate-400 hover:text-slate-600 transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <pre className="whitespace-pre-wrap text-slate-800 font-mono text-sm leading-relaxed">
                  {commitMessage}
                </pre>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
