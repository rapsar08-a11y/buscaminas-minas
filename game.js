/**
 * ========================================
 * BUSCAMINAS - LÓGICA DEL JUEGO
 * ========================================
 */

class Buscaminas {
    constructor() {
        // Configuración de dificultades
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };

        // Estado del juego
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.minesPositions = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        this.currentDifficulty = 'easy';

        // Referencias a elementos del DOM
        this.boardElement = document.getElementById('board');
        this.minesCountElement = document.getElementById('mines-count');
        this.flagsCountElement = document.getElementById('flags-count');
        this.timerElement = document.getElementById('timer');
        this.gameStatusElement = document.getElementById('game-status');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameButton = document.getElementById('new-game');

        // Inicializar eventos
        this.initEvents();
        
        // Iniciar primera partida
        this.newGame();
    }

    /**
     * Inicializa los eventos del juego
     */
    initEvents() {
        // Cambio de dificultad
        this.difficultySelect.addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
            this.newGame();
        });

        // Botón nueva partida
        this.newGameButton.addEventListener('click', () => {
            this.newGame();
        });

        // Prevenir menú contextual en el tablero
        this.boardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Inicia una nueva partida
     */
    newGame() {
        // Resetear estado
        const { rows, cols, mines } = this.difficulties[this.currentDifficulty];
        this.rows = rows;
        this.cols = cols;
        this.totalMines = mines;
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.minesPositions = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timer = 0;
        
        // Detener timer anterior
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Actualizar UI
        this.minesCountElement.textContent = this.totalMines;
        this.flagsCountElement.textContent = '0';
        this.timerElement.textContent = '000';
        this.gameStatusElement.textContent = '';
        this.gameStatusElement.className = 'game-status';
        this.boardElement.classList.remove('win');

        // Crear tablero vacío
        this.createEmptyBoard();
        this.renderBoard();
    }

    /**
     * Crea un tablero vacío
     */
    createEmptyBoard() {
        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            this.revealed[r] = [];
            this.flagged[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = 0;
                this.revealed[r][c] = false;
                this.flagged[r][c] = false;
            }
        }
    }

    /**
     * Coloca las minas después del primer clic
     * @param {number} firstRow - Fila del primer clic
     * @param {number} firstCol - Columna del primer clic
     */
    placeMines(firstRow, firstCol) {
        let minesPlaced = 0;
        this.minesPositions = [];

        while (minesPlaced < this.totalMines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);

            // No colocar mina en la posición del primer clic ni en sus adyacentes
            const isNearFirstClick = Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1;

            if (this.board[r][c] !== -1 && !isNearFirstClick) {
                this.board[r][c] = -1; // -1 representa una mina
                this.minesPositions.push({ r, c });
                minesPlaced++;
            }
        }

        // Calcular números de minas adyacentes
        this.calculateNumbers();
    }

    /**
     * Calcula el número de minas adyacentes para cada celda
     */
    calculateNumbers() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] !== -1) {
                    this.board[r][c] = this.countAdjacentMines(r, c);
                }
            }
        }
    }

    /**
     * Cuenta las minas adyacentes a una celda
     * @param {number} row - Fila de la celda
     * @param {number} col - Columna de la celda
     * @returns {number} Número de minas adyacentes
     */
    countAdjacentMines(row, col) {
        let count = 0;
        const neighbors = this.getNeighbors(row, col);

        for (const { r, c } of neighbors) {
            if (this.board[r][c] === -1) {
                count++;
            }
        }

        return count;
    }

    /**
     * Obtiene las celdas vecinas de una posición
     * @param {number} row - Fila
     * @param {number} col - Columna
     * @returns {Array} Array de posiciones vecinas
     */
    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < this.rows && 
                newCol >= 0 && newCol < this.cols) {
                neighbors.push({ r: newRow, c: newCol });
            }
        }

        return neighbors;
    }

    /**
     * Renderiza el tablero en el DOM
     */
    renderBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 35px)`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                // Eventos del mouse
                cell.addEventListener('click', (e) => this.handleLeftClick(e));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e));

                this.boardElement.appendChild(cell);
            }
        }
    }

    /**
     * Maneja el clic izquierdo en una celda
     * @param {Event} e - Evento de clic
     */
    handleLeftClick(e) {
        if (this.gameOver || this.gameWon) return;

        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);

        // No hacer nada si la celda tiene bandera
        if (this.flagged[row][col]) return;

        // Primer clic: colocar minas e iniciar timer
        if (this.firstClick) {
            this.placeMines(row, col);
            this.startTimer();
            this.firstClick = false;
        }

        // Revelar celda
        this.revealCell(row, col);
    }

    /**
     * Maneja el clic derecho en una celda (poner/quitar bandera)
     * @param {Event} e - Evento de clic
     */
    handleRightClick(e) {
        e.preventDefault();
        if (this.gameOver || this.gameWon) return;

        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);

        // No poner bandera si la celda ya está revelada
        if (this.revealed[row][col]) return;

        // Toggle bandera
        this.flagged[row][col] = !this.flagged[row][col];
        
        // Actualizar contador de banderas
        const totalFlags = this.countFlags();
        this.flagsCountElement.textContent = totalFlags;

        // Actualizar visualización
        this.updateCellDisplay(row, col);
    }

    /**
     * Cuenta el número total de banderas en el tablero
     * @returns {number} Número de banderas
     */
    countFlags() {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.flagged[r][c]) count++;
            }
        }
        return count;
    }

    /**
     * Revela una celda
     * @param {number} row - Fila
     * @param {number} col - Columna
     */
    revealCell(row, col) {
        // Verificar si ya está revelada o tiene bandera
        if (this.revealed[row][col] || this.flagged[row][col]) return;

        // Marcar como revelada
        this.revealed[row][col] = true;

        // Obtener elemento de la celda
        const cell = this.getCellElement(row, col);
        cell.classList.add('revealed');

        // Verificar si es una mina
        if (this.board[row][col] === -1) {
            this.gameOver = true;
            cell.classList.add('mine');
            this.endGame(false);
            return;
        }

        // Mostrar número o seguir revelando
        if (this.board[row][col] > 0) {
            cell.textContent = this.board[row][col];
            cell.classList.add(`num-${this.board[row][col]}`);
        } else {
            // Celda vacía: revelar celdas adyacentes
            const neighbors = this.getNeighbors(row, col);
            for (const { r, c } of neighbors) {
                this.revealCell(r, c);
            }
        }

        // Verificar victoria
        this.checkWin();
    }

    /**
     * Obtiene el elemento DOM de una celda
     * @param {number} row - Fila
     * @param {number} col - Columna
     * @returns {HTMLElement} Elemento de la celda
     */
    getCellElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Actualiza la visualización de una celda
     * @param {number} row - Fila
     * @param {number} col - Columna
     */
    updateCellDisplay(row, col) {
        const cell = this.getCellElement(row, col);

        if (this.flagged[row][col]) {
            cell.textContent = '🚩';
            cell.classList.add('flagged');
        } else {
            cell.textContent = '';
            cell.classList.remove('flagged');
        }
    }

    /**
     * Inicia el temporizador
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.timer.toString().padStart(3, '0');
            
            // Límite de 999 segundos
            if (this.timer >= 999) {
                clearInterval(this.timerInterval);
            }
        }, 1000);
    }

    /**
     * Verifica si el jugador ha ganado
     */
    checkWin() {
        let revealedCount = 0;
        const totalCells = this.rows * this.cols;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.revealed[r][c]) revealedCount++;
            }
        }

        // Victoria: todas las celdas sin mina reveladas
        if (revealedCount === totalCells - this.totalMines) {
            this.gameWon = true;
            this.endGame(true);
        }
    }

    /**
     * Finaliza el juego
     * @param {boolean} won - Si el jugador ganó
     */
    endGame(won) {
        // Detener timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        if (won) {
            // Victoria
            this.gameStatusElement.textContent = '🎉 ¡FELICIDADES! ¡Has ganado! 🎉';
            this.gameStatusElement.className = 'game-status win';
            this.boardElement.classList.add('win');
            
            // Marcar todas las minas con banderas
            for (const { r, c } of this.minesPositions) {
                this.flagged[r][c] = true;
                this.updateCellDisplay(r, c);
            }
            this.flagsCountElement.textContent = this.totalMines;
        } else {
            // Derrota
            this.gameStatusElement.textContent = '💥 ¡BOOM! ¡Has perdido! 💥';
            this.gameStatusElement.className = 'game-status lose';
            
            // Revelar todas las minas
            this.revealAllMines();
        }
    }

    /**
     * Revela todas las minas al perder
     */
    revealAllMines() {
        for (const { r, c } of this.minesPositions) {
            const cell = this.getCellElement(r, c);
            cell.classList.add('revealed', 'mine');
            cell.textContent = '💣';
        }

        // Marcar banderas incorrectas
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.flagged[r][c] && this.board[r][c] !== -1) {
                    const cell = this.getCellElement(r, c);
                    cell.classList.add('mine-wrong');
                    cell.textContent = '❌';
                }
            }
        }
    }
}

// Inicializar juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new Buscaminas();
});
