from groq import Groq, RateLimitError
import sys
import os
import re
import time

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from utils.apikeyrotation import get_key

SYSTEM_PROMPT = """TASK: Binary classifier. Output ONLY "1" or "0". Any other output is a failure.

═══════════════════════════
GATE 1 — REJECT IF ANY MATCH
═══════════════════════════
- 1-3 words total → 0
- Only mention: <@id> → 0
- Starts with / or # → 0
- Contains: restarted|connected|disconnected|processing|detected|successful|received|initialized|complete|failed|error|status|ping|pong → 0
- Entire message is: ok|okay|got it|thanks|sure|noted|understood|alright|fine|cool|nice|great|huh|lol|haha|wow|oh|ah|hmm|interesting → 0
- Subject is only a pronoun: it|this|that|these|those → 0
- No named subject after trigger → 0

═══════════════════════════
GATE 2 — MUST HAVE BOTH
═══════════════════════════
A) TRIGGER: what is|what are|how does|how do|how can|why does|why is|explain [NOUN]|define [NOUN]|describe [NOUN]|tell me about [NOUN]|difference between
B) SUBJECT: a real named topic (not a pronoun)

MENTION RULE: strip <@id> first, evaluate remainder.

1→ "What is Python?" "How does JWT work?" "Explain recursion." "<@123> what is Docker?"
0→ "explain" "how" "done" "ok thanks" "how does it work" "explain this" "<@123>" "/help" "#general" "processing..." "connected" "huh" "tell me"

OUTPUT ONLY 0 OR 1."""

# ═══════════════════════════════════════
# REGEX PRE-FILTER
# ═══════════════════════════════════════

DISCORD_ARTIFACTS  = re.compile(r'^<@\d+>$|^/|^#', re.IGNORECASE)
SYSTEM_WORDS       = re.compile(r'\b(restarted|connected|disconnected|processing|detected|successful|received|initialized|complete|completed|failed|error|warning|status|ping|pong)\b', re.IGNORECASE)
ACKNOWLEDGEMENTS   = re.compile(r'^(ok|okay|got\s?it|thanks|thank\s?you|sure|noted|understood|alright|fine|cool|nice|great|good|huh|lol|lmao|haha|wow|oh|ah|hmm|interesting)$', re.IGNORECASE)
QUESTION_TRIGGERS  = re.compile(r'\b(what\s+is|what\s+are|what\s+was|what\s+does|what\s+do|how\s+does|how\s+do|how\s+is|how\s+can|how\s+to|why\s+does|why\s+do|why\s+is|why\s+are|explain\s+\w+|describe\s+\w+|define\s+\w+|tell\s+me\s+about|what\'s\s+the\s+difference|can\s+you\s+explain|could\s+you\s+explain)\b', re.IGNORECASE)
VAGUE_SUBJECT      = re.compile(r'^(what\s+is\s+(it|this|that|these|those)\??|how\s+does\s+(it|this|that)\s+work\??|explain\s+(this|that|it)\??)$', re.IGNORECASE)

def regex_filter(text: str) -> int | None:
    """
    0  → definitely noise, skip Groq
    None → ambiguous, send to Groq
    Never returns 1 — Groq makes the final yes decision
    """
    # strip mention
    text = re.sub(r'^<@\d+>\s*', '', text).strip()

    if not text:                              return 0  # empty after strip
    if len(text.split()) <= 2:               return 0  # fragment
    if DISCORD_ARTIFACTS.match(text):        return 0  # /cmd #channel
    if SYSTEM_WORDS.search(text):            return 0  # bot language
    if ACKNOWLEDGEMENTS.match(text):         return 0  # ok/thanks/huh
    if VAGUE_SUBJECT.match(text):            return 0  # explain this / how does it work
    if not QUESTION_TRIGGERS.search(text):   return 0  # no trigger at all

    return None  # ambiguous → send to Groq


def detect_question(user_input: str, retries: int = 3) -> int:
    print(f"[detect] input: '{user_input}'")

    # GATE 1 — regex (free, instant)
    regex_result = regex_filter(user_input)
    if regex_result is not None:
        print(f"[detect] regex → {regex_result}")
        return regex_result

    # GATE 2 — Groq (only truly ambiguous messages reach here)
    print(f"[detect] sending to Groq")
    groq_api_key = get_key()
    client = Groq(api_key=groq_api_key)

    for attempt in range(retries):
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

        except RateLimitError:
            wait = 20 * (attempt + 1)
            print(f"[detect] rate limit. waiting {wait}s (attempt {attempt + 1}/{retries})")
            time.sleep(wait)

        except Exception as e:
            print(f"[detect] Groq error: {e}")
            return 0

    print("[detect] all retries exhausted")
    return 0