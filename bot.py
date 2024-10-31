from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, CallbackContext
from telegram.ext import filters
import json
import os
import logging

# Настройка ведения журнала
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)

TOKEN = '7211622201:AAH6uicWDk-pyBRpXdHa1oPDjX0pu6pnLaw'  # Замените на ваш новый токен бота

user_scores = {}  # Хранение очков пользователей

# Объявляем абсолютный путь к файлу данных
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'user_scores.json')

def load_data():
    global user_scores
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                user_scores = json.load(f)
                logging.debug("Data loaded from user_scores.json")
        except Exception as e:
            logging.error(f"Error loading data: {e}")
            user_scores = {}
    else:
        user_scores = {}
        logging.debug("No existing data found, starting fresh")

def save_data():
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(user_scores, f)
            logging.debug("Data saved to user_scores.json")
    except Exception as e:
        logging.error(f"Error saving data: {e}")

def update_score(user_id, points):
    user_id = str(user_id)
    logging.debug(f"Updating score for user {user_id} by {points} points")
    current_score = user_scores.get(user_id, 0)
    new_score = current_score + points
    user_scores[user_id] = new_score
    save_data()
    logging.debug(f"New score for user {user_id}: {new_score}")
    return new_score

def get_user_score(user_id):
    user_id = str(user_id)
    logging.debug(f"Getting score for user {user_id}")
    score = user_scores.get(user_id, 0)
    logging.debug(f"Current score for user {user_id}: {score}")
    return score

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("Начать игру", web_app=WebAppInfo(url="https://karos7777.github.io/cross-numbers-webapp/"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Привет! Нажмите кнопку ниже, чтобы начать игру.", reply_markup=reply_markup)

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logging.debug("web_app_data called")

    user_id = update.effective_user.id

    if update.message.web_app_data is None:
        logging.debug("No web_app_data found in the message.")
        return

    data = update.message.web_app_data.data  # Получаем данные от Web App
    logging.debug(f"Received data: {data} from user: {user_id}")

    try:
        # Парсим полученные данные
        received_data = json.loads(data)
        action = received_data.get('action')
        logging.debug(f"Action: {action}")

        if action == 'solved':
            # Начисляем очки пользователю
            new_score = update_score(user_id, 100)
            logging.debug(f"New score for user {user_id}: {new_score}")
            await update.message.reply_text(f"Отличная работа! Вы получили 100 очков. Ваш общий счет: {new_score}")
        else:
            logging.debug(f"Unknown action: {action}")
    except json.JSONDecodeError as e:
        logging.error(f"JSON Decode Error: {e}")
        await update.message.reply_text("Ошибка при обработке данных от Web App.")

async def score(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    current_score = get_user_score(user_id)
    logging.debug(f"User {user_id} requested their score: {current_score}")
    await update.message.reply_text(f"Ваш общий счет: {current_score}")

async def handle_all_updates(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logging.debug(f"Received update: {update}")

def main():
    global WEBHOOK_URL
    WEBHOOK_URL = 'https://46c4-5-188-66-64.ngrok-free.app'  # Замените на ваш ngrok URL

    load_data()  # Загружаем данные один раз при запуске бота

    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('score', score))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))

    # Добавляем универсальный обработчик
    application.add_handler(MessageHandler(filters.ALL, handle_all_updates))

    # Запускаем бота с использованием polling (временно, если проблемы с вебхуками)
    application.run_polling()

    # Если вы хотите использовать вебхуки, убедитесь, что ваш WEBHOOK_URL корректен и доступен
    # application.run_webhook(
    #     listen='0.0.0.0',
    #     port=8443,
    #     url_path='webhook',  # Задайте уникальный путь
    #     webhook_url=f'{WEBHOOK_URL}/webhook',  # Убедитесь, что токен не включён в URL
    # )

if __name__ == '__main__':
    main()
