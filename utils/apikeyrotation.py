import os
from dotenv import load_dotenv
import redis as r
import random
load_dotenv()
keys=os.getenv("GROQ_API_KEY").split(",")

idx=0
def rotate_key():
    global idx
    key = keys[idx % len(keys)]
    idx+=1
    return key

def get_key():
    global idx
    key = keys[idx % len(keys)]
    return key
def set_key():
    r.set("groq_active_key",get_key())

def random_key():
    return random.choice(keys)