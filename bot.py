import os
import json
import asyncio
import logging
from datetime import datetime

from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import (
    Message,
    ReplyKeyboardMarkup,
    KeyboardButton,
    WebAppInfo
)
from aiogram.filters import Command  # ← ДОБАВЛЕНО!

from aiohttp import web

# ============================================
# ENV
# ============================================

load_dotenv()

TOKEN = os.getenv("TOKEN")

if not TOKEN:
    raise RuntimeError("TOKEN is missing")

# ============================================
# LOGGING
# ============================================

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ============================================
# CONFIG
# ============================================

USERS_FILE = "users.json"
ADMIN_ID = 8789067375

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
            "level": 1,
            "zodiac": None
        }
        logging.info(f"New user registered: {uid}")
    
    users[uid]["messages"] += 1
    users[uid]["level"] = 1 + (users[uid]["messages"] // 50)
    
    save_users(users)
    return users[uid]

def get_user(uid):
    users = load_users()
    return users.get(str(uid))

def update_user_data(uid, data):
    users = load_users()
    if str(uid) in users:
        users[str(uid)].update(data)
        save_users(users)
        return True
    return False

# ============================================
# DISPATCHER
# ============================================

dp = Dispatcher()
logging.info("✅ COSMIRA BOT STARTED")

# ============================================
# KEYBOARD
# ============================================

main_keyboard = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="🚀 Открыть COSMIRA", web_app=WebAppInfo(url="https://cosmira.netlify.app/"))],
        [KeyboardButton(text="👤 Профиль"), KeyboardButton(text="💎 Premium")],
        [KeyboardButton(text="📊 Статистика"), KeyboardButton(text="⚙️ Настройки")]
    ],
    resize_keyboard=True
)

# ============================================
# HANDLERS
# ============================================

@dp.message(Command("start"))
async def start_handler(message: Message):
    try:
        logging.info(f"Start command from user: {message.from_user.id}")
        register_user(message.from_user)
        
        await message.answer(
            "🌌 <b>COSMIRA AI</b>\n\n"
            "Добро пожаловать в будущее!\n\n"
            "✨ AI платформа\n"
            "🚀 WebApp\n"
            "💎 Premium\n\n"
            "Нажми кнопку ниже 👇",
            reply_markup=main_keyboard,
            parse_mode=ParseMode.HTML
        )
        logging.info(f"Start response sent to {message.from_user.id}")
    except Exception as e:
        logging.error(f"Start handler error: {e}")
        await message.answer("Привет! Бот работает 🚀")

@dp.message(Command("admin"))
async def admin_handler(message: Message):
    if message.from_user.id != ADMIN_ID:
        await message.answer("⛔ Доступ запрещён")
        return
    
    users = load_users()
    total = len(users)
    msgs = sum(u.get("messages", 0) for u in users.values())
    
    await message.answer(
        f"👑 <b>ADMIN PANEL</b>\n\n"
        f"👥 Пользователей: {total}\n"
        f"💬 Сообщений: {msgs}",
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "👤 Профиль")
async def profile_handler(message: Message):
    user = get_user(message.from_user.id)
    if not user:
        user = register_user(message.from_user)
    
    await message.answer(
        f"👤 <b>Профиль</b>\n\n"
        f"🆔 ID: <code>{user['id']}</code>\n"
        f"📛 Имя: {user['name']}\n"
        f"⭐ Уровень: {user['level']}\n"
        f"💬 Сообщений: {user['messages']}\n"
        f"👑 Premium: {'Да' if user['premium'] else 'Нет'}",
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "💎 Premium")
async def premium_handler(message: Message):
    await message.answer(
        "💎 <b>COSMIRA PREMIUM</b>\n\n"
        "✨ Безлимитный AI\n"
        "⚡ Максимальная скорость\n"
        "🚀 Эксклюзивные функции\n\n"
        "Скоро запуск!",
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "📊 Статистика")
async def stats_handler(message: Message):
    users = load_users()
    await message.answer(
        f"📊 <b>Статистика</b>\n\n"
        f"👥 Пользователей: {len(users)}\n"
        f"💬 Всего сообщений: {sum(u.get('messages', 0) for u in users.values())}",
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "⚙️ Настройки")
async def settings_handler(message: Message):
    await message.answer("⚙️ Настройки в разработке...")

@dp.message()
async def echo_handler(message: Message):
    await message.answer(f"📨 Получено: {message.text}\n\nИспользуй команды или кнопки!")

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
    data = await request.json()
    uid = data.get("userId")
    updates = data.get("updates", {})
    if update_user_data(uid, updates):
        return web.json_response({"success": True})
    return web.json_response({"error": "Not found"}, status=404)

async def start_web_server():
    app = web.Application()
    app.router.add_get("/api/health", api_health)
    app.router.add_get("/api/user/{uid}", api_get_user)
    app.router.add_post("/api/update", api_update_user)
    
    runner = web.AppRunner(app)
    await runner.setup()
    
    port = int(os.environ.get("PORT", 10000))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logging.info(f"🌐 Web API on port {port}")

# ============================================
# MAIN
# ============================================

async def main():
    bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    
    web_task = asyncio.create_task(start_web_server())
    polling_task = asyncio.create_task(dp.start_polling(bot))
    
    await asyncio.gather(web_task, polling_task)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("🛑 Bot stopped")