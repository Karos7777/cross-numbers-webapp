import sqlite3

# Подключение к базе данных
conn = sqlite3.connect('demo.db')
cursor = conn.cursor()

# Создание таблицы chat_data
cursor.execute('''
CREATE TABLE IF NOT EXISTS chat_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    message_ts REAL NOT NULL,
    message TEXT NOT NULL
)
''')

# Сохранение изменений и закрытие соединения
conn.commit()
conn.close()
