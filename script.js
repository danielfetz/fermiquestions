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
        question: "How many chickens are slaughtered each year?",
        answer: 50000000000,
        category: "Agriculture",
        explanation: "Approximately 50 billion chickens are slaughtered annually worldwide for meat consumption.",
        date: "2025-01-01"
    },
    {
        question: "How many people live in New York City?",
        answer: 8400000,
        category: "Population",
        explanation: "New York City has approximately 8.4 million residents.",
        date: "2025-01-02"
    },
    {
        question: "How many cars are there in the United States?",
        answer: 280000000,
        category: "Transportation",
        explanation: "There are roughly 280 million registered vehicles in the US.",
        date: "2025-01-03"
    },
    {
        question: "How many McDonald's restaurants exist worldwide?",
        answer: 40000,
        category: "Business",
        explanation: "McDonald's operates approximately 40,000 restaurants globally.",
        date: "2025-01-04"
    },
    {
        question: "How many books are published each year in the US?",
        answer: 300000,
        category: "Publishing",
        explanation: "Around 300,000 new books are published annually in the United States.",
        date: "2025-01-05"
    },
    {
        question: "How many trees are cut down each year globally?",
        answer: 15000000000,
        category: "Environment",
        explanation: "Approximately 15 billion trees are cut down annually worldwide.",
        date: "2025-01-06"
    },
    {
        question: "How many emails are sent per day worldwide?",
        answer: 300000000000,
        category: "Technology",
        explanation: "Roughly 300 billion emails are sent daily across the globe.",
        date: "2025-01-07"
    },
    {
        question: "How many pizzas are sold in the US each year?",
        answer: 3000000000,
        category: "Food",
        explanation: "About 3 billion pizzas are sold annually in the United States.",
        date: "2025-01-08"
    },
    {
        question: "How many people visit Times Square each year?",
        answer: 50000000,
        category: "Tourism",
        explanation: "Approximately 50 million people visit Times Square annually.",
        date: "2025-01-09"
    },
    {
        question: "How many smartphones are sold worldwide each year?",
        answer: 1400000000,
        category: "Technology",
        explanation: "Around 1.4 billion smartphones are sold globally each year.",
        date: "2025-01-10"
    },
    {
        question: "How many cups of coffee are consumed daily in the US?",
        answer: 400000000,
        category: "Food",
        explanation: "Americans consume approximately 400 million cups of coffee daily.",
        date: "2025-01-11"
    },
    {
        question: "How many movies are released in the US each year?",
        answer: 800,
        category: "Entertainment",
        explanation: "About 800 movies are released theatrically in the US annually.",
        date: "2025-01-12"
    },
    {
        question: "How many people die from car accidents each year globally?",
        answer: 1350000,
        category: "Safety",
        explanation: "Approximately 1.35 million people die in road traffic accidents annually.",
        date: "2025-01-13"
    },
    {
        question: "How many babies are born each day worldwide?",
        answer: 385000,
        category: "Population",
        explanation: "About 385,000 babies are born daily across the globe.",
        date: "2025-01-14"
    },
    {
        question: "How many plastic bottles are used each year globally?",
        answer: 500000000000,
        category: "Environment",
        explanation: "Roughly 500 billion plastic bottles are used annually worldwide.",
        date: "2025-01-15"
    },
    {
        question: "How many people live in Tokyo?",
        answer: 14000000,
        category: "Population",
        explanation: "Tokyo has approximately 14 million residents in its metropolitan area.",
        date: "2025-01-16"
    },
    {
        question: "How many hamburgers does McDonald's sell each day?",
        answer: 75000000,
        category: "Food",
        explanation: "McDonald's sells approximately 75 million hamburgers daily worldwide.",
        date: "2025-01-17"
    },
    {
        question: "How many text messages are sent per day globally?",
        answer: 20000000000,
        category: "Technology",
        explanation: "About 20 billion text messages are sent daily across the world.",
        date: "2025-01-18"
    },
    {
        question: "How many people visit Disney World each year?",
        answer: 20000000,
        category: "Tourism",
        explanation: "Disney World in Florida attracts approximately 20 million visitors annually.",
        date: "2025-01-19"
    },
    {
        question: "How many newspapers are sold daily in the US?",
        answer: 30000000,
        category: "Media",
        explanation: "About 30 million newspapers are sold daily in the United States.",
        date: "2025-01-20"
    },
    {
        question: "How many people live in London?",
        answer: 9000000,
        category: "Population",
        explanation: "London has approximately 9 million residents in its metropolitan area.",
        date: "2025-01-21"
    },
    {
        question: "How many bicycles are sold in the US each year?",
        answer: 15000000,
        category: "Transportation",
        explanation: "About 15 million bicycles are sold annually in the United States.",
        date: "2025-01-22"
    },
    {
        question: "How many people visit the Eiffel Tower each year?",
        answer: 7000000,
        category: "Tourism",
        explanation: "The Eiffel Tower receives approximately 7 million visitors annually.",
        date: "2025-01-23"
    },
    {
        question: "How many gallons of milk are consumed in the US each year?",
        answer: 60000000000,
        category: "Food",
        explanation: "Americans consume approximately 60 billion gallons of milk annually.",
        date: "2025-01-24"
    },
    {
        question: "How many people work at Walmart?",
        answer: 2300000,
        category: "Business",
        explanation: "Walmart employs approximately 2.3 million people worldwide.",
        date: "2025-01-25"
    },
    {
        question: "How many people visit the Grand Canyon each year?",
        answer: 6000000,
        category: "Tourism",
        explanation: "The Grand Canyon National Park receives about 6 million visitors annually.",
        date: "2025-01-26"
    },
    {
        question: "How many people live in Paris?",
        answer: 2100000,
        category: "Population",
        explanation: "Paris has approximately 2.1 million residents within city limits.",
        date: "2025-01-27"
    },
    {
        question: "How many people visit the Louvre Museum each year?",
        answer: 10000000,
        category: "Tourism",
        explanation: "The Louvre Museum in Paris receives approximately 10 million visitors annually.",
        date: "2025-01-28"
    },
    {
        question: "How many people live in Los Angeles?",
        answer: 4000000,
        category: "Population",
        explanation: "Los Angeles has approximately 4 million residents within city limits.",
        date: "2025-01-29"
    },
    {
        question: "How many people visit Yellowstone National Park each year?",
        answer: 4000000,
        category: "Tourism",
        explanation: "Yellowstone National Park receives approximately 4 million visitors annually.",
        date: "2025-01-30"
    },
    {
        question: "How many people work at Amazon?",
        answer: 1600000,
        category: "Business",
        explanation: "Amazon employs approximately 1.6 million people worldwide.",
        date: "2025-01-31"
    },
    {
        question: "How many people visit the Statue of Liberty each year?",
        answer: 4500000,
        category: "Tourism",
        explanation: "The Statue of Liberty receives approximately 4.5 million visitors annually.",
        date: "2025-02-01"
    },
    {
        question: "How many people live in Chicago?",
        answer: 2700000,
        category: "Population",
        explanation: "Chicago has approximately 2.7 million residents within city limits.",
        date: "2025-02-02"
    },
    {
        question: "How many people visit the Smithsonian Museums each year?",
        answer: 30000000,
        category: "Tourism",
        explanation: "The Smithsonian Museums in Washington DC receive approximately 30 million visitors annually.",
        date: "2025-02-03"
    },
    {
        question: "How many people work at Apple?",
        answer: 164000,
        category: "Business",
        explanation: "Apple employs approximately 164,000 people worldwide.",
        date: "2025-02-04"
    },
    {
        question: "How many people visit Central Park each year?",
        answer: 42000000,
        category: "Tourism",
        explanation: "Central Park in New York City receives approximately 42 million visitors annually.",
        date: "2025-02-05"
    },
    {
        question: "How many people live in Houston?",
        answer: 2300000,
        category: "Population",
        explanation: "Houston has approximately 2.3 million residents within city limits.",
        date: "2025-02-06"
    },
    {
        question: "How many people visit the Golden Gate Bridge each year?",
        answer: 10000000,
        category: "Tourism",
        explanation: "The Golden Gate Bridge receives approximately 10 million visitors annually.",
        date: "2025-02-07"
    },
    {
        question: "How many people work at Google?",
        answer: 156500,
        category: "Business",
        explanation: "Google employs approximately 156,500 people worldwide.",
        date: "2025-02-08"
    },
    {
        question: "How many people visit the National Mall each year?",
        answer: 25000000,
        category: "Tourism",
        explanation: "The National Mall in Washington DC receives approximately 25 million visitors annually.",
        date: "2025-02-09"
    },
    {
        question: "How many people visit the Pentagon each year?",
        answer: 25000000,
        category: "Tourism",
        explanation: "The National Mall in Washington DC receives approximately 25 million visitors annually.",
        date: "2025-07-29"
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
    const guessValue = parseInt(guessInput.value.replace(/,/g, ''));
    
    if (isNaN(guessValue) || guessValue < 0) {
        alert('Please enter a valid positive number!');
        return;
    }
    
    currentGuess++;
    
    // Add guess to display
    addGuessToDisplay(guessValue);
    
    // Check if guess is correct (within 5%)
    const tolerance = currentQuestion.answer * 0.05;
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
        resultMessage.textContent = `Congratulations! You won in ${currentGuess} guess${currentGuess > 1 ? 'es' : ''}!`;
        resultMessage.className = 'result-message won';
    } else {
        resultMessage.textContent = 'Game Over! You ran out of guesses.';
        resultMessage.className = 'result-message lost';
    }
    
    // Set correct answer
    correctAnswer.innerHTML = `The correct answer was: <strong>${formatNumber(currentQuestion.answer)}</strong>`;
    
    // Hide input section and show new game button
    inputSection.style.display = 'none';
    newGameSection.style.display = 'block';
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
    
    // Force cleanup of any rendering layers that might affect viewport
    modal.style.backdropFilter = 'none';
    modal.style.transform = 'none';
    
    // Trigger a style recalculation
    modal.offsetHeight;
    
    // Reset backdrop filter after cleanup
    setTimeout(() => {
        modal.style.backdropFilter = '';
        modal.style.transform = '';
    }, 0);
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
                questionStatus.textContent = `Won (${completedData.guesses})`;
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
                const newURL = `#/question/${question.date}`;
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
    
    // Reset input
    guessInput.value = '';
    guessInput.disabled = false;
    submitBtn.disabled = false;
    
    // Clear guesses
    clearGuesses();
    
    // Simple scroll to top to ensure good positioning
    window.scrollTo(0, 0);
    
    // Auto-focus only on non-touch devices (desktop)
    if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
        guessInput.focus();
    }

    // Update URL without triggering navigation
    if (!isNavigating) {
        updateURL(question.date);
    }
}

// URL Routing Functions

// Update the URL to reflect the current question
function updateURL(questionDate) {
    const newURL = `#/question/${questionDate}`;
    if (window.location.hash !== newURL) {
        window.history.pushState(null, '', newURL);
    }
}

// Parse the current URL and return the question date
function parseURL() {
    const hash = window.location.hash;
    
    // Check if URL matches pattern #/question/YYYY-MM-DD
    const questionMatch = hash.match(/^#\/question\/(\d{4}-\d{2}-\d{2})$/);
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
