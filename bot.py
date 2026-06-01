import os
import logging
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

# Твои модули
from database import init_db, save_user, get_user, consume_free_use
from validator import validate_date, validate_time, validate_place
from ai_engine import ask_ai

BOT_TOKEN = os.getenv("BOT_TOKEN")
dp = Dispatcher()
logging.basicConfig(level=logging.INFO)

# Состояния для регистрации
class RegState(StatesGroup):
    date = State()
    time = State()
    place = State()

# Кнопка /start
@dp.message(Command("start"))
async def cmd_start(message: types.Message, state: FSMContext):
    user = await get_user(message.from_user.id)
    if user:
        await message.answer(f"👋 С возвращением, {user['name']}! Что делаем?", reply_markup=main_menu())
    else:
        await message.answer("🔮 Привет! Чтобы звёзды заговорили, введи дату рождения (ДД.ММ.ГГГГ):")
        await state.set_state(RegState.date)

# Регистрация: Дата
@dp.message(RegState.date)
async def reg_date(msg: types.Message, state: FSMContext):
    ok, err = validate_date(msg.text)
    if not ok: return await msg.answer(err)
    await state.update_data(birth_date=msg.text)
    await msg.answer(" Теперь время рождения (ЧЧ:ММ):")
    await state.set_state(RegState.time)

# Регистрация: Время
@dp.message(RegState.time)
async def reg_time(msg: types.Message, state: FSMContext):
    ok, err = validate_time(msg.text)
    if not ok: return await msg.answer(err)
    await state.update_data(birth_time=msg.text)
    await msg.answer(" Где родился (Город):")
    await state.set_state(RegState.place)

# Регистрация: Место
@dp.message(RegState.place)
async def reg_place(msg: types.Message, state: FSMContext):
    ok, err = validate_place(msg.text)
    if not ok: return await msg.answer(err)
    
    data = await state.get_data()
    await save_user(
        msg.from_user.id,
        msg.from_user.username,
        msg.from_user.full_name,
        data['birth_date'],
        data['birth_time'],
        msg.text
    )
    await state.clear()
    await msg.answer("✅ Данные сохранены! Добро пожаловать в COSMIRA.", reply_markup=main_menu())

# Главное меню
def main_menu():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔥 Гороскоп", callback_data="horoscope")],
        [InlineKeyboardButton(text="💞 Совместимость", callback_data="compat")],
        [InlineKeyboardButton(text="🌌 Натальная карта", callback_data="natal")],
        [InlineKeyboardButton(text=" Хорар", callback_data="horary")],
        [InlineKeyboardButton(text="👤 Профиль", callback_data="profile")]
    ])

# Обработка кнопок меню
@dp.callback_query(F.data.in_(["horoscope", "compat", "natal", "horary", "profile"]))
async def handle_menu(cb: types.CallbackQuery, state: FSMContext):
    user = await get_user(cb.from_user.id)
    if not user:
        return await cb.answer("Сначала /start", show_alert=True)

    # Если нажали Профиль
    if cb.data == "profile":
        text = (f" {user['name']}\n"
                f"🎂 {user['birth_date']}\n"
                f"⏱ {user['birth_time']}\n"
                f"🌍 {user['birth_place']}\n"
                f"🎟 Бесплатных попыток: {user['free_uses']}")
        return await cb.message.edit_text(text, reply_markup=main_menu())

    # Если кончились попытки
    if user['free_uses'] <= 0:
        return await cb.answer("Лимит исчерпан. Нужен премиум.", show_alert=True)

    await cb.answer()
    await cb.message.edit_text(" Считываю звёзды и генерирую ответ...", reply_markup=main_menu())

    # Промт для AI
    prompt = (f"Пользователь: {user['name']}. Дата: {user['birth_date']}, Время: {user['birth_time']}, Место: {user['birth_place']}.\n"
              f"Запрос: {cb.data}. \n"
              f"Сделай точный, глубокий астрологический разбор (без воды).")

    # Запрос к AI
    result = await ask_ai(prompt)
    
    # Списание попытки
    await consume_free_use(cb.from_user.id)
    
    await cb.message.edit_text(f" **Результат:**\n\n{result}", parse_mode="Markdown", reply_markup=main_menu())

# Запуск
async def main():
    await init_db() # Создаст таблицу в Supabase
    bot = Bot(token=BOT_TOKEN)
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
    # v2 fix