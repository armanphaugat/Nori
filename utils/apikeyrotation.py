import os
from dotenv import load_dotenv
load_dotenv()
keys=os.getenv("GROQ_API_KEY").split(",")

idx=0
def rotate_key():
    global idx
    key = keys[idx % len(keys)]
    idx+=1
    return key