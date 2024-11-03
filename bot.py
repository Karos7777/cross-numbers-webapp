import typing as t
from collections import defaultdict
import sqlite3
import logging
from telegram import Update
from telegram.ext._utils.types import UD, CD
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    PicklePersistence,
    filters,
    CallbackContext,
    BasePersistence,
    PersistenceInput
)


class SqlitePersistence(BasePersistence):
    def __init__(self, name: str='demo.db'):
        super().__init__(update_interval=1)
        self.store_data = PersistenceInput(bot_data=False, user_data=False, callback_data=False)
        self.conn = sqlite3.connect(name)
        self.cursor = self.conn.cursor()

    async def get_chat_data(self) -> t.DefaultDict[int, t.Any]:
        data = self.cursor.execute('''SELECT * FROM chat_data''').fetchall()
        chat_data = defaultdict(dict)
        for row in data:
            chat_id = row[1]
            if 'messages' not in chat_data[chat_id]:
                chat_data[chat_id] = { 'messages': [] }
            chat_data[chat_id]['messages'].append(dict(zip(['id', 'chat_id', 'message_ts', 'message'], row)))
        return chat_data

    async def update_chat_data(self, chat_id: int, data: CD) -> None:
        for row in data['messages']:
            db_row = self.cursor.execute('''SELECT * 
                                            FROM chat_data 
                                            WHERE chat_id = ? AND message_ts = ? AND message = ?''', 
                                            (chat_id, row['message_ts'], row['message'])).fetchone()
            if db_row is None:
                self.cursor.execute('''INSERT INTO chat_data
                                           (chat_id, message_ts, message)
                                       VALUES 
                                           (?, ?, ?)''', (chat_id, row['message_ts'], row['message']))
            else:
                self.cursor.execute('''UPDATE chat_data
                SET
                    message = ?
                WHERE
                    chat_id = ? AND message_ts = ?
                ''', (row['message'], chat_id, row['message_ts']))
        self.conn.commit()

    async def refresh_chat_data(self, chat_id: int, chat_data: t.Any) -> None:
        data = self.cursor.execute('''SELECT * FROM chat_data WHERE chat_id = ?''', (chat_id, ))
        chat_data['messages'] = [dict(zip(['id', 'chat_id', 'message_ts', 'message'], x)) for x in data]

    async def drop_chat_data(self, chat_id: int) -> None:
        self.cursor.execute('''DELETE * FROM chat_data WHERE chat_id = ?''', (chat_id, ))
    
    async def get_bot_data(self) -> t.Any:
        pass

    def update_bot_data(self, data) -> None:
        pass

    def refresh_bot_data(self, bot_data) -> None:
        pass

    def get_user_data(self) -> t.DefaultDict[int, t.Any]:
        pass

    def update_user_data(self, user_id: int, data: t.Any) -> None:
        pass

    def refresh_user_data(self, user_id: int, user_data: t.Any) -> None:
        pass

    def get_callback_data(self) -> t.Optional[t.Any]:
        pass

    def update_callback_data(self, data: t.Any) -> None:
        pass

    def get_conversations(self, name: str) -> t.Any:
        pass

    def update_conversation(self, name: str, key, new_state: t.Optional[object]) -> None:
        pass

    def flush(self) -> None:
        self.conn.close()

    async def drop_user_data(self, user_id: int) -> None:
        pass

    async def get_user_data(self) -> t.Dict[int, UD]:
        pass


# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text('Demo pickle persistence')


async def show_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Display the gathered info."""
    def _read_messages(chat_messages):
        return '\n'.join([f'{x["message_ts"]}: {x["message"]}' for x in chat_messages])

    messages = [f"\n{key}:\n{_read_messages(value)}" for key, value in context.chat_data.items()]
    facts = '\n'.join(messages)
    await update.message.reply_text(
        f"This is what you already told me: {facts}"
    )

async def save_message(update: Update, context: CallbackContext) -> None:
    if 'messages' not in context.chat_data:
        context.chat_data['messages'] = []
    context.chat_data['messages'].append({'message': update.message.text, 'message_ts': update.message.date.timestamp()}) # (4)


def main() -> None:
    """Run the bot."""
    # Create the Application and pass it your bot's token.
    persistence = SqlitePersistence() # (1)
    application = Application.builder().token('7211622201:AAH6uicWDk-pyBRpXdHa1oPDjX0pu6pnLaw').persistence(persistence).build() # (2)
    show_data_handler = CommandHandler("show_data", show_data)
    application.add_handler(show_data_handler)
    application.add_handler(MessageHandler(filters=filters.ALL, callback=save_message)) # (3)

    # Run the bot until the user presses Ctrl-C
    application.run_polling()


if __name__ == "__main__":
    main()