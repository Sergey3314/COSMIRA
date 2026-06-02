import os
import json
import asyncio
import logging
import pathlib
from datetime import datetime

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
import asyncpg
from aiohttp import web
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()
logging.basicConfig(level=logging.INFO)

# ==========================================
# КОНФИГУРАЦИЯ
# ==========================================
BOT_TOKEN = os.getenv("BOT_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://cosmira-bot.onrender.com/")
PORT = int(os.getenv("PORT", 10000))

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# ==========================================
# БАЗА ДАННЫХ (PostgreSQL)
# ==========================================
async def get_conn():
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
        logging.info("✅ База данных инициализирована")
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
        row = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", str(user_id))
        return dict(row) if row else None
    finally:
        await conn.close()

# ==========================================
# AIogram: ЛОГИКА БОТА
# ==========================================
@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✨ Открыть COSMIRA", web_app=WebAppInfo(url=WEBAPP_URL))]
    ])
    await message.answer(
        "Привет! Я COSMIRA — твой персональный астролог. 🌌\n\n"
        "Нажми кнопку ниже, чтобы открыть приложение, заполнить данные и построить свою натальную карту!",
        reply_markup=kb
    )

@dp.message(lambda m: m.web_app_data)
async def handle_webapp_data(message: types.Message):
    data = message.web_app_data.data
    await message.answer(f"📥 Получены данные из приложения", parse_mode="Markdown")

# ==========================================
# Aiohttp: API ДЛЯ WEB APP
# ==========================================
async def handle_get_user(request):
    uid = request.query.get('uid')
    if not uid:
        return web.json_response({"error": "No uid"}, status=400)
    
    user = await get_user(uid)
    return web.json_response(user if user else {})

async def handle_save_user(request):
    try:
        data = await request.json()
        await save_user(
            user_id=str(data.get('id')),
            username=data.get('username', ''),
            name=data.get('name', 'Пользователь'),
            birth_date=data.get('birth_date'),
            birth_time=data.get('birth_time'),
            birth_place=data.get('birth_city', '')
        )
        return web.json_response({"status": "ok", "user": data})
    except Exception as e:
        return web.json_response({"status": "error", "error": str(e)}, status=500)

async def handle_horoscope(request):
    sign = request.query.get('sign', 'Aries')
    return web.json_response({
        "text": f"Энергия {sign} сегодня направлена на внутренние преображения. Отличный день для начала новых проектов."
    })

async def handle_natal(request):
    return web.json_response({
        "planets": {
            "Sun": {"sign_ru": "Лев", "degree": 15, "house": 5},
            "Moon": {"sign_ru": "Рак", "degree": 22, "house": 4},
            "Ascendant": {"sign_ru": "Скорпион", "degree": 10}
        },
        "interpretation": "Ваше Солнце в огненном знаке дает энергию, а Луна в Раке смягчает эмоциональный фон."
    })

async def handle_horary(request):
    try:
        data = await request.json()
        question = data.get('question', '')
        return web.json_response({
            "answer": f"Звёзды говорят: да, но действуйте осторожно. ({question})",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

# ==========================================
# ЗАПУСК (Web Server + Bot Polling)
# ==========================================
async def main():
    # 1. Инициализируем БД
    await init_db()
    
    # 2. Создаем веб-приложение
    web_app = web.Application()
    
    # === РАЗДАЧА СТАТИКИ (WEBAPP) ===
    webapp_dir = pathlib.Path(__file__).parent / 'webapp'
    web_app.router.add_static('/webapp/', path=webapp_dir)
    
    async def handle_webapp(request):
        return web.FileResponse(webapp_dir / 'index.html')
    
    web_app.router.add_get('/', handle_webapp)
    # =======================================
    
    # API endpoints
    web_app.router.add_get('/api/user', handle_get_user)
    web_app.router.add_post('/api/user', handle_save_user)
    web_app.router.add_get('/api/horoscope', handle_horoscope)
    web_app.router.add_get('/api/natal', handle_natal)
    web_app.router.add_post('/api/horary', handle_horary)
    
    # 3. Асинхронный запуск веб-сервера (без конфликта циклов событий!)
    runner = web.AppRunner(web_app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()
    logging.info(f"🚀 Web-сервер запущен на порту {PORT}")
    
    # 4. Запуск бота (работает в том же цикле событий, сервер продолжает работать в фоне)
    logging.info("🤖 Запуск бота...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())