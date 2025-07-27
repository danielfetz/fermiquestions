// Game state
let currentQuestion = null;
let currentGuess = 0;
let maxGuesses = 6;
let gameWon = false;
let gameOver = false;

// Statistics
let stats = {
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0
    }
};

// Database of Fermi questions
const fermiQuestions = [
    {
        question: "How many chickens are slaughtered each year?",
        answer: 50000000000,
        category: "Agriculture",
        explanation: "Approximately 50 billion chickens are slaughtered annually worldwide for meat consumption."
    },
    {
        question: "How many people live in New York City?",
        answer: 8400000,
        category: "Population",
        explanation: "New York City has approximately 8.4 million residents."
    },
    {
        question: "How many cars are there in the United States?",
        answer: 280000000,
        category: "Transportation",
        explanation: "There are roughly 280 million registered vehicles in the US."
    },
    {
        question: "How many McDonald's restaurants exist worldwide?",
        answer: 40000,
        category: "Business",
        explanation: "McDonald's operates approximately 40,000 restaurants globally."
    },
    {
        question: "How many books are published each year in the US?",
        answer: 300000,
        category: "Publishing",
        explanation: "Around 300,000 new books are published annually in the United States."
    },
    {
        question: "How many trees are cut down each year globally?",
        answer: 15000000000,
        category: "Environment",
        explanation: "Approximately 15 billion trees are cut down annually worldwide."
    },
    {
        question: "How many emails are sent per day worldwide?",
        answer: 300000000000,
        category: "Technology",
        explanation: "Roughly 300 billion emails are sent daily across the globe."
    },
    {
        question: "How many pizzas are sold in the US each year?",
        answer: 3000000000,
        category: "Food",
        explanation: "About 3 billion pizzas are sold annually in the United States."
    },
    {
        question: "How many people visit Times Square each year?",
        answer: 50000000,
        category: "Tourism",
        explanation: "Approximately 50 million people visit Times Square annually."
    },
    {
        question: "How many smartphones are sold worldwide each year?",
        answer: 1400000000,
        category: "Technology",
        explanation: "Around 1.4 billion smartphones are sold globally each year."
    },
    {
        question: "How many cups of coffee are consumed daily in the US?",
        answer: 400000000,
        category: "Food",
        explanation: "Americans consume approximately 400 million cups of coffee daily."
    },
    {
        question: "How many movies are released in the US each year?",
        answer: 800,
        category: "Entertainment",
        explanation: "About 800 movies are released theatrically in the US annually."
    },
    {
        question: "How many people die from car accidents each year globally?",
        answer: 1350000,
        category: "Safety",
        explanation: "Approximately 1.35 million people die in road traffic accidents annually."
    },
    {
        question: "How many babies are born each day worldwide?",
        answer: 385000,
        category: "Population",
        explanation: "About 385,000 babies are born daily across the globe."
    },
    {
        question: "How many plastic bottles are used each year globally?",
        answer: 500000000000,
        category: "Environment",
        explanation: "Roughly 500 billion plastic bottles are used annually worldwide."
    }
];

// DOM elements
const questionText = document.getElementById('question-text');
const questionCategory = document.getElementById('question-category');
const guessCount = document.getElementById('guess-count');
const guessesContainer = document.getElementById('guesses-container');
const guessInput = document.getElementById('guess-input');
const submitBtn = document.getElementById('submit-btn');
const gameOverModal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalAnswer = document.getElementById('modal-answer');
const newGameBtn = document.getElementById('new-game-btn');
const helpBtn = document.getElementById('help-btn');
const statsBtn = document.getElementById('stats-btn');
const helpModal = document.getElementById('help-modal');
const statsModal = document.getElementById('stats-modal');
const closeHelpBtn = document.getElementById('close-help-btn');
const closeStatsBtn = document.getElementById('close-stats-btn');

// Initialize game
function initGame() {
    loadStats();
    startNewGame();
    setupEventListeners();
}

// Start a new game
function startNewGame() {
    currentQuestion = getRandomQuestion();
    currentGuess = 0;
    gameWon = false;
    gameOver = false;
    
    // Update display
    questionText.textContent = currentQuestion.question;
    questionCategory.textContent = currentQuestion.category;
    updateGuessCount();
    clearGuesses();
    
    // Reset input
    guessInput.value = '';
    guessInput.disabled = false;
    submitBtn.disabled = false;
    guessInput.focus();
}

// Get a random question
function getRandomQuestion() {
    const randomIndex = Math.floor(Math.random() * fermiQuestions.length);
    return fermiQuestions[randomIndex];
}

// Update guess counter
function updateGuessCount() {
    guessCount.textContent = `Guess: ${currentGuess}/${maxGuesses}`;
}

// Clear previous guesses
function clearGuesses() {
    guessesContainer.innerHTML = '';
    
    // Create empty guess rows
    for (let i = 0; i < maxGuesses; i++) {
        const guessRow = document.createElement('div');
        guessRow.className = 'guess-row';
        
        const guessField = document.createElement('div');
        guessField.className = 'guess-field empty';
        guessField.textContent = '---';
        
        const feedbackButton = document.createElement('button');
        feedbackButton.className = 'feedback-button hidden';
        
        guessRow.appendChild(guessField);
        guessRow.appendChild(feedbackButton);
        guessesContainer.appendChild(guessRow);
    }
}

// Submit a guess
function submitGuess() {
    const guessValue = parseInt(guessInput.value);
    
    if (isNaN(guessValue) || guessValue < 0) {
        alert('Please enter a valid positive number!');
        return;
    }
    
    currentGuess++;
    updateGuessCount();
    
    // Add guess to display
    addGuessToDisplay(guessValue);
    
    // Check if guess is correct (within 5%)
    const tolerance = currentQuestion.answer * 0.05;
    const isCorrect = Math.abs(guessValue - currentQuestion.answer) <= tolerance;
    
    if (isCorrect) {
        gameWon = true;
        gameOver = true;
        showFeedback(currentGuess - 1, 'correct', '✓');
    } else {
        const isHigh = guessValue > currentQuestion.answer;
        showFeedback(currentGuess - 1, isHigh ? 'high' : 'low', isHigh ? '↓' : '↑');
        
        if (currentGuess >= maxGuesses) {
            gameOver = true;
        }
    }
    
    // Clear input
    guessInput.value = '';
    
    // Check if game is over
    if (gameOver) {
        endGame();
    }
}

// Add guess to display
function addGuessToDisplay(guess) {
    const guessRows = guessesContainer.querySelectorAll('.guess-row');
    const currentRow = guessRows[currentGuess - 1];
    const guessField = currentRow.querySelector('.guess-field');
    
    guessField.textContent = formatNumber(guess);
    guessField.classList.remove('empty');
}

// Show feedback for a guess
function showFeedback(guessIndex, type, symbol) {
    const guessRows = guessesContainer.querySelectorAll('.guess-row');
    const currentRow = guessRows[guessIndex];
    const feedbackButton = currentRow.querySelector('.feedback-button');
    
    feedbackButton.textContent = symbol;
    feedbackButton.className = `feedback-button ${type}`;
    
    if (type !== 'correct') {
        currentRow.classList.add('shake');
        setTimeout(() => {
            currentRow.classList.remove('shake');
        }, 500);
    }
}

// Format number with commas
function formatNumber(num) {
    return num.toLocaleString();
}

// End the game
function endGame() {
    guessInput.disabled = true;
    submitBtn.disabled = true;
    
    // Update statistics
    stats.gamesPlayed++;
    if (gameWon) {
        stats.gamesWon++;
        stats.currentStreak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.guessDistribution[currentGuess]++;
    } else {
        stats.currentStreak = 0;
    }
    stats.winRate = Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
    saveStats();
    
    // Show game over modal
    if (gameWon) {
        modalTitle.textContent = 'Congratulations!';
        modalMessage.textContent = `You won in ${currentGuess} guess${currentGuess > 1 ? 'es' : ''}!`;
    } else {
        modalTitle.textContent = 'Game Over!';
        modalMessage.textContent = 'You ran out of guesses.';
    }
    
    modalAnswer.textContent = `The correct answer was: ${formatNumber(currentQuestion.answer)}`;
    modalAnswer.innerHTML += `<br><small>${currentQuestion.explanation}</small>`;
    
    gameOverModal.style.display = 'block';
}

// Start a new game
function startNewGameFromModal() {
    gameOverModal.style.display = 'none';
    startNewGame();
}

// Show help modal
function showHelp() {
    helpModal.style.display = 'block';
}

// Show stats modal
function showStats() {
    updateStatsDisplay();
    statsModal.style.display = 'block';
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('games-won').textContent = stats.gamesWon;
    document.getElementById('win-rate').textContent = `${stats.winRate}%`;
    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('max-streak').textContent = stats.maxStreak;
    
    // Update guess distribution
    const guessDist = stats.guessDistribution || {};
    const maxWins = Math.max(...Object.values(guessDist), 0);
    
    for (let i = 1; i <= 6; i++) {
        const count = guessDist[i] || 0;
        const percentage = maxWins > 0 ? (count / maxWins) * 100 : 0;
        
        const countElement = document.getElementById(`count-${i}`);
        const barElement = document.getElementById(`dist-${i}`);
        
        if (countElement && barElement) {
            countElement.textContent = count;
            barElement.style.width = `${percentage}%`;
        }
    }
}

// Close modals
function closeModal(modal) {
    modal.style.display = 'none';
}

// Save statistics to localStorage
function saveStats() {
    localStorage.setItem('fermiGameStats', JSON.stringify(stats));
}

// Load statistics from localStorage
function loadStats() {
    const savedStats = localStorage.getItem('fermiGameStats');
    if (savedStats) {
        try {
            const loadedStats = JSON.parse(savedStats);
            stats = {
                gamesPlayed: loadedStats.gamesPlayed || 0,
                gamesWon: loadedStats.gamesWon || 0,
                winRate: loadedStats.winRate || 0,
                currentStreak: loadedStats.currentStreak || 0,
                maxStreak: loadedStats.maxStreak || 0,
                guessDistribution: loadedStats.guessDistribution || {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0,
                    6: 0
                }
            };
        } catch (error) {
            console.error('Error loading stats:', error);
            // Reset to default if there's an error
            stats = {
                gamesPlayed: 0,
                gamesWon: 0,
                winRate: 0,
                currentStreak: 0,
                maxStreak: 0,
                guessDistribution: {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0,
                    6: 0
                }
            };
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Submit button
    submitBtn.addEventListener('click', submitGuess);
    
    // Enter key in input
    guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitGuess();
        }
    });
    
    // New game button
    newGameBtn.addEventListener('click', startNewGameFromModal);
    
    // Help button
    helpBtn.addEventListener('click', showHelp);
    
    // Stats button
    statsBtn.addEventListener('click', showStats);
    
    // Close buttons
    closeHelpBtn.addEventListener('click', () => closeModal(helpModal));
    closeStatsBtn.addEventListener('click', () => closeModal(statsModal));
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === gameOverModal) {
            closeModal(gameOverModal);
        }
        if (e.target === helpModal) {
            closeModal(helpModal);
        }
        if (e.target === statsModal) {
            closeModal(statsModal);
        }
    });
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame); 
