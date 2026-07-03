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
A) TRIGGER — an information-seeking cue in ANY language:
   English:  what is|what are|how does|how do|how can|why does|why is|explain|define|describe|tell me about|difference between
   Hindi/Hinglish (Roman or Devanagari): kya hai|kya hota hai|kaise|kyun|kyu|batao|samjhao|kya matlab|kaun|kitna|क्या है|कैसे|क्यों|बताओ|समझाओ|कौन|कितना
   Punjabi (Roman or Gurmukhi): ki hai|kive|kyu|dasso|samjhao|ਕੀ ਹੈ|ਕਿਵੇਂ|ਕਿਉਂ|ਦੱਸੋ|ਸਮਝਾਓ
   A trailing "?" with a named subject also counts as a trigger.
B) SUBJECT: a real named topic (not a pronoun)

LANGUAGE NOTE: The 1-3 word GATE 1 reject is about English filler only.
A short non-English question with a real subject (e.g. "Python kya hai?", "ਪਾਈਥਨ ਕੀ ਹੈ?") is a genuine question → 1.

MENTION RULE: strip <@id> first, evaluate remainder.

1→ "What is Python?" "How does JWT work?" "Explain recursion." "<@123> what is Docker?" "Python kya hai?" "JWT kaise kaam karta hai?" "Docker ki hai?" "ਪਾਈਥਨ ਕੀ ਹੈ?" "recursion samjhao"
0→ "explain" "how" "done" "ok thanks" "how does it work" "explain this" "<@123>" "/help" "#general" "processing..." "connected" "huh" "tell me" "kya" "haan" "theek hai" "ਹਾਂ"

OUTPUT ONLY 0 OR 1."""

def detect_question(user_input: str, retries: int = 3) -> int:
    print(f"[detect] input={user_input!r}")
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
                # 8 tokens (not 1) so a leading space/newline doesn't truncate the
                # answer to an empty/whitespace string that then parses as "not a question".
                max_tokens=8,
            )

            raw = response.choices[0].message.content or ""
            print(f"[detect] Groq raw={raw!r}")

            # Lenient parse: find the first 0 or 1 anywhere in the output.
            if "1" in raw:
                return 1
            if "0" in raw:
                return 0

            # Model returned something unparseable. Don't silently swallow the
            # message — fail OPEN (treat as a question) so the user still gets an
            # answer. A false positive costs one KB lookup; a false negative is
            # total silence, which is what we're fixing.
            print(f"[detect] unparseable output {raw!r} — failing open (treating as question)")
            return 1

        except RateLimitError:
            wait = 20 * (attempt + 1)
            print(f"[detect] rate limit. waiting {wait}s (attempt {attempt + 1}/{retries})")
            time.sleep(wait)

        except Exception as e:
            # API/key/network error — fail OPEN rather than going silent.
            print(f"[detect] Groq error: {e} — failing open (treating as question)")
            return 1

    # Retries exhausted (persistent rate limiting) — fail open.
    print("[detect] all retries exhausted — failing open (treating as question)")
    return 1