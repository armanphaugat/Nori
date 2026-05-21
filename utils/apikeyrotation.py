import os
from dotenv import load_dotenv
import threading
_lock=threading.Lock()
import redis
import random
load_dotenv()
keys=os.getenv("GROQ_API_KEY","").split(",")
exa_keys=os.getenv("EXA_API_KEY","").split(",")
tavily_keys= os.getenv("TAVILY_API_KEY").split(",")
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)
idx=0
exa_idx=0
tavily_idx=0
def rotate_key():
    global idx
    with _lock: 
        key = keys[idx % len(keys)]
        idx+=1
        return key

def get_key():
    with _lock:
        key = keys[idx % len(keys)]
        return key
def set_key():
    redis_client.set("groq_active_key",get_key())

def random_key():
    return random.choice(keys)

def rotate_exa_key():
    global exa_idx
    with _lock:
        exa_key=exa_keys[exa_idx%len(exa_keys)]
        exa_idx+=1
        return exa_key
    
def get_exa_key():
    with _lock:
        global exa_idx
        return exa_keys[exa_idx%len(exa_keys)]

def set_exa_key():
    redis_client.set("exa_active_key",get_exa_key())

def random_exa_key():
    return random.choice(exa_keys)

def rotate_tavily_key():
    global tavily_idx
    with _lock:
        tavily_key=tavily_keys[tavily_idx%len(tavily_keys)]
        tavily_idx+=1
        return tavily_key
    
def get_tavily_key():
    with _lock:
        global tavily_idx
        return tavily_keys[tavily_idx%len(tavily_keys)]

def set_tavily_key():
    redis_client.set("tavily_active_key",get_tavily_key())

def random_tavily_key():
    return random.choice(tavily_keys)