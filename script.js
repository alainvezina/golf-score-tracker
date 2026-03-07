// Golf Score Tracker - Vanilla JavaScript Application

class GolfScoreTracker {
    constructor() {
        this.players = [];
        this.scores = {};
        this.currentRound = 1;
        this.maxRounds = 9;
        this.maxPlayers = 6;
        this.minPlayers = 2;
        this.version = '1.0.0';
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // Player setup events
        document.getElementById('add-player').addEventListener('click', () => this.addPlayer());
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayer();
        });
        document.getElementById('start-game').addEventListener('click', () => this.startGame());

        // Burger menu (game actions) - use class so menu open/close is reliable
        const burgerBtn = document.getElementById('game-burger-btn');
        const burgerMenu = document.getElementById('game-burger-menu');
        if (burgerBtn && burgerMenu) {
            burgerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isOpen = burgerMenu.classList.toggle('game-burger-menu-open');
                burgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
            document.getElementById('burger-clear-round').addEventListener('click', () => { this.closeBurger(); this.clearRound(); });
            document.getElementById('burger-clear-all').addEventListener('click', () => { this.closeBurger(); this.clearAllScores(); });
            document.getElementById('burger-new-game').addEventListener('click', () => { this.closeBurger(); this.newGame(); });
            document.getElementById('burger-reset').addEventListener('click', () => { this.closeBurger(); this.resetGame(); });
            document.getElementById('burger-export').addEventListener('click', () => { this.closeBurger(); this.exportSummary(); });
            document.addEventListener('click', (e) => {
                if (burgerMenu.classList.contains('game-burger-menu-open') && !burgerBtn.contains(e.target) && !burgerMenu.contains(e.target)) this.closeBurger();
            });
        }

        // Confirmation modal
        const confirmModal = document.getElementById('confirm-modal');
        document.getElementById('confirm-modal-ok').addEventListener('click', () => {
            if (this._confirmCallback) this._confirmCallback();
            this._confirmCallback = null;
            confirmModal.hidden = true;
        });
        document.getElementById('confirm-modal-cancel').addEventListener('click', () => {
            this._confirmCallback = null;
            confirmModal.hidden = true;
        });
        confirmModal.querySelector('.confirm-modal-backdrop').addEventListener('click', () => {
            this._confirmCallback = null;
            confirmModal.hidden = true;
        });

        // Load existing game state
        if (this.players.length >= this.minPlayers) {
            this.startGame();
        }
    }

    addPlayer() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();

        if (!name) {
            this.showToast('Please enter a player name', 'warning');
            nameInput.focus();
            return;
        }

        if (this.players.includes(name)) {
            this.showToast('Player name already exists', 'warning');
            nameInput.focus();
            return;
        }

        if (this.players.length >= this.maxPlayers) {
            this.showToast(`Maximum ${this.maxPlayers} players allowed`, 'warning');
            return;
        }

        this.players.push(name);
        this.scores[name] = new Array(this.maxRounds).fill(null);
        
        nameInput.value = '';
        this.updatePlayersList();
        this.saveToStorage();
    }

    removePlayer(name) {
        const index = this.players.indexOf(name);
        if (index > -1) {
            this.players.splice(index, 1);
            delete this.scores[name];
            this.updatePlayersList();
            this.saveToStorage();
        }
    }

    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        const startButton = document.getElementById('start-game');
        
        playersList.innerHTML = '';
        
        this.players.forEach(name => {
            const playerTag = document.createElement('div');
            playerTag.className = 'player-tag';
            // Escape HTML to prevent XSS and ensure proper display
            const escapedName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            playerTag.innerHTML = `
                <span class="player-name-text">${escapedName}</span>
                <span class="remove-player" onclick="gameTracker.removePlayer('${name.replace(/'/g, "\\'")}')" title="Remove player">×</span>
            `;
            playersList.appendChild(playerTag);
        });

        // Show start button if we have enough players
        if (this.players.length >= this.minPlayers) {
            startButton.style.display = 'inline-block';
        } else {
            startButton.style.display = 'none';
        }
    }

    startGame() {
        if (this.players.length < this.minPlayers) {
            this.showToast(`Need at least ${this.minPlayers} players to start`, 'warning');
            return;
        }

        document.getElementById('player-setup').style.display = 'none';
        document.getElementById('game-board').style.display = 'block';
        document.body.classList.add('game-active');
        const burgerWrap = document.getElementById('game-burger-wrap');
        if (burgerWrap) burgerWrap.style.display = 'block';
        document.getElementById('game-board').classList.add('fade-in');
        
        this.createScoreTable();
        this.updateCurrentRound();
        this.updateVersionDisplay();
        this.saveToStorage();
    }

    createScoreTable() {
        const roundLabels = ['♠️ R1', '♥️ R2', '♦️ R3', '♣️ R4', '♠️ R5', '♥️ R6', '♦️ R7', '♣️ R8', '🎆 R9'];
        const theadRow = document.getElementById('score-table-header-row');
        const tbody = document.getElementById('score-table-body');

        // Header: one row with Round label + player name (total) per column — always visible
        theadRow.innerHTML = `
            <th class="sticky-round-col border-b-2 border-r-2 border-amber-400 px-2 py-2 text-left font-bold text-amber-100 font-cinzel text-sm">🎯</th>
            ${this.players.map(playerName =>
                `<th class="border-b-2 border-r-2 border-amber-400 px-2 py-2 text-center font-bold font-cinzel player-name-total-cell bg-gradient-to-r from-emerald-800 to-emerald-700 text-amber-100" data-player="${playerName}">
                    <span class="player-header-name">${playerName}</span>
                    <span class="player-header-total" data-player="${playerName}">(${this.calculatePlayerTotal(playerName)})</span>
                </th>`
            ).join('')}
        `;

        tbody.innerHTML = '';

        // Body: one row per round (R1..R9) then Total row
        for (let round = 0; round < this.maxRounds; round++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border-b-2 border-r-2 border-amber-400 px-2 py-2 font-bold text-emerald-900 sticky-round-cell font-cinzel bg-amber-50 text-sm">${roundLabels[round]}</td>
                ${this.players.map(playerName =>
                    `<td class="border-b-2 border-r-2 border-amber-400 px-1 py-2 score-cell" data-player="${playerName}" data-round="${round}">
                        <div class="score-input-container">
                            <input 
                                type="number" 
                                class="score-input" 
                                placeholder="—"
                                min="-48"
                                max="48"
                                data-player="${playerName}" 
                                data-round="${round}"
                                value="${this.scores[playerName][round] !== null ? this.scores[playerName][round] : ''}"
                            >
                            <span class="edit-icon">♠️</span>
                        </div>
                    </td>`
                ).join('')}
            `;
            tbody.appendChild(row);
        }

        // Total row
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td class="border-b-2 border-r-2 border-amber-400 px-2 py-2 font-bold text-emerald-900 sticky-round-cell font-cinzel bg-gradient-to-r from-amber-200 to-amber-100 text-sm">🏅</td>
            ${this.players.map(playerName =>
                `<td class="border-b-2 border-amber-400 px-2 py-2 text-center font-bold text-emerald-900 total-cell bg-gradient-to-r from-amber-200 to-amber-100 font-cinzel text-sm" data-player="${playerName}">
                    ${this.calculatePlayerTotal(playerName)}
                </td>`
            ).join('')}
        `;
        tbody.appendChild(totalRow);

        // Bind score input events
        document.querySelectorAll('.score-input').forEach(input => {
            input.addEventListener('input', (e) => this.updateScore(e));
            input.addEventListener('focus', (e) => e.target.select());
            input.addEventListener('keydown', (e) => this.handleInputKeydown(e));
            input.addEventListener('blur', (e) => this.handleInputBlur(e));
        });
        
        // Add touch/swipe gestures for mobile
        this.addTouchGestures();

        this.highlightCurrentRound();
        this.updateLeaderIndicator();
        this.updateRoundProgress();
        this.updateLeadingSummary();
    }

    updateRoundProgress() {
        let container = document.getElementById('round-progress');
        if (!container) return;
        if (!container.querySelector('.round-dot')) {
            for (let i = 1; i <= this.maxRounds; i++) {
                const dot = document.createElement('span');
                dot.className = 'round-dot';
                dot.setAttribute('data-round', i);
                dot.setAttribute('title', `Round ${i}`);
                container.appendChild(dot);
            }
        }
        container.querySelectorAll('.round-dot').forEach((dot, i) => {
            const r = i + 1;
            dot.classList.remove('done', 'current');
            if (r < this.currentRound) dot.classList.add('done');
            else if (r === this.currentRound) dot.classList.add('current');
        });
    }

    updateLeadingSummary() {
        const el = document.getElementById('leading-summary');
        if (!el) return;
        const totals = this.players.map(p => ({ name: p, total: this.calculatePlayerTotal(p) }));
        const hasScores = totals.some(t => t.total > 0 || this.scores[t.name].some(s => s !== null));
        if (!hasScores) {
            el.innerHTML = '<span class="leading-label">Leading:</span> —';
            return;
        }
        const minTotal = Math.min(...totals.map(t => t.total));
        const leaders = totals.filter(t => t.total === minTotal);
        if (leaders.length === 1) {
            el.innerHTML = `<span class="leading-label">Leading:</span> ${leaders[0].name} (${leaders[0].total})`;
        } else {
            el.innerHTML = `<span class="leading-label">Tie:</span> ${leaders.map(l => `${l.name} (${l.total})`).join(', ')}`;
        }
    }

    updateLeaderIndicator() {
        const totals = this.players.map(p => ({ name: p, total: this.calculatePlayerTotal(p) }));
        const minTotal = Math.min(...totals.map(t => t.total));
        const hasScores = totals.some(t => t.total > 0 || this.scores[t.name].some(s => s !== null));
        const leaders = hasScores ? totals.filter(t => t.total === minTotal).map(t => t.name) : [];

        this.players.forEach(playerName => {
            const isLeading = leaders.includes(playerName);
            document.querySelectorAll(`[data-player="${playerName}"].total-cell, .player-header-total[data-player="${playerName}"]`).forEach(el => {
                el.classList.toggle('is-leading', isLeading);
            });
            document.querySelectorAll(`.player-name-total-cell[data-player="${playerName}"], td.total-cell[data-player="${playerName}"]`).forEach(el => {
                el.classList.toggle('is-leading', isLeading);
            });
        });
        this.updateLeadingSummary();
    }

    updateScore(event) {
        const input = event.target;
        const player = input.dataset.player;
        const round = parseInt(input.dataset.round);
        const value = input.value.trim();

        try {
            // Validate input
            if (value === '') {
                this.scores[player][round] = null;
            } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= -48 && numValue <= 48) {
                    this.scores[player][round] = numValue;
                    // Don't auto-advance on input event - let user finish typing double digits
                    // Auto-advance only happens on Enter/Tab/Arrow keys
                } else {
                    this.showInputError(input, `Score must be between -48 and 48`);
                    input.value = this.scores[player][round] !== null ? this.scores[player][round] : '';
                    return;
                }
            }

            // Update total for this player (footer row + header next to name)
            const total = this.calculatePlayerTotal(player);
            const totalCell = document.querySelector(`[data-player="${player}"].total-cell`);
            if (totalCell) totalCell.textContent = total;
            const headerTotal = document.querySelector(`.player-header-total[data-player="${player}"]`);
            if (headerTotal) headerTotal.textContent = `(${total})`;

            this.updateLeaderIndicator();

            // Check if round is complete and advance if needed
            this.checkRoundComplete();
            
            // Check if game is over
            this.checkGameOver();
            
            this.saveToStorageWithRetry();
        } catch (error) {
            console.error('Error updating score:', error);
            this.showToast('Error saving score. Please try again.');
        }
    }

    calculatePlayerTotal(player) {
        const scores = this.scores[player].filter(score => score !== null);
        if (scores.length === 0) return 0;
        return scores.reduce((total, score) => total + score, 0);
    }
    
    // Enhanced Input Experience Methods
    handleInputKeydown(event) {
        const input = event.target;
        const key = event.key;
        
        switch (key) {
            case 'Enter':
            case 'Tab':
                event.preventDefault();
                // Validate and save score before moving
                const value = input.value.trim();
                if (value !== '') {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= -48 && numValue <= 48) {
                        // Score is valid, move to next player in same round
                        this.focusNextInput(input);
                    }
                } else {
                    // Empty value, just move to next
                    this.focusNextInput(input);
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.focusNextInput(input);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.focusPreviousInput(input);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.focusInputBelow(input);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.focusInputAbove(input);
                break;
            case 'Escape':
                input.blur();
                break;
            case 'Backspace':
            case 'Delete':
                if (input.value === '') {
                    event.preventDefault();
                    this.focusPreviousInput(input);
                }
                break;
        }
    }
    
    handleInputBlur(event) {
        const input = event.target;
        // Clear any error styling when input loses focus
        this.clearInputError(input);
    }
    
    focusNextInput(currentInput) {
        // Move to next player in the same round
        const currentPlayer = currentInput.dataset.player;
        const currentRound = parseInt(currentInput.dataset.round);
        const currentPlayerIndex = this.players.indexOf(currentPlayer);
        
        if (currentPlayerIndex < this.players.length - 1) {
            // Move to next player in same round
            const nextPlayer = this.players[currentPlayerIndex + 1];
            const nextInput = document.querySelector(`.score-input[data-player="${nextPlayer}"][data-round="${currentRound}"]`);
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        } else {
            // If last player, move to first player of next round (if exists)
            if (currentRound < this.maxRounds - 1) {
                const nextRound = currentRound + 1;
                const firstPlayer = this.players[0];
                const nextInput = document.querySelector(`.score-input[data-player="${firstPlayer}"][data-round="${nextRound}"]`);
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }
        }
    }
    
    focusPreviousInput(currentInput) {
        // Move to previous player in the same round
        const currentPlayer = currentInput.dataset.player;
        const currentRound = parseInt(currentInput.dataset.round);
        const currentPlayerIndex = this.players.indexOf(currentPlayer);
        
        if (currentPlayerIndex > 0) {
            // Move to previous player in same round
            const prevPlayer = this.players[currentPlayerIndex - 1];
            const prevInput = document.querySelector(`.score-input[data-player="${prevPlayer}"][data-round="${currentRound}"]`);
            if (prevInput) {
                prevInput.focus();
                prevInput.select();
            }
        } else {
            // If first player, move to last player of previous round (if exists)
            if (currentRound > 0) {
                const prevRound = currentRound - 1;
                const lastPlayer = this.players[this.players.length - 1];
                const prevInput = document.querySelector(`.score-input[data-player="${lastPlayer}"][data-round="${prevRound}"]`);
                if (prevInput) {
                    prevInput.focus();
                    prevInput.select();
                }
            }
        }
    }
    
    focusInputBelow(currentInput) {
        // Same player, next round (next row)
        const currentPlayer = currentInput.dataset.player;
        const currentRound = parseInt(currentInput.dataset.round);
        if (currentRound < this.maxRounds - 1) {
            const belowInput = document.querySelector(`.score-input[data-player="${currentPlayer}"][data-round="${currentRound + 1}"]`);
            if (belowInput) {
                belowInput.focus();
                belowInput.select();
            }
        }
    }
    
    focusInputAbove(currentInput) {
        // Same player, previous round (previous row)
        const currentPlayer = currentInput.dataset.player;
        const currentRound = parseInt(currentInput.dataset.round);
        if (currentRound > 0) {
            const aboveInput = document.querySelector(`.score-input[data-player="${currentPlayer}"][data-round="${currentRound - 1}"]`);
            if (aboveInput) {
                aboveInput.focus();
                aboveInput.select();
            }
        }
    }
    
    addTouchGestures() {
        const scoreTable = document.getElementById('score-table');
        if (!scoreTable) return;
        
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        const minSwipeDistance = 50;
        const maxSwipeTime = 300;
        
        scoreTable.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        }, { passive: true });
        
        scoreTable.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 0) return;
            
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchEndTime = Date.now();
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;
            
            // Check if it's a valid swipe
            if (deltaTime > maxSwipeTime) return;
            
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            if (absDeltaX > minSwipeDistance && absDeltaX > absDeltaY) {
                // Horizontal swipe
                const focusedInput = document.activeElement;
                if (focusedInput && focusedInput.classList.contains('score-input')) {
                    if (deltaX > 0) {
                        // Swipe right - next input
                        this.focusNextInput(focusedInput);
                    } else {
                        // Swipe left - previous input
                        this.focusPreviousInput(focusedInput);
                    }
                }
            } else if (absDeltaY > minSwipeDistance && absDeltaY > absDeltaX) {
                // Vertical swipe
                const focusedInput = document.activeElement;
                if (focusedInput && focusedInput.classList.contains('score-input')) {
                    if (deltaY > 0) {
                        // Swipe down - input below
                        this.focusInputBelow(focusedInput);
                    } else {
                        // Swipe up - input above
                        this.focusInputAbove(focusedInput);
                    }
                }
            }
        }, { passive: true });
    }

    checkRoundComplete() {
        // Check if all players have entered a score for the current round
        const currentRoundComplete = this.players.every(player => 
            this.scores[player][this.currentRound - 1] !== null
        );

        if (currentRoundComplete && this.currentRound < this.maxRounds) {
            // Auto-advance to next round
            setTimeout(() => {
                this.currentRound++;
                this.updateCurrentRound();
                this.highlightCurrentRound();
            }, 500);
        }
    }

    checkGameOver() {
        // Check if all rounds are complete for all players
        const allRoundsComplete = this.players.every(player => 
            this.scores[player].every(score => score !== null)
        );

        if (allRoundsComplete) {
            setTimeout(() => {
                this.showGameOver();
            }, 1000);
        }
    }

    showGameOver() {
        // Calculate final totals and find winner(s)
        const playerTotals = this.players.map(player => ({
            name: player,
            total: this.calculatePlayerTotal(player)
        }));

        // Sort by total (lowest score wins in golf)
        playerTotals.sort((a, b) => a.total - b.total);
        
        const lowestScore = playerTotals[0].total;
        const winners = playerTotals.filter(player => player.total === lowestScore);
        
        // Update current round display to show game over
        const roundDisplay = document.getElementById('current-round');
        roundDisplay.textContent = 'Game Over!';
        roundDisplay.style.color = '#dc2626';
        roundDisplay.style.fontWeight = 'bold';
        
        // Highlight winner column(s)
        winners.forEach(winner => {
            document.querySelectorAll(`[data-player="${winner.name}"]`).forEach(cell => {
                cell.classList.add('winner-col');
            });
        });
        
        // Show game over message
        this.displayGameOverMessage(winners);
    }

    displayGameOverMessage(winners) {
        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-message">
                <h2 class="text-3xl font-bold text-green-800 mb-4">🎉 Game Over! 🎉</h2>
                <div class="mb-4">
                    ${winners.length === 1 ? 
                        `<p class="text-xl text-green-700">Winner: <strong>${winners[0].name}</strong></p>
                         <p class="text-lg text-gray-600">Final Score: ${winners[0].total}</p>` :
                        `<p class="text-xl text-green-700">It's a tie!</p>
                         <p class="text-lg text-gray-600">Winners: ${winners.map(w => w.name).join(', ')}</p>
                         <p class="text-lg text-gray-600">Final Score: ${winners[0].total}</p>`
                    }
                </div>
                <button 
                    onclick="gameTracker.closeGameOver()" 
                    class="premium-btn bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-bold mr-3"
                >
                    Continue
                </button>
                <button 
                    onclick="gameTracker.newGame()" 
                    class="premium-btn bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-bold"
                >
                    New Game
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add fade-in animation
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
    }

    closeGameOver() {
        const overlay = document.querySelector('.game-over-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    resetGame() {
        this.showConfirm('Reset the entire game? This will clear all players and scores and cannot be undone.', () => {
            // Clear all game data
            this.players = [];
            this.scores = {};
            this.currentRound = 1;
            
            // Clear localStorage
            try {
                localStorage.removeItem('golfScoreTracker');
            } catch (error) {
                console.error('Failed to clear localStorage:', error);
            }
            
            // Reset UI to initial state
            document.getElementById('player-setup').style.display = 'block';
            document.getElementById('game-board').style.display = 'none';
            document.body.classList.remove('game-active');
            const burgerWrap = document.getElementById('game-burger-wrap');
            if (burgerWrap) burgerWrap.style.display = 'none';
            this.closeBurger();
            
            // Reset round display styling
            const roundDisplay = document.getElementById('current-round');
            roundDisplay.textContent = '1';
            roundDisplay.style.color = '';
            roundDisplay.style.fontWeight = '';
            
            // Close any game over overlay
            this.closeGameOver();
            
            this.updatePlayersList();
            
            // Focus on player name input
            document.getElementById('player-name').focus();
        });
    }

    exportSummary() {
        if (this.players.length === 0) {
            this.showToast('No game data to export.', 'warning');
            return;
        }
        
        // Calculate all player totals
        const playerTotals = this.players.map(player => ({
            name: player,
            total: this.calculatePlayerTotal(player),
            scores: [...this.scores[player]]
        }));
        
        // Sort by total (lowest score wins)
        playerTotals.sort((a, b) => a.total - b.total);
        
        // Create summary text
        const timestamp = new Date().toLocaleString();
        let summary = `GOLF SCORE TRACKER - GAME SUMMARY\n`;
        summary += `Generated: ${timestamp}\n`;
        summary += `Players: ${this.players.length}\n`;
        summary += `Rounds Played: ${this.currentRound === 10 ? '9 (Complete)' : this.currentRound - 1}\n\n`;
        
        // Add detailed scores
        summary += `DETAILED SCORES:\n`;
        summary += `${'Player'.padEnd(15)} | `;
        for (let i = 1; i <= 9; i++) {
            summary += `R${i}`.padStart(4);
        }
        summary += ` | Total\n`;
        summary += `${'-'.repeat(15)} | ${'-'.repeat(36)} | -----\n`;
        
        playerTotals.forEach(player => {
            summary += `${player.name.padEnd(15)} | `;
            player.scores.forEach(score => {
                const scoreStr = score !== null ? score.toString() : '-';
                summary += scoreStr.padStart(4);
            });
            summary += ` | ${player.total.toString().padStart(3)}\n`;
        });
        
        // Add winner information
        summary += `\nRESULTS:\n`;
        const lowestScore = playerTotals[0].total;
        const winners = playerTotals.filter(p => p.total === lowestScore);
        
        if (winners.length === 1) {
            summary += `🏆 WINNER: ${winners[0].name} (Score: ${winners[0].total})\n`;
        } else {
            summary += `🏆 TIE GAME!\n`;
            summary += `Winners: ${winners.map(w => `${w.name} (${w.total})`).join(', ')}\n`;
        }
        
        summary += `\nLowest Score Wins in Golf!\n`;
        
        // Create downloadable file
        this.downloadSummary(summary);
        
        // Also copy to clipboard if possible
        this.copyToClipboard(summary);
    }
    
    downloadSummary(summary) {
        try {
            const blob = new Blob([summary], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            a.href = url;
            a.download = `golf-scores-${timestamp}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: show in alert
            this.showToast('Download failed. Summary was copied to clipboard if possible.', 'error');
        }
    }
    
    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                // Show brief success message
                this.showToast('Summary copied to clipboard and downloaded!');
            }).catch(() => {
                this.showToast('Summary downloaded successfully!');
            });
        } else {
            this.showToast('Summary downloaded successfully!');
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show and auto-hide toast
        setTimeout(() => toast.classList.add('show'), 10);
        const hideDelay = type === 'error' ? 5000 : 3000; // Show errors longer
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, hideDelay);
    }

    showConfirm(message, onConfirm) {
        document.getElementById('confirm-modal-message').textContent = message;
        this._confirmCallback = onConfirm;
        document.getElementById('confirm-modal').hidden = false;
    }

    closeBurger() {
        const menu = document.getElementById('game-burger-menu');
        const btn = document.getElementById('game-burger-btn');
        if (menu) menu.classList.remove('game-burger-menu-open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }
    
    updateCurrentRound() {
        const roundEl = document.getElementById('current-round');
        if (roundEl) roundEl.textContent = this.currentRound;
        this.updateRoundProgress();

        // Focus on first player's input for current round
        const firstPlayerInput = document.querySelector(`.score-input[data-player="${this.players[0]}"][data-round="${this.currentRound - 1}"]`);
        if (firstPlayerInput && !firstPlayerInput.value) {
            setTimeout(() => firstPlayerInput.focus(), 100);
        }
    }

    highlightCurrentRound() {
        // Remove existing highlights
        document.querySelectorAll('.score-cell').forEach(cell => {
            cell.classList.remove('current-round', 'completed');
        });

        // Highlight current round and completed rounds
        for (let round = 0; round < this.maxRounds; round++) {
            this.players.forEach(player => {
                const cell = document.querySelector(`.score-cell[data-player="${player}"][data-round="${round}"]`);
                if (cell) {
                    if (round < this.currentRound - 1) {
                        cell.classList.add('completed');
                    } else if (round === this.currentRound - 1) {
                        cell.classList.add('current-round');
                    }
                }
            });
        }
    }

    clearRound() {
        if (!this.players || this.players.length === 0) {
            this.showToast('No players in the game.', 'error');
            return;
        }
        
        this.showConfirm(`Clear all scores for round ${this.currentRound}?`, () => {
            try {
                const roundIndex = this.currentRound - 1;
                
                if (roundIndex < 0 || roundIndex >= this.maxRounds) {
                    this.showToast('Invalid round number.', 'error');
                    return;
                }
                
                this.players.forEach(player => {
                    // Clear the score in the data
                    if (this.scores[player] && this.scores[player][roundIndex] !== undefined) {
                        this.scores[player][roundIndex] = null;
                    }
                    
                    // Clear the input field - try multiple selector strategies
                    let input = document.querySelector(`.score-input[data-player="${player}"][data-round="${roundIndex}"]`);
                    
                    // Fallback: try finding by td then input
                    if (!input) {
                        const cell = document.querySelector(`.score-cell[data-player="${player}"][data-round="${roundIndex}"]`);
                        if (cell) {
                            input = cell.querySelector('.score-input');
                        }
                    }
                    
                    if (input) {
                        input.value = '';
                        // Clear any error styling
                        this.clearInputError(input);
                    } else {
                        console.warn(`Could not find input for player ${player}, round ${roundIndex}`);
                    }
                    
                    // Update total (footer + header)
                    const tot = this.calculatePlayerTotal(player);
                    const totalCell = document.querySelector(`[data-player="${player}"].total-cell`);
                    if (totalCell) totalCell.textContent = tot;
                    const headerTotal = document.querySelector(`.player-header-total[data-player="${player}"]`);
                    if (headerTotal) headerTotal.textContent = `(${tot})`;
                });
                
                this.updateLeaderIndicator();
                // Refresh the round highlighting to ensure UI is updated
                this.highlightCurrentRound();
                
                // Save to storage
                this.saveToStorage();
                
                // Show confirmation
                this.showToast(`Round ${this.currentRound} cleared successfully.`, 'success');
            } catch (error) {
                console.error('Error clearing round:', error);
                this.showToast('Error clearing round. Please try again.', 'error');
            }
        });
    }

    clearAllScores() {
        this.showConfirm('Clear all scores for all rounds? This cannot be undone.', () => {
            this.players.forEach(player => {
                this.scores[player] = new Array(this.maxRounds).fill(null);
            });
            this.currentRound = 1;
            this.createScoreTable();
            this.updateCurrentRound();
            this.saveToStorage();
        });
    }

    newGame() {
        this.showConfirm('Start a new game? This will clear all current data.', () => {
            this.players = [];
            this.scores = {};
            this.currentRound = 1;
            
            document.getElementById('player-setup').style.display = 'block';
            document.getElementById('game-board').style.display = 'none';
            document.body.classList.remove('game-active');
            const burgerWrap = document.getElementById('game-burger-wrap');
            if (burgerWrap) burgerWrap.style.display = 'none';
            this.closeBurger();
            
            this.updatePlayersList();
            this.saveToStorage();
            
            // Focus on player name input
            document.getElementById('player-name').focus();
        });
    }

    saveToStorage() {
        const gameState = {
            players: this.players,
            scores: this.scores,
            currentRound: this.currentRound,
            timestamp: new Date().toISOString(),
            version: this.version
        };
        
        try {
            localStorage.setItem('golfScoreTracker', JSON.stringify(gameState));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            this.handleStorageError(error, 'save');
        }
    }
    
    updateVersionDisplay() {
        const versionNumber = document.getElementById('version-number');
        if (versionNumber) {
            versionNumber.textContent = this.version;
        }
        
        // Update page title with version
        document.title = `Golf Score Tracker - Premium Card Room v${this.version}`;
        
        // Show the version section
        const versionSection = document.getElementById('game-version');
        if (versionSection) {
            versionSection.style.display = 'block';
        }
    }
    
    // Enhanced Error Handling Methods
    saveToStorageWithRetry(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.saveToStorage();
                return true; // Success
            } catch (error) {
                console.error(`Save attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) {
                    this.handleStorageError(error, 'save');
                    return false;
                }
                // Wait a bit before retrying
                setTimeout(() => {}, 100 * attempt);
            }
        }
        return false;
    }
    
    handleStorageError(error, operation) {
        let message = '';
        
        if (error.name === 'QuotaExceededError') {
            message = 'Storage space is full. Game data may not be saved. Consider clearing browser data or game history.';
        } else if (error.name === 'SecurityError') {
            message = 'Cannot access storage. Please ensure cookies and local storage are enabled.';
        } else {
            message = `Failed to ${operation} game data. Your progress may not be saved.`;
        }
        
        this.showToast(message, 'error');
        
        // Offer recovery options
        if (operation === 'save') {
            setTimeout(() => {
                this.showConfirm('Would you like to export your current game data as backup?', () => this.exportSummary());
            }, 2000);
        }
    }
    
    showInputError(input, message) {
        // Add error styling
        input.classList.add('input-error');
        
        // Create error tooltip
        const errorTooltip = document.createElement('div');
        errorTooltip.className = 'input-error-tooltip';
        errorTooltip.textContent = message;
        
        // Position tooltip
        const container = input.closest('.score-input-container');
        if (container) {
            container.style.position = 'relative';
            container.appendChild(errorTooltip);
            
            // Remove after 3 seconds
            setTimeout(() => {
                this.clearInputError(input);
            }, 3000);
        }
        
        // Shake animation
        input.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
    }
    
    clearInputError(input) {
        input.classList.remove('input-error');
        const container = input.closest('.score-input-container');
        if (container) {
            const tooltip = container.querySelector('.input-error-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('golfScoreTracker');
            if (saved) {
                const gameState = JSON.parse(saved);
                
                // Validate loaded data structure
                if (this.validateGameState(gameState)) {
                    this.players = gameState.players || [];
                    this.scores = gameState.scores || {};
                    this.currentRound = gameState.currentRound || 1;
                    
                    // Initialize scores for any missing players
                    this.players.forEach(player => {
                        if (!this.scores[player]) {
                            this.scores[player] = new Array(this.maxRounds).fill(null);
                        }
                    });
                    
                    // Validate scores structure
                    this.validateAndFixScores();
                    
                    // Update version if it exists in saved state
                    if (gameState.version) {
                        this.version = gameState.version;
                    }
                } else {
                    throw new Error('Invalid game state data');
                }
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.handleStorageError(error, 'load');
            this.resetToDefaults();
            
            // Offer to restore from backup if available
            this.offerBackupRestore();
        }
    }
    
    validateGameState(gameState) {
        if (!gameState || typeof gameState !== 'object') return false;
        if (!Array.isArray(gameState.players)) return false;
        if (!gameState.scores || typeof gameState.scores !== 'object') return false;
        if (typeof gameState.currentRound !== 'number') return false;
        if (gameState.currentRound < 1 || gameState.currentRound > this.maxRounds) return false;
        
        // Check that all players have score arrays
        for (const player of gameState.players) {
            if (!Array.isArray(gameState.scores[player])) return false;
            if (gameState.scores[player].length !== this.maxRounds) return false;
        }
        
        return true;
    }
    
    validateAndFixScores() {
        this.players.forEach(player => {
            if (this.scores[player]) {
                this.scores[player] = this.scores[player].map(score => {
                    if (score === null || score === undefined) return null;
                    const numScore = parseInt(score);
                    if (isNaN(numScore) || numScore < -48 || numScore > 48) {
                        console.warn(`Invalid score ${score} for player ${player}, resetting to null`);
                        return null;
                    }
                    return numScore;
                });
            }
        });
    }
    
    resetToDefaults() {
        this.players = [];
        this.scores = {};
        this.currentRound = 1;
    }
    
    offerBackupRestore() {
        this.showToast('Game data may be corrupted. Starting fresh.', 'warning');
    }

    updateUI() {
        this.updatePlayersList();
        
        // If we have a game in progress, show the game board
        if (this.players.length >= this.minPlayers && Object.keys(this.scores).length > 0) {
            // Check if any scores have been entered
            const hasScores = Object.values(this.scores).some(playerScores => 
                playerScores.some(score => score !== null)
            );
            
            if (hasScores) {
                this.startGame();
            }
        }
        
        // Display version
        this.updateVersionDisplay();
    }
}

// Initialize the game when the page loads
let gameTracker;
document.addEventListener('DOMContentLoaded', () => {
    try {
        gameTracker = new GolfScoreTracker();
    } catch (error) {
        console.error('Failed to initialize game:', error);
        const toast = document.createElement('div');
        toast.className = 'toast-message toast-error show';
        toast.textContent = 'Failed to load the game. Please refresh the page and try again.';
        document.body.appendChild(toast);
    }
});

// Enhanced global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Prevent form submission on Enter key for non-input elements
    if (e.key === 'Enter' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
    }
    
    // Global keyboard shortcuts
    if (gameTracker && !e.target.classList.contains('score-input')) {
        switch (e.key) {
            case 'n':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (document.getElementById('game-board').style.display !== 'none') {
                        gameTracker.newGame();
                    }
                }
                break;
            case 'e':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const exportBtn = document.getElementById('burger-export');
                    if (exportBtn) exportBtn.click();
                }
                break;
            case 'r':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const resetBtn = document.getElementById('burger-reset');
                    if (resetBtn) resetBtn.click();
                }
                break;
            case 'Escape':
                const menu = document.getElementById('game-burger-menu');
                if (menu && menu.classList.contains('game-burger-menu-open')) {
                    gameTracker.closeBurger();
                } else {
                    const overlay = document.querySelector('.game-over-overlay');
                    if (overlay) gameTracker.closeGameOver();
                }
                break;
        }
    }
});

// Handle page visibility changes to save state
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && gameTracker) {
        try {
            gameTracker.saveToStorage();
        } catch (error) {
            console.error('Failed to save on page hide:', error);
        }
    }
});

// Handle before page unload to save state
window.addEventListener('beforeunload', () => {
    if (gameTracker) {
        try {
            gameTracker.saveToStorage();
        } catch (error) {
            console.error('Failed to save before unload:', error);
        }
    }
});
