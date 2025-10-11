# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a mobile-friendly web application for tracking scores in the 8-card Golf card game. It's built with vanilla HTML, CSS (using Tailwind CDN), and JavaScript with no build system or dependencies.

## Development Commands

### Running the Application
```bash
# Serve the application locally using Python (Python 3)
python -m http.server 8000

# Or using Python 2
python -m SimpleHTTPServer 8000

# Alternative: Using Node.js (if installed)
npx http-server . -p 8000

# Access the application at http://localhost:8000
```

### Development Workflow
```bash
# Open the project in a browser directly (no server needed for basic development)
open index.html

# For development with live reload capabilities
npx live-server --port=8000

# Check for JavaScript syntax errors
node -c script.js
```

### Code Analysis and Linting
```bash
# Basic HTML validation (if html5validator is installed)
html5validator --root . --format text

# JavaScript linting with ESLint (if configured)
npx eslint script.js

# CSS validation (online tool recommended as no build system exists)
```

## Architecture Overview

### Core Architecture Pattern
The application follows a **single-page application (SPA)** pattern with a class-based vanilla JavaScript architecture:

- **Single Class Design**: The entire application state and logic is managed by the `GolfScoreTracker` class
- **Event-Driven UI**: DOM manipulation is handled through event listeners and direct DOM updates
- **Local Storage Persistence**: All game state is automatically persisted to browser localStorage
- **Responsive Mobile-First**: Built with Tailwind CSS for mobile-optimized UI

### Key Components

#### 1. State Management (`GolfScoreTracker` class)
- **Players Array**: Stores active player names
- **Scores Object**: Nested structure storing scores by player and round
- **Current Round Tracking**: Manages game progression through 9 rounds
- **Auto-save**: Persistent state management with localStorage

#### 2. UI Management
- **Dynamic Table Generation**: Score table is dynamically created based on active players
- **Round Highlighting**: Visual feedback showing current/completed rounds
- **Input Validation**: Score inputs are constrained to valid range (-5 to 20)
- **Auto-advancement**: Game automatically progresses when all players complete a round

#### 3. Data Flow
```
User Input → Event Handler → State Update → DOM Update → localStorage Save
```

### File Structure & Responsibilities

- **`index.html`**: Complete UI structure with embedded Tailwind classes and semantic markup
- **`script.js`**: Single-class application logic with state management, event handling, and persistence
- **`styles.css`**: Custom CSS overrides and mobile-specific enhancements
- **`README.md`**: User documentation and feature overview

### State Architecture

The application state is centralized in the `GolfScoreTracker` class:

```javascript path=null start=null
{
  players: ["Player1", "Player2", ...],           // Array of player names
  scores: {                                        // Nested scores object
    "Player1": [null, 5, -2, 3, null, ...],      // 9-round scores per player
    "Player2": [2, null, 1, -1, null, ...]
  },
  currentRound: 1,                                // Active round (1-9)
  maxRounds: 9,                                   // Game configuration
  maxPlayers: 6,
  minPlayers: 2
}
```

### Key Behavioral Patterns

#### Game Flow Management
- **Setup Phase**: Player registration with validation (unique names, max 6 players)
- **Game Phase**: Round-by-round score entry with auto-advancement
- **Persistence**: Automatic state saving on every interaction and page visibility change

#### Input Handling
- **Real-time Validation**: Score inputs validated on entry (-5 to 20 range)
- **Keyboard Navigation**: Enter key advances between inputs, form submission prevented
- **Touch Optimization**: Input selection and mobile-friendly controls

#### Visual Feedback System
- **Round Status**: Current round highlighted in yellow, completed rounds in green
- **Score Totaling**: Real-time calculation and display of running totals
- **State Transitions**: Smooth animations between setup and game phases

## Development Guidelines

### Code Style Patterns
- Class-based organization with clear method separation
- Event delegation pattern for dynamic DOM elements
- Defensive programming with try/catch blocks for localStorage
- Mobile-first responsive design principles

### State Modification
- All state changes go through class methods
- Immediate DOM updates after state changes
- Automatic persistence after every state modification
- Input validation at the data layer level

### Testing Approach
Since this is a client-side only application:
- Manual testing in browser across devices
- localStorage behavior testing in different browsers
- Input validation testing with edge cases
- Responsive design testing across screen sizes