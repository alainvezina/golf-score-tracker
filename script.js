// Golf Score Tracker - Vanilla JavaScript Application

class GolfScoreTracker {
    constructor() {
        this.players = [];
        this.scores = {};
        this.currentRound = 1;
        this.maxRounds = 9;
        this.maxPlayers = 6;
        this.minPlayers = 2;
        
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
            playerTag.innerHTML = `
                ${name} 
                <span class="remove-player" onclick="gameTracker.removePlayer('${name}')" title="Remove player">×</span>
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
    }

    createScoreTable() {
        const tbody = document.getElementById('score-table-body');
        tbody.innerHTML = '';

        this.players.forEach(playerName => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border-b border-r border-slate-200 px-4 py-3 font-semibold text-slate-700 player-name-cell">${playerName}</td>
                ${Array.from({length: this.maxRounds}, (_, round) => 
                    `<td class="border-b border-r border-slate-200 px-2 py-2 score-cell" data-player="${playerName}" data-round="${round}">
                        <div class="score-input-container">
                            <input 
                                type="number" 
                                class="score-input" 
                                placeholder="-"
                                min="-5"
                                max="20"
                                data-player="${playerName}" 
                                data-round="${round}"
                                value="${this.scores[playerName][round] !== null ? this.scores[playerName][round] : ''}"
                            >
                            <span class="edit-icon">✏️</span>
                        </div>
                    </td>`
                ).join('')}
                <td class="border-b border-slate-200 px-4 py-3 text-center font-bold text-slate-800 total-cell bg-blue-50" data-player="${playerName}">
                    ${this.calculatePlayerTotal(playerName)}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Bind score input events
        document.querySelectorAll('.score-input').forEach(input => {
            input.addEventListener('input', (e) => this.updateScore(e));
            input.addEventListener('focus', (e) => e.target.select());
        });

        this.highlightCurrentRound();
    }

    updateScore(event) {
        const input = event.target;
        const player = input.dataset.player;
        const round = parseInt(input.dataset.round);
        const value = input.value.trim();

        // Validate input
        if (value === '') {
            this.scores[player][round] = null;
        } else {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue >= -5 && numValue <= 20) {
                this.scores[player][round] = numValue;
            } else {
                input.value = this.scores[player][round] !== null ? this.scores[player][round] : '';
                return;
            }
        }

        // Update total for this player
        const totalCell = document.querySelector(`[data-player="${player}"].total-cell`);
        totalCell.textContent = this.calculatePlayerTotal(player);

        // Check if round is complete and advance if needed
        this.checkRoundComplete();
        
        // Check if game is over
        this.checkGameOver();
        
        this.saveToStorage();
    }

    calculatePlayerTotal(player) {
        const scores = this.scores[player].filter(score => score !== null);
        if (scores.length === 0) return 0;
        return scores.reduce((total, score) => total + score, 0);
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
            const winnerRow = document.querySelector(`[data-player="${winner.name}"].total-cell`).parentElement;
            winnerRow.classList.add('winner-row');
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
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show and auto-hide toast
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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
                    <div class="history-game-item bg-gray-50 p-3 rounded-lg">
                        <div class="text-sm font-medium text-gray-800">
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
        const firstPlayerInput = document.querySelector(`[data-player="${this.players[0]}"][data-round="${this.currentRound - 1}"]`);
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
                const cell = document.querySelector(`[data-player="${player}"][data-round="${round}"]`).parentNode;
                if (round < this.currentRound - 1) {
                    cell.classList.add('completed');
                } else if (round === this.currentRound - 1) {
                    cell.classList.add('current-round');
                }
            });
        }
    }

    clearRound() {
        if (confirm(`Clear all scores for round ${this.currentRound}?`)) {
            this.players.forEach(player => {
                this.scores[player][this.currentRound - 1] = null;
                const input = document.querySelector(`[data-player="${player}"][data-round="${this.currentRound - 1}"]`);
                if (input) input.value = '';
                
                // Update total
                const totalCell = document.querySelector(`[data-player="${player}"].total-cell`);
                totalCell.textContent = this.calculatePlayerTotal(player);
            });
            this.saveToStorage();
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
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('golfScoreTracker', JSON.stringify(gameState));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('golfScoreTracker');
            if (saved) {
                const gameState = JSON.parse(saved);
                this.players = gameState.players || [];
                this.scores = gameState.scores || {};
                this.currentRound = gameState.currentRound || 1;
                
                // Initialize scores for any missing players
                this.players.forEach(player => {
                    if (!this.scores[player]) {
                        this.scores[player] = new Array(this.maxRounds).fill(null);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.players = [];
            this.scores = {};
            this.currentRound = 1;
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
    }
}

// Initialize the game when the page loads
let gameTracker;
document.addEventListener('DOMContentLoaded', () => {
    gameTracker = new GolfScoreTracker();
});

// Prevent form submission on Enter key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
    }
});

// Handle page visibility changes to save state
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && gameTracker) {
        gameTracker.saveToStorage();
    }
});