import os
import asyncio
import logging

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
# DISPATCHER
# ============================================

dp = Dispatcher()

print("COSMIRA STARTED")

# ============================================
# KEYBOARD
# ============================================

main_keyboard = ReplyKeyboardMarkup(
    keyboard=[
        [
            KeyboardButton(
                text="🚀 Открыть COSMIRA",
                web_app=WebAppInfo(url="https://cosmira.netlify.app/")
            )
        ],
        [
            KeyboardButton(text="👤 Профиль"),
            KeyboardButton(text="💎 Premium")
        ],
        [
            KeyboardButton(text="⚙️ Настройки")
        ]
    ],
    resize_keyboard=True
)

# ============================================
# HANDLERS
# ============================================

@dp.message(F.text == "/start")
async def start_handler(message: Message):
    await message.answer(
        """
<b>🌌 COSMIRA AI</b>

Добро пожаловать в будущее.

✨ AI Платформа нового поколения
🚀 WebApp интерфейс
🧠 Умный AI помощник
💎 Premium система скоро появится
        """,
        reply_markup=main_keyboard
    )


@dp.message(F.text == "👤 Профиль")
async def profile_handler(message: Message):
    await message.answer(
        f"""
<b>👤 Ваш профиль</b>

🆔 ID: <code>{message.from_user.id}</code>

👑 Premium: Нет

🚀 Статус:
Пользователь COSMIRA
        """
    )


@dp.message(F.text == "💎 Premium")
async def premium_handler(message: Message):
    await message.answer(
        """
<b>💎 COSMIRA PREMIUM</b>

✨ AI без ограничений
⚡ Быстрые ответы
🧠 Мощные модели
🎨 Генерация изображений
🚀 Эксклюзивные функции

Скоро запуск оплаты.
        """
    )


@dp.message(F.text == "⚙️ Настройки")
async def settings_handler(message: Message):
    await message.answer(
        """
<b>⚙️ Настройки</b>

🌙 Тема
🔔 Уведомления
🌍 Язык
🎨 Дизайн

Скоро панель управления.
        """
    )

# ============================================
# WEB SERVER (Render healthcheck)
# ============================================

async def health(request):
    return web.Response(text="COSMIRA BOT WORKING")


async def start_web_server():
    app = web.Application()
    app.router.add_get("/", health)

    runner = web.AppRunner(app)
    await runner.setup()

    port = int(os.environ.get("PORT", 10000))

    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()

# ============================================
# MAIN
# ============================================

async def main():
    bot = Bot(
        token=TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )

    await start_web_server()
    await dp.start_polling(bot)

# ============================================
# START
# ============================================

if __name__ == "__main__":
    asyncio.run(main())