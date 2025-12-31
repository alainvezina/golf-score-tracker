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

        // Game control events
        document.getElementById('clear-round').addEventListener('click', () => this.clearRound());
        document.getElementById('clear-all').addEventListener('click', () => this.clearAllScores());
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        
        // Bottom navigation events
        document.getElementById('bottom-reset').addEventListener('click', () => this.resetGame());
        document.getElementById('bottom-export').addEventListener('click', () => this.exportSummary());

        // Load existing game state
        if (this.players.length >= this.minPlayers) {
            this.startGame();
        }
    }

    addPlayer() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();

        if (!name) {
            alert('Please enter a player name');
            return;
        }

        if (this.players.includes(name)) {
            alert('Player name already exists');
            return;
        }

        if (this.players.length >= this.maxPlayers) {
            alert(`Maximum ${this.maxPlayers} players allowed`);
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
            alert(`Need at least ${this.minPlayers} players to start`);
            return;
        }

        document.getElementById('player-setup').style.display = 'none';
        document.getElementById('previous-games').style.display = 'none';
        document.getElementById('game-board').style.display = 'block';
        document.getElementById('bottom-nav').style.display = 'block';
        document.getElementById('game-board').classList.add('fade-in');
        
        this.createScoreTable();
        this.updateCurrentRound();
        this.updateVersionDisplay();
        this.saveToStorage();
    }

    createScoreTable() {
        const tbody = document.getElementById('score-table-body');
        tbody.innerHTML = '';

        this.players.forEach(playerName => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border-b-2 border-r-2 border-amber-400 px-4 py-4 font-bold text-emerald-900 player-name-cell font-cinzel bg-amber-50">🎭 ${playerName}</td>
                ${Array.from({length: this.maxRounds}, (_, round) => 
                    `<td class="border-b-2 border-r-2 border-amber-400 px-2 py-3 score-cell" data-player="${playerName}" data-round="${round}">
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
                <td class="border-b-2 border-amber-400 px-4 py-4 text-center font-bold text-emerald-900 total-cell bg-gradient-to-r from-amber-200 to-amber-100 font-cinzel" data-player="${playerName}">
                    ${this.calculatePlayerTotal(playerName)}
                </td>
            `;
            tbody.appendChild(row);
        });

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

            // Update total for this player
            const totalCell = document.querySelector(`[data-player="${player}"].total-cell`);
            if (totalCell) {
                totalCell.textContent = this.calculatePlayerTotal(player);
            }

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
        const currentPlayer = currentInput.dataset.player;
        const currentRound = parseInt(currentInput.dataset.round);
        const currentPlayerIndex = this.players.indexOf(currentPlayer);
        
        if (currentPlayerIndex < this.players.length - 1) {
            const nextPlayer = this.players[currentPlayerIndex + 1];
            const belowInput = document.querySelector(`.score-input[data-player="${nextPlayer}"][data-round="${currentRound}"]`);
            if (belowInput) {
                belowInput.focus();
                belowInput.select();
            }
        }
    }
    
    focusInputAbove(currentInput) {
        const currentPlayer = currentInput.dataset.player;
        const currentRound = parseInt(currentInput.dataset.round);
        const currentPlayerIndex = this.players.indexOf(currentPlayer);
        
        if (currentPlayerIndex > 0) {
            const prevPlayer = this.players[currentPlayerIndex - 1];
            const aboveInput = document.querySelector(`.score-input[data-player="${prevPlayer}"][data-round="${currentRound}"]`);
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
        
        // Save completed game to history
        this.saveGameToHistory(playerTotals);
        
        // Update current round display to show game over
        const roundDisplay = document.getElementById('current-round');
        roundDisplay.textContent = 'Game Over!';
        roundDisplay.style.color = '#dc2626';
        roundDisplay.style.fontWeight = 'bold';
        
        // Highlight winner row(s)
        winners.forEach(winner => {
            const totalCell = document.querySelector(`[data-player="${winner.name}"].total-cell`);
            if (totalCell) {
                const winnerRow = totalCell.parentElement;
                if (winnerRow) {
                    winnerRow.classList.add('winner-row');
                }
            }
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
                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold transition-colors mr-3"
                >
                    Continue
                </button>
                <button 
                    onclick="gameTracker.newGame()" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors"
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
        if (confirm('Reset the entire game? This will clear all players and scores and cannot be undone.')) {
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
            document.getElementById('previous-games').style.display = 'block';
            document.getElementById('game-board').style.display = 'none';
            document.getElementById('bottom-nav').style.display = 'none';
            
            // Reset round display styling
            const roundDisplay = document.getElementById('current-round');
            roundDisplay.textContent = '1';
            roundDisplay.style.color = '';
            roundDisplay.style.fontWeight = '';
            
            // Close any game over overlay
            this.closeGameOver();
            
            this.updatePlayersList();
            this.updateHistoryDisplay();
            
            // Focus on player name input
            document.getElementById('player-name').focus();
        }
    }

    exportSummary() {
        if (this.players.length === 0) {
            alert('No game data to export.');
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
            alert('Download failed. Here\'s your summary:\n\n' + summary);
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
    
    saveGameToHistory(playerTotals) {
        try {
            const gameHistory = this.getGameHistory();
            
            // Create new game record
            const gameRecord = {
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                }),
                players: playerTotals.map(player => ({
                    name: player.name,
                    total: player.total
                }))
            };
            
            // Add to beginning of history array
            gameHistory.unshift(gameRecord);
            
            // Keep only the last 10 games
            if (gameHistory.length > 10) {
                gameHistory.splice(10);
            }
            
            // Save to localStorage
            localStorage.setItem('golfScoreHistory', JSON.stringify(gameHistory));
            
            // Update the history display
            this.updateHistoryDisplay();
            
        } catch (error) {
            console.error('Failed to save game to history:', error);
        }
    }
    
    getGameHistory() {
        try {
            const historyData = localStorage.getItem('golfScoreHistory');
            return historyData ? JSON.parse(historyData) : [];
        } catch (error) {
            console.error('Failed to load game history:', error);
            return [];
        }
    }
    
    updateHistoryDisplay() {
        const historyContainer = document.getElementById('games-history');
        const clearButton = document.getElementById('clear-history');
        const gameHistory = this.getGameHistory();
        
        if (gameHistory.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-500 italic">No previous games yet. Complete a game to see your history!</p>';
            clearButton.style.display = 'none';
        } else {
            // Create formatted history list
            const historyHTML = gameHistory.map(game => {
                const playersText = game.players
                    .map(player => `${player.name}: ${player.total}`)
                    .join(', ');
                
                return `
                    <div class="history-game-item">
                        <div class="text-sm font-bold">
                            ${game.date} – ${playersText}
                        </div>
                    </div>
                `;
            }).join('');
            
            historyContainer.innerHTML = historyHTML;
            clearButton.style.display = 'inline-block';
        }
    }
    
    clearHistory() {
        if (confirm('Clear all game history? This action cannot be undone.')) {
            try {
                localStorage.removeItem('golfScoreHistory');
                this.updateHistoryDisplay();
                this.showToast('Game history cleared successfully.');
            } catch (error) {
                console.error('Failed to clear history:', error);
                alert('Failed to clear history. Please try again.');
            }
        }
    }

    updateCurrentRound() {
        document.getElementById('current-round').textContent = this.currentRound;
        
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
        
        if (confirm(`Clear all scores for round ${this.currentRound}?`)) {
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
                    
                    // Update total
                    const totalCell = document.querySelector(`[data-player="${player}"].total-cell`);
                    if (totalCell) {
                        totalCell.textContent = this.calculatePlayerTotal(player);
                    }
                });
                
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
        }
    }

    clearAllScores() {
        if (confirm('Clear all scores for all rounds? This cannot be undone.')) {
            this.players.forEach(player => {
                this.scores[player] = new Array(this.maxRounds).fill(null);
            });
            this.currentRound = 1;
            this.createScoreTable();
            this.updateCurrentRound();
            this.saveToStorage();
        }
    }

    newGame() {
        if (confirm('Start a new game? This will clear all current data.')) {
            this.players = [];
            this.scores = {};
            this.currentRound = 1;
            
            document.getElementById('player-setup').style.display = 'block';
            document.getElementById('game-board').style.display = 'none';
            
            this.updatePlayersList();
            this.updateHistoryDisplay();
            this.saveToStorage();
            
            // Focus on player name input
            document.getElementById('player-name').focus();
        }
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
                if (confirm(`${message}\n\nWould you like to export your current game data as backup?`)) {
                    this.exportSummary();
                }
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
        // Check if there's any game history that could be used as backup
        const history = this.getGameHistory();
        if (history && history.length > 0) {
            setTimeout(() => {
                if (confirm('Your current game data appears corrupted. Would you like to view your game history to manually restore a previous game?')) {
                    // Show the previous games section
                    document.getElementById('previous-games').style.display = 'block';
                    this.updateHistoryDisplay();
                }
            }, 1000);
        }
    }

    updateUI() {
        this.updatePlayersList();
        this.updateHistoryDisplay();
        
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
        alert('Failed to load the game. Please refresh the page and try again.');
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
                    const newGameBtn = document.getElementById('new-game');
                    if (newGameBtn && newGameBtn.style.display !== 'none') {
                        newGameBtn.click();
                    }
                }
                break;
            case 'e':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const exportBtn = document.getElementById('bottom-export');
                    if (exportBtn && exportBtn.style.display !== 'none') {
                        exportBtn.click();
                    }
                }
                break;
            case 'r':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const resetBtn = document.getElementById('bottom-reset');
                    if (resetBtn && resetBtn.style.display !== 'none') {
                        resetBtn.click();
                    }
                }
                break;
            case 'Escape':
                // Close any open overlays
                const overlay = document.querySelector('.game-over-overlay');
                if (overlay) {
                    gameTracker.closeGameOver();
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
