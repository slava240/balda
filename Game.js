// Безопасная инициализация VK Bridge
const bridge = window.vkBridge ? window.vkBridge.default : null;
if (bridge) {
    bridge.send("VKWebAppInit").catch(e => console.log("VK Init error", e));
}

const size = 5;
let score = 0;
let selectedCells = [];
let placedCell = null;
let gameState = 'PLACE';
let usedWords = [];

// Встроенный базовый словарь
const miniDictionary = ["БАЛДА", "ЛАДА", "АДА", "БАЛ", "ЛАД", "АД", "ДА", "БАЛЛ"];

// Начальное поле
const board = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['Б', 'А', 'Л', 'Д', 'А'],
    ['', '', '', '', ''],
    ['', '', '', '', '']
];

function initGame() {
    console.log("Игра инициализирована");
    renderGrid();
    
    // Пытаемся получить имя, если мы в ВК
    if (bridge) {
        bridge.send("VKWebAppGetUserInfo")
            .then(data => { document.getElementById('user-info').textContent = data.first_name; })
            .catch(() => { document.getElementById('user-info').textContent = "Игрок 1"; });
    } else {
        document.getElementById('user-info').textContent = "Игрок 1";
    }
}

function renderGrid() {
    const grid = document.getElementById('grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // Определяем букву в клетке
            let char = board[r][c];
            if (placedCell && placedCell.r === r && placedCell.c === c) {
                char = placedCell.char;
                cell.classList.add('placed');
            }
            
            cell.textContent = char;

            // Подсветка выделения
            if (selectedCells.some(s => s.r === r && s.c === c)) {
                cell.classList.add('selected');
            }

            cell.onclick = () => handleCellClick(r, c);
            grid.appendChild(cell);
        }
    }
}

function handleCellClick(r, c) {
    if (gameState === 'PLACE') {
        if (board[r][c] === '') {
            const char = prompt("Введите букву:");
            if (char && char.length === 1) {
                placedCell = { r, c, char: char.toUpperCase() };
                gameState = 'SELECT';
                updateStatus("Теперь выделите слово");
                renderGrid();
            }
        } else {
            alert("Выберите пустую клетку!");
        }
    } else if (gameState === 'SELECT') {
        const char = (placedCell && placedCell.r === r && placedCell.c === c) ? placedCell.char : board[r][c];
        
        if (char === '') return;

        // Проверка на повторное нажатие (отмена выделения)
        const index = selectedCells.findIndex(s => s.r === r && s.c === c);
        if (index !== -1) {
            selectedCells = selectedCells.slice(0, index);
        } else {
            // Проверка на соседство (только по горизонтали и вертикали)
            const last = selectedCells[selectedCells.length - 1];
            if (!last || (Math.abs(last.r - r) + Math.abs(last.c - c) === 1)) {
                selectedCells.push({ r, c, char });
            }
        }
        
        document.getElementById('word-display').textContent = selectedCells.map(s => s.char).join('') || '---';
        renderGrid();
    }
}

function submitWord() {
    if (gameState !== 'SELECT' || !placedCell) {
        alert("Сначала поставьте букву!");
        return;
    }

    const word = selectedCells.map(i => i.char).join('');
    const hasNewLetter = selectedCells.some(s => s.r === placedCell.r && s.c === placedCell.c);

    if (word.length < 2) {
        alert("Слово слишком короткое!");
        return;
    }

    if (!hasNewLetter) {
        alert("Слово должно содержать вашу новую букву!");
        return;
    }

    if (usedWords.includes(word)) {
        alert("Это слово уже было!");
        return;
    }

    // В текущей версии проверяем по мини-словарю
    if (miniDictionary.includes(word) || confirm(`Слова "${word}" нет в базе. Принять всё равно?`)) {
        board[placedCell.r][placedCell.c] = placedCell.char;
        usedWords.push(word);
        score += word.length;
        document.getElementById('score').textContent = `Счёт: ${score}`;
        alert(`Слово "${word}" принято! +${word.length}`);
        resetTurn();
    }
}

function resetTurn() {
    placedCell = null;
    selectedCells = [];
    gameState = 'PLACE';
    document.getElementById('word-display').textContent = '---';
    updateStatus("Поставьте букву на свободную клетку");
    renderGrid();
}

function updateStatus(text) {
    const statusEl = document.getElementById('status-text');
    if (statusEl) statusEl.textContent = text;
}

// Запуск
window.onload = initGame;

