import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class ChatBotScreen extends StatefulWidget {
  const ChatBotScreen({super.key});

  @override
  State<ChatBotScreen> createState() => _ChatBotScreenState();
}

class _ChatBotScreenState extends State<ChatBotScreen> {
  final TextEditingController _controller = TextEditingController();
  List<Map<String, String>> messages = [];
  bool _isLoading = false;

  final String apiKey = "AIzaSyB9U9fGkupQD1t-YW2_S91_NzKWFFXdOjY";

  Future<String> sendMessageToGemini(String userMessage) async {
    const String apiUrl =
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

    try {
      final response = await http.post(
        Uri.parse("$apiUrl?key=$apiKey"),
        headers: {"Content-Type": "application/json"},
        body: json.encode({
          "contents": [
            {
              "role": "user",
              "parts": [
                {
                  "text":
                      "You are ARTICUNO, a healthcare assistant for rural areas. "
                          "Reply in a clear, natural way. Keep answers concise. "
                          "Do not use bold, italics, special symbols (*, #, _, backticks), or code formatting. "
                          "Focus on health-related queries, disease symptoms, precautions, and remedies. "
                          "You can use bullet points where needed."
                },
                {"text": userMessage}
              ]
            }
          ],
          "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 150,
            "topP": 0.9
          }
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data["candidates"][0]["content"]["parts"][0]["text"] ??
            "No response";
      } else {
        return "Error: ${response.statusCode}";
      }
    } catch (e) {
      return "Error connecting to server: $e";
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 4,
        centerTitle: true,
        title: const Text(
          "ARTICUNO Chat",
          style: TextStyle(
            color: Color(0xFF26A69A),
            fontSize: 24,
            fontWeight: FontWeight.bold,
            shadows: [
              Shadow(
                blurRadius: 15.0,
                color: Color(0xFF26A69A),
                offset: Offset(0, 0),
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.health_and_safety,
                            size: 80, color: Colors.teal.withOpacity(0.3)),
                        const SizedBox(height: 16),
                        Text(
                          "Ask ARTICUNO about your health",
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];

                      if (msg["type"] == "text_user") {
                        return Align(
                          alignment: Alignment.centerRight,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF26A69A).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(msg["content"]!,
                                style: const TextStyle(color: Colors.white)),
                          ),
                        );
                      } else if (msg["type"] == "text_bot") {
                        return Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(msg["content"]!,
                                style: const TextStyle(color: Colors.white70)),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: CircularProgressIndicator(color: Colors.teal),
            ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.grey[900],
            border: const Border(
              top: BorderSide(color: Colors.white24, width: 1),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: "Describe your symptoms...",
                    hintStyle: const TextStyle(color: Colors.white54),
                    filled: true,
                    fillColor: Colors.black,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.send, color: Color(0xFF26A69A)),
                onPressed: () async {
                  if (_controller.text.trim().isNotEmpty) {
                    final userMessage = _controller.text.trim();

                    setState(() {
                      messages.add(
                          {"type": "text_user", "content": userMessage});
                      _isLoading = true;
                    });

                    _controller.clear();

                    final botReply = await sendMessageToGemini(userMessage);

                    setState(() {
                      messages
                          .add({"type": "text_bot", "content": botReply});
                      _isLoading = false;
                    });
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
