import os
from datetime import date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine(os.getenv("DATABASE_URL"), pool_pre_ping=True,pool_size=5,max_overflow=10,pool_recycle=300)
DB = sessionmaker(bind=engine)

def db(): return DB()

def add_server(guild_id, name):
    with DB() as s:
        s.execute(text("INSERT INTO servers (server_id, server_name) VALUES (:id, :name) ON CONFLICT DO NOTHING"), {"id": guild_id, "name": name})
        s.commit()

def log_upload(guild_id, user_id, username, kind, name, chunks, status="ok", error=None):
    with DB() as s:
        s.execute(text("INSERT INTO uploads (server_id, uploaded_by, username, type, name, chunks, status, error) VALUES (:sid, :uid, :uname, :type, :name, :chunks, :status, :error)"),
            {"sid": guild_id, "uid": user_id, "uname": username, "type": kind, "name": name, "chunks": chunks, "status": status, "error": error})
        s.commit()

def log_analytics(guild_id, answered=0, failed=0, no_kb=0, latency=None, uploads=0, chunks=0):
    with DB() as s:
        s.execute(text("""
            INSERT INTO analytics (server_id, day, total_questions, answered, failed, no_kb, avg_latency_ms, total_uploads, chunks_added)
            VALUES (:sid, :day, :total, :ans, :fail, :nokb, :lat, :upl, :chunks)
            ON CONFLICT (server_id, day) DO UPDATE SET
                total_questions = analytics.total_questions + :total,
                answered        = analytics.answered        + :ans,
                failed          = analytics.failed          + :fail,
                no_kb           = analytics.no_kb           + :nokb,
                avg_latency_ms  = :lat,
                total_uploads   = analytics.total_uploads   + :upl,
                chunks_added    = analytics.chunks_added    + :chunks
        """), {"sid": guild_id, "day": date.today(), "total": answered+failed+no_kb,
               "ans": answered, "fail": failed, "nokb": no_kb, "lat": latency, "upl": uploads, "chunks": chunks})
        s.commit()

def get_server(guild_id):
    with DB() as s:
        return s.execute(text("SELECT * FROM servers WHERE server_id = :id"), {"id": guild_id}).mappings().first()

def get_uploads(guild_id):
    with DB() as s:
        return s.execute(text("SELECT * FROM uploads WHERE server_id = :id ORDER BY uploaded_at DESC"), {"id": guild_id}).mappings().all()

def get_analytics(guild_id):
    with DB() as s:
        return s.execute(text("SELECT * FROM analytics WHERE server_id = :id ORDER BY day DESC"), {"id": guild_id}).mappings().all()
    
def update_faiss_k(guild_id,k):
    with DB() as s:
        result=s.execute(text("UPDATE servers SET faiss_k= :k WHERE server_id= :guild_id"),{"k":k,"guild_id":guild_id})
        s.commit()
        return result.rowcount
    
def update_bm25_k(guild_id,k):
    with DB() as s:
        result=s.execute(text("UPDATE servers SET bm25_k= :k WHERE server_id= :guild_id"),{"k":k,"guild_id":guild_id})
        s.commit()
        return result.rowcount

def update_temperature(guild_id,k):
    with DB() as s:
        result=s.execute(text("UPDATE servers SET temperature= :k WHERE server_id= :guild_id"),{"k":k,"guild_id":guild_id})
        s.commit()
        return result.rowcount

def update_chunk_size(guild_id,k):
    with DB() as s:
        result=s.execute(text("UPDATE servers SET chunk_size= :k WHERE server_id= :guild_id"),{"k":k,"guild_id":guild_id})
        s.commit()
        return result.rowcount

def update_chunk_overlap(guild_id,k):
    with DB() as s:
        result=s.execute(text("UPDATE servers SET chunk_overlap= :k WHERE server_id= :guild_id"),{"k":k,"guild_id":guild_id})
        s.commit()
        return result.rowcount
    
def insert_system_prompt(guild_id, system_prompt):
    with DB() as s:
        s.execute(text("INSERT INTO servers (server_id, system_prompt) VALUES (:guild_id, :system_prompt)"),{"guild_id": guild_id, "system_prompt": system_prompt})
        s.commit()

def update_system_prompt(guild_id, system_prompt):
    with DB() as s:
        s.execute(
            text("UPDATE servers SET system_prompt = :system_prompt WHERE server_id = :guild_id"),
            {"system_prompt": system_prompt, "guild_id": guild_id}
        )
        s.commit()

def update_max_tokens(guild_id, k):
    with DB() as s:
        result = s.execute(text("UPDATE servers SET max_tokens = :k WHERE server_id = :guild_id"), {"k": k, "guild_id": guild_id})
        s.commit()
        return result.rowcount
    
def set_channel(guild_id, channel_id):
    with DB() as s:
        s.execute(text("""
            INSERT INTO channels (server_id, channel_id)
            VALUES (:guild_id, :channel_id)
            ON CONFLICT DO NOTHING
        """), {"guild_id": guild_id, "channel_id": channel_id})
        s.commit()

def remove_channel(guild_id, channel_id):
    with DB() as s:
        s.execute(text("DELETE FROM channels WHERE server_id = :guild_id AND channel_id = :channel_id"),{"guild_id": guild_id, "channel_id": channel_id})
        s.commit()

def get_channels(guild_id):
    with DB() as s:
        return s.execute(text("SELECT channel_id FROM channels WHERE server_id = :guild_id"),{"guild_id": guild_id}).mappings().all()