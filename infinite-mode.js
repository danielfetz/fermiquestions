(function () {
    const MAX_GUESSES = 6;
    const CORRECT_TOLERANCE = 0.2;
    const CLOSE_TOLERANCE = 0.5;
    const STATS_STORAGE_KEY = 'fermiInfiniteStats';
    const CHECKMARK_ICON = `
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

    const defaultStats = () => ({
        runsStarted: 0,
        questionsAttempted: 0,
        questionsCorrect: 0,
        totalGuesses: 0,
        bestLevel: 0,
        longestStreak: 0,
        lastRunBest: 0
    });

    const state = {
        runStarted: false,
        level: 1,
        question: null,
        guesses: [],
        questionComplete: false,
        awaitingNext: false,
        currentStreak: 0,
        highestLevelThisRun: 0,
        hintRevealed: false,
        lastOutcome: null
    };

    let stats = defaultStats();

    const els = {};

    function getSupabaseClient() {
        if (typeof window === 'undefined') return null;
        return window.supabaseClient || null;
    }

    function getCurrentUserId() {
        if (typeof window === 'undefined') return null;
        return window.currentUserId || null;
    }

    function formatNumberLocal(value) {
        if (typeof formatNumber === 'function') {
            return formatNumber(value);
        }
        try {
            return Number(value).toLocaleString();
        } catch (error) {
            return String(value);
        }
    }

    function loadStats() {
        try {
            const stored = localStorage.getItem(STATS_STORAGE_KEY);
            if (!stored) {
                return defaultStats();
            }
            const parsed = JSON.parse(stored);
            return {
                runsStarted: Number(parsed.runsStarted) || 0,
                questionsAttempted: Number(parsed.questionsAttempted) || 0,
                questionsCorrect: Number(parsed.questionsCorrect) || 0,
                totalGuesses: Number(parsed.totalGuesses) || 0,
                bestLevel: Number(parsed.bestLevel) || 0,
                longestStreak: Number(parsed.longestStreak) || 0,
                lastRunBest: Number(parsed.lastRunBest) || 0
            };
        } catch (error) {
            console.error('Error loading infinite stats:', error);
            return defaultStats();
        }
    }

    function updateStatsPanel() {
        const runsEl = document.getElementById('infinite-runs-started');
        const bestLevelEl = document.getElementById('infinite-best-level');
        const longestEl = document.getElementById('infinite-longest-streak');
        const answeredEl = document.getElementById('infinite-questions-answered');
        const accuracyEl = document.getElementById('infinite-accuracy');
        const averageEl = document.getElementById('infinite-average-guesses');

        if (runsEl) runsEl.textContent = stats.runsStarted;
        if (bestLevelEl) bestLevelEl.textContent = stats.bestLevel;
        if (longestEl) longestEl.textContent = stats.longestStreak;
        if (answeredEl) answeredEl.textContent = stats.questionsAttempted;

        const accuracy = stats.questionsAttempted > 0
            ? Math.round((stats.questionsCorrect / stats.questionsAttempted) * 100)
            : 0;
        if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;

        const average = stats.questionsAttempted > 0
            ? stats.totalGuesses / stats.questionsAttempted
            : 0;
        if (averageEl) {
            averageEl.textContent = Number.isInteger(average)
                ? `${average}`
                : average.toFixed(1);
        }
    }

    function persistStats() {
        try {
            localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving infinite stats:', error);
        }
        updateStatsPanel();
        updateCard();
        void saveInfiniteStatsToSupabase();
    }

    function updateCard() {
        if (els.levelBadge) {
            const badgeText = stats.bestLevel > 0 ? `Best: Level ${stats.bestLevel}` : 'Best: —';
            els.levelBadge.textContent = badgeText;
        }

        if (els.playButton) {
            const resumeLabel = state.runStarted && state.question && !state.questionComplete;
            els.playButton.textContent = resumeLabel ? 'Resume run' : 'Start run';
        }

        if (els.status) {
            let statusText = '';
            if (state.runStarted && state.question) {
                if (state.questionComplete) {
                    if (state.awaitingNext) {
                        statusText = `Level ${state.level + 1} awaits.`;
                    } else if (state.lastOutcome === 'loss') {
                        const levelDisplay = state.highestLevelThisRun || 0;
                        statusText = levelDisplay > 0
                            ? `Run paused · reached level ${levelDisplay}`
                            : 'Run paused · ready to restart';
                    } else {
                        statusText = `Level ${state.level} complete.`;
                    }
                } else {
                    statusText = `Run in progress · Level ${state.level}`;
                }
            } else if (state.lastOutcome === 'loss' && stats.lastRunBest > 0) {
                statusText = `Last run reached level ${stats.lastRunBest}`;
            } else if (stats.bestLevel > 0) {
                statusText = `Best run reached level ${stats.bestLevel}`;
            } else {
                statusText = 'Start your first run and climb the ladder.';
            }
            els.status.textContent = statusText;
        }
    }

    function clearGuessBoard() {
        if (!els.guessesContainer) return;
        els.guessesContainer.innerHTML = '';
        els.guessRows = [];
        for (let i = 0; i < MAX_GUESSES; i++) {
            const guessRow = document.createElement('div');
            guessRow.className = 'guess-row';

            const guessField = document.createElement('div');
            guessField.className = 'guess-field empty';
            const guessNumber = i + 1;
            if (typeof getGuessText === 'function') {
                guessField.textContent = getGuessText(guessNumber);
            } else {
                const suffix = ['st', 'nd', 'rd'][((guessNumber + 90) % 100 - 10) % 10 - 1] || 'th';
                guessField.textContent = `${guessNumber}${suffix} guess`;
            }

            const feedbackButton = document.createElement('button');
            feedbackButton.className = 'feedback-button hidden';
            feedbackButton.type = 'button';

            guessRow.appendChild(guessField);
            guessRow.appendChild(feedbackButton);
            els.guessesContainer.appendChild(guessRow);
            els.guessRows.push({ row: guessRow, field: guessField, feedback: feedbackButton });
        }
    }

    function hideHint() {
        if (els.hintContainer) {
            els.hintContainer.classList.remove('open');
            els.hintContainer.style.display = 'none';
        }
        if (els.hintText) {
            els.hintText.textContent = '';
        }
        state.hintRevealed = false;
    }

    function renderIdleView() {
        if (els.levelPill) {
            els.levelPill.textContent = '';
        }
        if (els.questionText) {
            els.questionText.textContent = 'Start a run from the welcome screen to tackle endless Fermi questions.';
        }
        if (els.category) {
            els.category.textContent = '';
        }
        if (els.imageContainer) {
            els.imageContainer.classList.remove('visible');
        }
        hideHint();
        clearGuessBoard();
        if (els.guessCounter) {
            els.guessCounter.textContent = 'Start a run to play.';
        }
        if (els.result) {
            els.result.style.display = 'none';
        }
        if (els.nextButton) {
            els.nextButton.style.display = 'none';
        }
        if (els.restartButton) {
            els.restartButton.style.display = 'none';
        }
        disableInput();
    }

    function focusInput() {
        if (!els.input || els.input.disabled) return;
        if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
            els.input.focus();
        }
    }

    function enableInput() {
        if (els.input) {
            els.input.disabled = false;
        }
        if (els.submitButton) {
            els.submitButton.disabled = false;
        }
    }

    function disableInput() {
        if (els.input) {
            els.input.disabled = true;
        }
        if (els.submitButton) {
            els.submitButton.disabled = true;
        }
    }

    function setGuessCounter(text) {
        if (els.guessCounter) {
            els.guessCounter.textContent = text;
        }
    }

    function updateGuessCounter() {
        if (!state.question) {
            setGuessCounter('Start a run to play.');
            return;
        }
        const attempt = state.guesses.length + 1;
        setGuessCounter(`Guess ${attempt} of ${MAX_GUESSES}`);
    }
    function showHint() {
        if (!state.question || !state.question.hint || !els.hintContainer || !els.hintText) return;
        els.hintText.textContent = state.question.hint;
        els.hintContainer.style.display = 'block';
        els.hintContainer.classList.add('open');
        state.hintRevealed = true;
    }

    function maybeShowHint() {
        if (!state.question || state.hintRevealed) return;
        if (state.question.hint && state.guesses.length >= 2) {
            showHint();
        }
    }

    function getAvailableLevels() {
        if (!Array.isArray(window.fermiInfiniteQuestions)) return [];
        return window.fermiInfiniteQuestions
            .map(q => Number(q.level) || 0)
            .filter(level => level > 0);
    }

    function selectQuestionForLevel(level) {
        const questions = Array.isArray(window.fermiInfiniteQuestions)
            ? window.fermiInfiniteQuestions
            : [];
        if (questions.length === 0) {
            return null;
        }

        const targetLevel = Math.max(1, level);
        let pool = questions.filter(q => Number(q.level) === targetLevel);
        if (pool.length === 0) {
            const availableLevels = getAvailableLevels();
            const maxLevel = availableLevels.length ? Math.max(...availableLevels) : 1;
            const fallbackLevel = Math.min(targetLevel, maxLevel);
            pool = questions.filter(q => Number(q.level) === fallbackLevel);
        }

        if (pool.length === 0) {
            pool = questions;
        }

        const previousId = state.question?.id;
        let selected = pool[Math.floor(Math.random() * pool.length)];
        if (pool.length > 1 && previousId) {
            let attempts = 0;
            while (selected.id === previousId && attempts < 4) {
                selected = pool[Math.floor(Math.random() * pool.length)];
                attempts++;
            }
        }
        return selected ? { ...selected } : null;
    }

    function applyQuestionDetails() {
        if (!state.question) return;
        if (els.levelPill) {
            els.levelPill.textContent = `Level ${state.level}`;
        }
        if (els.questionText) {
            els.questionText.textContent = state.question.question || '';
        }
        if (els.category) {
            els.category.textContent = state.question.category || '';
        }
        if (els.imageContainer && els.image) {
            if (state.question.image) {
                els.image.src = state.question.image;
                els.image.alt = state.question.category ? `${state.question.category} illustration` : 'Question illustration';
                els.imageContainer.classList.add('visible');
            } else {
                els.image.removeAttribute('src');
                els.image.removeAttribute('alt');
                els.imageContainer.classList.remove('visible');
            }
        }
    }

    function renderQuestion() {
        if (!state.question) {
            renderIdleView();
            return;
        }

        applyQuestionDetails();

        hideHint();
        clearGuessBoard();
        setGuessCounter('Guess 1 of 6');
        enableInput();
        if (els.input) {
            els.input.value = '';
        }
        if (els.result) {
            els.result.style.display = 'none';
        }
        if (els.nextButton) {
            els.nextButton.style.display = 'none';
        }
        if (els.restartButton) {
            els.restartButton.style.display = 'none';
        }
        state.guesses = [];
        state.questionComplete = false;
        state.awaitingNext = false;
        state.hintRevealed = false;
        state.lastOutcome = null;
        updateCard();
        focusInput();
    }
    function applyFeedback(index, guessValue, feedback) {
        const entry = els.guessRows?.[index];
        if (!entry) return;
        const { row, field, feedback: button } = entry;

        field.textContent = formatNumberLocal(guessValue);
        field.classList.remove('empty');
        button.className = `feedback-button ${feedback.status}`;

        if (feedback.status === 'correct') {
            button.innerHTML = CHECKMARK_ICON;
            button.setAttribute('data-tooltip', "You're within ±20% of the correct answer!");
        } else {
            button.textContent = feedback.symbol;
            if (feedback.status === 'close') {
                const direction = feedback.symbol === '↓' ? 'Too high' : 'Too low';
                button.setAttribute('data-tooltip', `${direction}, but within ±50% of the answer!`);
            } else if (feedback.status === 'high') {
                button.setAttribute('data-tooltip', 'Too high! You need to go lower ↓');
            } else if (feedback.status === 'low') {
                button.setAttribute('data-tooltip', 'Too low! You need to go higher ↑');
            } else {
                button.removeAttribute('data-tooltip');
            }
        }

        if (feedback.status !== 'correct' && typeof triggerShake === 'function') {
            triggerShake(row);
        }
    }

    function evaluateGuess(value) {
        if (!state.question) {
            return { status: 'low', symbol: '', isCorrect: false };
        }
        const answer = Number(state.question.answer);
        if (!Number.isFinite(answer) || answer === 0) {
            return { status: 'low', symbol: '', isCorrect: false };
        }

        const difference = Math.abs(value - answer);
        const isCorrect = difference <= answer * CORRECT_TOLERANCE;
        if (isCorrect) {
            return { status: 'correct', symbol: 'WIN', isCorrect: true };
        }

        const isHigh = value > answer;
        const isClose = difference <= answer * CLOSE_TOLERANCE;
        if (isClose) {
            return { status: 'close', symbol: isHigh ? '↓' : '↑', isCorrect: false };
        }
        return { status: isHigh ? 'high' : 'low', symbol: isHigh ? '↓' : '↑', isCorrect: false };
    }

    function handleGuessSubmission() {
        if (!state.question || state.questionComplete) {
            return;
        }
        if (!els.input) return;

        const numeric = parseInt(els.input.value.replace(/[^\d]/g, ''), 10);
        if (!Number.isFinite(numeric) || numeric < 0) {
            alert('Please enter a valid positive number!');
            return;
        }

        state.guesses.push(numeric);
        const guessIndex = state.guesses.length - 1;
        const feedback = evaluateGuess(numeric);
        applyFeedback(guessIndex, numeric, feedback);
        updateGuessCounter();
        maybeShowHint();

        els.input.value = '';

        if (feedback.isCorrect) {
            completeQuestion(true);
        } else if (state.guesses.length >= MAX_GUESSES) {
            completeQuestion(false);
        }
    }
    function updateResultDisplay(won) {
        if (!els.result) return;
        els.result.style.display = 'block';
        if (els.resultEmoji) {
            els.resultEmoji.textContent = won ? '🏆' : '💥';
        }
        if (els.resultMessage) {
            els.resultMessage.textContent = won
                ? `Level ${state.level} cleared!`
                : `Run over at level ${state.level}.`;
        }
        if (els.correctAnswer && state.question) {
            els.correctAnswer.textContent = `Answer: ${formatNumberLocal(state.question.answer)}`;
        }
        if (els.explanation) {
            els.explanation.textContent = state.question?.explanation || '';
        }

        if (els.nextButton) {
            if (won) {
                els.nextButton.style.display = 'inline-flex';
                els.nextButton.textContent = `Next level (${state.level + 1})`;
            } else {
                els.nextButton.style.display = 'none';
            }
        }
        if (els.restartButton) {
            els.restartButton.style.display = 'inline-flex';
            els.restartButton.textContent = won ? 'End run' : 'Restart run';
        }
    }

    function updateGuessCounterAfterCompletion(won) {
        if (!els.guessCounter) return;
        if (won) {
            els.guessCounter.textContent = `Solved in ${state.guesses.length} ${state.guesses.length === 1 ? 'guess' : 'guesses'}`;
        } else {
            els.guessCounter.textContent = 'No guesses remaining.';
        }
    }

    function saveInfiniteGameSession(won) {
        const client = getSupabaseClient();
        const userId = getCurrentUserId();
        if (!client || !userId || !state.question) {
            return Promise.resolve();
        }
        try {
            return client
                .from('infinite_game_sessions')
                .insert({
                    user_id: userId,
                    question_id: state.question.id || null,
                    question_level: state.question.level || state.level,
                    question_text: state.question.question,
                    correct_answer: state.question.answer,
                    won,
                    total_guesses: state.guesses.length,
                    guesses: state.guesses,
                    completed_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    run_level: state.level,
                    highest_level_completed: state.highestLevelThisRun
                })
                .then(({ error }) => {
                    if (error) {
                        console.error('Error saving infinite game to Supabase:', error);
                    }
                });
        } catch (error) {
            console.error('Error saving infinite game to Supabase:', error);
            return Promise.resolve();
        }
    }

    function saveInfiniteStatsToSupabase() {
        const client = getSupabaseClient();
        const userId = getCurrentUserId();
        if (!client || !userId) {
            return Promise.resolve();
        }
        const accuracy = stats.questionsAttempted > 0
            ? stats.questionsCorrect / stats.questionsAttempted
            : 0;
        try {
            return client
                .from('infinite_user_stats')
                .upsert({
                    user_id: userId,
                    runs_started: stats.runsStarted,
                    best_level: stats.bestLevel,
                    longest_streak: stats.longestStreak,
                    questions_attempted: stats.questionsAttempted,
                    questions_correct: stats.questionsCorrect,
                    total_guesses: stats.totalGuesses,
                    accuracy,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' })
                .then(({ error }) => {
                    if (error) {
                        console.error('Error saving infinite stats to Supabase:', error);
                    }
                });
        } catch (error) {
            console.error('Error saving infinite stats to Supabase:', error);
            return Promise.resolve();
        }
    }
    function completeQuestion(won) {
        state.questionComplete = true;
        state.lastOutcome = won ? 'win' : 'loss';
        disableInput();
        updateGuessCounterAfterCompletion(won);
        updateResultDisplay(won);

        stats.questionsAttempted += 1;
        stats.totalGuesses += state.guesses.length;

        if (won) {
            state.currentStreak += 1;
            state.highestLevelThisRun = Math.max(state.highestLevelThisRun, state.level);
            stats.questionsCorrect += 1;
            stats.bestLevel = Math.max(stats.bestLevel, state.highestLevelThisRun);
            stats.longestStreak = Math.max(stats.longestStreak, state.currentStreak);
            stats.lastRunBest = state.highestLevelThisRun;
            state.awaitingNext = true;
        } else {
            stats.bestLevel = Math.max(stats.bestLevel, state.highestLevelThisRun);
            stats.longestStreak = Math.max(stats.longestStreak, state.currentStreak);
            stats.lastRunBest = state.highestLevelThisRun;
            state.currentStreak = 0;
            state.runStarted = false;
            state.awaitingNext = false;
        }

        persistStats();
        void saveInfiniteGameSession(won);
        if (won && typeof triggerConfetti === 'function') {
            triggerConfetti();
        }
    }
    function startNextLevel() {
        state.level += 1;
        state.runStarted = true;
        state.guesses = [];
        state.questionComplete = false;
        state.awaitingNext = false;
        state.lastOutcome = null;
        const nextQuestion = selectQuestionForLevel(state.level);
        if (!nextQuestion) {
            resetRunState();
            return;
        }
        state.question = nextQuestion;
        renderQuestion();
    }

    function resetRunState() {
        state.runStarted = false;
        state.level = 1;
        state.currentStreak = 0;
        state.highestLevelThisRun = 0;
        state.guesses = [];
        state.question = null;
        state.questionComplete = false;
        state.awaitingNext = false;
        state.hintRevealed = false;
        state.lastOutcome = null;
        renderIdleView();
        updateCard();
    }

    function startNewRun() {
        state.runStarted = true;
        state.level = 1;
        state.currentStreak = 0;
        state.highestLevelThisRun = 0;
        state.guesses = [];
        state.questionComplete = false;
        state.awaitingNext = false;
        state.hintRevealed = false;
        state.lastOutcome = null;
        stats.runsStarted += 1;
        stats.lastRunBest = 0;
        persistStats();

        const question = selectQuestionForLevel(state.level);
        state.question = question;
        if (question) {
            renderQuestion();
        } else {
            renderIdleView();
        }
    }

    function handleNextLevel() {
        if (!state.questionComplete || !state.awaitingNext) {
            return;
        }
        startNextLevel();
    }

    function handleRestartClick() {
        if (state.questionComplete && state.lastOutcome === 'win') {
            resetRunState();
        } else {
            startNewRun();
        }
    }

    function handlePlayClick() {
        if (state.runStarted && state.question && !state.questionComplete) {
            if (typeof navigateToView === 'function') {
                navigateToView('infinite');
            }
            renderExistingState();
            return;
        }
        startNewRun();
        if (typeof navigateToView === 'function') {
            navigateToView('infinite');
        } else {
            renderExistingState();
        }
    }

    function handleInputFormat() {
        if (!els.input) return;
        const digits = els.input.value.replace(/[^\d]/g, '');
        if (digits === '') {
            els.input.value = '';
            return;
        }
        const numeric = parseInt(digits, 10);
        if (Number.isFinite(numeric)) {
            els.input.value = formatNumberLocal(numeric);
        }
    }

    function handleQuickButtonClick(event) {
        if (!els.input) return;
        const value = Number(event.currentTarget?.dataset?.value);
        if (!Number.isFinite(value)) return;
        const current = parseInt(els.input.value.replace(/[^\d]/g, ''), 10) || 0;
        const updated = Math.max(0, current + value);
        els.input.value = formatNumberLocal(updated);
        focusInput();
    }
    function renderExistingState() {
        if (!state.question) {
            renderIdleView();
            return;
        }

        applyQuestionDetails();
        clearGuessBoard();
        if (state.guesses.length > 0) {
            state.guesses.forEach((guess, index) => {
                const feedback = evaluateGuess(guess);
                applyFeedback(index, guess, feedback);
            });
        }

        if (state.hintRevealed) {
            showHint();
        } else {
            hideHint();
        }

        if (state.questionComplete) {
            disableInput();
            updateGuessCounterAfterCompletion(state.lastOutcome === 'win');
            updateResultDisplay(state.lastOutcome === 'win');
            if (els.nextButton) {
                if (state.awaitingNext) {
                    els.nextButton.style.display = 'inline-flex';
                    els.nextButton.textContent = `Next level (${state.level + 1})`;
                } else {
                    els.nextButton.style.display = 'none';
                }
            }
            if (els.restartButton) {
                els.restartButton.style.display = 'inline-flex';
                els.restartButton.textContent = state.lastOutcome === 'win' ? 'End run' : 'Restart run';
            }
        } else {
            enableInput();
            updateGuessCounter();
            if (els.result) {
                els.result.style.display = 'none';
            }
            if (els.nextButton) {
                els.nextButton.style.display = 'none';
            }
            if (els.restartButton) {
                els.restartButton.style.display = 'none';
            }
        }

        updateCard();
    }
    function setupElements() {
        els.card = document.getElementById('infinite-challenge-card');
        if (!els.card) return false;

        els.playButton = document.getElementById('play-infinite-btn');
        els.levelBadge = document.getElementById('infinite-challenge-level');
        els.status = document.getElementById('infinite-challenge-status');
        els.levelPill = document.getElementById('infinite-level-pill');
        els.questionText = document.getElementById('infinite-question-text');
        els.category = document.getElementById('infinite-question-category');
        els.imageContainer = document.getElementById('infinite-question-image-container');
        els.image = document.getElementById('infinite-question-image');
        els.hintContainer = document.getElementById('infinite-hint-container');
        els.hintText = document.getElementById('infinite-hint-text');
        els.guessesContainer = document.getElementById('infinite-guesses-container');
        els.guessCounter = document.getElementById('infinite-guess-counter');
        els.input = document.getElementById('infinite-guess-input');
        els.submitButton = document.getElementById('infinite-submit-btn');
        els.nextButton = document.getElementById('infinite-next-btn');
        els.restartButton = document.getElementById('infinite-restart-btn');
        els.result = document.getElementById('infinite-game-result');
        els.resultEmoji = document.getElementById('infinite-result-emoji');
        els.resultMessage = document.getElementById('infinite-result-message');
        els.correctAnswer = document.getElementById('infinite-correct-answer');
        els.explanation = document.getElementById('infinite-explanation');
        els.backButton = document.getElementById('infinite-back-btn');
        els.quickButtons = document.querySelectorAll('#infinite-quick-buttons .quick-btn');
        return true;
    }

    function setupEventListeners() {
        if (els.playButton) {
            els.playButton.addEventListener('click', handlePlayClick);
        }
        if (els.submitButton) {
            els.submitButton.addEventListener('click', handleGuessSubmission);
        }
        if (els.input) {
            els.input.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    handleGuessSubmission();
                }
            });
            els.input.addEventListener('input', handleInputFormat);
        }
        if (els.quickButtons && els.quickButtons.length) {
            els.quickButtons.forEach(btn => btn.addEventListener('click', handleQuickButtonClick));
        }
        if (els.nextButton) {
            els.nextButton.addEventListener('click', handleNextLevel);
        }
        if (els.restartButton) {
            els.restartButton.addEventListener('click', handleRestartClick);
        }
        if (els.backButton) {
            els.backButton.addEventListener('click', () => {
                if (typeof navigateToView === 'function') {
                    navigateToView('welcome');
                } else {
                    renderIdleView();
                }
            });
        }
    }

    function renderCurrentState() {
        if (state.question) {
            renderExistingState();
        } else {
            renderIdleView();
        }
    }
    function init() {
        if (!Array.isArray(window.fermiInfiniteQuestions) || window.fermiInfiniteQuestions.length === 0) {
            console.warn('Infinite challenge question bank is unavailable.');
        }
        if (!setupElements()) {
            return;
        }

        stats = loadStats();
        updateStatsPanel();
        updateCard();
        renderIdleView();
        setupEventListeners();

        window.updateInfiniteStatsDisplay = updateStatsPanel;
        window.focusInfiniteInput = focusInput;
        window.onInfiniteViewActivated = () => {
            renderCurrentState();
            focusInput();
        };
        window.onInfiniteRouteRequested = () => {
            renderCurrentState();
        };
    }

    document.addEventListener('DOMContentLoaded', init);
})();
