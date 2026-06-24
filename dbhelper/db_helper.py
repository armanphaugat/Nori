import os
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
import asyncio
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "")
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_pre_ping=False,
    pool_size=20,
    max_overflow=40,
    pool_recycle=300,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }
)
AsyncDB = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
PLAN_LIMITS = {
    "free": 50,
    "starter": 200,
    "growth": 500,
    "pro": 800,
    "enterprise": 1000000,
}

PLAN_URL_LIMITS = {
    "free": 5,
    "starter": 10,
    "growth": 30,
    "pro": 50,
    "enterprise": 1000000,
}

PLAN_FILE_LIMITS = {
    "free": 3,
    "starter": 10,
    "growth": 30,
    "pro": 50,
    "enterprise": 1000000,
}

async def add_server(guild_id: str, name: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("INSERT INTO servers (server_id, server_name) VALUES (:id, :name) ON CONFLICT DO NOTHING"),
            {"id": str(guild_id), "name": name},
        )
        await s.commit()


async def get_server(guild_id: str) -> Optional[dict]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT * FROM servers WHERE server_id = :id"),
                {"id": str(guild_id)},
            )
        ).mappings().first()
        return dict(row) if row else None


async def get_all_servers(limit: int = 100, offset: int = 0) -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("SELECT * FROM servers ORDER BY added_at DESC LIMIT :limit OFFSET :offset"),
                {"limit": limit, "offset": offset},
            )
        ).mappings().all()
        return [dict(r) for r in rows]


async def reset_server_settings(guild_id: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("UPDATE servers SET prefix='-', max_tokens=1024, updated_at=NOW() WHERE server_id=:id"),
            {"id": str(guild_id)},
        )
        await s.commit()


async def update_max_tokens(guild_id: str, value: int) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("UPDATE servers SET max_tokens=:value, updated_at=NOW() WHERE server_id=:id"),
            {"value": value, "id": str(guild_id)},
        )
        await s.commit()
        return result.rowcount


async def update_pause_status(guild_id: str, is_paused: bool) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("UPDATE servers SET is_paused=:is_paused, updated_at=NOW() WHERE server_id=:id"),
            {"is_paused": is_paused, "id": str(guild_id)},
        )
        await s.commit()
        return result.rowcount


# ---------------------------------------------------------------------------
# Channels
# ---------------------------------------------------------------------------

async def set_channel(guild_id: str, channel_id: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("INSERT INTO channels (server_id, channel_id) VALUES (:guild_id, :channel_id) ON CONFLICT DO NOTHING"),
            {"guild_id": str(guild_id), "channel_id": str(channel_id)},
        )
        await s.commit()


async def remove_channel(guild_id: str, channel_id: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("DELETE FROM channels WHERE server_id=:guild_id AND channel_id=:channel_id"),
            {"guild_id": str(guild_id), "channel_id": str(channel_id)},
        )
        await s.commit()


async def get_channels(guild_id: str) -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("SELECT channel_id FROM channels WHERE server_id=:guild_id"),
                {"guild_id": str(guild_id)},
            )
        ).mappings().all()
        return [dict(r) for r in rows]


async def get_all_channels(limit: int = 100, offset: int = 0) -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("SELECT * FROM channels ORDER BY added_at DESC LIMIT :limit OFFSET :offset"),
                {"limit": limit, "offset": offset},
            )
        ).mappings().all()
        return [dict(r) for r in rows]

async def get_mod_channel(guild_id: str) -> Optional[dict]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT mod_channel FROM servers WHERE server_id=:id"),
                {"id": str(guild_id)},
            )
        ).mappings().first()
        return dict(row) if row else None


async def insert_mod_channel(guild_id: str, channel_id: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("UPDATE servers SET mod_channel=:channel_id, updated_at=NOW() WHERE server_id=:id"),
            {"channel_id": str(channel_id), "id": str(guild_id)},
        )
        await s.commit()


async def remove_mod_channel(guild_id: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("UPDATE servers SET mod_channel=NULL, updated_at=NOW() WHERE server_id=:id"),
            {"id": str(guild_id)},
        )
        await s.commit()

async def log_upload(
    guild_id, user_id, username, kind, name,
    content_id=None,
    feed_id=None,
    status="ok",
    error=None,
) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("""
                INSERT INTO uploads
                    (server_id, uploaded_by, username, type, name, content_id, feed_id, status, error)
                VALUES
                    (:sid, :uid, :uname, :type, :name, :cid, :fid, :status, :error)
            """),
            {
                "sid": str(guild_id), "uid": str(user_id), "uname": username,
                "type": kind, "name": name,
                "cid": content_id, "fid": feed_id,
                "status": status, "error": error,
            },
        )
        await s.commit()


async def get_uploads(guild_id: str, limit: int = 100, offset: int = 0) -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("""
                    SELECT * FROM uploads
                    WHERE server_id=:id
                    ORDER BY uploaded_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                {"id": str(guild_id), "limit": limit, "offset": offset},
            )
        ).mappings().all()
        return [dict(r) for r in rows]

get_all_uploads = get_uploads

async def remove_upload(upload_id: str, guild_id: str) -> bool:
    async with AsyncDB() as s:
        result = await s.execute(
            text("DELETE FROM uploads WHERE id=:id AND server_id=:sid RETURNING id"),
            {"id": upload_id, "sid": str(guild_id)},
        )
        await s.commit()
        return result.fetchone() is not None


async def get_upload_by_id(upload_id: str, guild_id: str) -> Optional[dict]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT * FROM uploads WHERE id=:id AND server_id=:sid"),
                {"id": upload_id, "sid": str(guild_id)},
            )
        ).mappings().first()
        return dict(row) if row else None

async def get_uploads_count_by_type(server_id: str) -> dict:
    """Single query instead of two separate ones."""
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("""
                    SELECT type, count(*) AS cnt
                    FROM uploads
                    WHERE server_id=:server_id AND deleted_at IS NULL
                    GROUP BY type
                """),
                {"server_id": server_id},
            )
        ).fetchall()
        counts = {"url": 0, "file": 0}
        for row in rows:
            counts[row[0]] = row[1]
        return counts

async def log_question_event(
    guild_id: str,
    user_id: str,
    answered: bool,
    latency_ms: Optional[float] = None,
    message_link: Optional[str] = None,
) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("""
                INSERT INTO question_events (server_id, user_id, answered, latency_ms, message_link)
                VALUES (:sid, :uid, :answered, :latency_ms, :message_link)
            """),
            {
                "sid": str(guild_id),
                "uid": str(user_id),
                "answered": answered,
                "latency_ms": latency_ms,
                "message_link": message_link,
            },
        )
        await s.commit()


async def get_analytics(guild_id: str, limit: int = 30, offset: int = 0) -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("""
                    SELECT
                        (asked_at AT TIME ZONE 'UTC')::date      AS day,
                        COUNT(*)                                  AS total,
                        COUNT(*) FILTER (WHERE answered = true)   AS answered,
                        COUNT(*) FILTER (WHERE answered = false)  AS unanswered,
                        ROUND(AVG(latency_ms)::numeric, 2)        AS avg_latency_ms,
                        COUNT(DISTINCT user_id)                   AS unique_users
                    FROM question_events
                    WHERE server_id=:guild_id
                    GROUP BY day
                    ORDER BY day DESC
                    LIMIT :limit OFFSET :offset
                """),
                {"guild_id": str(guild_id), "limit": limit, "offset": offset},
            )
        ).mappings().all()
        return [dict(r) for r in rows]


async def get_analytics_summary(guild_id: str) -> Optional[dict]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("""
                    SELECT
                        COUNT(DISTINCT (asked_at AT TIME ZONE 'UTC')::date) AS total_days,
                        COUNT(*)                                             AS total_questions,
                        COUNT(*) FILTER (WHERE answered = true)             AS answered,
                        COUNT(*) FILTER (WHERE answered = false)            AS unanswered,
                        ROUND(
                            100.0 * COUNT(*) FILTER (WHERE answered = true)
                            / NULLIF(COUNT(*), 0), 1
                        )                                                    AS answer_rate_pct,
                        ROUND(AVG(latency_ms)::numeric, 2)                  AS avg_latency_ms,
                        COUNT(DISTINCT user_id)                             AS unique_users
                    FROM question_events
                    WHERE server_id=:guild_id
                """),
                {"guild_id": str(guild_id)},
            )
        ).mappings().first()
        return dict(row) if row else None


async def get_recent_events(guild_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("""
                    SELECT id, user_id, asked_at, answered, latency_ms
                    FROM question_events
                    WHERE server_id=:guild_id
                    ORDER BY asked_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                {"guild_id": str(guild_id), "limit": limit, "offset": offset},
            )
        ).mappings().all()
        return [dict(r) for r in rows]


async def get_total_questions(server_id: str) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("SELECT count(*) FROM question_events WHERE server_id=:server_id"),
            {"server_id": server_id},
        )
        return result.scalar() or 0


async def get_questions_last_30_days(server_id: str) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("""
                SELECT count(*) FROM question_events
                WHERE server_id=:server_id
                AND asked_at >= now() - interval '30 days'
            """),
            {"server_id": server_id},
        )
        return result.scalar() or 0


async def get_questions_since(server_id: str, billing_date) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("""
                SELECT count(*) FROM question_events
                WHERE server_id=:server_id AND asked_at >= :billing_date
            """),
            {"server_id": server_id, "billing_date": billing_date},
        )
        return result.scalar() or 0

async def upsert_admin_user(
    discord_id: str,
    username: str,
    avatar: Optional[str],
    email: Optional[str],
    discord_access_token: str,
    discord_refresh_token: str,
    discord_token_expiry: datetime,
) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("""
                INSERT INTO admin_users (
                    discord_id, username, avatar, email,
                    discord_access_token, discord_refresh_token, discord_token_expiry,
                    created_at, last_login
                )
                VALUES (
                    :discord_id, :username, :avatar, :email,
                    :d_at, :d_rt, :d_exp, NOW(), NOW()
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
                "discord_id": discord_id, "username": username,
                "avatar": avatar, "email": email,
                "d_at": discord_access_token,
                "d_rt": discord_refresh_token,
                "d_exp": discord_token_expiry,
            },
        )
        await s.commit()


async def get_admin_user(discord_id: str) -> Optional[dict]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT * FROM admin_users WHERE discord_id=:discord_id"),
                {"discord_id": discord_id},
            )
        ).mappings().fetchone()
        return dict(row) if row else None


async def get_admin_by_email(email: str) -> Optional[str]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT discord_id FROM admin_users WHERE email=:email"),
                {"email": email},
            )
        ).fetchone()
        return row[0] if row else None


async def create_session(
    discord_id: str,
    refresh_token_hash: str,
    expires_at: datetime,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> str:
    async with AsyncDB() as s:
        result = await s.execute(
            text("""
                INSERT INTO admin_sessions (
                    discord_id, refresh_token_hash,
                    issued_at, expires_at, revoked,
                    user_agent, ip_address
                )
                VALUES (:discord_id, :hash, NOW(), :expires_at, FALSE, :ua, :ip)
                RETURNING id
            """),
            {
                "discord_id": discord_id, "hash": refresh_token_hash,
                "expires_at": expires_at, "ua": user_agent, "ip": ip_address,
            },
        )
        await s.commit()
        return str(result.fetchone()[0])


async def get_session_by_hash(refresh_token_hash: str) -> Optional[dict]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT * FROM admin_sessions WHERE refresh_token_hash=:hash"),
                {"hash": refresh_token_hash},
            )
        ).mappings().fetchone()
        return dict(row) if row else None


async def revoke_session(session_id: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("UPDATE admin_sessions SET revoked=TRUE WHERE id=:id"),
            {"id": session_id},
        )
        await s.commit()


async def revoke_session_by_id(session_id: str, owner_discord_id: str) -> bool:
    async with AsyncDB() as s:
        result = await s.execute(
            text("""
                UPDATE admin_sessions SET revoked=TRUE
                WHERE id=:id AND discord_id=:discord_id AND revoked=FALSE
                RETURNING id
            """),
            {"id": session_id, "discord_id": owner_discord_id},
        )
        await s.commit()
        return result.fetchone() is not None


async def get_user_sessions(discord_id: str) -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("""
                    SELECT id, discord_id, issued_at, expires_at,
                           revoked, user_agent, ip_address
                    FROM admin_sessions
                    WHERE discord_id=:discord_id AND expires_at > NOW()
                    ORDER BY issued_at DESC
                """),
                {"discord_id": discord_id},
            )
        ).mappings().fetchall()
        return [dict(r) for r in rows]


async def get_guild_admin(guild_id: str, discord_id: str) -> Optional[dict]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT * FROM guild_admins WHERE guild_id=:guild_id AND discord_id=:discord_id"),
                {"guild_id": str(guild_id), "discord_id": discord_id},
            )
        ).mappings().fetchone()
        return dict(row) if row else None


async def add_guild_admin(guild_id: str, discord_id: str, role: str, granted_by: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
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
            {"guild_id": str(guild_id), "discord_id": discord_id, "role": role, "granted_by": granted_by},
        )
        await s.commit()


async def remove_guild_admin(guild_id: str, discord_id: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("DELETE FROM guild_admins WHERE guild_id=:guild_id AND discord_id=:discord_id"),
            {"guild_id": str(guild_id), "discord_id": discord_id},
        )
        await s.commit()


async def get_user_guild_ids(discord_id: str) -> set:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("SELECT guild_id FROM guild_admins WHERE discord_id=:uid"),
                {"uid": discord_id},
            )
        ).mappings().all()
    return {row["guild_id"] for row in rows}


async def get_servers_by_admin(discord_id: str) -> list[str]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("SELECT guild_id FROM guild_admins WHERE discord_id=:discord_id"),
                {"discord_id": discord_id},
            )
        ).fetchall()
        return [row[0] for row in rows]


async def sync_guild_admins(
    guild_id: str, guild_name: str, discord_id: str, role: str, granted_by: str
) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("INSERT INTO servers (server_id, server_name) VALUES (:id, :name) ON CONFLICT DO NOTHING"),
            {"id": str(guild_id), "name": guild_name},
        )
        await s.execute(
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
            {"guild_id": str(guild_id), "discord_id": discord_id, "role": role, "granted_by": granted_by},
        )
        await s.commit()

async def get_user_servers_with_config_status(discord_id: str) -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("""
                    SELECT
                        s.server_id, s.server_name, s.prefix, s.max_tokens,
                        s.mod_channel, s.kb_spec_id, s.web_spec_id,
                        s.added_at, s.updated_at, s.is_paused,
                        COUNT(DISTINCT c.channel_id)::integer        AS channel_count,
                        (COUNT(DISTINCT c.channel_id) > 0)::boolean  AS has_channels,
                        (s.mod_channel IS NOT NULL)::boolean          AS has_mod_channel,
                        (s.kb_spec_id IS NOT NULL)::boolean           AS has_kb,
                        (s.web_spec_id IS NOT NULL)::boolean          AS has_web,
                        CASE
                            WHEN s.mod_channel IS NOT NULL
                                 AND s.kb_spec_id IS NOT NULL
                                 AND COUNT(DISTINCT c.channel_id) > 0 THEN 'configured'
                            WHEN s.mod_channel IS NOT NULL
                                 OR s.kb_spec_id IS NOT NULL
                                 OR COUNT(DISTINCT c.channel_id) > 0  THEN 'partial'
                            ELSE 'unconfigured'
                        END AS config_status
                    FROM servers s
                    INNER JOIN guild_admins ga ON s.server_id = ga.guild_id
                    LEFT JOIN channels c ON s.server_id = c.server_id
                    WHERE ga.discord_id=:discord_id
                    GROUP BY s.server_id, s.server_name, s.prefix, s.max_tokens,
                             s.mod_channel, s.kb_spec_id, s.web_spec_id,
                             s.added_at, s.updated_at, s.is_paused
                    ORDER BY s.added_at DESC
                """),
                {"discord_id": discord_id},
            )
        ).mappings().all()

        return [
            {
                "guild_id":        row["server_id"],
                "name":            row["server_name"],
                "prefix":          row["prefix"],
                "max_tokens":      row["max_tokens"],
                "mod_channel":     row["mod_channel"],
                "kb_spec_id":      row["kb_spec_id"],
                "web_spec_id":     row["web_spec_id"],
                "is_paused":       row["is_paused"],
                "config_status":   row["config_status"],
                "has_channels":    row["has_channels"],
                "has_mod_channel": row["has_mod_channel"],
                "has_kb":          row["has_kb"],
                "has_web":         row["has_web"],
                "channel_count":   row["channel_count"],
                "added_at":        row["added_at"].isoformat() if row.get("added_at") else None,
                "updated_at":      row["updated_at"].isoformat() if row.get("updated_at") else None,
            }
            for row in rows
        ]


async def get_all_servers_with_config_status() -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("""
                    SELECT
                        s.server_id, s.server_name, s.prefix, s.max_tokens,
                        s.mod_channel, s.kb_spec_id, s.web_spec_id,
                        s.added_at, s.updated_at, s.is_paused,
                        COUNT(DISTINCT c.channel_id)::integer        AS channel_count,
                        (COUNT(DISTINCT c.channel_id) > 0)::boolean  AS has_channels,
                        (s.mod_channel IS NOT NULL)::boolean          AS has_mod_channel,
                        (s.kb_spec_id IS NOT NULL)::boolean           AS has_kb,
                        (s.web_spec_id IS NOT NULL)::boolean          AS has_web,
                        CASE
                            WHEN s.mod_channel IS NOT NULL
                                 AND s.kb_spec_id IS NOT NULL
                                 AND COUNT(DISTINCT c.channel_id) > 0 THEN 'configured'
                            WHEN s.mod_channel IS NOT NULL
                                 OR s.kb_spec_id IS NOT NULL
                                 OR COUNT(DISTINCT c.channel_id) > 0  THEN 'partial'
                            ELSE 'unconfigured'
                        END AS config_status
                    FROM servers s
                    LEFT JOIN channels c ON s.server_id = c.server_id
                    GROUP BY s.server_id, s.server_name, s.prefix, s.max_tokens,
                             s.mod_channel, s.kb_spec_id, s.web_spec_id,
                             s.added_at, s.updated_at, s.is_paused
                    ORDER BY s.added_at DESC
                """),
            )
        ).mappings().all()

        return [
            {
                "guild_id":        row["server_id"],
                "name":            row["server_name"],
                "prefix":          row["prefix"],
                "max_tokens":      row["max_tokens"],
                "mod_channel":     row["mod_channel"],
                "kb_spec_id":      row["kb_spec_id"],
                "web_spec_id":     row["web_spec_id"],
                "is_paused":       row["is_paused"],
                "config_status":   row["config_status"],
                "has_channels":    row["has_channels"],
                "has_mod_channel": row["has_mod_channel"],
                "has_kb":          row["has_kb"],
                "has_web":         row["has_web"],
                "channel_count":   row["channel_count"],
                "added_at":        row["added_at"].isoformat() if row.get("added_at") else None,
                "updated_at":      row["updated_at"].isoformat() if row.get("updated_at") else None,
            }
            for row in rows
        ]

async def add_content_id(server_id: str, content_id: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("INSERT INTO server_uploads (server_id, content_id) VALUES (:server_id, :content_id)"),
            {"server_id": server_id, "content_id": content_id},
        )
        await s.commit()


async def add_feed_id(server_id: str, feed_id: str) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("INSERT INTO server_feeds (server_id, feed_id) VALUES (:server_id, :feed_id)"),
            {"server_id": server_id, "feed_id": feed_id},
        )
        await s.commit()


async def get_content_ids(server_id: str) -> list[str]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("SELECT content_id FROM server_uploads WHERE server_id=:server_id"),
                {"server_id": server_id},
            )
        ).fetchall()
        return [row[0] for row in rows]


async def get_feed_ids(server_id: str) -> list[str]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("SELECT feed_id FROM server_feeds WHERE server_id=:server_id"),
                {"server_id": server_id},
            )
        ).fetchall()
        return [row[0] for row in rows]


async def remove_content_id(server_id: str, content_id: str) -> bool:
    async with AsyncDB() as s:
        result = await s.execute(
            text("DELETE FROM server_uploads WHERE server_id=:server_id AND content_id=:content_id"),
            {"server_id": server_id, "content_id": content_id},
        )
        await s.commit()
        return result.rowcount > 0


async def remove_feed_id(server_id: str, feed_id: str) -> bool:
    async with AsyncDB() as s:
        result = await s.execute(
            text("DELETE FROM server_feeds WHERE server_id=:server_id AND feed_id=:feed_id"),
            {"server_id": server_id, "feed_id": feed_id},
        )
        await s.commit()
        return result.rowcount > 0

async def get_kb_spec_id(guild_id: str) -> Optional[str]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT kb_spec_id FROM servers WHERE server_id=:id"),
                {"id": str(guild_id)},
            )
        ).mappings().first()
        return row["kb_spec_id"] if row else None


async def get_web_spec_id(guild_id: str) -> Optional[str]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT web_spec_id FROM servers WHERE server_id=:id"),
                {"id": str(guild_id)},
            )
        ).mappings().first()
        return row["web_spec_id"] if row else None


async def get_spec_id(server_id: str, spec_type: str) -> Optional[str]:
    allowed = {"kb": "kb_spec_id", "web": "web_spec_id"}
    col = allowed.get(spec_type)
    if not col:
        raise ValueError(f"Invalid spec_type: {spec_type!r}")
    async with AsyncDB() as s:
        result = (
            await s.execute(
                text(f"SELECT {col} FROM servers WHERE server_id=:server_id"),
                {"server_id": server_id},
            )
        ).fetchone()
        return result[0] if result and result[0] else None


async def save_spec_id(server_id: str, spec_type: str, spec_id: Optional[str]) -> None:
    allowed = {"kb": "kb_spec_id", "web": "web_spec_id"}
    col = allowed.get(spec_type)
    if not col:
        raise ValueError(f"Invalid spec_type: {spec_type!r}")
    async with AsyncDB() as s:
        await s.execute(
            text(f"UPDATE servers SET {col}=:spec_id WHERE server_id=:server_id"),
            {"spec_id": spec_id, "server_id": server_id},
        )
        await s.commit()

async def get_channel_config(guild_id: str, channel_id: str) -> Optional[dict]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT language, tone FROM channel_config WHERE guild_id=:guild_id AND channel_id=:channel_id"),
                {"guild_id": guild_id, "channel_id": channel_id},
            )
        ).mappings().fetchone()
        return dict(row) if row else None

async def insert_channel_config(
    guild_id: str, channel_id: str, language: str = "english", tone: str = "professional"
) -> None:
    async with AsyncDB() as s:
        await s.execute(
            text("""
                INSERT INTO channel_config (guild_id, channel_id, language, tone)
                VALUES (:guild_id, :channel_id, :language, :tone)
            """),
            {"guild_id": guild_id, "channel_id": channel_id, "language": language, "tone": tone},
        )
        await s.commit()


async def update_channel_config(
    guild_id: str,
    channel_id: str,
    language: Optional[str] = None,
    tone: Optional[str] = None,
) -> bool:
    if not language and not tone:
        return False

    updates = []
    params: dict = {"guild_id": guild_id, "channel_id": channel_id}
    if language:
        updates.append("language=:language")
        params["language"] = language
    if tone:
        updates.append("tone=:tone")
        params["tone"] = tone

    async with AsyncDB() as s:
        result = await s.execute(
            text(f"UPDATE channel_config SET {', '.join(updates)} WHERE guild_id=:guild_id AND channel_id=:channel_id"),
            params,
        )
        await s.commit()
        return result.rowcount > 0


async def delete_channel_config(guild_id: str, channel_id: str) -> bool:
    async with AsyncDB() as s:
        result = await s.execute(
            text("DELETE FROM channel_config WHERE guild_id=:guild_id AND channel_id=:channel_id"),
            {"guild_id": guild_id, "channel_id": channel_id},
        )
        await s.commit()
        return result.rowcount > 0


async def get_all_channel_configs(guild_id: str) -> list[dict]:
    async with AsyncDB() as s:
        rows = (
            await s.execute(
                text("SELECT channel_id, language, tone FROM channel_config WHERE guild_id=:guild_id"),
                {"guild_id": guild_id},
            )
        ).mappings().fetchall()
        return [dict(row) for row in rows]

async def get_web_search(server_id: str) -> bool:
    async with AsyncDB() as s:
        result = (
            await s.execute(
                text("SELECT web_search FROM servers WHERE server_id=:server_id"),
                {"server_id": server_id},
            )
        ).fetchone()
        return bool(result.web_search) if result else False


async def update_web_search(server_id: str, enabled: bool) -> bool:
    async with AsyncDB() as s:
        result = await s.execute(
            text("UPDATE servers SET web_search=:enabled WHERE server_id=:server_id"),
            {"server_id": server_id, "enabled": enabled},
        )
        await s.commit()
        return result.rowcount > 0


async def get_server_plan(server_id: str) -> Optional[dict]:
    async with AsyncDB() as s:
        row = (
            await s.execute(
                text("SELECT * FROM server_plans WHERE server_id=:server_id"),
                {"server_id": server_id},
            )
        ).mappings().first()
        return dict(row) if row else None


async def upsert_server_plan(server_id: str, plan: str, max_limit_questions: int) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
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
        await s.commit()
        return result.rowcount


async def update_server_plan(server_id: str, plan: str) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("UPDATE server_plans SET plan=:plan, updated_at=NOW() WHERE server_id=:server_id"),
            {"server_id": server_id, "plan": plan},
        )
        await s.commit()
        return result.rowcount


async def update_max_limit_questions(server_id: str, max_limit_questions: int) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("""
                UPDATE server_plans
                SET max_limit_questions=:max_limit_questions, updated_at=NOW()
                WHERE server_id=:server_id
            """),
            {"server_id": server_id, "max_limit_questions": max_limit_questions},
        )
        await s.commit()
        return result.rowcount


async def delete_server_plan(server_id: str) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("DELETE FROM server_plans WHERE server_id=:server_id"),
            {"server_id": server_id},
        )
        await s.commit()
        return result.rowcount


async def update_server_plan_status(
    server_id: str,
    plan: str,
    max_limit: int,
    patreon_user_id: str = None,
    patreon_email: str = None,
) -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("""
                INSERT INTO server_plans (server_id, plan, max_limit_questions, patreon_user_id, patreon_email, updated_at)
                VALUES (:server_id, :plan, :max_limit, :patreon_user_id, :patreon_email, NOW())
                ON CONFLICT (server_id) DO UPDATE SET
                    plan = EXCLUDED.plan,
                    max_limit_questions = EXCLUDED.max_limit_questions,
                    patreon_user_id = COALESCE(EXCLUDED.patreon_user_id, server_plans.patreon_user_id),
                    patreon_email = COALESCE(EXCLUDED.patreon_email, server_plans.patreon_email),
                    updated_at = NOW()
            """),
            {
                "server_id": server_id, "plan": plan, "max_limit": max_limit,
                "patreon_user_id": patreon_user_id, "patreon_email": patreon_email,
            },
        )
        await s.commit()
        return result.rowcount
    
async def delete_spec_id(server_id: str, spec_type: str) -> int:
    async with AsyncDB() as s:
        if spec_type == "kb":
            result = await s.execute(
                text("UPDATE servers SET kb_spec_id = NULL WHERE server_id = :server_id"),
                {"server_id": server_id},
            )
        elif spec_type == "web":
            result = await s.execute(
                text("UPDATE servers SET web_spec_id = NULL WHERE server_id = :server_id"),
                {"server_id": server_id},
            )
        else:
            result = await s.execute(
                text("UPDATE servers SET kb_spec_id = NULL, web_spec_id = NULL WHERE server_id = :server_id"),
                {"server_id": server_id},
            )
        await s.commit()
        return result.rowcount

async def save_conversation_id(server_id: str, conversation_id: str, question: str = "", answer: str = "") -> int:
    async with AsyncDB() as s:
        result = await s.execute(
            text("""
                INSERT INTO conversation_history (server_id, conversation_id, question, answer)
                VALUES (:server_id, :conversation_id, :question, :answer)
                ON CONFLICT (conversation_id) DO NOTHING
            """),
            {
                "server_id": server_id,
                "conversation_id": conversation_id,
                "question": question,
                "answer": answer,
            },
        )
        await s.commit()
        return result.rowcount


async def get_conversation_ids(server_id: str, limit: int = 20) -> list[str]:
    async with AsyncDB() as s:
        result = await s.execute(
            text("""
                SELECT conversation_id FROM conversation_history
                WHERE server_id = :server_id
                ORDER BY created_at DESC
                LIMIT :limit
            """),
            {"server_id": server_id, "limit": limit},
        )
        rows = result.fetchall()
        return [row[0] for row in rows]


async def delete_old_conversations(server_id: str, keep: int = 20) -> list[str]:
    async with AsyncDB() as s:
        result = await s.execute(
            text("""
                DELETE FROM conversation_history
                WHERE id IN (
                    SELECT id FROM conversation_history
                    WHERE server_id = :server_id
                    ORDER BY created_at DESC
                    OFFSET :keep
                )
                RETURNING conversation_id
            """),
            {"server_id": server_id, "keep": keep},
        )
        await s.commit()
        rows = result.fetchall()
        return [row[0] for row in rows]


