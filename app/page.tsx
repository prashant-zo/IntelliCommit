"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Sparkles, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [showExamples, setShowExamples] = useState<boolean>(false);

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
          
          <Link href="/diff">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
          
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.h1 
                className="text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  AI-Powered
                </span>
                <br />
                <span className="text-slate-700">Commit Messages</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-slate-600 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Transform your git diffs into professional, conventional commit messages 
                in seconds with the power of artificial intelligence.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/diff">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Try It</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExamples(true)}
                className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 transition-colors"
              >
                View Examples
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="flex space-x-8 pt-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">10K+</div>
                <div className="text-sm text-slate-600">Commits Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">99%</div>
                <div className="text-sm text-slate-600">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">2s</div>
                <div className="text-sm text-slate-600">Average Time</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Visual Elements */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-12 border border-slate-200 text-center">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                  <GitBranch className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">AI-Powered</h3>
                  <p className="text-slate-600">Professional commit messages in seconds</p>
                </div>
                <div className="flex justify-center space-x-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            
            <motion.div
              animate={{ 
                y: [0, 10, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <GitBranch className="w-3 h-3 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Examples Modal */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowExamples(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                    <span>Example Git Diffs</span>
                  </h2>
                  <button
                    onClick={() => setShowExamples(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  {/* Example 1 */}
                  <div className="border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-2">Example 1: Adding a new feature</h3>
                    <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm">
                      <pre className="whitespace-pre-wrap text-slate-800">
{`diff --git a/src/components/Button.js b/src/components/Button.js
index 1234567..abcdefg 100644
--- a/src/components/Button.js
+++ b/src/components/Button.js
@@ -1,5 +1,6 @@
 import React from 'react';
 
+const Button = ({ children, onClick, variant = 'primary' }) => {
   return (
-    <button>Click me</button>
+    <button className={\`btn btn-\${variant}\`} onClick={onClick}>
+      {children}
+    </button>
   );
-}
+};
+
+export default Button;`}
                      </pre>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">Generated Commit:</p>
                      <p className="text-sm text-blue-700 mt-1">feat: add variant prop and onClick handler to Button component</p>
                    </div>
                  </div>

                  {/* Example 2 */}
                  <div className="border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-2">Example 2: Fixing a bug</h3>
                    <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm">
                      <pre className="whitespace-pre-wrap text-slate-800">
{`diff --git a/src/utils/validation.js b/src/utils/validation.js
index 1234567..abcdefg 100644
--- a/src/utils/validation.js
+++ b/src/utils/validation.js
@@ -5,7 +5,7 @@ export const validateEmail = (email) => {
   if (!email) return false;
   
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
-  return emailRegex.test(email);
+  return emailRegex.test(email.trim());
 };
 
 export const validatePassword = (password) => {`}
                      </pre>
                    </div>
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">Generated Commit:</p>
                      <p className="text-sm text-green-700 mt-1">fix: trim email before validation to handle whitespace</p>
                    </div>
                  </div>

                  {/* Example 3 */}
                  <div className="border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-2">Example 3: Refactoring code</h3>
                    <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm">
                      <pre className="whitespace-pre-wrap text-slate-800">
{`diff --git a/src/api/users.js b/src/api/users.js
index 1234567..abcdefg 100644
--- a/src/api/users.js
+++ b/src/api/users.js
@@ -1,10 +1,12 @@
-import axios from 'axios';
+import { apiClient } from '../utils/apiClient';
 
-export const fetchUsers = async () => {
-  const response = await axios.get('/api/users');
-  return response.data;
+export const fetchUsers = async () => {
+  return await apiClient.get('/users');
 };
 
-export const createUser = async (userData) => {
-  const response = await axios.post('/api/users', userData);
-  return response.data;
+export const createUser = async (userData) => {
+  return await apiClient.post('/users', userData);
 };`}
                      </pre>
                    </div>
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-800 font-medium">Generated Commit:</p>
                      <p className="text-sm text-purple-700 mt-1">refactor: replace axios with centralized apiClient in users module</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}