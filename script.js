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
    }
};

// Database of Fermi questions with dates
const fermiQuestions = [
    {
        question: "How many people live outside the country where they were born?",
        answer: 304000000,
        category: "",
        explanation: "",
        date: "2025-07-24"
    },
    {
        question: "How many people of Jewish faith live in the world?",
        answer: 15800000,
        category: "Religion",
        explanation: "",
        date: "2025-07-25"
    },
    {
        question: "How many McDonald's restaurants exist worldwide?",
        answer: 43477,
        category: "Business",
        explanation: "McDonald's operates approximately 43,500 restaurants globally.",
        date: "2025-07-26"
    },
    {
        question: "How many new electric cars/plug-in hybrids were sold worldwide in 2024?",
        answer: 17500000,
        category: "",
        explanation: "",
        date: "2025-07-27"
    },
    {
        question: "How many new smartphones were sold worldwide in 2024?",
        answer: 1240000000,
        category: "",
        explanation: "",
        date: "2025-07-28"
    },
    {
        question: "How many cars did Tesla produce in 2024?",
        answer: 1770000,
        category: "",
        explanation: "",
        date: "2025-07-29"
    },
    {
        question: "What percentage of the Earth's surface is land?",
        answer: 29,
        category: "",
        explanation: "",
        date: "2025-07-30"
    },
    {
        question: "How many chickens were slaughtered for meat worldwide in 2023?",
        answer: 76250000000,
        category: "",
        explanation: "",
        date: "2025-07-31"
    },
    {
        question: "How many humans have ever lived (including those currently alive)?",
        answer: 117000000000,
        category: "",
        explanation: "",
        date: "2025-08-01"
    },
    {
        question: "How many new cars were sold in the US in 2024?",
        answer: 15900000,
        category: "",
        explanation: "",
        date: "2025-08-02"
    },
    {
        question: "How many veterinarians are there in the US?",
        answer: 130415,
        category: "",
        explanation: "",
        date: "2025-08-03"
    },
    {
        question: "How many paying subscribers does Spotify have?",
        answer: 276000000,
        category: "",
        explanation: "",
        date: "2025-08-04"
    }
];

// DOM elements
const questionText = document.getElementById('question-text');
const questionCategory = document.getElementById('question-category');
const currentStreakDisplay = document.getElementById('current-streak-display');
const guessCounter = document.getElementById('guess-counter');
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
    startNewGame();
    setupEventListeners();
    initRouting();
}

// Update current streak display
function updateStreakDisplay() {
    currentStreakDisplay.textContent = `Current streak: ${stats.currentStreak}`;
}

// Start a new game
function startNewGame() {
    currentQuestion = getCurrentQuestion();
    currentGuess = 0;
    gameWon = false;
    gameOver = false;
    
    // Update display
    questionText.textContent = currentQuestion.question;
    questionCategory.innerHTML = getQuestionDisplayText(currentQuestion); // Use innerHTML to allow <span>
    updateStreakDisplay();
    clearGuesses();
    
    // Update page title
    updatePageTitle(currentQuestion);
    
    // Reset display elements
    guessCounter.style.display = 'block';
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
    
    // If all available questions are completed, return the first question
    return fermiQuestions[0];
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
    
    // Mark current question as completed
    if (currentQuestion && !completedQuestions[currentQuestion.date]) {
        completedQuestions[currentQuestion.date] = {
            question: currentQuestion.question,
            answer: currentQuestion.answer,
            date: currentQuestion.date,
            won: gameWon,
            guesses: currentGuess
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
    
    // Hide guess counter and show game result
    guessCounter.style.display = 'none';
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
    
    // Hide input section and show new game button
    inputSection.style.display = 'none';
    newGameSection.style.display = 'flex';
    shareBtn.style.display = 'block'; // Show share button after game ends
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
            if (!isCompleted) {
                // Navigate using URL routing
                const newURL = `#/${question.date}`;
                window.history.pushState(null, '', newURL);
                navigateToQuestion(question.date);
                closeModal(questionsModal);
            }
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
    currentQuestion = question;
    questionText.textContent = currentQuestion.question;
    questionCategory.innerHTML = getQuestionDisplayText(currentQuestion);
    
    // Update page title
    updatePageTitle(currentQuestion);
    
    // Reset game state
    currentGuess = 0;
    gameWon = false;
    gameOver = false;
    
    // Reset display
    guessCounter.style.display = 'block';
    gameResult.style.display = 'none';
    inputSection.style.display = 'block';
    newGameSection.style.display = 'none';
    shareBtn.style.display = 'none'; // Hide share button when selecting new question
    
    // Reset input
    guessInput.value = '';
    guessInput.disabled = false;
    submitBtn.disabled = false;
    
    // Clear guesses
    clearGuesses();
    
    // Simple scroll to top to ensure good positioning
    window.scrollTo(0, 0);
    
    // Auto-focus on desktop only
    if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
        guessInput.focus();
    }

    // Update URL without triggering navigation
    if (!isNavigating) {
        updateURL(question.date);
    }
}


// Generate share text for current game
function generateGameShareText() {
    if (!gameOver || !currentQuestion) return '';
    
    const date = formatDateForDisplay(currentQuestion.date);
    const guessEmojis = generateGuessEmojis();
    const question = currentQuestion.question;
    
    let shareText = `Fermi Question of the Day: ${date}\n\n"${question}"\n\n`;
    
    if (gameWon) {
        shareText += `I won using ${currentGuess} out of 6 guesses. Can you beat me?\n\n`;
    } else {
        shareText += `I couldn't solve this one in 6 guesses. Can you do better?\n\n`;
    }
    
    shareText += `${guessEmojis}\n\nhttps://fermiquestions.org`;
    
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
            emojis += '🟢';
        } else if (feedbackButton.classList.contains('close')) {
            emojis += '🟡';
        } else {
            emojis += '🔴';
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
    isNavigating = true;
    selectQuestion(defaultQuestion);
    isNavigating = false;
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
function initRouting() {
    // Handle browser navigation
    window.addEventListener('popstate', handlePopState);
    
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
    
    // New game buttons
    newGameBtnInline.addEventListener('click', startNewGame);
    
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
        
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            closeModal(helpModal);
        }
        if (e.target === statsModal) {
            closeModal(statsModal);
        }
        if (e.target === questionsModal) {
            closeModal(questionsModal);
        }
    });
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame); 
