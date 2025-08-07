// Game state
let currentQuestion = null;
let currentGuess = 0;
let maxGuesses = 6;
let gameWon = false;
let gameOver = false;
let completedQuestions = {}; // Changed from array to object to track win/loss status

// URL Routing state
let isNavigating = false;

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
    },
    hasSeenFirstGuessFeedback: false
};

// Database of Fermi questions with dates
const fermiQuestions = [
    {
        question: "How many people live outside the country where they were born?",
        answer: 304000000,
        category: "",
        explanation: "",
        hint: "Hint: About 20% of Germany's population was born in another country.",
        date: "2025-07-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0f8ff'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%234169e1'%3e🌍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people of Jewish faith live in the world?",
        answer: 15800000,
        category: "Religion",
        explanation: "",
        hint: "Hint: Appx. 45.5% of the world's Jewish population lives in Israel.",
        date: "2025-07-25",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fff8dc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%236b46c1'%3e✡️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many McDonald's restaurants exist worldwide?",
        answer: 43477,
        category: "Business",
        explanation: "McDonald's operates approximately 43,500 restaurants globally.",
        hint: "Hint: There are 13,557 McDonald's restaurants in the US.",
        date: "2025-07-26",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef3c7'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🍟%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new electric cars/plug-in hybrids were sold worldwide in 2024?",
        answer: 17500000,
        category: "",
        explanation: "",
        hint: "Hint: 62.9M new non-electric cars were sold worldwide in 2023.",
        date: "2025-07-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23dcfce7'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🔋%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new smartphones were sold worldwide in 2024?",
        answer: 1240000000,
        category: "",
        explanation: "",
        hint: "Hint: Xiaomi sold 169 million smartphones in 2024.",
        date: "2025-07-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f3f4f6'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many cars did Tesla produce in 2024?",
        answer: 1770000,
        category: "",
        explanation: "",
        hint: "Hint: In 2018, Tesla produced 255K cars.",
        date: "2025-07-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef2f2'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "What percentage of the Earth's surface is land?",
        answer: 29,
        category: "",
        explanation: "",
        hint: "Hint: The US covers 1.87% of the Earth's surface.",
        date: "2025-07-30",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23dbeafe'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%232563eb'%3e🌍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many chickens were slaughtered for meat worldwide in 2023?",
        answer: 76250000000,
        category: "",
        explanation: "",
        hint: "Hint: The average meat yield per chicken is 1.66 kg.",
        date: "2025-07-31",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fffbeb'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23d97706'%3e🐔%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many humans have ever lived (including those currently alive)?",
        answer: 117000000000,
        category: "",
        explanation: "",
        hint: "Hint: About half the people who ever lived, lived in the past 2000 years.",
        date: "2025-08-01",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef7cd'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23a16207'%3e👥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new cars were sold in the US in 2024?",
        answer: 15900000,
        category: "",
        explanation: "",
        hint: "Hint: Around 240 million people hold a valid driver's licence in the US.",
        date: "2025-08-02",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23eff6ff'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%232563eb'%3e🚙%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many veterinarians are there in the US?",
        answer: 130415,
        category: "",
        explanation: "",
        hint: "Hint: There are about 15,000 veterinarians in Australia.",
        date: "2025-08-03",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🐈%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many paying subscribers does Spotify have?",
        answer: 276000000,
        category: "",
        explanation: "",
        hint: "Hint: Spotify's revenue in the second quarter of 2025 was 4.2 billion euros.",
        date: "2025-08-04",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎵%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many iPhones has Apple ever sold?",
        answer: 3000000000,
        category: "",
        explanation: "",
        hint: "Hint: In 2024, Apple sold approximately 232.1 million iPhones.",
        date: "2025-08-05",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many students are currently enrolled in medical school in the US?",
        answer: 99562,
        category: "",
        explanation: "",
        hint: "Hint: The US had 1,01 million active physicians in 2023.",
        date: "2025-08-06",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef2f2'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🏥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many pigs were slaughtered for meat worldwide in 2023?",
        answer: 1510000000,
        category: "",
        explanation: "",
        hint: "Hint: The average meat yield per pig is 82 kg (181 lbs).",
        date: "2025-08-07",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fdf2f8'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23ec4899'%3e🐷%3c/text%3e%3c/svg%3e"
    }
];

// DOM elements
const questionText = document.getElementById('question-text');
const questionCategory = document.getElementById('question-category');
const questionImage = document.getElementById('question-image');
const questionImageContainer = document.getElementById('question-image-container');

const currentStreakDisplay = document.getElementById('current-streak-display');
const guessCounter = document.getElementById('guess-counter');
const hintContainer = document.getElementById('hint-container');
const hintText = document.getElementById('hint-text');
const gameResult = document.getElementById('game-result');
const resultMessage = document.getElementById('result-message');
const correctAnswer = document.getElementById('correct-answer');
const guessesContainer = document.getElementById('guesses-container');
const guessInput = document.getElementById('guess-input');
const submitBtn = document.getElementById('submit-btn');
const inputSection = document.getElementById('input-section');
const newGameSection = document.getElementById('new-game-section');
const newGameBtnInline = document.getElementById('new-game-btn-inline');
const gameOverModal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalAnswer = document.getElementById('modal-answer');
const newGameBtn = document.getElementById('new-game-btn');
const helpBtn = document.getElementById('help-btn');
const statsBtn = document.getElementById('stats-btn');
const helpModal = document.getElementById('help-modal');
const statsModal = document.getElementById('stats-modal');
const questionsModal = document.getElementById('questions-modal');
const questionsList = document.getElementById('questions-list');
const closeHelpBtn = document.getElementById('close-help-btn');
const closeStatsBtn = document.getElementById('close-stats-btn');
const closeQuestionsBtn = document.getElementById('close-questions-btn');
const shareBtn = document.getElementById('share-btn');
const shareStatsBtn = document.getElementById('share-stats-btn');

// Initialize game
function initGame() {
    loadStats();
    loadCompletedQuestions();
    
    // Try to load saved game state first, then start new game if no saved state
    const restoredFromSave = loadCurrentGameState();
    if (!restoredFromSave) {
        startNewGame();
    }
    
    setupEventListeners();
    initRouting(restoredFromSave);
}

// Update current streak display
function updateStreakDisplay() {
    currentStreakDisplay.textContent = `Current streak: ${stats.currentStreak}`;
}



// Update question display including image
function updateQuestionDisplay(question) {
    questionText.textContent = question.question;
    questionCategory.innerHTML = getQuestionDisplayText(question); // Use innerHTML to allow <span>
    
    // Update question image
    if (question.image) {
        // Hide container initially while loading
        questionImageContainer.style.display = 'none';
        
        // Create a new image element to test loading
        const testImg = new Image();
        testImg.onload = function() {
            // Image loaded successfully, show it
            questionImage.src = question.image;
            questionImage.alt = `Image for ${question.question}`;
            questionImageContainer.style.display = 'block';
        };
        testImg.onerror = function() {
            // Image failed to load, hide container
            console.log('Failed to load image:', question.image);
            questionImageContainer.style.display = 'none';
        };
        testImg.src = question.image;
    } else {
        questionImageContainer.style.display = 'none';
    }
}

// Start a new game
function startNewGame() {
    currentQuestion = getCurrentQuestion();
    
    if (!currentQuestion) {
        console.error('No questions available');
        return;
    }
    
    // Check if this question already has saved progress
    const storageKey = `fermiGameState_${currentQuestion.date}`;
    const existingSavedState = localStorage.getItem(storageKey);
    
    if (existingSavedState) {
        // If there's existing progress, navigate to it instead of starting fresh
        selectQuestion(currentQuestion);
        return;
    }
    
    // Only start fresh if there's no existing progress
    currentGuess = 0;
    gameWon = false;
    gameOver = false;
    
    // Update display
    updateQuestionDisplay(currentQuestion);
    updateStreakDisplay();
    clearGuesses();
    
    // Update page title
    updatePageTitle(currentQuestion);
    
    // Reset display elements
    guessCounter.style.display = 'block';
    hideHint();
    gameResult.style.display = 'none';
    inputSection.style.display = 'block';
    newGameSection.style.display = 'none';
    shareBtn.style.display = 'none'; // Hide share button for new game
    
    // Reset input
    guessInput.value = '';
    guessInput.disabled = false;
    submitBtn.disabled = false;
    
    // Auto-focus only on non-touch devices (desktop)
    if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
        guessInput.focus();
    }

    // Update URL to reflect the current question (only if not already navigating)
    if (!isNavigating) {
        updateURL(currentQuestion.date);
    }
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get question for a specific date
function getQuestionForDate(date) {
    return fermiQuestions.find(q => q.date === date);
}

// Format date for display (e.g., "20 July 2025")
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

// Get question based on current date and game state
function getCurrentQuestion() {
    const today = getCurrentDate();
    
    // Get all questions sorted by date (newest first)
    const sortedQuestions = fermiQuestions
        .filter(q => q.date <= today)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Find the first question that hasn't been completed
    for (let question of sortedQuestions) {
        if (!completedQuestions[question.date]) { // Check if the question is not completed
            return question;
        }
    }
    
    // If all available questions are completed, return the most recent one
    return sortedQuestions.length > 0 ? sortedQuestions[0] : null;
}

// Get question display text
function getQuestionDisplayText(question) {
    const today = getCurrentDate();
    
    if (question.date === today) {
        return "Question of the Day";
    } else {
        const formattedDate = formatDateForDisplay(question.date);
        return `${formattedDate} <span class='arrow'>></span>`;
    }
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
        
        // Set the appropriate text for each guess position
        const guessNumber = i + 1;
        const guessText = getGuessText(guessNumber);
        guessField.textContent = guessText;
        
        const feedbackButton = document.createElement('button');
        feedbackButton.className = 'feedback-button hidden';
        
        // Add tooltip to each feedback button
        const tooltip = document.createElement('div');
        tooltip.className = 'feedback-tooltip';
        const tooltipContent = document.createElement('div');
        tooltipContent.className = 'tooltip-content';
        tooltipContent.textContent = 'Arrows show direction for your next guess';
        const tooltipArrow = document.createElement('div');
        tooltipArrow.className = 'tooltip-arrow';
        
        tooltip.appendChild(tooltipContent);
        tooltip.appendChild(tooltipArrow);
        feedbackButton.appendChild(tooltip);
        

        
        guessRow.appendChild(guessField);
        guessRow.appendChild(feedbackButton);
        guessesContainer.appendChild(guessRow);
    }
}

// Helper function to get the text for each guess position
function getGuessText(guessNumber) {
    const guessTexts = {
        1: 'First guess',
        2: 'Second guess',
        3: 'Third guess',
        4: 'Fourth guess',
        5: 'Fifth guess',
        6: 'Sixth guess'
    };
    return guessTexts[guessNumber] || `${guessNumber}th guess`;
}

// Submit a guess
function submitGuess() {
    const guessValue = parseInt(guessInput.value.replace(/[^\d]/g, ''));
    
    if (isNaN(guessValue) || guessValue < 0) {
        alert('Please enter a valid positive number!');
        return;
    }
    
    currentGuess++;
    
    // Add guess to display
    addGuessToDisplay(guessValue);
    
    // Check if guess is correct (within 20%)
    const tolerance = currentQuestion.answer * 0.20;
    const isCorrect = Math.abs(guessValue - currentQuestion.answer) <= tolerance;
    
    if (isCorrect) {
        gameWon = true;
        gameOver = true;
        showFeedback(currentGuess - 1, 'correct', 'WIN');
    } else {
        const isHigh = guessValue > currentQuestion.answer;
        

        
        // Check if guess is within 50% (close but not correct)
        const closeTolerance = currentQuestion.answer * 0.5;
        const isClose = Math.abs(guessValue - currentQuestion.answer) <= closeTolerance;
        
        if (isClose) {
            showFeedback(currentGuess - 1, 'close', isHigh ? '↓' : '↑');
        } else {
            showFeedback(currentGuess - 1, isHigh ? 'high' : 'low', isHigh ? '↓' : '↑');
        }
        
        if (currentGuess >= maxGuesses) {
            gameOver = true;
        }
    }
    
    // Clear input
    guessInput.value = '';
    
    // Save current game state after each guess
    saveCurrentGameState();
    
    // Show hint after 2nd guess if game not won
    if (currentGuess === 2 && !gameWon && currentQuestion.hint) {
        showHint();
    }
    
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
    
    // Preserve the tooltip
    const tooltip = feedbackButton.querySelector('.feedback-tooltip');
    
    if (type === 'correct') {
        // Use retro pixelated checkmark SVG for correct answers
        feedbackButton.innerHTML = `
            <svg width="18" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="10" width="3" height="2" fill="white"/>
                <rect x="1" y="12" width="3" height="2" fill="white"/>
                <rect x="3" y="12" width="3" height="2" fill="white"/>
                <rect x="3" y="14" width="3" height="2" fill="white"/>
                <rect x="5" y="14" width="3" height="2" fill="white"/>
                <rect x="5" y="16" width="3" height="2" fill="white"/>
                <rect x="7" y="12" width="3" height="2" fill="white"/>
                <rect x="7" y="14" width="3" height="2" fill="white"/>
                <rect x="9" y="10" width="3" height="2" fill="white"/>
                <rect x="9" y="12" width="3" height="2" fill="white"/>
                <rect x="11" y="8" width="3" height="2" fill="white"/>
                <rect x="11" y="10" width="3" height="2" fill="white"/>
                <rect x="13" y="6" width="3" height="2" fill="white"/>
                <rect x="13" y="8" width="3" height="2" fill="white"/>
                <rect x="15" y="4" width="3" height="2" fill="white"/>
                <rect x="15" y="6" width="3" height="2" fill="white"/>
                <rect x="17" y="2" width="3" height="2" fill="white"/>
                <rect x="17" y="4" width="3" height="2" fill="white"/>
            </svg>
        `;
    } else {
        // Clear the button content first
        feedbackButton.innerHTML = '';
        // Add the symbol as a text node
        const symbolText = document.createTextNode(symbol);
        feedbackButton.appendChild(symbolText);
        // Re-add the tooltip if it existed
        if (tooltip) {
            feedbackButton.appendChild(tooltip);
        }
    }
    
    feedbackButton.className = `feedback-button ${type}`;
    
    // Update tooltip text based on feedback and show for first incorrect guess
    if (tooltip) {
        const tooltipContent = tooltip.querySelector('.tooltip-content');
        if (tooltipContent) {
            if (type === 'high' || type === 'close' && symbol === '↓') {
                tooltipContent.textContent = 'Too high! You need to go lower ↓';
            } else if (type === 'low' || type === 'close' && symbol === '↑') {
                tooltipContent.textContent = 'Too low! You need to go higher ↑';
            }
        }
        
        // Show tooltip automatically for first incorrect guess
        if (guessIndex === 0 && type !== 'correct' && !stats.hasSeenFirstGuessFeedback) {
            setTimeout(() => {
                tooltip.classList.add('show');
                setTimeout(() => {
                    tooltip.classList.remove('show');
                }, 3500);
            }, 200);
            stats.hasSeenFirstGuessFeedback = true;
            saveStats();
        }
    }
    
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

// Show hint after 2rd guess
function showHint() {
    if (currentQuestion.hint) {
        hintText.textContent = currentQuestion.hint;
        guessCounter.style.display = 'none';
        hintContainer.style.display = 'block';
    }
}

// Hide hint
function hideHint() {
    hintContainer.style.display = 'none';
}

// End the game
function endGame() {
    guessInput.disabled = true;
    submitBtn.disabled = true;
    
    // Clear saved game state since the game is now completed
    clearCurrentGameState();
    
    // Mark current question as completed and save guesses permanently
    if (currentQuestion && !completedQuestions[currentQuestion.date]) {
        // Gather all guesses and their feedback for permanent storage
        const guessRows = guessesContainer.querySelectorAll('.guess-row');
        const savedGuesses = [];
        
        for (let i = 0; i < currentGuess; i++) {
            const row = guessRows[i];
            const guessField = row.querySelector('.guess-field');
            const feedbackButton = row.querySelector('.feedback-button');
            
            let feedbackType = 'none';
            let feedbackSymbol = '';
            
            if (feedbackButton.classList.contains('correct')) {
                feedbackType = 'correct';
                feedbackSymbol = 'WIN';
            } else if (feedbackButton.classList.contains('close')) {
                feedbackType = 'close';
                feedbackSymbol = feedbackButton.textContent;
            } else if (feedbackButton.classList.contains('high')) {
                feedbackType = 'high';
                feedbackSymbol = feedbackButton.textContent;
            } else if (feedbackButton.classList.contains('low')) {
                feedbackType = 'low';
                feedbackSymbol = feedbackButton.textContent;
            }
            
            savedGuesses.push({
                value: guessField.textContent,
                feedbackType: feedbackType,
                feedbackSymbol: feedbackSymbol
            });
        }
        
        completedQuestions[currentQuestion.date] = {
            question: currentQuestion.question,
            answer: currentQuestion.answer,
            date: currentQuestion.date,
            won: gameWon,
            guesses: currentGuess,
            savedGuesses: savedGuesses
        };
        saveCompletedQuestions();
    }
    
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
    
    // Hide guess counter, hint, and show game result
    guessCounter.style.display = 'none';
    hideHint();
    gameResult.style.display = 'block';
    
    // Set result message
    if (gameWon) {
        resultMessage.textContent = `You won in ${currentGuess} guess${currentGuess > 1 ? 'es' : ''}!`;
        resultMessage.className = 'result-message won';
    } else {
        resultMessage.textContent = 'You ran out of guesses!';
        resultMessage.className = 'result-message lost';
    }
    
    // Set correct answer
    correctAnswer.innerHTML = `The correct answer was: <i>${formatNumber(currentQuestion.answer)}</i>`;

    // Check if all available questions are completed
    const today = getCurrentDate();
    const availableQuestions = fermiQuestions.filter(q => q.date <= today);
    const allCompleted = availableQuestions.every(q => completedQuestions[q.date]);
    
    // Hide input section and show new game button
    inputSection.style.display = 'none';
    newGameSection.style.display = 'flex';
    shareBtn.style.display = 'block'; // Show share button after game ends

    // Update button text and functionality based on completion status
    if (allCompleted) {
        newGameBtnInline.textContent = 'Show stats';
        newGameBtnInline.onclick = showStats;
    } else {
        newGameBtnInline.textContent = 'Play more';
        newGameBtnInline.onclick = startNewGame;
    }    
    updateStreakDisplay(); // Update streak display when game ends
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
                },
                hasSeenFirstGuessFeedback: loadedStats.hasSeenFirstGuessFeedback || false
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
                },
                hasSeenFirstGuessFeedback: false
            };
        }
    }
}

// Save completed questions to localStorage
function saveCompletedQuestions() {
    localStorage.setItem('fermiCompletedQuestions', JSON.stringify(completedQuestions));
}

// Load completed questions from localStorage
function loadCompletedQuestions() {
    const savedCompletedQuestions = localStorage.getItem('fermiCompletedQuestions');
    if (savedCompletedQuestions) {
        try {
            completedQuestions = JSON.parse(savedCompletedQuestions);
        } catch (error) {
            console.error('Error loading completed questions:', error);
            completedQuestions = {}; // Reset to default on error
        }
    }
}

// Save current game state to localStorage (per question)
function saveCurrentGameState() {
    if (!currentQuestion) return;
    
    // Gather current guesses and their feedback
    const guessRows = guessesContainer.querySelectorAll('.guess-row');
    const guesses = [];
    
    for (let i = 0; i < currentGuess; i++) {
        const row = guessRows[i];
        const guessField = row.querySelector('.guess-field');
        const feedbackButton = row.querySelector('.feedback-button');
        
        let feedbackType = 'none';
        let feedbackSymbol = '';
        
        if (feedbackButton.classList.contains('correct')) {
            feedbackType = 'correct';
            feedbackSymbol = 'WIN';
        } else if (feedbackButton.classList.contains('close')) {
            feedbackType = 'close';
            feedbackSymbol = feedbackButton.textContent;
        } else if (feedbackButton.classList.contains('high')) {
            feedbackType = 'high';
            feedbackSymbol = feedbackButton.textContent;
        } else if (feedbackButton.classList.contains('low')) {
            feedbackType = 'low';
            feedbackSymbol = feedbackButton.textContent;
        }
        
        guesses.push({
            value: guessField.textContent,
            feedbackType: feedbackType,
            feedbackSymbol: feedbackSymbol
        });
    }
    
    const gameState = {
        question: currentQuestion,
        currentGuess: currentGuess,
        gameWon: gameWon,
        gameOver: gameOver,
        guesses: guesses,
        timestamp: Date.now()
    };
    
    // Store state with question date as key
    const storageKey = `fermiGameState_${currentQuestion.date}`;
    localStorage.setItem(storageKey, JSON.stringify(gameState));
}

// Load current game state from localStorage
function loadCurrentGameState() {
    // Try to find the most recent incomplete question with saved state
    const today = getCurrentDate();
    const availableQuestions = fermiQuestions
        .filter(q => q.date <= today)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (const question of availableQuestions) {
        // Skip if question is already completed
        if (completedQuestions[question.date]) continue;
        
        // Check if there's saved state for this question
        const storageKey = `fermiGameState_${question.date}`;
        const savedGameState = localStorage.getItem(storageKey);
        if (!savedGameState) continue;
        
        try {
            const gameState = JSON.parse(savedGameState);
            
            // Check if the saved state is not too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            if (!gameState.question || 
                (Date.now() - gameState.timestamp) > maxAge) {
                localStorage.removeItem(storageKey);
                continue;
            }
            
            // Restore game state
            currentQuestion = gameState.question;
            currentGuess = gameState.currentGuess;
            gameWon = gameState.gameWon;
            gameOver = gameState.gameOver;
            
            // Update display
            updateQuestionDisplay(currentQuestion);
            updatePageTitle(currentQuestion);
            updateStreakDisplay();
            
            // Update URL to reflect the restored question
            updateURL(currentQuestion.date);
            
            // Clear guesses container and restore saved guesses
            clearGuesses();
            restoreGuessesDisplay(gameState.guesses);
            
                    // Update game state display
        if (gameOver) {
            endGameDisplay(); // Call display updates without stats/completion logic
        } else {
            // Show input section for continuing the game
            guessCounter.style.display = 'block';
            gameResult.style.display = 'none';
            inputSection.style.display = 'block';
            newGameSection.style.display = 'none';
            shareBtn.style.display = 'none';
            
            // Check if hint should be shown (2+ guesses and not won)
            if (currentGuess >= 2 && !gameWon && currentQuestion.hint) {
                showHint();
            } else {
                hideHint();
            }
            
            // Enable input
            guessInput.disabled = false;
            submitBtn.disabled = false;
            
            // Auto-focus on desktop only
            if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
                setTimeout(() => guessInput.focus(), 100);
            }
        }
            
            return true;
        } catch (error) {
            console.error('Error loading saved game state for', question.date, ':', error);
            localStorage.removeItem(storageKey);
            continue;
        }
    }
    
    return false;
}

// Clear current game state from localStorage
function clearCurrentGameState() {
    if (currentQuestion) {
        const storageKey = `fermiGameState_${currentQuestion.date}`;
        localStorage.removeItem(storageKey);
    }
}

// Restore guesses display from saved state
function restoreGuessesDisplay(savedGuesses) {
    const guessRows = guessesContainer.querySelectorAll('.guess-row');
    
    savedGuesses.forEach((guess, index) => {
        if (index < guessRows.length) {
            const row = guessRows[index];
            const guessField = row.querySelector('.guess-field');
            const feedbackButton = row.querySelector('.feedback-button');
            
            // Restore guess value
            guessField.textContent = guess.value;
            guessField.classList.remove('empty');
            
            // Restore feedback
            if (guess.feedbackType !== 'none') {
                if (guess.feedbackType === 'correct') {
                    // Use the same checkmark SVG from showFeedback function
                    feedbackButton.innerHTML = `
                        <svg width="18" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1" y="10" width="3" height="2" fill="white"/>
                            <rect x="1" y="12" width="3" height="2" fill="white"/>
                            <rect x="3" y="12" width="3" height="2" fill="white"/>
                            <rect x="3" y="14" width="3" height="2" fill="white"/>
                            <rect x="5" y="14" width="3" height="2" fill="white"/>
                            <rect x="5" y="16" width="3" height="2" fill="white"/>
                            <rect x="7" y="12" width="3" height="2" fill="white"/>
                            <rect x="7" y="14" width="3" height="2" fill="white"/>
                            <rect x="9" y="10" width="3" height="2" fill="white"/>
                            <rect x="9" y="12" width="3" height="2" fill="white"/>
                            <rect x="11" y="8" width="3" height="2" fill="white"/>
                            <rect x="11" y="10" width="3" height="2" fill="white"/>
                            <rect x="13" y="6" width="3" height="2" fill="white"/>
                            <rect x="13" y="8" width="3" height="2" fill="white"/>
                            <rect x="15" y="4" width="3" height="2" fill="white"/>
                            <rect x="15" y="6" width="3" height="2" fill="white"/>
                            <rect x="17" y="2" width="3" height="2" fill="white"/>
                            <rect x="17" y="4" width="3" height="2" fill="white"/>
                        </svg>
                    `;
                } else {
                    feedbackButton.textContent = guess.feedbackSymbol;
                }
                
                feedbackButton.className = `feedback-button ${guess.feedbackType}`;
            }
        }
    });
}

// Update display elements for ended game (without updating stats)
function endGameDisplay() {
    guessInput.disabled = true;
    submitBtn.disabled = true;
    
    // Hide guess counter, hint, and show game result
    guessCounter.style.display = 'none';
    hideHint();
    gameResult.style.display = 'block';
    
    // Set result message
    if (gameWon) {
        resultMessage.textContent = `You won in ${currentGuess} guess${currentGuess > 1 ? 'es' : ''}!`;
        resultMessage.className = 'result-message won';
    } else {
        resultMessage.textContent = 'You ran out of guesses!';
        resultMessage.className = 'result-message lost';
    }
    
    // Set correct answer
    correctAnswer.innerHTML = `The correct answer was: <i>${formatNumber(currentQuestion.answer)}</i>`;

    // Check if all available questions are completed
    const today = getCurrentDate();
    const availableQuestions = fermiQuestions.filter(q => q.date <= today);
    const allCompleted = availableQuestions.every(q => completedQuestions[q.date]);
    
    // Hide input section and show new game button
    inputSection.style.display = 'none';
    newGameSection.style.display = 'flex';
    shareBtn.style.display = 'block'; // Show share button after game ends

    // Update button text and functionality based on completion status
    if (allCompleted) {
        newGameBtnInline.textContent = 'Show stats';
        newGameBtnInline.onclick = showStats;
    } else {
        newGameBtnInline.textContent = 'Play more';
        newGameBtnInline.onclick = startNewGame;
    }
}

// Show questions history modal
function showQuestionsHistory() {
    populateQuestionsList();
    questionsModal.style.display = 'block';
}

// Populate questions list
function populateQuestionsList() {
    questionsList.innerHTML = '';
    const today = getCurrentDate();
    
    // Get all questions sorted by date (newest first)
    const sortedQuestions = fermiQuestions
        .filter(q => q.date <= today)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedQuestions.forEach(question => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        
        const isCompleted = completedQuestions[question.date] !== undefined;
        const isCurrent = question.date === currentQuestion.date;
        
        if (isCompleted) {
            const completedData = completedQuestions[question.date];
            if (completedData.won) {
                questionItem.classList.add('completed', 'won');
            } else {
                questionItem.classList.add('completed', 'lost');
            }
        } else if (isCurrent) {
            questionItem.classList.add('current');
        }
        
        const questionInfo = document.createElement('div');
        questionInfo.className = 'question-info';
        
        const questionDate = document.createElement('div');
        questionDate.className = 'question-date';
        questionDate.textContent = formatDateForDisplay(question.date);
        
        const questionTextSmall = document.createElement('div');
        questionTextSmall.className = 'question-text-small';
        questionTextSmall.textContent = question.question;
        
        questionInfo.appendChild(questionDate);
        questionInfo.appendChild(questionTextSmall);
        
        const questionStatus = document.createElement('div');
        questionStatus.className = 'question-status';
        
        if (isCompleted) {
            const completedData = completedQuestions[question.date];
            if (completedData.won) {
                questionStatus.textContent = `Won (${completedData.guesses}/6)`;
                questionStatus.classList.add('won');
            } else {
                questionStatus.textContent = 'Lost';
                questionStatus.classList.add('lost');
            }
        } else if (isCurrent) {
            questionStatus.textContent = 'Current';
            questionStatus.classList.add('current');
        } else {
            questionStatus.textContent = 'Available';
            questionStatus.classList.add('available');
        }
        
        questionItem.appendChild(questionInfo);
        questionItem.appendChild(questionStatus);
        
        // Add click handler to select this question
        questionItem.addEventListener('click', () => {
            // Navigate using URL routing (works for both completed and incomplete questions)
            const newURL = `#/${question.date}`;
            window.history.pushState(null, '', newURL);
            navigateToQuestion(question.date);
            closeModal(questionsModal);
        });
        
        questionsList.appendChild(questionItem);
    });
}

// Update the page title based on current question
function updatePageTitle(question) {
    const baseTitle = "Fermi Questions";
    if (question) {
        const today = getCurrentDate();
        if (question.date === today) {
            document.title = `${baseTitle} - Today's Question`;
        } else {
            const formattedDate = formatDateForDisplay(question.date);
            document.title = `${baseTitle} - ${formattedDate}`;
        }
    } else {
        document.title = baseTitle;
    }
}

// Select a specific question
function selectQuestion(question) {
    // Save current game state before switching (if there's an active game)
    if (currentQuestion && currentGuess > 0 && !gameOver && !completedQuestions[currentQuestion.date]) {
        saveCurrentGameState();
    }
    
    currentQuestion = question;
    updateQuestionDisplay(currentQuestion);
    
    // Update page title
    updatePageTitle(currentQuestion);
    
    // Check if this question has been completed before
    const isCompleted = completedQuestions[question.date] !== undefined;
    
    if (isCompleted) {
        // Restore completed question state
        const completedData = completedQuestions[question.date];
        currentGuess = completedData.guesses;
        gameWon = completedData.won;
        gameOver = true;
        
        // Clear guesses and restore saved ones
        clearGuesses();
        if (completedData.savedGuesses) {
            restoreGuessesDisplay(completedData.savedGuesses);
        }
        
        // Show completed game display
        endGameDisplay();
    } else {
        // Check if there's saved state for this incomplete question
        const storageKey = `fermiGameState_${question.date}`;
        const savedGameState = localStorage.getItem(storageKey);
        
        if (savedGameState) {
            try {
                const gameState = JSON.parse(savedGameState);
                
                // Check if saved state is still valid (not too old)
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                if (gameState.question && (Date.now() - gameState.timestamp) <= maxAge) {
                    // Restore saved state
                    currentGuess = gameState.currentGuess;
                    gameWon = gameState.gameWon;
                    gameOver = gameState.gameOver;
                    
                    // Clear guesses and restore saved ones
                    clearGuesses();
                    restoreGuessesDisplay(gameState.guesses);
                    
                    if (gameOver) {
                        endGameDisplay();
                    } else {
                        // Show input section for continuing the game
                        guessCounter.style.display = 'block';
                        gameResult.style.display = 'none';
                        inputSection.style.display = 'block';
                        newGameSection.style.display = 'none';
                        shareBtn.style.display = 'none';
                        
                        // Check if hint should be shown (2+ guesses and not won)
                        if (currentGuess >= 2 && !gameWon && currentQuestion.hint) {
                            showHint();
                        } else {
                            hideHint();
                        }
                        
                        // Enable input
                        guessInput.value = '';
                        guessInput.disabled = false;
                        submitBtn.disabled = false;
                        
                        // Auto-focus on desktop only
                        if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
                            guessInput.focus();
                        }
                    }
                } else {
                    // Clean up old saved state and start fresh
                    localStorage.removeItem(storageKey);
                    startFreshQuestion();
                }
            } catch (error) {
                console.error('Error loading saved state for question:', error);
                localStorage.removeItem(storageKey);
                startFreshQuestion();
            }
        } else {
            startFreshQuestion();
        }
    }
    
    // Simple scroll to top to ensure good positioning
    window.scrollTo(0, 0);

    // Update URL without triggering navigation
    if (!isNavigating) {
        updateURL(question.date);
    }
    
    function startFreshQuestion() {
        // Reset game state for new question
        currentGuess = 0;
        gameWon = false;
        gameOver = false;
        
        // Reset display
        guessCounter.style.display = 'block';
        hideHint();
        gameResult.style.display = 'none';
        inputSection.style.display = 'block';
        newGameSection.style.display = 'none';
        shareBtn.style.display = 'none';
        
        // Reset input
        guessInput.value = '';
        guessInput.disabled = false;
        submitBtn.disabled = false;
        
        // Clear guesses
        clearGuesses();
        
        // Auto-focus on desktop only
        if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
            guessInput.focus();
        }
    }
}


// Generate share text for current game
function generateGameShareText() {
    if (!gameOver || !currentQuestion) return '';
    
    const guessEmojis = generateGuessEmojis();
    const question = currentQuestion.question;
    
    let shareText = `Fermi Question of the Day: "${question}"\n\n${guessEmojis}\n\nhttps://fermiquestions.org/#/${currentQuestion.date}`;
    
    return shareText;
}

// Generate share text for stats
function generateStatsShareText() {
    const gamesPlayed = stats.gamesPlayed;
    const winRate = stats.winRate;
    const currentStreak = stats.currentStreak;
    const maxStreak = stats.maxStreak;
    
    return `My Fermi Questions Stats:\n🎯 Games Played: ${gamesPlayed}\n📊 Win Rate: ${winRate}%\n🔥 Current Streak: ${currentStreak}\n🏆 Max Streak: ${maxStreak}\n\nhttps://fermiquestions.org`;
}

// Generate emoji representation of guesses
function generateGuessEmojis() {
    const guessRows = guessesContainer.querySelectorAll('.guess-row');
    let emojis = '';
    
    for (let i = 0; i < currentGuess; i++) {
        const row = guessRows[i];
        const feedbackButton = row.querySelector('.feedback-button');
        
        if (feedbackButton.classList.contains('correct')) {
            emojis += '✅'; // Green checkmark for correct
        } else if (feedbackButton.classList.contains('high') || 
                   (feedbackButton.classList.contains('close') && feedbackButton.textContent === '↓')) {
            emojis += '⬇️'; // Too high (whether close or far)
        } else if (feedbackButton.classList.contains('low') || 
                   (feedbackButton.classList.contains('close') && feedbackButton.textContent === '↑')) {
            emojis += '⬆️'; // Too low (whether close or far)
        } else {
            emojis += '❓'; // Fallback for unknown feedback
        }
    }
    
    return emojis;
}

// Handle sharing with Web Share API or clipboard fallback
async function handleShare(text) {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
        if (navigator.share && isMobile) {
            await navigator.share({
                text: text
            });
            // No feedback message for native share - OS handles this
        } else {
            // Desktop: copy to clipboard
            await navigator.clipboard.writeText(text);
            showShareFeedback('Copied to clipboard!');
        }
    } catch (error) {
        // Only show clipboard feedback if we're actually copying to clipboard
        if (navigator.share && isMobile) {
            // User cancelled share sheet - do nothing
            return;
        }
        
        // Fallback for older browsers - copy to clipboard
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showShareFeedback('Copied to clipboard!');
    }
}

// Show feedback after sharing
function showShareFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: 'Press Start 2P', monospace;
        font-size: 0.7rem;
        z-index: 10000;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        document.body.removeChild(feedback);
    }, 2000);
}

// Share current game
function shareGame() {
    const shareText = generateGameShareText();
    if (shareText) {
        handleShare(shareText);
    }
}

// Share stats
function shareStats() {
    const shareText = generateStatsShareText();
    handleShare(shareText);
}

// URL Routing Functions

// Update the URL to reflect the current question
function updateURL(questionDate) {
    const newURL = `#/${questionDate}`;
    if (window.location.hash !== newURL) {
        window.history.pushState(null, '', newURL);
    }
}

// Parse the current URL and return the question date
function parseURL() {
    const hash = window.location.hash;
    
    // Check if URL matches pattern #/question/YYYY-MM-DD
    const questionMatch = hash.match(/^#\/(\d{4}-\d{2}-\d{2})$/);
    if (questionMatch) {
        return questionMatch[1];
    }
    
    // Default to current date if no valid route
    return null;
}

// Navigate to a specific question by date
function navigateToQuestion(questionDate) {
    const question = getQuestionForDate(questionDate);
    
    if (question) {
        // Check if the question is available (not future-dated)
        const today = getCurrentDate();
        if (question.date <= today) {
            isNavigating = true;
            selectQuestion(question);
            isNavigating = false;
            return true;
        }
    }
    
    // If question not found or not available, redirect to current question
    navigateToCurrentQuestion();
    return false;
}

// Navigate to the current/default question
function navigateToCurrentQuestion() {
    const defaultQuestion = getCurrentQuestion();
    if (defaultQuestion) {
        isNavigating = true;
        selectQuestion(defaultQuestion);
        isNavigating = false;
    }
}

// Handle browser back/forward navigation
function handlePopState() {
    const questionDate = parseURL();
    
    if (questionDate) {
        navigateToQuestion(questionDate);
    } else {
        navigateToCurrentQuestion();
    }
}

// Initialize routing
function initRouting(skipInitialNavigation = false) {
    // Handle browser navigation
    window.addEventListener('popstate', handlePopState);
    
    // Skip initial navigation if we restored from saved state
    if (skipInitialNavigation) {
        return;
    }
    
    // Handle initial page load
    const questionDate = parseURL();
    if (questionDate) {
        // Try to navigate to the question from URL
        if (!navigateToQuestion(questionDate)) {
            // If navigation failed, update URL to reflect actual question
            updateURL(currentQuestion.date);
        }
    } else {
        // No specific question in URL, update URL to show current question
        updateURL(currentQuestion.date);
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
    
    // Format input with commas as user types
    guessInput.addEventListener('input', (e) => {
        const input = e.target;
        const value = input.value.replace(/[^\d]/g, ''); // Keep only digits
        
        if (value === '') {
            input.value = '';
        } else {
            const number = parseInt(value);
            const formattedValue = formatNumber(number);
            input.value = formattedValue;
        }
    });
    
    // Help button
    helpBtn.addEventListener('click', showHelp);
    
    // Stats button
    statsBtn.addEventListener('click', showStats);
    
    // Questions history button (question category)
    questionCategory.addEventListener('click', showQuestionsHistory);
    
    // Close buttons
    closeHelpBtn.addEventListener('click', () => closeModal(helpModal));
    closeStatsBtn.addEventListener('click', () => closeModal(statsModal));
    closeQuestionsBtn.addEventListener('click', () => closeModal(questionsModal));

    // Share buttons
    shareBtn.addEventListener('click', shareGame);
    shareStatsBtn.addEventListener('click', shareStats);
        
    // Close modals when clicking outside (desktop + mobile)
    [helpModal, statsModal, questionsModal].forEach(modal => {
        ['click', 'touchend'].forEach(event => {
            modal.addEventListener(event, e => e.target === modal && closeModal(modal));
        });
    });
    
    // Prevent modal content clicks from closing modals
    document.querySelectorAll('.modal-content').forEach(content => {
        ['click', 'touchend'].forEach(event => {
            content.addEventListener(event, e => e.stopPropagation());
        });
    });
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame); 
