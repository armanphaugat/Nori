from groq import Groq, RateLimitError
import sys
import os
import re
import time

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from utils.apikeyrotation import get_key

SYSTEM_PROMPT = """TASK: Binary classifier. Output ONLY "1" or "0". Any other output is a failure. No explanations, no punctuation.

LANGUAGES: English, Hindi, German, Chinese, Spanish, French, Arabic, Portuguese, Japanese, Russian. Judge by MEANING and INTENT.

CLASSIFICATION RULES:
Output "1" ONLY if the text is a direct question or request asking to explain, define, describe, or understand a specific, named concept or topic.
Output "0" for everything else.

STEP-BY-STEP FILTERING CRITERIA:

1. MENTION CLEANING:
   - Mentions (like <@id>) must be ignored before judging.

2. IMMEDIATE REJECTION (Output "0" if ANY apply):
   - Starts with a command prefix (e.g., /, #).
   - The message is entirely a system log or status update (e.g., "restarted", "processing", "connected", "failed", "error").
   - The message is entirely a short acknowledgment, filler, or reaction (e.g., "ok", "thanks", "sure", "wow", "lol", "hmm").
   - There is NO named topic (e.g., "explain this", "what is it?", "how does it work?").

3. MANDATORY CRITERIA FOR "1" (Must meet BOTH):
   - A) TRIGGER: Contains a question word or request for explanation (e.g., "what is", "how does","how can i", "explain", "define", "difference between").
   - B) SUBJECT: Contains a real, named noun, concept, or tool that the trigger is actively asking about (e.g., "Python", "JWT", "Recursion").

EXAMPLES FOR EVALUATION REFERENCE:
- "What is Python?" / "पायथन क्या है?" / "Was ist Python?" / "什么是Python？" → 1
- "Explain recursion." / "रिकर्शन समझाओ।" / "Erkläre Rekursion." / "解释一下递归。" → 1
- "how does it work" / "यह कैसे काम करता है" / "wie funktioniert das" / "这是怎么工作的" → 0 (No named subject)
- "how can I create a giveaway" / "मैं एक गिवीयू कैसे बना सकता हूँ" / "wie kann ich ein giveaway erstellen" / "我怎样创建一个赠品活动" → 1
- "ok thanks" / "ठीक है धन्यवाद" / "ok danke" / "好的谢谢" → 0 (Filler/Acknowledgment)
- "processing..." / "प्रोसेसिंग..." / "Verarbeitung..." / "处理中..." → 0 (Status update)

OUTPUT FORMAT:
Respond with exactly one character: "1" or "0"""


def detect_question(user_input: str, retries: int = 3) -> int:
    print(f"[detect] input: '{user_input}'")
    print(f"[detect] sending to Groq")
    groq_api_key = get_key()
    client = Groq(api_key=groq_api_key)
    try:
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
        print(f"[detect] Groq → {result}")
        if result not in ("0", "1"):
            print(f"[detect] unexpected output: {repr(result)}")
            return 0

        return int(result)
    except Exception as e:
        print(f"[detect] error: {e}")
        return 0   
