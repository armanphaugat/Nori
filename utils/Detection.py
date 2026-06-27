from groq import Groq
import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from utils.apikeyrotation import get_key

SYSTEM_PROMPT = """You are a binary intent classifier. Output ONLY "1" or "0". No other text.

OUTPUT 1 — genuine information request:
- Questions seeking explanation, definition, or knowledge
- "What is X", "How does X work", "Explain X", "Tell me about X"

OUTPUT 0 — everything else:
- System/bot messages: "processing...", "done", "connected", "disconnected", "Bot restarted"
- Status/debug output: logs, stack traces, error dumps
- Discord/Slack artifacts: mentions (<@123456789>), commands (/cmd), channel refs (#general)
- Acknowledgements: "ok", "got it", "thanks", "sure"
- Random statements with no question intent
- Noise: "query detection successful", "request received"

DECISION RULE: Would a human support agent recognize this as someone asking to learn something? If yes → 1. If no → 0.

EXAMPLES:
"What is Python?" → 1
"Explain binary search." → 1
"Tell me about Docker." → 1
"How does JWT authentication work?" → 1
"<@123456789>" → 0
"<@123456789> query detection successful" → 0
"processing request..." → 0
"Bot restarted successfully." → 0
"done" → 0
"ok" → 0
"/help" → 0
"#general" → 0

OUTPUT ONLY 0 OR 1."""


def detect_question(user_input: str) -> int:
    print(f"Detecting question for input: {user_input}")

    groq_api_key = get_key()
    print(f"Using GROQ API Key: {groq_api_key}")

    client = Groq(api_key=groq_api_key)

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_input},
        ],
        temperature=0,
        max_tokens=1,
    )

    result = response.choices[0].message.content.strip()
    print(f"Detection result for '{user_input}': {result}")

    return int(result) if result in ("0", "1") else 1