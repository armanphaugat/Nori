import os
from datetime import date, datetime
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
)
DB = sessionmaker(bind=engine)

def add_server(guild_id: str, name: str) -> None:
    with DB() as s:
        s.execute(text("""INSERT INTO servers (server_id, server_name) VALUES (:id, :name) ON CONFLICT DO NOTHING"""),{"id": str(guild_id), "name": name},)
        s.commit()


def get_server(guild_id: str) -> Optional[dict]:
    with DB() as s:
        row = s.execute(text("SELECT * FROM servers WHERE server_id = :id"),{"id": str(guild_id)},).mappings().first()
        return dict(row) if row else None


def get_all_servers() -> list[dict]:
    with DB() as s:
        rows = s.execute(text("SELECT * FROM servers ORDER BY added_at DESC")).mappings().all()
        return [dict(r) for r in rows]


def reset_server_settings(guild_id: str) -> None:
    with DB() as s:
        s.execute(
            text("""UPDATE servers SET prefix= '-',max_tokens = 1024,updated_at = NOW() WHERE server_id = :id"""),{"id": str(guild_id)},)
        s.commit()


def update_max_tokens(guild_id: str, value: int) -> int:
    with DB() as s:
        result = s.execute(
            text("""UPDATE servers SET max_tokens = :value, updated_at = NOW() WHERE server_id = :id"""),{"value": value, "id": str(guild_id)},)
        s.commit()
        return result.rowcount

def set_channel(guild_id: str, channel_id: str) -> None:
    with DB() as s:
        s.execute(text("""INSERT INTO channels (server_id, channel_id) VALUES (:guild_id, :channel_id) ON CONFLICT DO NOTHING"""),{"guild_id": str(guild_id), "channel_id": str(channel_id)},)
        s.commit()


def remove_channel(guild_id: str, channel_id: str) -> None:
    with DB() as s:
        s.execute(text("""DELETE FROM channels WHERE server_id = :guild_id AND channel_id = :channel_id"""),{"guild_id": str(guild_id), "channel_id": str(channel_id)},)
        s.commit()


def get_channels(guild_id: str) -> list[dict]:
    with DB() as s:
        rows = s.execute(text("SELECT channel_id FROM channels WHERE server_id = :guild_id"),{"guild_id": str(guild_id)},).mappings().all()
        return [dict(r) for r in rows]


def get_all_channels() -> list[dict]:
    with DB() as s:
        rows = s.execute(text("SELECT * FROM channels ORDER BY added_at DESC")).mappings().all()
        return [dict(r) for r in rows]

def get_mod_channel(guild_id: str) -> Optional[dict]:
    with DB() as s:
        row = s.execute(text("SELECT mod_channel FROM servers WHERE server_id = :id"),{"id": str(guild_id)},).mappings().first()
        return dict(row) if row else None


def insert_mod_channel(guild_id: str, channel_id: str) -> None:
    with DB() as s:
        s.execute(
            text("""UPDATE servers SET mod_channel = :channel_id, updated_at = NOW() WHERE server_id = :id"""),{"channel_id": str(channel_id), "id": str(guild_id)},
        )
        s.commit()


def remove_mod_channel(guild_id: str) -> None:
    with DB() as s:
        s.execute(
            text("""UPDATE servers SET mod_channel = NULL, updated_at = NOW() WHERE server_id = :id"""),
            {"id": str(guild_id)},
        )
        s.commit()

def log_upload(
    guild_id, user_id, username, kind, name,
    content_id=None,
    feed_id=None,
    status="ok",
    error=None,
) -> None:
    with DB() as s:
        s.execute(
            text("""
                INSERT INTO uploads
                    (server_id, uploaded_by, username, type, name, content_id, feed_id, status, error)
                VALUES
                    (:sid, :uid, :uname, :type, :name, :cid, :fid, :status, :error)
            """),
            {
                "sid": str(guild_id), "uid": str(user_id), "uname": username,
                "type": kind, "name": name,
                "cid": content_id,
                "fid": feed_id,    # add this
                "status": status, "error": error,
            },
        )
        s.commit()
def get_uploads(guild_id: str) -> list[dict]:
    with DB() as s:
        rows = s.execute(
            text("SELECT * FROM uploads WHERE server_id = :id ORDER BY uploaded_at DESC"),
            {"id": str(guild_id)},
        ).mappings().all()
        return [dict(r) for r in rows]


get_all_uploads = get_uploads


def remove_upload(upload_id: str, guild_id: str) -> bool:
    with DB() as s:
        result = s.execute(
            text("DELETE FROM uploads WHERE id = :id AND server_id = :sid RETURNING id"),
            {"id": upload_id, "sid": str(guild_id)},
        )
        s.commit()
        return result.fetchone() is not None

def log_question_event(
    guild_id: str,
    user_id: str,
    answered: bool,
    latency_ms: Optional[float] = None,
) -> None:
    with DB() as s:
        s.execute(
            text("""
                INSERT INTO question_events (server_id, user_id, answered, latency_ms)
                VALUES (:sid, :uid, :answered, :latency_ms)
            """),
            {
                "sid":        str(guild_id),
                "uid":        str(user_id),
                "answered":   answered,
                "latency_ms": latency_ms,
            },
        )
        s.commit()

def get_analytics(
    guild_id: str,
    limit: int = 30,
    offset: int = 0,
) -> list[dict]:
    with DB() as s:
        rows = s.execute(
            text("""
                SELECT
                    (asked_at AT TIME ZONE 'UTC')::date          AS day,
                    COUNT(*)                                      AS total,
                    COUNT(*) FILTER (WHERE answered = true)       AS answered,
                    COUNT(*) FILTER (WHERE answered = false)      AS unanswered,
                    ROUND(AVG(latency_ms)::numeric, 2)            AS avg_latency_ms,
                    COUNT(DISTINCT user_id)                       AS unique_users
                FROM question_events
                WHERE server_id = :guild_id
                GROUP BY day
                ORDER BY day DESC
                LIMIT :limit OFFSET :offset
            """),
            {"guild_id": str(guild_id), "limit": limit, "offset": offset},
        ).mappings().all()
        return [dict(r) for r in rows]

def get_analytics_summary(guild_id: str) -> Optional[dict]:
    with DB() as s:
        row = s.execute(
            text("""
                SELECT
                    COUNT(DISTINCT (asked_at AT TIME ZONE 'UTC')::date)   AS total_days,
                    COUNT(*)                                               AS total_questions,
                    COUNT(*) FILTER (WHERE answered = true)               AS answered,
                    COUNT(*) FILTER (WHERE answered = false)              AS unanswered,
                    ROUND(
                        100.0 * COUNT(*) FILTER (WHERE answered = true)
                        / NULLIF(COUNT(*), 0),
                        1
                    )                                                      AS answer_rate_pct,
                    ROUND(AVG(latency_ms)::numeric, 2)                    AS avg_latency_ms,
                    COUNT(DISTINCT user_id)                               AS unique_users
                FROM question_events
                WHERE server_id = :guild_id
            """),
            {"guild_id": str(guild_id)},
        ).mappings().first()
        return dict(row) if row else None

def get_recent_events(
    guild_id: str,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    with DB() as s:
        rows = s.execute(
            text("""
                SELECT
                    id,
                    user_id,
                    asked_at,
                    answered,
                    latency_ms
                FROM question_events
                WHERE server_id = :guild_id
                ORDER BY asked_at DESC
                LIMIT :limit OFFSET :offset
            """),
            {"guild_id": str(guild_id), "limit": limit, "offset": offset},
        ).mappings().all()
        return [dict(r) for r in rows]


def upsert_admin_user(
    discord_id: str,
    username: str,
    avatar: Optional[str],
    email: Optional[str],
    discord_access_token: str,
    discord_refresh_token: str,
    discord_token_expiry: datetime,
) -> None:
    with DB() as s:
        s.execute(
            text("""
                INSERT INTO admin_users (
                    discord_id, username, avatar, email,
                    discord_access_token, discord_refresh_token, discord_token_expiry,
                    created_at, last_login
                )
                VALUES (
                    :discord_id, :username, :avatar, :email,
                    :d_at, :d_rt, :d_exp,
                    NOW(), NOW()
                )
                ON CONFLICT (discord_id) DO UPDATE SET
                    username              = EXCLUDED.username,
                    avatar                = EXCLUDED.avatar,
                    email                 = EXCLUDED.email,
                    discord_access_token  = EXCLUDED.discord_access_token,
                    discord_refresh_token = EXCLUDED.discord_refresh_token,
                    discord_token_expiry  = EXCLUDED.discord_token_expiry,
                    last_login            = NOW()
            """),
            {
                "discord_id": discord_id,
                "username": username,
                "avatar": avatar,
                "email": email,
                "d_at": discord_access_token,
                "d_rt": discord_refresh_token,
                "d_exp": discord_token_expiry,
            },
        )
        s.commit()


def get_admin_user(discord_id: str) -> Optional[dict]:
    with DB() as s:
        row = s.execute(
            text("SELECT * FROM admin_users WHERE discord_id = :discord_id"),
            {"discord_id": discord_id},
        ).mappings().fetchone()
        return dict(row) if row else None


def create_session(
    discord_id: str,
    refresh_token_hash: str,
    expires_at: datetime,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> str:
    with DB() as s:
        result = s.execute(
            text("""
                INSERT INTO admin_sessions (
                    discord_id, refresh_token_hash,
                    issued_at, expires_at, revoked,
                    user_agent, ip_address
                )
                VALUES (
                    :discord_id, :hash,
                    NOW(), :expires_at, FALSE,
                    :ua, :ip
                )
                RETURNING id
            """),
            {
                "discord_id": discord_id,
                "hash": refresh_token_hash,
                "expires_at": expires_at,
                "ua": user_agent,
                "ip": ip_address,
            },
        )
        s.commit()
        return str(result.fetchone()[0])


def get_session_by_hash(refresh_token_hash: str) -> Optional[dict]:
    with DB() as s:
        row = s.execute(
            text("SELECT * FROM admin_sessions WHERE refresh_token_hash = :hash"),
            {"hash": refresh_token_hash},
        ).mappings().fetchone()
        return dict(row) if row else None


def revoke_session(session_id: str) -> None:
    with DB() as s:
        s.execute(
            text("UPDATE admin_sessions SET revoked = TRUE WHERE id = :id"),
            {"id": session_id},
        )
        s.commit()


def revoke_session_by_id(session_id: str, owner_discord_id: str) -> bool:
    with DB() as s:
        result = s.execute(
            text("""
                UPDATE admin_sessions
                SET revoked = TRUE
                WHERE id = :id
                  AND discord_id = :discord_id
                  AND revoked = FALSE
                RETURNING id
            """),
            {"id": session_id, "discord_id": owner_discord_id},
        )
        s.commit()
        return result.fetchone() is not None


def get_user_sessions(discord_id: str) -> list[dict]:
    with DB() as s:
        rows = s.execute(
            text("""
                SELECT
                    id, discord_id, issued_at, expires_at,
                    revoked, user_agent, ip_address
                FROM admin_sessions
                WHERE discord_id = :discord_id
                  AND expires_at > NOW()
                ORDER BY issued_at DESC
            """),
            {"discord_id": discord_id},
        ).mappings().fetchall()
        return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# guild_admins
# ---------------------------------------------------------------------------

def get_guild_admin(guild_id: str, discord_id: str) -> Optional[dict]:
    with DB() as s:
        row = s.execute(
            text("""
                SELECT * FROM guild_admins
                WHERE guild_id = :guild_id AND discord_id = :discord_id
            """),
            {"guild_id": str(guild_id), "discord_id": discord_id},
        ).mappings().fetchone()
        return dict(row) if row else None


def add_guild_admin(
    guild_id: str,
    discord_id: str,
    role: str,
    granted_by: str,
) -> None:
    with DB() as s:
        s.execute(
            text("""
                INSERT INTO guild_admins (guild_id, discord_id, role, granted_by, granted_at)
                VALUES (:guild_id, :discord_id, :role, :granted_by, NOW())
                ON CONFLICT (guild_id, discord_id) DO UPDATE SET
                    role = CASE
                        WHEN guild_admins.role = 'owner' THEN 'owner'
                        ELSE EXCLUDED.role
                    END,
                    granted_by = EXCLUDED.granted_by
            """),
            {
                "guild_id": str(guild_id),
                "discord_id": discord_id,
                "role": role,
                "granted_by": granted_by,
            },
        )
        s.commit()


def remove_guild_admin(guild_id: str, discord_id: str) -> None:
    with DB() as s:
        s.execute(
            text("""
                DELETE FROM guild_admins
                WHERE guild_id = :guild_id AND discord_id = :discord_id
            """),
            {"guild_id": str(guild_id), "discord_id": discord_id},
        )
        s.commit()

def get_user_servers_with_config_status(discord_id: str) -> list[dict]:
    """
    Get all servers owned/administered by a user with config status.
    Config is considered complete when: mod_channel is set AND at least one channel exists.
    """
    with DB() as s:
        rows = s.execute(
            text("""
                SELECT
                    s.server_id,
                    s.server_name,
                    s.prefix,
                    s.max_tokens,
                    s.mod_channel,
                    s.kb_spec_id,
                    s.web_spec_id,
                    s.added_at,
                    s.updated_at,
                    s.is_paused,
                    COUNT(DISTINCT c.channel_id)::integer AS channel_count,
                    (COUNT(DISTINCT c.channel_id) > 0)::boolean AS has_channels,
                    (s.mod_channel IS NOT NULL)::boolean AS has_mod_channel,
                    (s.kb_spec_id IS NOT NULL)::boolean AS has_kb,
                    (s.web_spec_id IS NOT NULL)::boolean AS has_web,
                    CASE
                        WHEN s.mod_channel IS NOT NULL
                             AND s.kb_spec_id IS NOT NULL
                             AND COUNT(DISTINCT c.channel_id) > 0
                        THEN 'configured'
                        WHEN s.mod_channel IS NOT NULL
                             OR s.kb_spec_id IS NOT NULL
                             OR COUNT(DISTINCT c.channel_id) > 0
                        THEN 'partial'
                        ELSE 'unconfigured'
                    END AS config_status
                FROM servers s
                INNER JOIN guild_admins ga ON s.server_id = ga.guild_id
                LEFT JOIN channels c ON s.server_id = c.server_id
                WHERE ga.discord_id = :discord_id
                GROUP BY s.server_id, s.server_name, s.prefix, s.max_tokens,
                         s.mod_channel, s.kb_spec_id, s.web_spec_id,
                         s.added_at, s.updated_at, s.is_paused
                ORDER BY s.added_at DESC
            """),
            {"discord_id": discord_id},
        ).mappings().all()

        return [
            {
                "guild_id":       row["server_id"],
                "name":           row["server_name"],
                "prefix":         row["prefix"],
                "max_tokens":     row["max_tokens"],
                "mod_channel":    row["mod_channel"],
                "kb_spec_id":     row["kb_spec_id"],
                "web_spec_id":    row["web_spec_id"],
                "is_paused":      row["is_paused"],
                "config_status":  row["config_status"],
                "has_channels":   row["has_channels"],
                "has_mod_channel": row["has_mod_channel"],
                "has_kb":         row["has_kb"],
                "has_web":        row["has_web"],
                "channel_count":  row["channel_count"],
                "added_at":       row["added_at"].isoformat() if row.get("added_at") else None,
                "updated_at":     row["updated_at"].isoformat() if row.get("updated_at") else None,
            }
            for row in rows
        ]


def get_all_servers_with_config_status() -> list[dict]:
    """
    Get all servers with their config status (admin use only).
    """
    with DB() as s:
        rows = s.execute(
            text("""
                SELECT
                    s.server_id,
                    s.server_name,
                    s.prefix,
                    s.max_tokens,
                    s.mod_channel,
                    s.kb_spec_id,
                    s.web_spec_id,
                    s.added_at,
                    s.updated_at,
                    s.is_paused,
                    COUNT(DISTINCT c.channel_id)::integer AS channel_count,
                    (COUNT(DISTINCT c.channel_id) > 0)::boolean AS has_channels,
                    (s.mod_channel IS NOT NULL)::boolean AS has_mod_channel,
                    (s.kb_spec_id IS NOT NULL)::boolean AS has_kb,
                    (s.web_spec_id IS NOT NULL)::boolean AS has_web,
                    CASE
                        WHEN s.mod_channel IS NOT NULL
                             AND s.kb_spec_id IS NOT NULL
                             AND COUNT(DISTINCT c.channel_id) > 0
                        THEN 'configured'
                        WHEN s.mod_channel IS NOT NULL
                             OR s.kb_spec_id IS NOT NULL
                             OR COUNT(DISTINCT c.channel_id) > 0
                        THEN 'partial'
                        ELSE 'unconfigured'
                    END AS config_status
                FROM servers s
                LEFT JOIN channels c ON s.server_id = c.server_id
                GROUP BY s.server_id, s.server_name, s.prefix, s.max_tokens,
                         s.mod_channel, s.kb_spec_id, s.web_spec_id,
                         s.added_at, s.updated_at, s.is_paused
                ORDER BY s.added_at DESC
            """),
        ).mappings().all()

        return [
            {
                "guild_id":       row["server_id"],
                "name":           row["server_name"],
                "prefix":         row["prefix"],
                "max_tokens":     row["max_tokens"],
                "mod_channel":    row["mod_channel"],
                "kb_spec_id":     row["kb_spec_id"],
                "web_spec_id":    row["web_spec_id"],
                "is_paused":      row["is_paused"],
                "config_status":  row["config_status"],
                "has_channels":   row["has_channels"],
                "has_mod_channel": row["has_mod_channel"],
                "has_kb":         row["has_kb"],
                "has_web":        row["has_web"],
                "channel_count":  row["channel_count"],
                "added_at":       row["added_at"].isoformat() if row.get("added_at") else None,
                "updated_at":     row["updated_at"].isoformat() if row.get("updated_at") else None,
            }
            for row in rows
        ]


# ---------------------------------------------------------------------------
# server_uploads / server_feeds
# ---------------------------------------------------------------------------

def add_content_id(server_id: str, content_id: str) -> None:
    with DB() as s:
        s.execute(
            text("""
                INSERT INTO server_uploads (server_id, content_id)
                VALUES (:server_id, :content_id)
            """),
            {"server_id": server_id, "content_id": content_id},
        )
        s.commit()


def add_feed_id(server_id: str, feed_id: str) -> None:
    with DB() as s:
        s.execute(
            text("""
                INSERT INTO server_feeds (server_id, feed_id)
                VALUES (:server_id, :feed_id)
            """),
            {"server_id": server_id, "feed_id": feed_id},
        )
        s.commit()


def get_content_ids(server_id: str) -> list[str]:
    with DB() as s:
        rows = s.execute(
            text("SELECT content_id FROM server_uploads WHERE server_id = :server_id"),
            {"server_id": server_id},
        ).fetchall()
        return [row[0] for row in rows]


def get_feed_ids(server_id: str) -> list[str]:
    with DB() as s:
        rows = s.execute(
            text("SELECT feed_id FROM server_feeds WHERE server_id = :server_id"),
            {"server_id": server_id},
        ).fetchall()
        return [row[0] for row in rows]


def get_kb_spec_id(guild_id: str) -> Optional[str]:
    with DB() as s:
        row = s.execute(
            text("SELECT kb_spec_id FROM servers WHERE server_id = :id"),
            {"id": str(guild_id)},
        ).mappings().first()
        return row["kb_spec_id"] if row else None


def get_web_spec_id(guild_id: str) -> Optional[str]:
    with DB() as s:
        row = s.execute(
            text("SELECT web_spec_id FROM servers WHERE server_id = :id"),
            {"id": str(guild_id)},
        ).mappings().first()
        return row["web_spec_id"] if row else None
    
def remove_content_id(server_id: str, content_id: str) -> bool:
    with DB() as s:
        result = s.execute(
            text("""
                DELETE FROM server_uploads
                WHERE server_id = :server_id AND content_id = :content_id
            """),
            {"server_id": server_id, "content_id": content_id},
        )
        s.commit()
        return result.rowcount > 0


def remove_feed_id(server_id: str, feed_id: str) -> bool:
    with DB() as s:
        result = s.execute(
            text("""
                DELETE FROM server_feeds
                WHERE server_id = :server_id AND feed_id = :feed_id
            """),
            {"server_id": server_id, "feed_id": feed_id},
        )
        s.commit()
        return result.rowcount > 0
    
def get_upload_by_id(upload_id: str, guild_id: str) -> dict | None:
    with DB() as s:
        row = s.execute(
            text("SELECT * FROM uploads WHERE id = :id AND server_id = :sid"),
            {"id": upload_id, "sid": str(guild_id)},
        ).mappings().first()
        return dict(row) if row else None
    
def get_user_guild_ids(discord_id: str) -> set:
    with DB() as s:
        rows = s.execute(
            text("SELECT guild_id FROM guild_admins WHERE discord_id = :uid"),
            {"uid": discord_id},
        ).mappings().all()
    return {row["guild_id"] for row in rows}

def update_pause_status(guild_id: str, is_paused: bool) -> int:
    with DB() as s:
        result = s.execute(
            text("UPDATE servers SET is_paused = :is_paused, updated_at = NOW() WHERE server_id = :id"),
            {"is_paused": is_paused, "id": str(guild_id)},
        )
        s.commit()
        return result.rowcount
    
def get_channel_config(guild_id:str,channel_id:str):
    with DB() as s:
        result=s.execute(text("Select language,tone From channel_config Where guild_id=:guild_id ANd channel_id=:channel_id"),{"guild_id":guild_id,"channel_id":channel_id})
        row = result.mappings().fetchone()
        return dict(row) if row else None

def insert_channel_config(guild_id: str, channel_id: str, language: str = "english", tone: str = "professional"):
    with DB() as s:
        s.execute(
            text("INSERT INTO channel_config (guild_id, channel_id, language, tone) VALUES (:guild_id, :channel_id, :language, :tone)"),
            {"guild_id": guild_id, "channel_id": channel_id, "language": language, "tone": tone}
        )
        s.commit()
        return 1
    return 0

def update_channel_config(guild_id: str, channel_id: str, language: str = None, tone: str = None):
    with DB() as s:
        if language and tone:
            s.execute(
                text("UPDATE channel_config SET language=:language, tone=:tone WHERE guild_id=:guild_id AND channel_id=:channel_id"),
                {"guild_id": guild_id, "channel_id": channel_id, "language": language, "tone": tone}
            )
        elif language:
            s.execute(
                text("UPDATE channel_config SET language=:language WHERE guild_id=:guild_id AND channel_id=:channel_id"),
                {"guild_id": guild_id, "channel_id": channel_id, "language": language}
            )
        elif tone:
            s.execute(
                text("UPDATE channel_config SET tone=:tone WHERE guild_id=:guild_id AND channel_id=:channel_id"),
                {"guild_id": guild_id, "channel_id": channel_id, "tone": tone}
            )
        s.commit()
        return 1
    return 0


def delete_channel_config(guild_id: str, channel_id: str):
    with DB() as s:
        s.execute(
            text("DELETE FROM channel_config WHERE guild_id=:guild_id AND channel_id=:channel_id"),
            {"guild_id": guild_id, "channel_id": channel_id}
        )
        s.commit()
        return 1
    return 0

def get_all_channel_configs(guild_id: str):
    try:
        with DB() as s:
            result = s.execute(
                text("SELECT channel_id, language, tone FROM channel_config WHERE guild_id=:guild_id"),
                {"guild_id": guild_id}
            )
            rows = result.mappings().fetchall()
            return [dict(row) for row in rows] if rows else []
    except Exception:
        return []
    
def get_web_search(server_id: str) -> bool:
    try:
        with DB() as s:
            result = s.execute(
                text("SELECT web_search FROM servers WHERE server_id = :server_id"),
                {"server_id": server_id}
            ).fetchone()
            return bool(result.web_search) if result else False
    except Exception as e:
        print(f"[get_web_search] Error: {e}")
        return False


def update_web_search(server_id: str, enabled: bool) -> int:
    try:
        with DB() as s:
            s.execute(
                text("UPDATE servers SET web_search = :enabled WHERE server_id = :server_id"),
                {"server_id": server_id, "enabled": enabled}
            )
            s.commit()
            return 1
    except Exception as e:
        print(f"[update_web_search] Error: {e}")
    return 0

def get_spec_id(server_id: str, spec_type: str) -> str | None:
    col = "kb_spec_id" if spec_type == "kb" else "web_spec_id"
    try:
        with DB() as s:
            result = s.execute(
                text(f"SELECT {col} FROM servers WHERE server_id = :server_id"),
                {"server_id": server_id}
            ).fetchone()
            return result[0] if result and result[0] else None
    except Exception as e:
        print(f"[get_spec_id] Error: {e}")
        return None


def save_spec_id(server_id: str, spec_type: str, spec_id: str | None):
    col = "kb_spec_id" if spec_type == "kb" else "web_spec_id"
    try:
        with DB() as s:
            s.execute(
                text(f"UPDATE servers SET {col} = :spec_id WHERE server_id = :server_id"),
                {"spec_id": spec_id, "server_id": server_id}
            )
            s.commit()
    except Exception as e:
        print(f"[save_spec_id] Error: {e}")

def sync_guild_admins(guild_id: str, guild_name: str, discord_id: str, role: str, granted_by: str):
    try:
        with DB() as s:
            s.execute(
                text("INSERT INTO servers (server_id, server_name) VALUES (:id, :name) ON CONFLICT DO NOTHING"),
                {"id": str(guild_id), "name": guild_name}
            )
            s.commit()
        with DB() as s:
            s.execute(
                text("""
                    INSERT INTO guild_admins (guild_id, discord_id, role, granted_by, granted_at)
                    VALUES (:guild_id, :discord_id, :role, :granted_by, NOW())
                    ON CONFLICT (guild_id, discord_id) DO UPDATE SET
                        role = CASE
                            WHEN guild_admins.role = 'owner' THEN 'owner'
                            ELSE EXCLUDED.role
                        END,
                        granted_by = EXCLUDED.granted_by
                """),
                {
                    "guild_id": str(guild_id),
                    "discord_id": discord_id,
                    "role": role,
                    "granted_by": granted_by
                }
            )
            s.commit()

    except Exception as e:
        print(f"[sync_guild_admins] Non-fatal error for {discord_id}: {e}")

def get_total_questions(server_id: str):
    try:
        with DB() as s:
            result = s.execute(
                text("SELECT count(*) FROM question_events WHERE server_id = :server_id"),
                {"server_id": server_id}
            )
            return result.scalar()
    except Exception as e:
        print(f"Failed To Get Total Questions: {e}")
        return None
    
def get_questions_last_30_days(server_id: str):
    try:
        with DB() as s:
            result = s.execute(
                text("SELECT count(*) FROM question_events WHERE server_id = :server_id AND asked_at >= now() - interval '30 days'"),
                {"server_id": server_id}
            )
            return result.scalar()
    except Exception as e:
        print(f"Failed To Get Questions Last 30 Days: {e}")
        return None
    
def get_server_plan(server_id: str) -> Optional[dict]:
    with DB() as s:
        row = s.execute(
            text("SELECT * FROM server_plans WHERE server_id = :server_id"),
            {"server_id": server_id},
        ).mappings().first()
        return dict(row) if row else None


def upsert_server_plan(server_id: str, plan: str, max_limit_questions: int) -> int:
    with DB() as s:
        result = s.execute(
            text("""
                INSERT INTO server_plans (server_id, plan, max_limit_questions)
                VALUES (:server_id, :plan, :max_limit_questions)
                ON CONFLICT (server_id) DO UPDATE SET
                    plan = EXCLUDED.plan,
                    max_limit_questions = EXCLUDED.max_limit_questions,
                    updated_at = NOW()
            """),
            {"server_id": server_id, "plan": plan, "max_limit_questions": max_limit_questions},
        )
        s.commit()
        return result.rowcount


def update_server_plan(server_id: str, plan: str) -> int:
    with DB() as s:
        result = s.execute(
            text("""
                UPDATE server_plans
                SET plan = :plan, updated_at = NOW()
                WHERE server_id = :server_id
            """),
            {"server_id": server_id, "plan": plan},
        )
        s.commit()
        return result.rowcount


def update_max_limit_questions(server_id: str, max_limit_questions: int) -> int:
    with DB() as s:
        result = s.execute(
            text("""
                UPDATE server_plans
                SET max_limit_questions = :max_limit_questions, updated_at = NOW()
                WHERE server_id = :server_id
            """),
            {"server_id": server_id, "max_limit_questions": max_limit_questions},
        )
        s.commit()
        return result.rowcount


def delete_server_plan(server_id: str) -> int:
    with DB() as s:
        result = s.execute(
            text("DELETE FROM server_plans WHERE server_id = :server_id"),
            {"server_id": server_id},
        )
        s.commit()
        return result.rowcount

def get_uploads_count_by_type(server_id: str) -> Optional[dict]:
    try:
        with DB() as s:
            url_count = s.execute(
                text("SELECT count(*) FROM uploads WHERE server_id = :server_id AND type = 'url' AND deleted_at IS NULL"),
                {"server_id": server_id}
            ).scalar()
            
            file_count = s.execute(
                text("SELECT count(*) FROM uploads WHERE server_id = :server_id AND type = 'pdf' AND deleted_at IS NULL"),
                {"server_id": server_id}
            ).scalar()
            
            return {"url": url_count, "file": file_count}
    except Exception as e:
        print(f"Failed To Get Uploads Count By Type: {e}")
        return None
    
def get_questions_since(server_id: str, billing_date) -> int:
    with DB() as s:
        result = s.execute(
            text("""
                SELECT count(*) FROM question_events 
                WHERE server_id = :server_id 
                AND asked_at >= :billing_date
            """),
            {"server_id": server_id, "billing_date": billing_date}
        )
        return result.scalar() or 0