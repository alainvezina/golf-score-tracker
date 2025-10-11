# Golf Score Tracker

A mobile-friendly web application for tracking scores in the 8-card Golf card game.

## Features

- **Player Management**: Add 2-6 players with unique names
- **Score Tracking**: Track scores across 9 rounds with automatic totaling
- **Mobile-Friendly**: Responsive design optimized for mobile devices
- **Auto-Save**: Automatically saves game state using localStorage
- **Round Management**: Visual indicators for current and completed rounds
- **Game Controls**: Clear current round, clear all scores, or start new game

## How to Use

1. **Setup Players**: Enter player names and click "Add Player"
2. **Start Game**: Click "Start Game" once you have 2+ players
3. **Enter Scores**: Input scores for each round (accepts -5 to 20)
4. **Track Progress**: Current round is highlighted in yellow, completed rounds in green
5. **Automatic Advancement**: Game advances to next round when all players have scores

## Game Rules (8-Card Golf)

In 8-card Golf, players aim for the **lowest total score** across 9 rounds:
- Each player receives 8 cards per round
- Scoring varies by card combinations
- Lower scores are better
- Game progresses through 9 rounds

## Technical Details

- **Framework**: Pure HTML, CSS (Tailwind), and vanilla JavaScript
- **Storage**: Client-side localStorage for persistence
- **Compatibility**: Works on all modern browsers
- **No Dependencies**: No external libraries or build tools required

## File Structure

```
golf-score-tracker/
├── index.html          # Main application file
├── styles.css          # Custom CSS styles
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## Features

### Player Management
- Add up to 6 players
- Remove players before starting game
- Duplicate name validation
- Player name persistence

### Score Tracking
- Input validation (-5 to 20 range)
- Real-time total calculation
- Round-by-round progression
- Visual feedback for current/completed rounds

### Mobile Optimization
- Responsive table design
- Touch-friendly inputs
- Optimized typography for small screens
- Horizontal scrolling for score table

### Data Persistence
- Automatic save to localStorage
- Game state restoration on page reload
- Graceful handling of storage errors
- Timestamp tracking

### Accessibility Features
- High contrast mode support
- Reduced motion support
- Keyboard navigation
- Screen reader friendly markup

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Getting Started

1. Download or clone the project files
2. Open `index.html` in any modern web browser
3. No server setup or installation required!

## License

This project is open source and available under the MIT License.