from groq import Groq
from utils.apikeyrotation import get_key
def detect_question(user_input: str) -> int:
    GROQ_API_KEY = get_key()
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a binary intent classifier.\n"
                    "Your ONLY job is to decide if the user's message is a question.\n"
                    "A question can be direct ('What is AI?'), indirect ('I wonder how this works'), "
                    "or implied ('Tell me about Python').\n\n"
                    "Reply with EXACTLY one digit:\n"
                    "  0 → the message IS a question\n"
                    "  1 → the message is NOT a question\n\n"
                    "No explanation. No punctuation. Just 0 or 1."
                ),
            },
            {"role": "user", "content": user_input},
        ],
        temperature=0,
        max_tokens=1,
    )
    result = response.choices[0].message.content.strip()
    return int(result) if result in ("0", "1") else 1
