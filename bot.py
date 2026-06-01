import os
import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram.filters import Command
from aiohttp import web

# ============================================
# ENV
# ============================================

load_dotenv()
TOKEN = os.getenv("TOKEN")
if not TOKEN:
    raise RuntimeError("TOKEN missing in .env!")

# ============================================
# LOGGING
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# ============================================
# CONFIG
# ============================================

USERS_FILE = "users.json"
ADMIN_ID = 8789067375
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "webapp"

# ============================================
# USERS
# ============================================

def load_users():
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=4)

def register_user(user):
    users = load_users()
    uid = str(user.id)
    
    if uid not in users:
        users[uid] = {
            "id": user.id,
            "username": user.username,
            "name": user.full_name,
            "joined": datetime.now().strftime("%d.%m.%Y %H:%M"),
            "messages": 0,
            "premium": False,
            "level": 1
        }
        logging.info(f"✅ New user: {uid}")
    
    users[uid]["messages"] = users[uid].get("messages", 0) + 1
    users[uid]["level"] = 1 + (users[uid]["messages"] // 50)
    save_users(users)
    return users[uid]

def get_user(uid):
    return load_users().get(str(uid))

# ============================================
# BOT
# ============================================

dp = Dispatcher()
logging.info("✅ COSMIRA BOT STARTED")

# 🔘 КЛАВИАТУРА
WEBAPP_URL = "https://cosmira-bot.onrender.com/"  # ← ТВОЙ RENDER URL!

main_kb = ReplyKeyboardMarkup(keyboard=[
    [KeyboardButton(text="🚀 Открыть COSMIRA", web_app=WebAppInfo(url=WEBAPP_URL))],
    [KeyboardButton(text="👤 Профиль"), KeyboardButton(text="💎 Premium")],
    [KeyboardButton(text="📊 Статистика"), KeyboardButton(text="⚙️ Настройки")]
], resize_keyboard=True)

# ============================================
# HANDLERS
# ============================================

@dp.message(Command("start"))
async def start_cmd(m: Message):
    register_user(m.from_user)
    await m.answer(
        "🌌 <b>COSMIRA AI</b>\n\n"
        "Добро пожаловать!\n\n"
        "Жми кнопку ниже 👇",
        reply_markup=main_kb,
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "👤 Профиль")
async def profile_cmd(m: Message):
    u = get_user(m.from_user.id) or {"name": "", "level": 1, "messages": 0}
    await m.answer(
        f"👤 <b>{u.get('name', m.from_user.full_name)}</b>\n\n"
        f"⭐ Уровень: {u.get('level', 1)}\n"
        f"💬 Сообщений: {u.get('messages', 0)}",
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "💎 Premium")
async def prem_cmd(m: Message):
    await m.answer("💎 <b>Premium</b>\n\nСкоро запуск! ✨", parse_mode=ParseMode.HTML)

@dp.message(F.text == "📊 Статистика")
async def stats_cmd(m: Message):
    users = load_users()
    total = len(users)
    msgs = sum(u.get("messages", 0) for u in users.values())
    await m.answer(f"📊 <b>Статистика</b>\n\n👥 {total} пользователей\n💬 {msgs} сообщений", parse_mode=ParseMode.HTML)

@dp.message(F.text == "⚙️ Настройки")
async def settings_cmd(m: Message):
    await m.answer("⚙️ В разработке...")

@dp.message()
async def echo(m: Message):
    await m.answer("Используй кнопки или /start 🚀")

# ============================================
# WEB API
# ============================================

async def api_health(request):
    return web.json_response({"status": "ok", "service": "COSMIRA"})

async def api_get_user(request):
    uid = request.match_info.get("uid")
    user = get_user(uid)
    if user:
        return web.json_response(user)
    return web.json_response({"error": "Not found"}, status=404)

async def api_update_user(request):
    try:
        data = await request.json()
        uid = data.get("userId")
        updates = data.get("updates", {})
        users = load_users()
        if str(uid) in users:
            users[str(uid)].update(updates)
            save_users(users)
            return web.json_response({"success": True})
        return web.json_response({"error": "Not found"}, status=404)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=400)

# ============================================
# SERVE WEBAPP (СТАТИКА)
# ============================================

async def serve_webapp(request):
    """Отдаёт index.html для главной"""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return web.FileResponse(index_path)
    return web.Response(text="WebApp not found", status=404)

async def serve_static(request):
    """Отдаёт CSS/JS файлы"""
    file_path = STATIC_DIR / request.match_info["filename"]
    if file_path.exists():
        return web.FileResponse(file_path)
    return web.Response(text="File not found", status=404)

# ============================================
# WEB SERVER
# ============================================

async def start_web_server():
    app = web.Application()
    
    # API routes
    app.router.add_get("/api/health", api_health)
    app.router.add_get("/api/user/{uid}", api_get_user)
    app.router.add_post("/api/update", api_update_user)
    
    # WebApp (главная)
    app.router.add_get("/", serve_webapp)
    
    # Статика (CSS, JS)
    app.router.add_get("/static/{filename}", serve_static, name="static")
    
    # CORS для WebApp
    @web.middleware
    async def cors_middleware(request, handler):
        response = await handler(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    app.middlewares.append(cors_middleware)
    
    runner = web.AppRunner(app)
    await runner.setup()
    
    port = int(os.environ.get("PORT", 10000))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    
    logging.info(f"🌐 Server running on port {port}")
    logging.info(f" WebApp: https://cosmira-bot.onrender.com/")

# ============================================
# MAIN
# ============================================

async def main():
    bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    
    # Запускаем веб-сервер и бота вместе
    web_task = asyncio.create_task(start_web_server())
    polling_task = asyncio.create_task(dp.start_polling(bot))
    
    await asyncio.gather(web_task, polling_task)

# ============================================
# START
# ============================================

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("🛑 Bot stopped")