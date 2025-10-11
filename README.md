# Golf Score Tracker 🏌️

A modern, mobile-friendly web application for tracking scores in the 8-card Golf card game.

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🎮 Game Management
- **2-6 Player Support** - Add and manage players with unique names
- **9 Round Scoring** - Track scores across all rounds with automatic progression
- **Input Validation** - Score range validation (-5 to 20) with visual feedback
- **Game State Persistence** - Automatic saving with localStorage
- **Winner Detection** - Automatic game completion with winner highlighting

### 📱 Modern Mobile-First Design
- **Responsive Layout** - Optimized for all screen sizes
- **Touch-Friendly** - 44px+ tap targets for mobile accessibility
- **Clean Flat Design** - Modern blue/teal/gray color palette
- **Professional Typography** - Inter font for enhanced readability
- **Interactive Feedback** - Hover effects and smooth transitions

### 📊 Advanced Features
- **Previous Games History** - View up to 10 recent games with scores
- **Export Summary** - Download detailed game summaries as text files
- **Fixed Bottom Navigation** - Easy access to key actions on mobile
- **Visual Round Indicators** - Clear highlighting of current/completed rounds
- **Game Controls** - Clear rounds, reset game, start new game options

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)
1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from a branch" → `main` → `/ (root)`
4. Access your app at `https://your-username.github.io/golf-score-tracker`

### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/golf-score-tracker.git
cd golf-score-tracker

# Serve locally (choose one):
python -m http.server 8000        # Python 3
python -m SimpleHTTPServer 8000   # Python 2
npx http-server . -p 8000         # Node.js

# Open in browser
open http://localhost:8000
```

### Option 3: Direct Download
1. Download the repository as ZIP
2. Extract and open `index.html` in any modern browser
3. No installation required!

## 🎯 How to Play 8-Card Golf

In 8-card Golf, players aim for the **lowest total score**:

1. **Setup**: Each player receives 8 cards per round
2. **Scoring**: Various card combinations yield different points
3. **Objective**: Accumulate the lowest total score across 9 rounds
4. **Winner**: Player with the lowest final total wins

## 🛠️ Technical Details

### Built With
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Tailwind CSS
- **Vanilla JavaScript** - No framework dependencies
- **localStorage API** - Client-side persistence

### Architecture
- **Single-page Application** - Dynamic UI updates
- **Class-based JavaScript** - Clean, maintainable code structure
- **Event-driven Design** - Responsive user interactions
- **Mobile-first CSS** - Progressive enhancement approach

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