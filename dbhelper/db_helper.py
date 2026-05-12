import os
from datetime import date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import Optional
import datetime
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
    
def set_channel(guild_id, channel_id,):
    with DB() as s:
        s.execute(text("""
            INSERT INTO channels (server_id, channel_id)
            VALUES (:guild_id, :channel_id)
            ON CONFLICT DO NOTHING
        """), {"guild_id": guild_id, "channel_id": channel_id})
        s.commit()


def get_mod_channel(guild_id):
    with DB() as s:
        return s.execute(
            text("SELECT mod_channel FROM servers WHERE server_id = :guild_id"),
            {"guild_id": guild_id}
        ).mappings().first()

def insert_mod_channel(guild_id, channel_id):
    with DB() as s:
        s.execute(
            text("""
                UPDATE servers
                SET mod_channel = :channel_id, updated_at = NOW()
                WHERE server_id = :guild_id
            """),
            {"guild_id": guild_id, "channel_id": channel_id}
        )
        s.commit()

def get_all_servers():
    with DB() as s:
        return s.execute(text("SELECT * FROM servers ORDER BY added_at DESC")).mappings().all()

def get_all_uploads(guild_id):
    with DB() as s:
        return s.execute(text("SELECT * FROM uploads WHERE server_id= :guild_id ORDER BY uploaded_at DESC"),{"guild_id":guild_id}).mappings().all()

def get_analytics(guild_id, limit: int = 30, offset: int = 0):
    with DB() as s:
        return s.execute(
            text("""
                SELECT 
                    day,
                    total_questions,
                    answered,
                    failed,
                    no_kb,
                    avg_latency_ms,
                    unique_users,
                    total_uploads,
                    chunks_added,
                    top_topic
                FROM analytics
                WHERE server_id = :guild_id
                ORDER BY day DESC
                LIMIT :limit OFFSET :offset
            """),
            {"guild_id": guild_id, "limit": limit, "offset": offset}
        ).mappings().all()


def get_analytics_summary(guild_id):
    with DB() as s:
        return s.execute(
            text("""
                SELECT
                    COUNT(*)                  AS total_days,
                    SUM(total_questions)      AS total_questions,
                    SUM(answered)             AS answered,
                    SUM(failed)               AS failed,
                    SUM(no_kb)                AS no_kb,
                    ROUND(AVG(avg_latency_ms)::numeric, 2) AS avg_latency_ms,
                    SUM(unique_users)         AS unique_users,
                    SUM(total_uploads)        AS total_uploads,
                    SUM(chunks_added)         AS chunks_added
                FROM analytics
                WHERE server_id = :guild_id
            """),
            {"guild_id": guild_id}
        ).mappings().first()

def get_all_channels():
    with DB() as s:
        return s.execute(text("SELECT * FROM channels ORDER BY added_at DESC")).mappings().all()
    
def reset_server_settings(guild_id):
    with DB() as s:
        s.execute(text("""
            UPDATE servers SET
                prefix        = '!',
                max_tokens    = 512,
                temperature   = 0.7,
                chunk_size    = 500,
                chunk_overlap = 100,
                faiss_k       = 5,
                bm25_k        = 5,
                updated_at    = NOW()
            WHERE server_id = :id
        """), {"id": guild_id})
        s.commit()

def remove_mod_channel(guild_id):
    with DB() as s:
        s.execute(
            text("UPDATE servers SET mod_channel = NULL, updated_at = NOW() WHERE server_id = :id"),
            {"id": guild_id}
        )
        s.commit()
def upsert_admin_user(
    discord_id: str,
    username: str,
    avatar: Optional[str],
    email: Optional[str],
    discord_access_token: str,
    discord_refresh_token: str,
    discord_token_expiry: datetime,
) -> None:

    sql = text("""
        INSERT INTO admin_users (
            discord_id,
            username,
            avatar,
            email,
            discord_access_token,
            discord_refresh_token,
            discord_token_expiry,
            created_at,
            last_login
        )
        VALUES (
            :discord_id,
            :username,
            :avatar,
            :email,
            :d_at,
            :d_rt,
            :d_exp,
            NOW(),
            NOW()
        )
        ON CONFLICT (discord_id)
        DO UPDATE SET
            username = EXCLUDED.username,
            avatar = EXCLUDED.avatar,
            email = EXCLUDED.email,
            discord_access_token = EXCLUDED.discord_access_token,
            discord_refresh_token = EXCLUDED.discord_refresh_token,
            discord_token_expiry = EXCLUDED.discord_token_expiry,
            last_login = NOW();
    """)

    with DB() as s:
        s.execute(sql, {
            "discord_id": discord_id,
            "username": username,
            "avatar": avatar,
            "email": email,
            "d_at": discord_access_token,
            "d_rt": discord_refresh_token,
            "d_exp": discord_token_expiry,
        })
        s.commit()


def get_admin_user(discord_id: str) -> Optional[dict]:

    sql = text("""
        SELECT *
        FROM admin_users
        WHERE discord_id = :discord_id;
    """)

    with DB() as s:
        row = s.execute(sql, {
            "discord_id": discord_id
        }).mappings().fetchone()

        return dict(row) if row else None


# ---------------------------------------------------------------------------
# admin_sessions
# ---------------------------------------------------------------------------

def create_session(
    discord_id: str,
    refresh_token_hash: str,
    expires_at: datetime,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> str:

    sql = text("""
        INSERT INTO admin_sessions (
            discord_id,
            refresh_token_hash,
            issued_at,
            expires_at,
            revoked,
            user_agent,
            ip_address
        )
        VALUES (
            :discord_id,
            :hash,
            NOW(),
            :expires_at,
            FALSE,
            :ua,
            :ip
        )
        RETURNING id;
    """)

    with DB() as s:
        result = s.execute(sql, {
            "discord_id": discord_id,
            "hash": refresh_token_hash,
            "expires_at": expires_at,
            "ua": user_agent,
            "ip": ip_address,
        })

        s.commit()

        return str(result.fetchone()[0])


def get_session_by_hash(refresh_token_hash: str) -> Optional[dict]:

    sql = text("""
        SELECT *
        FROM admin_sessions
        WHERE refresh_token_hash = :hash;
    """)

    with DB() as s:
        row = s.execute(sql, {
            "hash": refresh_token_hash
        }).mappings().fetchone()

        return dict(row) if row else None


def revoke_session(session_id: str) -> None:

    sql = text("""
        UPDATE admin_sessions
        SET revoked = TRUE
        WHERE id = :session_id;
    """)

    with DB() as s:
        s.execute(sql, {
            "session_id": session_id
        })
        s.commit()


def revoke_session_by_id(
    session_id: str,
    owner_discord_id: str
) -> bool:

    sql = text("""
        UPDATE admin_sessions
        SET revoked = TRUE
        WHERE id = :session_id
          AND discord_id = :discord_id
          AND revoked = FALSE
        RETURNING id;
    """)

    with DB() as s:
        result = s.execute(sql, {
            "session_id": session_id,
            "discord_id": owner_discord_id
        })

        s.commit()

        return result.fetchone() is not None


def get_user_sessions(discord_id: str) -> list[dict]:

    sql = text("""
        SELECT
            id,
            discord_id,
            issued_at,
            expires_at,
            revoked,
            user_agent,
            ip_address
        FROM admin_sessions
        WHERE discord_id = :discord_id
          AND expires_at > NOW()
        ORDER BY issued_at DESC;
    """)

    with DB() as s:
        rows = s.execute(sql, {
            "discord_id": discord_id
        }).mappings().fetchall()

        return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# guild_admins
# ---------------------------------------------------------------------------

def get_guild_admin(
    guild_id: str,
    discord_id: str
) -> Optional[dict]:

    sql = text("""
        SELECT *
        FROM guild_admins
        WHERE guild_id = :guild_id
          AND discord_id = :discord_id;
    """)

    with DB() as s:
        row = s.execute(sql, {
            "guild_id": guild_id,
            "discord_id": discord_id
        }).mappings().fetchone()

        return dict(row) if row else None


def add_guild_admin(
    guild_id: str,
    discord_id: str,
    role: str,
    granted_by: str,
) -> None:

    sql = text("""
        INSERT INTO guild_admins (
            guild_id,
            discord_id,
            role,
            granted_by,
            granted_at
        )
        VALUES (
            :guild_id,
            :discord_id,
            :role,
            :granted_by,
            NOW()
        )
        ON CONFLICT (guild_id, discord_id)
        DO UPDATE SET
            role = EXCLUDED.role;
    """)
    with DB() as s:
        s.execute(sql, {
            "guild_id": guild_id,
            "discord_id": discord_id,
            "role": role,
            "granted_by": granted_by,
        })
        s.commit()

def remove_guild_admin(
    guild_id: str,
    discord_id: str
) -> None:
    sql = text("""DELETE FROM guild_admins WHERE guild_id = :guild_id AND discord_id = :discord_id;""")
    with DB() as s:
        s.execute(sql, {
            "guild_id": guild_id,
            "discord_id": discord_id,
        })
        s.commit()

