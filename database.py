import asyncpg
import os
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL")

async def get_conn():
    # SSL берётся из строки подключения (?sslmode=require)
    return await asyncpg.connect(DATABASE_URL)

async def init_db():
    conn = await get_conn()
    try:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT,
                name TEXT,
                joined TEXT,
                premium BOOLEAN DEFAULT FALSE,
                free_uses INTEGER DEFAULT 3,
                birth_date TEXT,
                birth_time TEXT,
                birth_place TEXT
            )
        """)
    finally:
        await conn.close()

async def save_user(user_id, username, name, birth_date, birth_time, birth_place):
    conn = await get_conn()
    try:
        await conn.execute("""
            INSERT INTO users (user_id, username, name, joined, premium, free_uses, birth_date, birth_time, birth_place)
            VALUES ($1, $2, $3, $4, FALSE, 3, $5, $6, $7)
            ON CONFLICT (user_id) DO UPDATE SET
                username = $2, name = $3, birth_date = $5, birth_time = $6, birth_place = $7
        """, str(user_id), username, name, datetime.now().isoformat(), birth_date, birth_time, birth_place)
    finally:
        await conn.close()

async def get_user(user_id):
    conn = await get_conn()
    try:
        return await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", str(user_id))
    finally:
        await conn.close()

async def consume_free_use(user_id):
    conn = await get_conn()
    try:
        await conn.execute("UPDATE users SET free_uses = GREATEST(0, free_uses - 1) WHERE user_id = $1", str(user_id))
    finally:
        await conn.close()