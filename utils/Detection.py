from groq import Groq, RateLimitError
import sys
import os
import re
import time
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from utils.apikeyrotation import get_key

# Initialize local ONNX session and Tokenizer
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_onnx")
model_path = os.path.join(MODEL_DIR, "model.onnx")
tokenizer_path = os.path.join(MODEL_DIR, "tokenizer.json")

session = None
tokenizer = None
if os.path.exists(model_path) and os.path.exists(tokenizer_path):
    try:
        session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        tokenizer = Tokenizer.from_file(tokenizer_path)
    except Exception as e:
        print(f"[detect] Error loading ONNX model/tokenizer: {e}")

# Heuristics triggers for developer intents (after stripping polite phrases)
FORCE_QUESTION_STARTS = (
    "explain", "describe", "define", "tell me about", "how to", "show me", 
    "give me", "write a", "create a", "help me with", "need help"
)

# Short responses to ignore
IGNORED_PHRASES = {
    "ok", "okay", "thanks", "thank you", "sure", "noted", "understood", 
    "fine", "cool", "nice", "great", "lol", "haha", "wow", "ping", "pong"
}

# Starters that explicitly indicate a statement when not ending in a question mark
EXPLICIT_STATEMENT_STARTERS = (
    "how we ", "how it ", "who is going to ", "the server ", "this is ", "we have ", "i have "
)

# Detailed SYSTEM_PROMPT to ensure high-accuracy categorization during Groq fallback
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
A) TRIGGER: what is|what are|how does|how do|how can|why does|why is|explain [NOUN]|define [NOUN]|describe [NOUN]|tell me about [NOUN]|difference between|give me|show me|how to
B) SUBJECT: a real named topic (not a pronoun)

MENTION RULE: strip <@id> first, evaluate remainder.

1→ "What is Python?" "How does JWT work?" "Explain recursion." "<@123> what is Docker?"
0→ "explain" "how" "done" "ok thanks" "how does it work" "explain this" "<@123>" "/help" "#general" "processing..." "connected" "huh" "tell me"

OUTPUT ONLY 0 OR 1."""

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=0)

def clean_polite_starters(text: str) -> str:
    """Removes common polite conversation starters to get to the core trigger."""
    starters = ["please", "can you", "could you", "would you mind", "hi", "hello", "hey"]
    words = text.split()
    while words and words[0] in starters:
        words.pop(0)
    return " ".join(words)

def detect_via_groq(user_input: str, retries: int = 3) -> int:
    """Fallback classifier using Groq LLM with high-accuracy rules."""
    print(f"[detect] fallback sending to Groq")
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
            print(f"[detect] Groq ➔ {result}")

            if result not in ("0", "1"):
                return 0

            return int(result)

        except RateLimitError:
            wait = 20 * (attempt + 1)
            print(f"[detect] rate limit. waiting {wait}s (attempt {attempt + 1}/{retries})")
            time.sleep(wait)

        except Exception as e:
            print(f"[detect] Groq error: {e}")
            return -1

    return -1

def detect_question(user_input: str) -> int:
    if not user_input or not isinstance(user_input, str):
        return 0

    text = user_input.strip().lower()
    
    # 1. Strip Discord mentions
    text = re.sub(r'<@!?\d+>|<@&\d+>', '', text).strip()
    
    # Reject empty or extremely short inputs
    if not text:
        return 0
        
    words = text.split()
    if len(words) < 2:
        return 0

    # 2. Check Ignored Phrases
    clean_text = re.sub(r'[^\w\s]', '', text).strip()
    if clean_text in IGNORED_PHRASES:
        print(f"[detect] matched ignore list ➔ 0")
        return 0

    # 3. Clean polite words and check force starts & explicit statements
    cleaned_start_text = clean_polite_starters(text)
    
    # Explicitly check for statements that shouldn't be matched as questions (unless they end with ?)
    if not text.endswith("?"):
        if cleaned_start_text.startswith(EXPLICIT_STATEMENT_STARTERS) or text.startswith(EXPLICIT_STATEMENT_STARTERS):
            print(f"[detect] matched explicit statement starter ➔ 0")
            return 0

    matched_trigger = False
    for trigger in FORCE_QUESTION_STARTS:
        if cleaned_start_text.startswith(trigger):
            print(f"[detect] matched force trigger '{trigger}' ➔ 1")
            matched_trigger = True
            return 1

    # 4. Check explicit question mark
    ends_with_q = text.endswith("?")
    if ends_with_q:
        print(f"[detect] ends with question mark ➔ 1")
        return 1

    # 5. Local ONNX Model Inference
    if session is not None and tokenizer is not None:
        try:
            encoding = tokenizer.encode(user_input)
            
            input_ids = np.array([encoding.ids], dtype=np.int64)
            attention_mask = np.array([encoding.attention_mask], dtype=np.int64)
            token_type_ids = np.array([encoding.type_ids], dtype=np.int64)
            
            onnx_inputs = {
                "input_ids": input_ids,
                "attention_mask": attention_mask,
                "token_type_ids": token_type_ids
            }
            
            outputs = session.run(None, onnx_inputs)
            logits = outputs[0][0]
            probs = softmax(logits)
            prediction = int(np.argmax(probs))
            confidence = probs[prediction]

            # If prediction is 1 but we don't have explicit question mark or force trigger,
            # we force a fallback to Groq to double check and prevent false positives.
            if prediction == 1 and not ends_with_q and not matched_trigger:
                print(f"[detect] local model predicted 1 but lacks '?' or trigger. Querying Groq...")
                groq_res = detect_via_groq(user_input)
                if groq_res != -1:
                    return groq_res
                return prediction

            # High confidence threshold (>= 95%)
            if confidence >= 0.95:
                print(f"[detect] local model high confidence ({confidence:.4f}) ➔ {prediction}")
                return prediction

            # Low confidence fallback to Groq
            print(f"[detect] local model uncertain ({confidence:.4f}). Querying Groq...")
            groq_res = detect_via_groq(user_input)
            if groq_res != -1:
                return groq_res
            
            return prediction

        except Exception as e:
            print(f"[detect] local model exception: {e}. Falling back to Groq...")
            groq_res = detect_via_groq(user_input)
            return groq_res if groq_res != -1 else 0
    else:
        # Fallback to Groq directly if ONNX session is not initialized
        groq_res = detect_via_groq(user_input)
        return groq_res if groq_res != -1 else 0