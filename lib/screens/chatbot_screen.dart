import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import '../data/offline_disease_db.dart';

class ChatBotScreen extends StatefulWidget {
  const ChatBotScreen({super.key});

  @override
  State<ChatBotScreen> createState() => _ChatBotScreenState();
}

class _ChatBotScreenState extends State<ChatBotScreen>
    with TickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  // Each message: { "type": "text_user"|"text_bot", "content": "...", "isTyping": bool }
  List<Map<String, dynamic>> messages = [];

  bool _isLoading = false;
  bool _offlineMode = false; // ← Toggle for offline mode

  // Typewriter state
  Timer? _typeTimer;
  String _typingBuffer = '';
  int _typingIndex = 0;
  bool _isTyping = false;

  final String apiKey = "AIzaSyB9U9fGkupQD1t-YW2_S91_NzKWFFXdOjY";

  // ─── Online: Gemini API ──────────────────────────────────────────────────
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
                      "You can use bullet points where needed.",
                },
                {"text": userMessage},
              ],
            },
          ],
          "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 200,
            "topP": 0.9,
          },
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
      return "Unable to connect. Try Offline Mode.";
    }
  }

  // ─── Offline: local disease DB lookup ───────────────────────────────────
  String queryOfflineDB(String userMessage) {
    final disease = findDiseaseByQuery(userMessage);
    if (disease != null) {
      return formatDiseaseResponse(disease);
    }
    return "I couldn't find information about that in offline mode.\n"
        "For internet-based answers, switch to Online Mode.";
  }

  // ─── Typewriter animation ────────────────────────────────────────────────
  void _typewriterReveal(String fullText) {
    _isTyping = true;
    _typingBuffer = '';
    _typingIndex = 0;

    // Add a bot message entry that will be updated character by character
    setState(() {
      messages.add({"type": "text_bot", "content": "", "isTyping": true});
    });

    final int botIndex = messages.length - 1;

    _typeTimer?.cancel();
    _typeTimer = Timer.periodic(const Duration(milliseconds: 50), (timer) {
      if (_typingIndex < fullText.length) {
        _typingBuffer += fullText[_typingIndex];
        _typingIndex++;
        setState(() {
          messages[botIndex]["content"] = _typingBuffer;
        });
        _scrollToBottom();
      } else {
        timer.cancel();
        setState(() {
          messages[botIndex]["isTyping"] = false;
          _isTyping = false;
          _isLoading = false;
        });
      }
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 100),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ─── Send handler ────────────────────────────────────────────────────────
  Future<void> _handleSend() async {
    final userMessage = _controller.text.trim();
    if (userMessage.isEmpty || _isLoading || _isTyping) return;

    setState(() {
      messages.add({
        "type": "text_user",
        "content": userMessage,
        "isTyping": false,
      });
      _isLoading = true;
    });
    _controller.clear();
    _scrollToBottom();

    // Run the fetch + mandatory 7-second loading timer in parallel.
    // Response only shows after BOTH complete (whichever takes longer).
    final results = await Future.wait([
      _offlineMode
          ? Future.value(queryOfflineDB(userMessage))
          : sendMessageToGemini(userMessage),
      Future.delayed(const Duration(seconds: 7), () => ''), // 7s minimum wait
    ]);

    final botReply = results[0]; // first result is always the actual reply
    _typewriterReveal(botReply);
  }

  @override
  void dispose() {
    _typeTimer?.cancel();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ─── Mode badge ─────────────────────────────────────────────────────────
  Widget _modeBadge() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _offlineMode
            ? Colors.orange.withOpacity(0.15)
            : Colors.teal.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _offlineMode ? Colors.orange : const Color(0xFF26A69A),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _offlineMode ? Icons.wifi_off : Icons.wifi,
            size: 13,
            color: _offlineMode ? Colors.orange : const Color(0xFF26A69A),
          ),
          const SizedBox(width: 5),
          Text(
            _offlineMode ? "Offline" : "Online",
            style: TextStyle(
              fontSize: 12,
              color: _offlineMode ? Colors.orange : const Color(0xFF26A69A),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  // ─── Offline mode toggle button ──────────────────────────────────────────
  Widget _offlineToggleButton() {
    return GestureDetector(
      onTap: () {
        setState(() => _offlineMode = !_offlineMode);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: _offlineMode
                ? Colors.orange.shade800
                : Colors.teal.shade700,
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            duration: const Duration(seconds: 2),
            content: Row(
              children: [
                Icon(
                  _offlineMode ? Icons.wifi_off : Icons.wifi,
                  color: Colors.white,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  _offlineMode
                      ? "Offline Mode ON — using local disease database"
                      : "Online Mode — using ARTICUNO AI",
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                ),
              ],
            ),
          ),
        );
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: _offlineMode
                ? [Colors.orange.shade800, Colors.deepOrange.shade700]
                : [const Color(0xFF1A6B62), const Color(0xFF26A69A)],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: (_offlineMode ? Colors.orange : Colors.teal).withOpacity(
                0.35,
              ),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _offlineMode ? Icons.wifi_off : Icons.wifi,
              size: 15,
              color: Colors.white,
            ),
            const SizedBox(width: 6),
            Text(
              _offlineMode ? "Go Online" : "Go Offline",
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Message bubble ──────────────────────────────────────────────────────
  Widget _buildMessageBubble(Map<String, dynamic> msg) {
    final isUser = msg["type"] == "text_user";
    final content = msg["content"] as String;
    final isTypingNow = msg["isTyping"] as bool? ?? false;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.80,
        ),
        decoration: BoxDecoration(
          color: isUser
              ? const Color(0xFF26A69A).withOpacity(0.18)
              : (_offlineMode
                    ? Colors.orange.withOpacity(0.10)
                    : Colors.green.withOpacity(0.12)),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(14),
            topRight: const Radius.circular(14),
            bottomLeft: Radius.circular(isUser ? 14 : 2),
            bottomRight: Radius.circular(isUser ? 2 : 14),
          ),
          border: Border.all(
            color: isUser
                ? const Color(0xFF26A69A).withOpacity(0.25)
                : (_offlineMode
                      ? Colors.orange.withOpacity(0.25)
                      : Colors.teal.withOpacity(0.20)),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              content,
              style: TextStyle(
                color: isUser ? Colors.white : Colors.white70,
                fontSize: 14,
                height: 1.5,
              ),
            ),
            if (isTypingNow) ...[const SizedBox(height: 4), _buildCursor()],
          ],
        ),
      ),
    );
  }

  // Blinking cursor shown during typewriter animation
  Widget _buildCursor() {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      builder: (ctx, value, _) {
        return Opacity(
          opacity: value > 0.5 ? 1.0 : 0.0,
          child: Container(
            width: 2,
            height: 14,
            color: _offlineMode ? Colors.orange : const Color(0xFF26A69A),
          ),
        );
      },
      onEnd: () => setState(() {}), // keeps rebuilding for blink effect
    );
  }

  // ─── Build ───────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 4,
        centerTitle: false,
        title: Row(
          children: [
            const Text(
              "ARTICUNO",
              style: TextStyle(
                color: Color(0xFF26A69A),
                fontSize: 20,
                fontWeight: FontWeight.bold,
                shadows: [
                  Shadow(
                    blurRadius: 12.0,
                    color: Color(0xFF26A69A),
                    offset: Offset(0, 0),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            _modeBadge(),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: _offlineToggleButton(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Offline mode info banner
          if (_offlineMode)
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: double.infinity,
              color: Colors.orange.withOpacity(0.10),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: const [
                  Icon(Icons.info_outline, color: Colors.orange, size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "Offline Mode: search your problem ",
                      style: TextStyle(color: Colors.orange, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

          // Messages list
          Expanded(
            child: messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.health_and_safety,
                          size: 80,
                          color: Colors.teal.withOpacity(0.25),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          "Ask ARTICUNO about your health",
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.45),
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _offlineMode
                              ? "Offline: type a disease name to search"
                              : "Online: powered by Gemini AI",
                          style: TextStyle(
                            color: _offlineMode
                                ? Colors.orange.withOpacity(0.6)
                                : Colors.teal.withOpacity(0.5),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      return _buildMessageBubble(messages[index]);
                    },
                  ),
          ),

          // Loading indicator (only shown while waiting for API, not during typewriter)
          if (_isLoading && !_isTyping)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: _offlineMode
                          ? Colors.orange
                          : const Color(0xFF26A69A),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    _offlineMode
                        ? "Searching disease database..."
                        : "ARTICUNO is thinking...",
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),

      // Bottom input bar
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.grey[900],
            border: const Border(
              top: BorderSide(color: Colors.white12, width: 1),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  onSubmitted: (_) => _handleSend(),
                  decoration: InputDecoration(
                    hintText: _offlineMode
                        ? "Type disease or symptom..."
                        : "Describe your symptoms...",
                    hintStyle: const TextStyle(
                      color: Colors.white38,
                      fontSize: 14,
                    ),
                    filled: true,
                    fillColor: const Color(0xFF111111),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: BorderSide(
                        color: _offlineMode
                            ? Colors.orange.withOpacity(0.30)
                            : Colors.teal.withOpacity(0.20),
                        width: 1,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: BorderSide(
                        color: _offlineMode
                            ? Colors.orange
                            : const Color(0xFF26A69A),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _handleSend,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: _offlineMode
                          ? [Colors.orange.shade700, Colors.deepOrange.shade600]
                          : [const Color(0xFF1A6B62), const Color(0xFF26A69A)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (_offlineMode ? Colors.orange : Colors.teal)
                            .withOpacity(0.4),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.send, color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
