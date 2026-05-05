import os
from datetime import date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine(os.getenv("DATABASE_URL"), pool_pre_ping=True)
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