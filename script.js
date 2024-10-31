document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    const startButton = document.getElementById('startButton');
    const gameContainer = document.getElementById('game-container');
    const numberPanel = document.getElementById('number-panel');
    const checkButton = document.getElementById('checkButton');

    let puzzle = null; // Кроссворд
    let numbers = [];  // Доступные цифры

    startButton.addEventListener('click', function () {
        startGame();
    });

    function startGame() {
        // Генерируем кроссворд
        puzzle = generatePuzzle();
        // Генерируем цифры
        numbers = generateNumbers(puzzle);
        // Отображаем кроссворд
        renderPuzzle(puzzle);
        // Отображаем цифры
        renderNumbers(numbers);
        // Прячем кнопку "Начать игру"
        startButton.style.display = 'none';
        // Показываем кнопку "Проверить решение"
        checkButton.style.display = 'block';
    }

    function generatePuzzle() {
        // Пример генерации фиксированного поля для демонстрации
        const grid = [
            [{ type: 'number', value: null }, { type: 'operator', value: '+' }, { type: 'number', value: null }, { type: 'operator', value: '=' }, { type: 'number', value: 8 }],
            [{ type: 'number', value: 5 }, { type: 'operator', value: '-' }, { type: 'number', value: null }, { type: 'operator', value: '=' }, { type: 'number', value: 2 }],
            [{ type: 'number', value: null }, { type: 'operator', value: '*' }, { type: 'number', value: 2 }, { type: 'operator', value: '=' }, { type: 'number', value: null }],
            // Добавьте больше строк по необходимости
        ];
        return grid;
    }

    function generateNumbers(puzzle) {
        const nums = [];
        // Пройдём по полю и соберём все необходимые цифры
        puzzle.forEach(row => {
            row.forEach(cell => {
                if (cell.type === 'number' && cell.value === null) {
                    // Для упрощения возьмём цифры от 1 до 9
                    nums.push(getRandomInt(1, 9));
                }
            });
        });
        return nums;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function renderPuzzle(puzzle) {
        gameContainer.innerHTML = '';
        puzzle.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';

                if (cell.type === 'operator') {
                    cellElement.textContent = cell.value;
                    cellElement.classList.add('operator');
                } else if (cell.type === 'number') {
                    if (cell.value !== null) {
                        cellElement.textContent = cell.value;
                        cellElement.classList.add('number-cell');
                    } else {
                        cellElement.classList.add('input-cell');
                        cellElement.dataset.row = rowIndex;
                        cellElement.dataset.col = cellIndex;
                        cellElement.addEventListener('click', selectCell);
                    }
                }

                gameContainer.appendChild(cellElement);
            });
        });
    }

    function renderNumbers(numbers) {
        numberPanel.innerHTML = '';
        numbers.forEach((number, index) => {
            const numberElement = document.createElement('div');
            numberElement.className = 'number';
            numberElement.textContent = number;
            numberElement.dataset.number = number;
            numberElement.dataset.index = index;
            numberElement.addEventListener('click', selectNumber);
            numberPanel.appendChild(numberElement);
        });
    }

    let selectedNumber = null;

    function selectNumber(event) {
        // Убираем выделение со всех цифр
        document.querySelectorAll('.number').forEach(elem => {
            elem.classList.remove('selected');
        });

        // Выделяем выбранную цифру
        selectedNumber = event.target;
        selectedNumber.classList.add('selected');
    }

    function selectCell(event) {
        if (selectedNumber) {
            const row = event.target.dataset.row;
            const col = event.target.dataset.col;
            const numberValue = parseInt(selectedNumber.dataset.number);

            // Устанавливаем значение в клетку
            puzzle[row][col].value = numberValue;

            // Удаляем цифру из панели
            const index = selectedNumber.dataset.index;
            numbers.splice(index, 1);
            selectedNumber = null;

            // Обновляем отображение
            renderNumbers(numbers);
            renderPuzzle(puzzle);
        }
    }

    checkButton.addEventListener('click', function () {
        if (checkSolution()) {
            // Отправляем данные боту
            tg.sendData(JSON.stringify({ action: 'solved' }));
            alert('Поздравляем! Вы решили кроссворд и получили 100 очков.');
        } else {
            alert('Есть ошибки в вашем решении. Попробуйте еще раз.');
        }
    });

    function checkSolution() {
        let isCorrect = true;
        // Пройдём по каждой строке и проверим уравнение
        puzzle.forEach(row => {
            // Составим уравнение из элементов строки
            let equation = '';
            row.forEach(cell => {
                if (cell.type === 'number') {
                    if (cell.value !== null) {
                        equation += cell.value;
                    } else {
                        isCorrect = false; // Не все клетки заполнены
                    }
                } else if (cell.type === 'operator') {
                    equation += ` ${cell.value} `;
                }
            });
            // Проверим уравнение
            if (isCorrect) {
                try {
                    const [left, right] = equation.split('=');
                    if (eval(left) !== eval(right)) {
                        isCorrect = false;
                    }
                } catch (e) {
                    isCorrect = false;
                }
            }
        });
        return isCorrect;
    }
});
