import { geminiModel } from "./gemini.js";
// Built-in fetch will be used

async function testConnectivity() {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  console.log("Testing Gemini...");
  try {
    // List models to see what's available
    try {
      const models = await genAI.listModels();
      console.log("Available models:", JSON.stringify(models, null, 2));
    } catch (e) {
      console.log("Could not list models:", e.message);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent("Hello");
    const response = await result.response;
    console.log("Gemini Success:", response.text());
  } catch (err) {
    console.error("Gemini Error:", err.message);
  }

  console.log("\nTesting Ollama...");
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: "hello",
        stream: false
      })
    });
    const data = await res.json();
    console.log("Ollama Raw Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Ollama Error:", err.message);
  }
}

testConnectivity();
