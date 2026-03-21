async function testChat() {
  console.log("🚀 Starting NLP Test...");
  try {
    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Generate a daily clinical summary report" })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("\n✅ Test Result:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("\n❌ Test Failed:", err.message);
  }
}

testChat();
