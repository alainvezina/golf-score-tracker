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
        document.getElementById('game-board').style.display = 'block';
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
                <td class="border border-green-300 px-3 py-2 font-semibold player-name-cell">${playerName}</td>
                ${Array.from({length: this.maxRounds}, (_, round) => 
                    `<td class="border border-green-300 px-1 py-2 score-cell" data-player="${playerName}" data-round="${round}">
                        <input 
                            type="number" 
                            class="score-input" 
                            placeholder="0"
                            min="-5"
                            max="20"
                            data-player="${playerName}" 
                            data-round="${round}"
                            value="${this.scores[playerName][round] !== null ? this.scores[playerName][round] : ''}"
                        >
                    </td>`
                ).join('')}
                <td class="border border-green-300 px-3 py-2 text-center total-cell" data-player="${playerName}">
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