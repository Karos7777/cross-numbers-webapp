document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    const startButton = document.getElementById('startButton');
    const gameContainer = document.getElementById('game-container');

    let puzzle = null; // Кроссворд

    startButton.addEventListener('click', function () {
        startGame();
    });

    function startGame() {
        // Генерируем кроссворд
        puzzle = generatePuzzle();
        // Отображаем кроссворд
        renderPuzzle(puzzle);
        // Прячем кнопку "Начать игру"
        startButton.style.display = 'none';
    }

    function generatePuzzle() {
        const operators = ['+', '-', '*', '/'];
        const gridSize = 5;
        const grid = [];

        for (let i = 0; i < gridSize; i++) {
            const row = [];
            for (let j = 0; j < gridSize; j++) {
                if (Math.random() < 0.2) { // 20% вероятность, что в клетке будет уравнение
                    const operator = operators[Math.floor(Math.random() * operators.length)];
                    let a, b, result;

                    if (operator === '+') {
                        a = getRandomInt(1, 50);
                        b = getRandomInt(1, 50);
                        result = a + b;
                    } else if (operator === '-') {
                        a = getRandomInt(1, 50);
                        b = getRandomInt(1, a); // чтобы результат был неотрицательным
                        result = a - b;
                    } else if (operator === '*') {
                        a = getRandomInt(1, 10);
                        b = getRandomInt(1, 10);
                        result = a * b;
                    } else if (operator === '/') {
                        b = getRandomInt(1, 10);
                        result = getRandomInt(1, 10);
                        a = b * result;
                    }

                    row.push({ clue: `${a} ${operator} ${b}`, answer: result.toString() });
                } else {
                    row.push({});
                }
            }
            grid.push(row);
        }
        return grid;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
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
                    cellElement.addEventListener('dragover', allowDrop);
                    cellElement.addEventListener('drop', drop);
                }
            }

            gameContainer.appendChild(cellElement);
        });
    });
}

    function generatePuzzle() {
		
    // Пример генерации фиксированного поля для демонстрации
    // В реальном приложении нужно реализовать алгоритм генерации случайных уравнений

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

    function renderNumbers(numbers) {
    numberPanel.innerHTML = '';
    numbers.forEach((number, index) => {
        const numberElement = document.createElement('div');
        numberElement.className = 'number';
        numberElement.textContent = number;
        numberElement.draggable = true;
        numberElement.dataset.number = number;
        numberElement.dataset.index = index;
        numberElement.addEventListener('dragstart', drag);
        numberPanel.appendChild(numberElement);
    });
}

    function drag(event) {
    event.dataTransfer.setData('text', event.target.dataset.index);
}

    function allowDrop(event) {
    event.preventDefault();
}

    function drop(event) {
    event.preventDefault();
    const numberIndex = event.dataTransfer.getData('text');
    const numberValue = numbers[numberIndex];

    // Устанавливаем значение в клетку
    const row = event.target.dataset.row;
    const col = event.target.dataset.col;
    puzzle[row][col].value = numberValue;

    // Удаляем цифру из панели
    numbers.splice(numberIndex, 1);
    renderNumbers(numbers);
    renderPuzzle(puzzle);
}

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


    function checkAnswers() {
        const inputs = document.querySelectorAll('input[data-answer]');
        let allCorrect = true;
        for (let input of inputs) {
            if (input.value !== input.dataset.answer) {
                input.style.backgroundColor = '#fbb';
                allCorrect = false;
            } else {
                input.style.backgroundColor = '#bfb';
            }
        }

        if (allCorrect) {
            // Отправляем данные боту
            tg.sendData(JSON.stringify({ action: 'solved' }));
            alert('Поздравляем! Вы решили кроссворд.');
        } else {
            alert('Некоторые ответы неверны. Проверьте выделенные поля.');
        }
    }
});
