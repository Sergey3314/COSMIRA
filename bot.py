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

from aiohttp import web

# ============================================
# ENV
# ============================================

load_dotenv()

TOKEN = os.getenv("TOKEN")

if not TOKEN:
    raise RuntimeError("TOKEN is missing in Render environment variables")

# ============================================
# LOGGING
# ============================================

logging.basicConfig(level=logging.INFO)

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
print("COSMIRA STARTED")

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
# TELEGRAM HANDLERS
# ============================================

@dp.message(F.text == "/start")
async def start_handler(message: Message):
    register_user(message.from_user)
    await message.answer(
        "🌌 <b>COSMIRA AI</b>\n\nДобро пожаловать в будущее.\n\n✨ AI платформа нового поколения\n🚀 WebApp интерфейс\n🧠 Умный помощник\n💎 Premium система\n\nНажмите кнопку ниже для запуска.",
        reply_markup=main_keyboard,
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "👤 Профиль")
async def profile_handler(message: Message):
    users = load_users()
    uid = str(message.from_user.id)
    
    if uid not in users:
        register_user(message.from_user)
        users = load_users()
    
    user = users[uid]
    await message.answer(
        f"👤 <b>Профиль</b>\n\n🆔 ID: <code>{user['id']}</code>\n📛 Имя: {user['name']}\n⭐ Уровень: {user['level']}\n💬 Сообщений: {user['messages']}\n👑 Premium: {'Да' if user['premium'] else 'Нет'}\n📅 Регистрация:\n{user['joined']}",
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "💎 Premium")
async def premium_handler(message: Message):
    await message.answer(
        "💎 <b>COSMIRA PREMIUM</b>\n\n✨ Безлимитный AI\n⚡ Максимальная скорость\n🧠 Продвинутые модели\n🎨 Генерация изображений\n🚀 Эксклюзивные функции\n\nСкоро запуск подписки.",
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "⚙️ Настройки")
async def settings_handler(message: Message):
    await message.answer("⚙️ <b>Настройки</b>\n\n🌙 Тема\n🔔 Уведомления\n🌍 Язык\n🎨 Интерфейс\n\nРаздел находится в разработке.", parse_mode=ParseMode.HTML)

@dp.message(F.text == "📊 Статистика")
async def stats_handler(message: Message):
    users = load_users()
    total_users = len(users)
    total_messages = sum(u.get("messages", 0) for u in users.values())
    await message.answer(f"📊 <b>COSMIRA</b>\n\n👥 Пользователей: {total_users}\n💬 Сообщений: {total_messages}", parse_mode=ParseMode.HTML)

@dp.message(F.text == "/admin")
async def admin_handler(message: Message):
    if message.from_user.id != ADMIN_ID:
        return
    users = load_users()
    total_users = len(users)
    total_messages = sum(u.get("messages", 0) for u in users.values())
    await message.answer(f"👑 ADMIN PANEL\n\n👥 Пользователей: {total_users}\n💬 Сообщений: {total_messages}\n🚀 COSMIRA ONLINE")

@dp.message()
async def ai_handler(message: Message):
    register_user(message.from_user)
    text = message.text.lower()
    
    if "привет" in text:
        answer = "👋 Привет.\n\nЯ COSMIRA AI.\n\nЧем могу помочь?"
    elif "бизнес" in text:
        answer = "💼 Бизнес идея:\nСоздать экосистему COSMIRA:\n• AI чат\n• WebApp\n• Telegram\n• Premium подписка\n• Генерация изображений"
    elif "ai" in text or "ии" in text:
        answer = "🧠 Искусственный интеллект:\nCOSMIRA объединяет:\n• AI чат\n• Анализ текста\n• Генерацию изображений\n• Автоматизацию задач"
    elif "сайт" in text:
        answer = "🌐 Сайт COSMIRA:\nhttps://cosmira.netlify.app"
    else:
        answer = f"🚀 COSMIRA получила: {message.text}\n\nПолноценный AI модуль будет подключён позже."
    
    await message.answer(answer)

# ============================================
# WEB API (для WebApp)
# ============================================

async def api_health(request):
    return web.json_response({"status": "ok", "service": "COSMIRA BOT"})

async def api_get_user(request):
    try:
        uid = request.match_info.get("uid")
        if not uid:
            return web.json_response({"error": "No user ID"}, status=400)
        
        user = get_user(uid)
        if user:
            return web.json_response(user)
        return web.json_response({"error": "User not found"}, status=404)
    except Exception as e:
        logging.error(f"API get_user error: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def api_update_user(request):
    try:
        data = await request.json()
        uid = data.get("userId")
        updates = data.get("updates", {})
        
        if not uid:
            return web.json_response({"error": "No user ID"}, status=400)
        
        if update_user_data(uid, updates):
            return web.json_response({"success": True})
        return web.json_response({"error": "User not found"}, status=404)
    except Exception as e:
        logging.error(f"API update_user error: {e}")
        return web.json_response({"error": str(e)}, status=500)

# ============================================
# WEB SERVER
# ============================================

async def start_web_server():
    app = web.Application()
    
    # API routes
    app.router.add_get("/api/health", api_health)
    app.router.add_get("/api/user/{uid}", api_get_user)
    app.router.add_post("/api/update", api_update_user)
    
    # CORS headers (для WebApp)
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
    
    print(f"🌐 Web API server started on port {port}")

# ============================================
# BOT
# ============================================

async def start_bot():
    bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await dp.start_polling(bot)

# ============================================
# MAIN
# ============================================

async def main():
    web_task = asyncio.create_task(start_web_server())
    bot_task = asyncio.create_task(start_bot())
    await asyncio.gather(web_task, bot_task)

# ============================================
# START
# ============================================

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        print("🛑 Bot stopped")