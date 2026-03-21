import fs from 'fs/promises';
import path from 'path';
import { geminiModel } from "./gemini.js";

const FALLBACK_PATH = path.resolve('fallback_responses.json');

const tryModel = async (modelName, prompt, timeoutMs) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();

  try {
    console.log(`🤖 Attempting ${modelName} (${timeoutMs / 1000}s timeout)...`);
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(id);

    if (res.ok) {
      const data = await res.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ ${modelName} responded in ${duration}s`);
      return { 
        provider: `ollama-${modelName}`, 
        text: data.response 
      };
    }
    throw new Error(`${modelName} error: ${res.status} ${res.statusText}`);
  } catch (err) {
    clearTimeout(id);
    const errorMsg = err.name === 'AbortError' ? `Timeout (${timeoutMs / 1000}s)` : err.message;
    console.error(`❌ ${modelName} failed: ${errorMsg}`);
    return null;
  }
};

export const generateResponse = async (prompt) => {
  const query = prompt.toLowerCase();
  console.log(`📝 Prompt length: ${prompt.length} chars (~${Math.round(prompt.length / 4)} tokens)`);

  // 0. Gemini (Primary)
  try {
    console.log("🤖 Attempting Gemini...");
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    if (text) {
      console.log("✅ Gemini responded successfully");
      return { provider: "gemini", text };
    }
  } catch (err) {
    console.error("❌ Gemini failed:", err.message);
  }
  
  // 1. llama3:latest (Secondary)
  let result = await tryModel("llama3:latest", prompt, 180000);
  if (result) return result;

  // 2. phi3:latest (Secondary)
  result = await tryModel("phi3:latest", prompt, 60000);
  if (result) return result;

  // 3. tinyllama:latest (Tertiary)
  result = await tryModel("tinyllama:latest", prompt, 30000);
  if (result) return result;

  // 🔴 Offline Fallback (FINAL RESORT)
  console.log("⚠️ All models failed, using hardcoded fallback...");
  try {
    const rawData = await fs.readFile(FALLBACK_PATH, 'utf8');
    const fallbacks = JSON.parse(rawData);
    
    let responseText = fallbacks.default;
    
    // Simple keyword matching for better results
    if (query.includes("patient") || query.includes("who")) {
      responseText = fallbacks["who are my patients?"];
    } else if (query.includes("report") || query.includes("summary")) {
      responseText = fallbacks["generate a daily clinical summary report"];
    } else if (query.includes("rahul")) {
      responseText = fallbacks["status of rahul sharma"];
    }

    return {
      provider: "offline-fallback",
      text: responseText
    };
  } catch (fsErr) {
    console.error("❌ Critical: All systems failed including fallback:", fsErr.message);
    return {
      provider: "error",
      text: "System Offline: I am currently unable to reach any AI engine or the local fallback database."
    };
  }
};
