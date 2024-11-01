import logging
import json
import aiosqlite
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.utils.executor import start_webhook
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
import asyncio

# Замените на ваш токен
BOT_TOKEN = '7211622201:AAH6uicWDk-pyBRpXdHa1oPDjX0pu6pnLaw'
WEBHOOK_PATH = '/webhook'
WEBHOOK_URL = 'https://karos7777.github.io/cross-numbers-webapp/' + WEBHOOK_PATH  # Замените на ваш домен

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Инициализация бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Инициализация базы данных
async def init_db():
    async with aiosqlite.connect('database.db') as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT,
                points INTEGER DEFAULT 0
            )
        ''')
        await db.commit()

# Функция для добавления пользователя
async def add_user(user_id, username):
    async with aiosqlite.connect('database.db') as db:
        await db.execute('INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)', (user_id, username))
        await db.commit()

# Функция для получения очков пользователя
async def get_points(user_id):
    async with aiosqlite.connect('database.db') as db:
        async with db.execute('SELECT points FROM users WHERE id = ?', (user_id,)) as cursor:
            row = await cursor.fetchone()
            return row[0] if row else None

# Функция для обновления очков пользователя
async def update_points(user_id, points):
    async with aiosqlite.connect('database.db') as db:
        await db.execute('UPDATE users SET points = ? WHERE id = ?', (points, user_id))
        await db.commit()

# Обработчик команды /start
@dp.message(Command('start'))
async def start_command(message: types.Message):
    user_id = message.from_user.id
    username = message.from_user.username
    await add_user(user_id, username)
    await message.reply("Добро пожаловать! Вы зарегистрированы.")

# Обработчик команды /score
@dp.message(Command('score'))
async def score_command(message: types.Message):
    user_id = message.from_user.id
    points = await get_points(user_id)
    if points is not None:
        await message.reply(f"Ваш текущий счет: {points} очков.")
    else:
        await message.reply("Вы не зарегистрированы. Используйте команду /start для регистрации.")

# Обработчик данных от Web App
@dp.message(F.web_app_data)
async def web_app_data_handler(message: types.Message):
    user_id = message.from_user.id
    data = message.web_app_data.data  # Получение данных от Web App

    try:
        received_data = json.loads(data)
        action = received_data.get('action')
        if action == 'solved':
            current_points = await get_points(user_id)
            if current_points is not None:
                new_points = current_points + 100
                await update_points(user_id, new_points)
                await message.reply(f"Поздравляем! Вы завершили уровень и получили 100 очков. Ваш текущий счет: {new_points} очков.")
            else:
                await message.reply("Вы не зарегистрированы. Используйте команду /start для регистрации.")
    except json.JSONDecodeError:
        await message.reply("Ошибка при обработке данных от Web App.")

# Обработчик команды /play для отправки кнопки с Web App
@dp.message(Command('play'))
async def play_command(message: types.Message):
    # Создаем кнопку с WebAppInfo
    web_app_button = InlineKeyboardButton(
        text="Играть",
        web_app=WebAppInfo(url="https://karos7777.github.io/cross-numbers-webapp/")  # Замените на URL вашего Web App
    )

    # Создаем разметку клавиатуры и добавляем в нее кнопку
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[web_app_button]])

    await message.answer("Нажмите кнопку ниже, чтобы начать игру.", reply_markup=keyboard)

# Настройка вебхука
async def on_startup():
    await bot.set_webhook(WEBHOOK_URL)
    await init_db()

async def on_shutdown():
    await bot.delete_webhook()

if __name__ == '__main__':
    from aiogram import executor
    executor.start_webhook(
        dispatcher=dp,
        webhook_path=WEBHOOK_PATH,
        on_startup=on_startup,
        on_shutdown=on_shutdown,
        skip_updates=True,
        host='0.0.0.0',
        port=8000,
    )
