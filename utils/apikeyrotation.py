import os
from dotenv import load_dotenv
import threading
_lock=threading.Lock()
import redis
import random
load_dotenv()
keys=os.getenv("GROQ_API_KEY","").split(",")
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)
idx=0
def rotate_key():
    global idx
    with _lock: 
        key = keys[idx % len(keys)]
        idx+=1
        return key

def get_key():
    key = keys[idx % len(keys)]
    return key
def set_key():
    with _lock:
        redis_client.set("groq_active_key",get_key())

def random_key():
    return random.choice(keys)