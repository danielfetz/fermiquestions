// Supabase configuration
const SUPABASE_URL = 'https://hxyaaqdnbkpsdpreddsf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4eWFhcWRuYmtwc2RwcmVkZHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTg3MTgsImV4cCI6MjA3MDgzNDcxOH0.ONL920tQUbG-ttVVhV4yuTof4V0Oc-WMBwWY1Q-VQXc';

// Initialize Supabase client
let supabaseClient = null;
let currentUserId = null;
let commentsChannel = null;

const MAX_CONFIDENCE_PERCENT = 99;
const MAX_CONFIDENCE_FRACTION = MAX_CONFIDENCE_PERCENT / 100;

// Initialize Supabase with error handling
function initSupabase() {
    try {
        if (typeof window.supabase !== 'undefined') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized successfully');
            
            // Sign in anonymously and get/create user session
            initSupabaseAuth();
        } else {
            console.error('Supabase library not loaded');
        }
    } catch (error) {
        console.error('Error initializing Supabase:', error);
    }
}

// Initialize Supabase authentication
async function initSupabaseAuth() {
    if (!supabaseClient) return;
    
    try {
        // Check if user already has a session
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            // Sign in anonymously
            const { data, error } = await supabaseClient.auth.signInAnonymously();
            if (error) {
                console.error('Error signing in anonymously:', error);
            } else {
                currentUserId = data.user?.id;
                console.log('Anonymous user created:', currentUserId);
            }
        } else {
            currentUserId = session.user?.id;
            console.log('Existing user session:', currentUserId);
        }
        
        // Listen for auth changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            currentUserId = session?.user?.id || null;
            console.log('Auth state changed:', event, currentUserId);
        });
    } catch (error) {
        console.error('Error with Supabase auth:', error);
    }
}

// Save game data to Supabase
async function saveGameToSupabase(gameData) {
    if (!supabaseClient || !currentUserId) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('game_sessions')
            .upsert({
                user_id: currentUserId,
                question_date: gameData.question_date,
                question_text: gameData.question_text,
                correct_answer: gameData.correct_answer,
                won: gameData.won,
                total_guesses: gameData.total_guesses,
                guesses: gameData.guesses,
                completed_at: gameData.completed_at,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,question_date'
            });
            
        if (error) {
            console.error('Error saving game to Supabase:', error);
        } else {
            console.log('Game saved to Supabase successfully');
        }
    } catch (error) {
        console.error('Error with Supabase save:', error);
    }
}

// Save stats to Supabase
async function saveStatsToSupabase(statsData) {
    if (!supabaseClient || !currentUserId) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('user_stats')
            .upsert({
                user_id: currentUserId,
                games_played: statsData.gamesPlayed,
                games_won: statsData.gamesWon,
                win_rate: statsData.winRate,
                current_streak: statsData.currentStreak,
                max_streak: statsData.maxStreak,
                guess_distribution: statsData.guessDistribution,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });
            
        if (error) {
            console.error('Error saving stats to Supabase:', error);
        } else {
            console.log('Stats saved to Supabase successfully');
        }
    } catch (error) {
        console.error('Error with Supabase stats save:', error);
    }
}

// Fetch average guesses for a question from Supabase using RPC
async function fetchAverageGuesses(questionDate) {
    if (!supabaseClient) return null;
    
    try {
        // Call the RPC function for server-side aggregation
        const { data, error } = await supabaseClient
            .rpc('avg_guesses_for_date', { q_date: questionDate });
        
        if (error) {
            console.error('Error fetching average guesses:', error);
            return null;
        }
        
        // The RPC returns an array with one row
        if (!data || data.length === 0) {
            return null;
        }
        
        const result = data[0];
        
        // Return null if no players have completed this question yet
        if (!result || result.total_players === 0) {
            return null;
        }
        
        return {
            average: parseFloat(result.average),
            totalPlayers: result.total_players,
            winRate: result.win_rate
        };
    } catch (error) {
        console.error('Error with average guesses fetch:', error);
        return null;
    }
}

// Fetch median of first guesses for a question.
// Tries RPC 'median_first_guess_for_date' first; falls back to client aggregation from game_sessions.
async function fetchMedianFirstGuess(questionDate) {
    if (!supabaseClient) return null;
    // Try server-side RPC (preferred)
    try {
        const { data, error } = await supabaseClient
            .rpc('median_first_guess_for_date', { q_date: questionDate });
        if (!error && data && data.length > 0) {
            const row = data[0];
            if (row && row.median != null) {
                const value = typeof row.median === 'string' ? parseFloat(row.median) : row.median;
                if (!isNaN(value)) return Math.round(value);
            }
        }
    } catch (err) {
        // ignore and try fallback
    }
    // Fallback: read first guesses from game_sessions JSON and compute client-side
    try {
        const { data, error } = await supabaseClient
            .from('game_sessions')
            .select('guesses, completed_at')
            .eq('question_date', questionDate)
            .not('guesses', 'is', null);
        if (error || !data) return null;
        const firstGuesses = [];
        for (const row of data) {
            const list = Array.isArray(row.guesses) ? row.guesses : null;
            if (!list || list.length === 0) continue;
            const first = list[0];
            if (!first || first.value == null) continue;
            const num = parseInt(String(first.value).replace(/[^\d]/g, ''));
            if (!isNaN(num)) firstGuesses.push(num);
        }
        if (firstGuesses.length === 0) return null;
        firstGuesses.sort((a, b) => a - b);
        const mid = Math.floor(firstGuesses.length / 2);
        if (firstGuesses.length % 2 === 0) {
            return Math.round((firstGuesses[mid - 1] + firstGuesses[mid]) / 2);
        }
        return firstGuesses[mid];
    } catch (err) {
        return null;
    }
}

// Compute the percentile of the user's first guess among all first guesses for this date
// Attempts RPC 'first_guess_percentile_for_date' first; falls back to client aggregation
async function fetchFirstGuessPercentile(questionDate) {
    if (!supabaseClient) return null;
    // get user's first guess from current game or saved data
    let userFirstGuess = null;
    try {
        const guessRows = guessesContainer.querySelectorAll('.guess-row');
        if (guessRows.length > 0) {
            const firstRow = guessRows[0];
            const guessField = firstRow.querySelector('.guess-field');
            if (guessField && guessField.textContent) {
                const n = parseInt(String(guessField.textContent).replace(/[^\d]/g, ''));
                if (!isNaN(n)) userFirstGuess = n;
            }
        }
    } catch (e) {
        // ignore
    }
    if (userFirstGuess == null) return null;

    // Try RPC
    try {
        const { data, error } = await supabaseClient
            .rpc('first_guess_percentile_for_date', { q_date: questionDate, g_value: userFirstGuess });
        if (!error && data && data.length > 0) {
            const row = data[0];
            if (row && typeof row.percentile === 'number') return row.percentile;
        }
    } catch (e) {
        // ignore and fallback
    }

    // Fallback: compute percentile client-side from game_sessions based on closeness to the correct answer
    try {
        const { data, error } = await supabaseClient
            .from('game_sessions')
            .select('guesses')
            .eq('question_date', questionDate)
            .not('guesses', 'is', null);
        if (error || !data) return null;
        const values = [];
        for (const row of data) {
            const list = Array.isArray(row.guesses) ? row.guesses : null;
            if (!list || list.length === 0) continue;
            const first = list[0];
            if (!first || first.value == null) continue;
            const num = parseInt(String(first.value).replace(/[^\d]/g, ''));
            if (!isNaN(num)) values.push(num);
        }
        if (values.length === 0) return null;
        if (!currentQuestion || !currentQuestion.answer) return null;
        const correct = Number(currentQuestion.answer);
        if (!isFinite(correct) || correct <= 0) return null;
        if (!(userFirstGuess > 0)) return null;
        // log-scale error (symmetric, multiplicative)
        const userErr = Math.abs(Math.log(userFirstGuess) - Math.log(correct));
        const errors = values
            .filter(v => v > 0)
            .map(v => Math.abs(Math.log(v) - Math.log(correct)))
            .filter(e => isFinite(e));
        if (errors.length === 0) return null;
        // percentile rank by closeness: percentage of players with error >= user's error
        let countGE = 0;
        for (const e of errors) if (e >= userErr) countGE++;
        const percentile = Math.round((countGE / errors.length) * 100);
        return percentile;
    } catch (e) {
        return null;
    }
}

// Fetch comments for a question
async function fetchComments(questionDate) {
    if (!supabaseClient) return [];
    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .select('id, content, guess_count, won, created_at')
            .eq('question_date', questionDate)
            .order('created_at', { ascending: false });
        if (error || !data) return [];
        return data;
    } catch (e) {
        console.error('Error fetching comments:', e);
        return [];
    }
}

// Add a comment
async function addComment(questionDate, content) {
    if (!supabaseClient || !currentUserId) return;
    const guessCount = getGuessCountForComment();
    const completed = completedQuestions[currentQuestion.date];
    const won = completed ? completed.won : gameWon;
    try {
        await supabaseClient
            .from('comments')
            .insert({
                user_id: currentUserId,
                question_date: questionDate,
                content,
                guess_count: guessCount,
                won,
                created_at: new Date().toISOString()
            });
    } catch (e) {
        console.error('Error adding comment:', e);
    }
}

function getGuessCountForComment() {
    if (!currentQuestion) return null;
    const completed = completedQuestions[currentQuestion.date];
    if (completed && typeof completed.guesses === 'number') {
        return completed.guesses;
    }
    if (gameOver) return currentGuess;
    return null;
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) {
        return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
}

// Load comments and update display
async function loadComments() {
    if (!currentQuestion) return;
    const comments = await fetchComments(currentQuestion.date);
    renderComments(comments);
    if (commentCountEl) commentCountEl.textContent = comments.length;
}

function renderComments(comments) {
    if (!commentsList) return;
    commentsList.innerHTML = '';
    if (!comments || comments.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No comments yet';
        commentsList.appendChild(empty);
        return;
    }
    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment';

        const textEl = document.createElement('div');
        textEl.className = 'comment-text';
        textEl.textContent = c.content;
        div.appendChild(textEl);

        const metaEl = document.createElement('div');
        metaEl.className = 'comment-meta';
        const timeAgo = formatTimeAgo(c.created_at);
        if (c.won === false) {
            metaEl.textContent = `Lost · ${timeAgo}`;
        } else if (c.guess_count != null) {
            const tries = `${c.guess_count}/6 tries`;
            metaEl.textContent = `${tries} · ${timeAgo}`;
        } else {
            metaEl.textContent = timeAgo;
        }
        div.appendChild(metaEl);

        commentsList.appendChild(div);
    });
}

async function updateCommentCount() {
    if (!currentQuestion || !commentCountEl) return;
    const comments = await fetchComments(currentQuestion.date);
    commentCountEl.textContent = comments.length;
}

function subscribeToComments(questionDate) {
    if (!supabaseClient) return;
    if (commentsChannel) {
        supabaseClient.removeChannel(commentsChannel);
    }
    commentsChannel = supabaseClient
        .channel(`comments-${questionDate}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `question_date=eq.${questionDate}`
        }, async () => {
            await updateCommentCount();
            if (commentsSection && commentsSection.classList.contains('open')) {
                await loadComments();
            }
        })
        .subscribe();
}

function openComments() {
    if (!commentsSection) return;
    loadComments();
    commentsSection.classList.add('open');
    document.body.classList.add('no-scroll');
}

function closeComments() {
    if (!commentsSection) return;
    commentsSection.classList.remove('open');
    document.body.classList.remove('no-scroll');
}

// Update the average tries display in the inline meta row
// Inline avg display removed entirely

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
    calibrationData: []
};

let calibrationEnabled = true;

// Database of Fermi questions with dates
const fermiQuestions = [
    {
        question: "How many people live outside the country where they were born?",
        answer: 304000000,
        category: "",
        explanation: "",
        hint: "About 20% of Germany's population was born in another country.",
        date: "2025-07-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0f8ff'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%234169e1'%3e🌍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people of Jewish faith live in the world?",
        answer: 15800000,
        category: "Religion",
        explanation: "",
        hint: "Appx. 45.5% of the world's Jewish population lives in Israel.",
        date: "2025-07-25",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e✡️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many McDonald's restaurants exist worldwide?",
        answer: 43477,
        category: "Business",
        explanation: "McDonald's operates approximately 43,500 restaurants globally.",
        hint: "There are 13,557 McDonald's restaurants in the US.",
        date: "2025-07-26",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef3c7'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🍟%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new electric cars/plug-in hybrids were sold worldwide in 2024?",
        answer: 17500000,
        category: "",
        explanation: "",
        hint: "62.9M new non-electric cars were sold worldwide in 2023.",
        date: "2025-07-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23dcfce7'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🔋%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new smartphones were sold worldwide in 2024?",
        answer: 1240000000,
        category: "",
        explanation: "",
        hint: "Xiaomi sold 169 million smartphones in 2024.",
        date: "2025-07-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f3f4f6'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many cars did Tesla produce in 2024?",
        answer: 1770000,
        category: "",
        explanation: "",
        hint: "In 2018, Tesla produced 255K cars.",
        date: "2025-07-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef2f2'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "What percentage of the Earth's surface is land?",
        answer: 29,
        category: "",
        explanation: "",
        hint: "The US covers 1.87% of the Earth's surface.",
        date: "2025-07-30",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23dbeafe'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%232563eb'%3e🌍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many chickens were slaughtered for meat worldwide in 2023?",
        answer: 76250000000,
        category: "",
        explanation: "",
        hint: "The average meat yield per chicken is 1.66 kg.",
        date: "2025-07-31",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fffbeb'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23d97706'%3e🐔%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many humans have ever lived (including those currently alive)?",
        answer: 117000000000,
        category: "",
        explanation: "",
        hint: "About half the people who ever lived, lived in the past 2000 years.",
        date: "2025-08-01",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef7cd'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23a16207'%3e👥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new cars were sold in the United States in 2024?",
        answer: 15900000,
        category: "",
        explanation: "",
        hint: "Around 240 million people hold a valid driver's licence in the US.",
        date: "2025-08-02",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23eff6ff'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%232563eb'%3e🚙%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many veterinarians are there in the United States?",
        answer: 130415,
        category: "",
        explanation: "",
        hint: "There are about 15,000 veterinarians in Australia.",
        date: "2025-08-03",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🐈%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many paying subscribers does Spotify have?",
        answer: 276000000,
        category: "",
        explanation: "",
        hint: "Spotify's revenue in the second quarter of 2025 was 4.2 billion euros.",
        date: "2025-08-04",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎵%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many iPhones has Apple ever sold?",
        answer: 3000000000,
        category: "",
        explanation: "",
        hint: "In 2024, Apple sold approximately 232.1 million iPhones.",
        date: "2025-08-05",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many students are currently enrolled in medical school in the US?",
        answer: 99562,
        category: "",
        explanation: "",
        hint: "The US had 1,01 million active physicians in 2023.",
        date: "2025-08-06",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef2f2'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🏥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many pigs were slaughtered for meat worldwide in 2023?",
        answer: 1510000000,
        category: "",
        explanation: "",
        hint: "The average meat yield per pig is 82 kg (181 lbs).",
        date: "2025-08-07",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fdf2f8'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23ec4899'%3e🐷%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many passengers did the San Francisco Airport handle in 2024?",
        answer: 52300000,
        category: "",
        explanation: "",
        hint: "1.35M passengers were flown from SFO to Taiwan in 2024.",
        date: "2025-08-08",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0f8ff'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%234169e1'%3e✈️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many printed books has Amazon sold in the United States in 2024?",
        answer: 308000000,
        category: "",
        explanation: "",
        hint: "In France, retailers sold 440 million print books in 2023.",
        date: "2025-08-09",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e📚%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many babies were born worldwide in 2024?",
        answer: 132000000,
        category: "",
        explanation: "",
        hint: "For every person that died in 2024, more than two babies were born.",
        date: "2025-08-10",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fffbeb'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23d97706'%3e👶%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many air traffic controllers are there in the United States?",
        answer: 14264,
        category: "",
        explanation: "",
        hint: "There are 527 airport traffic control towers in the US.",
        date: "2025-08-11",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🧭%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many sheep are there in the world?",
        answer: 1266000000,
        category: "",
        explanation: "",
        hint: "A single sheep provides around 4.5 kg of wool per year.",
        date: "2025-08-12",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🐑%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many dentists work in the United Kingdom?",
        answer: 45580,
        category: "",
        explanation: "",
        hint: "There are 11,976 dental practices in the UK.",
        date: "2025-08-13",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🦷%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many public school teachers are there in California?",
        answer: 285891,
        category: "",
        explanation: "",
        hint: "There are around 10,000 public schools in California.",
        date: "2025-08-14",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e👩‍🏫%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many weddings took place in the United States in 2022?",
        answer: 2070000,
        category: "",
        explanation: "",
        hint: "673,989 divorces happened in the US in 2022.",
        date: "2025-08-15",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many police officers are there across the European Union?",
        answer: 1537588,
        category: "",
        explanation: "",
        hint: "Finland has around 135 police officers per 100,000 inhabitants.",
        date: "2025-08-16",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🚓%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Americans who served in World War II were still alive as of 2024?",
        answer: 66143,
        category: "",
        explanation: "",
        hint: "Around 16.4 million Americans served in World War II.",
        date: "2025-08-17",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🪖%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many airports are there in the US, including small private airstrips?",
        answer: 19482,
        category: "",
        explanation: "",
        hint: "Around 26% of all US airports are open to the public.",
        date: "2025-08-18",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🛫%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many lawyers are there in the United States?",
        answer: 1322649,
        category: "",
        explanation: "",
        hint: "In 1970, there were 326,000 lawyers in the US.",
        date: "2025-08-19",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🏛️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many horses are there in the United States?",
        answer: 6700000,
        category: "",
        explanation: "",
        hint: "The horse population has declined by more than two-thirds since it peaked in 1920.",
        date: "2025-08-20",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🐴%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did Meta/Facebook make per day in 2024?",
        answer: 450000000,
        category: "",
        explanation: "",
        hint: "In December 2024, Meta's apps reached 3.35 billion people daily.",
        date: "2025-08-21",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many passengers fly in and out of US airports every day?",
        answer: 3000000,
        category: "",
        explanation: "",
        hint: "The FAA handles on average more than 44,000 flights per day.",
        date: "2025-08-22",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e✈️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new cars did Toyota sell globally in 2024?",
        answer: 10200000,
        category: "",
        explanation: "",
        hint: "In 2024, Toyoto sold around 2.33 million cars in the US.",
        date: "2025-08-23",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🚗️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many golf courses are there in the United States?",
        answer: 15963,
        category: "",
        explanation: "",
        hint: "In 2024, around 28 million people played on a golf course in the US.",
        date: "2025-08-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e⛳️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many PCs (desktops and laptops) were sold globally in 2024?",
        answer: 245300000,
        category: "",
        explanation: "",
        hint: "Dell was the third-largest PC vendor in 2024, selling 39.5 million units.",
        date: "2025-08-25",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💻%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many waiters and waitresses are there in the United States?",
        answer: 2280000,
        category: "",
        explanation: "",
        hint: "Per capita food-away-from-home expenditure was $4,306 in 2024.",
        date: "2025-08-26",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🍽️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people worldwide speak English as a native or second language?",
        answer: 1528000000,
        category: "",
        explanation: "",
        hint: "There are around 390 million native English speakers in the world.",
        date: "2025-08-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💬%3c/text%3e%3c/svg%3e"
    },
    {
        question: "What percentage of the Earth's land surface is covered by forest?",
        answer: 31,
        category: "",
        explanation: "",
        hint: "Around 76% of the Earth's land surface is habitable.",
        date: "2025-08-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🌲%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many visitors did Disneyland Paris have in 2023?",
        answer: 16100000,
        category: "",
        explanation: "",
        hint: "The Louvre Museum had 8.9 million visitors in 2023.",
        date: "2025-08-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🎢%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people worldwide were 80 years or older in 2021?",
        answer: 155000000,
        category: "",
        explanation: "",
        hint: "The UN estimates that 459 million people will be aged 80 or older by 2050.",
        date: "2025-08-30",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e👵%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many pharmacies are there in the United Kingdom?",
        answer: 13822,
        category: "",
        explanation: "",
        hint: "There are around 1300 pharmacies in Scotland alone.",
        date: "2025-08-31",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💊%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many electricians are there in the United States?",
        answer: 818700,
        category: "",
        explanation: "",
        hint: "In 2024, roughly 1.02 million single-family homes finished construction in the US.",
        date: "2025-09-01",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🔌%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did Reddit make in the first half of 2025?",
        answer: 892000000,
        category: "",
        explanation: "",
        hint: "Reddit's revenue per daily active user was $4.53 in the second quarter of 2025.",
        date: "2025-09-02",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💰%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many native Spanish speakers are there worldwide?",
        answer: 498500000,
        category: "",
        explanation: "",
        hint: "Mexico, Colombia, and Argentina all have more native Spanish speakers than Spain.",
        date: "2025-09-03",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🇪🇸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many elevators are there in Germany, excluding stair lifts?",
        answer: 815000,
        category: "",
        explanation: "",
        hint: "In 2021, 56% of Germany's 83 million residents lived in apartment buildings.",
        date: "2025-09-04",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🛗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many undergraduate students are there in the United Kingdom?",
        answer: 2050000,
        category: "",
        explanation: "",
        hint: "Around 749,000 babies were born in the United Kingdom in 2006.",
        date: "2025-09-05",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🏛️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many cars were produced in China in 2024?",
        answer: 27480000,
        category: "",
        explanation: "",
        hint: "China exported 4.96 million cars in 2024.",
        date: "2025-09-06",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Catholic priests are there worldwide?",
        answer: 407000,
        category: "",
        explanation: "",
        hint: "The number of baptized Catholics was around 1.4 billion in 2022.",
        date: "2025-09-07",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e⛪️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many US dollars are spent on gasoline per day in the United States?",
        answer: 1130000000,
        category: "",
        explanation: "",
        hint: "In August 2025, the average US price for gasoline was $3.13 per gallon/$0.83 per liter.",
        date: "2025-09-08",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e⛽️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people were alive worldwide in 1925?",
        answer: 1980000000,
        category: "",
        explanation: "",
        hint: "The US population in 1925 was 111.7 million.",
        date: "2025-09-09",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🌍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many assistant, associate, and full professors are there in the US?",
        answer: 518300,
        category: "",
        explanation: "",
        hint: "Stanford University has a total of 1,595 professors.",
        date: "2025-09-10",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🎓%3c/text%3e%3c/svg%3e"
    },
    {
        question: "What percentage of the Earth's land area is covered by South America?",
        answer: 12,
        category: "",
        explanation: "",
        hint: "The US alone covers around 6.6% of Earth's land area.",
        date: "2025-09-11",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🌎%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many oil tankers with a capacity of at least 55,000 metric tons are there?",
        answer: 3219,
        category: "",
        explanation: "",
        hint: "OPEC produced 28 million barrels (4.4 billion liters) of crude oil per day in August 2025.",
        date: "2025-09-12",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e⛴️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many professional judges work in Germany's court system?",
        answer: 20793,
        category: "",
        explanation: "",
        hint: "In 2021, German courts convicted around 662,100 defendants by final judgment.",
        date: "2025-09-13",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e👨‍⚖️️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many popes have there been in the Catholic Church?",
        answer: 267,
        category: "",
        explanation: "",
        hint: "St. Peter is recognized as the first pope and died around AD 64.",
        date: "2025-09-14",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️⛪️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many visitors does the London Eye observation wheel receive each year?",
        answer: 3500000,
        category: "",
        explanation: "",
        hint: "The London Eye has 32 capsules, each of which holds up to 25 passengers.",
        date: "2025-09-15",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🎡%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did the Harry Potter film series make at the box office?",
        answer: 7700000000,
        category: "",
        explanation: "",
        hint: "The eight Harry Potter films earned $2.39 billion at the US box office.",
        date: "2025-09-16",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍿%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many MacBooks were sold worldwide in 2024?",
        answer: 19700000,
        category: "",
        explanation: "",
        hint: "25.9% of Apple's total revenue in 2024 came from Europe.",
        date: "2025-09-17",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️💻%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many households in the US had an income exceeding $500,000 in 2022?",
        answer: 2478530,
        category: "",
        explanation: "",
        hint: "25.9M US households reported an income between $100,000 and $200,000 in 2022.",
        date: "2025-09-18",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🇺🇸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people work in McDonald's restaurants across the United States?",
        answer: 800000,
        category: "",
        explanation: "",
        hint: "There are 1,225 McDonald's restaurants in California.",
        date: "2025-09-19",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍔%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many daily active users did Duolingo have as of March 2025?",
        answer: 46600000,
        category: "",
        explanation: "",
        hint: "Duolingo's revenue in the first three months of 2025 was $230.7 million.",
        date: "2025-09-20",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many commercial airline pilots are employed worldwide?",
        answer: 382000,
        category: "",
        explanation: "",
        hint: "There were around 36.4 million scheduled commercial airline flights in 2024.",
        date: "2025-09-21",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🧑‍✈️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many divorces took place in Germany in 2024?",
        answer: 129337,
        category: "",
        explanation: "",
        hint: "Roughly 81% of the marriages formed in 2005 were still intact in 2015.",
        date: "2025-09-22",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️💔%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many hours did the average journey from London to San Francisco take in 1900?",
        answer: 293,
        category: "",
        explanation: "",
        hint: "The straight-line distance between San Francisco and London is 5,354 miles (8,617 km).",
        date: "2025-09-23",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🗽%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many babies were born in the United States on New Year's Day in 2000?",
        answer: 9083,
        category: "",
        explanation: "",
        hint: "January 1st, 2000 was a Saturday, which typically has 27% fewer births than weekdays.",
        date: "2025-09-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️👶%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many transactions did Visa process per day in 2024?",
        answer: 639000000,
        category: "",
        explanation: "",
        hint: "Roughly 57% of all credit and debit cards outside China carry the Visa brand.",
        date: "2025-09-25",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️💳%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many radiologists are there in the United States?",
        answer: 31960,
        category: "",
        explanation: "",
        hint: "In 2023, around 35.7 million MRI scans were performed in the US.",
        date: "2025-09-26",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🩻%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many pigs were alive worldwide in April 2025?",
        answer: 754281000,
        category: "",
        explanation: "",
        hint: "Pigs can live up to 20 years, but they are usually slaughtered for meat at the age of six months.",
        date: "2025-09-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🐷%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new dentistry graduates were there across the European Union in 2023?",
        answer: 14186,
        category: "",
        explanation: "",
        hint: "There are around 86 practicing dentists per 100,000 inhabitants in Germany.",
        date: "2025-09-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🦷%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did Netflix make in the first half of 2025?",
        answer: 21600000000,
        category: "",
        explanation: "",
        hint: "The United States and Canada account for around 44% of Netflix's revenue.",
        date: "2025-09-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍿%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many cars were in use in the United States in 1950?",
        answer: 40300000,
        category: "",
        explanation: "",
        hint: "The US had only 6% of the world population in 1950, but 75% of all cars.",
        date: "2025-09-30",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many bibles were sold in the United States in 2024?",
        answer: 17000000,
        category: "",
        explanation: "",
        hint: "US Bible sales in 2024 were 7.3 million higher than in 2019.",
        date: "2025-10-01",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️📚%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many existing and newly built US homes were sold in 2024?",
        answer: 4750000,
        category: "",
        explanation: "",
        hint: "US single-family home sales were around 686,000 in 2024.",
        date: "2025-10-02",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🏘️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many hospital beds were there in Germany as of 2023?",
        answer: 477000,
        category: "",
        explanation: "",
        hint: "The average bed oc­cupa­ncy rate was 71% in 2023.",
        date: "2025-10-03",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🏥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many AirPods did Apple sell worldwide in 2024?",
        answer: 67000000,
        category: "",
        explanation: "",
        hint: "AirPods launched in late 2016, and appx. 15 million units were sold in 2017.",
        date: "2025-10-04",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍏%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many school buses were in service in the United States as of 2024?",
        answer: 451000,
        category: "",
        explanation: "",
        hint: "A 2022 survey suggests that 28% of US students ride a school bus on a typical day.",
        date: "2025-10-05",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚌%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many soldiers did Switzerland mobilize at its highest point during WWII?",
        answer: 850000,
        category: "",
        explanation: "",
        hint: "At its peak, around 40% of the male population in Switzerland was mobilized.",
        date: "2025-10-06",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🇨🇭%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many .com domains were registered in total as of June 2025?",
        answer: 157900000,
        category: "",
        explanation: "",
        hint: "The number of .cn domains registered stood at 21 million in June 2025.",
        date: "2025-10-07",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🌐%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Chromebooks were sold worldwide in 2024?",
        answer: 17500000,
        category: "",
        explanation: "",
        hint: "Around 60% of Chromebook shipments went to the education sector in 2024/25.",
        date: "2025-10-08",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️💻%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many subscribers did Disney+ have as of June 2025?",
        answer: 128000000,
        category: "",
        explanation: "",
        hint: "Around 45% of Disney+ subscribers were in the US and Canada.",
        date: "2025-10-09",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🏰%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many foreign visitors came to Japan in 2024?",
        answer: 36900000,
        category: "",
        explanation: "",
        hint: "Around 24% of all visitors were Korean, and 7.4% were American.",
        date: "2025-10-10",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🇯🇵%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did Tesla make in 2024?",
        answer: 97690000000,
        category: "",
        explanation: "",
        hint: "Tesla's revenue from China was around $21 billion in 2024.",
        date: "2025-10-11",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many aircraft takeoffs and landings did Singapore's Changi Airport handle in 2024?",
        answer: 366000,
        category: "",
        explanation: "",
        hint: "On the airport’s busiest day in 2024, 226,000 passengers passed through its terminals.",
        date: "2025-10-12",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️✈️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many copies of Minecraft have been sold worldwide as of April 2025?",
        answer: 350000000,
        category: "",
        explanation: "",
        hint: "More than 215 million copies of Grand Theft Auto V have been sold.",
        date: "2025-10-13",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🎮%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did OpenAI make in the first half of 2025?",
        answer: 4300000000,
        category: "",
        explanation: "",
        hint: "OpenAI's revenue in the first six months of 2025 was 16% more than its revenue for all of 2024.",
        date: "2025-10-14",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🤖%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Summer Olympic medals have American athletes won in total?",
        answer: 2765,
        category: "",
        explanation: "",
        hint: "Germany won 33 medals at the 2024 Summer Olympics.",
        date: "2025-10-15",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🏅%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many articles are there in the English Wikipedia as of October 2025?",
        answer: 7075000,
        category: "",
        explanation: "",
        hint: "There are around 2 million articles about individual people on English Wikipedia.",
        date: "2025-10-16",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️📖%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many bananas were imported to the United Kingdom in 2023?",
        answer: 4900000000,
        category: "",
        explanation: "",
        hint: "The population of the United Kingdom was around 69 million in 2023.",
        date: "2025-10-17",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍌%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many public high schools are there in the United States?",
        answer: 23810,
        category: "",
        explanation: "",
        hint: "In 2007, 4.3 million babies were born in the United States",
        date: "2025-10-18",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🏫%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Starbucks stores are there worldwide?",
        answer: 41097,
        category: "",
        explanation: "",
        hint: "The revenue of Starbucks in 2024 was around $36 billion worldwide.",
        date: "2025-10-19",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️☕️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many students were enrolled at Harvard University in the fall of 2024?",
        answer: 24519,
        category: "",
        explanation: "",
        hint: "Harvard has around 420,000 living alumni.",
        date: "2025-10-20",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🎓%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many cars has Mercedes-Benz sold in the United States in 2024?",
        answer: 324528,
        category: "",
        explanation: "",
        hint: "In 2024, Tesla's US car sales totaled around 630,000.",
        date: "2025-10-21",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚖%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many years have passed since the Great Pyramid of Giza was completed?",
        answer: 4575,
        category: "",
        explanation: "",
        hint: "We live closer in time to Julius Caesar than he lived to the construction of the Great Pyramid.",
        date: "2025-10-22",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🐪%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many police officers are there in Australia?",
        answer: 57539,
        category: "",
        explanation: "",
        hint: "The population of Australia was around 19 million in 2000.",
        date: "2025-10-23",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️👮‍♀️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many students graduated from medical school in the United Kingdom in 2024?",
        answer: 9374,
        category: "",
        explanation: "",
        hint: "There are about 3.2 practicing doctors per 1,000 people in the UK.",
        date: "2025-10-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🥼%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new electric cars/plug-in hybrids were sold in the United States in 2024?",
        answer: 1560000,
        category: "",
        explanation: "",
        hint: "Tesla accounted for 41% of all electric/plug-in hybrid US car sales in 2024.",
        date: "2025-10-25",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️⚡️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did Uber make from ridesharing services in 2024?",
        answer: 25000000000,
        category: "",
        explanation: "",
        hint: "Around 11.3 billion trips were faciliated by Uber in 2024, however this number also includes food delivery orders.",
        date: "2025-10-26",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚖%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many buildings had a height of 200 meters or more at the end of 2024?",
        answer: 2519,
        category: "",
        explanation: "",
        hint: "As of October 2025, New York City had 101 buildings with a height of 200 meters or more.",
        date: "2025-10-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🗼%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much US dollars does it cost to launch one kilogram to low Earth orbit onboard Falcon 9?",
        answer: 3175,
        category: "",
        explanation: "",
        hint: "The list price for a dedicated Falcon 9 rocket launch is $69.85 million.",
        date: "2025-10-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚀%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many babies were born in Germany on December 24, 2024?",
        answer: 1333,
        category: "",
        explanation: "",
        hint: "December 24 saw 29% fewer babies born than December 23, 2024.",
        date: "2025-10-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️👶%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Jews live in the European Union?",
        answer: 794100,
        category: "",
        explanation: "",
        hint: "There are roughly 30 times more Muslims than Jews living in the EU.",
        date: "2025-10-30",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🕍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new cars did Audi sell globally in 2024?",
        answer: 1671218,
        category: "",
        explanation: "",
        hint: "The largest market for Audi was China which accounted for 650,000 car sales in 2024.",
        date: "2025-10-31",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚙%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many of the least populous UN member states must be combined to match China’s population?",
        answer: 150,
        category: "",
        explanation: "",
        hint: "74 UN member states have a population of under 5 million.",
        date: "2025-11-01",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🌎%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did the LEGO Group (toys) make in 2024?",
        answer: 10080000000,
        category: "",
        explanation: "",
        hint: "The LEGO Group made a net profit of around $2 billion in 2024.",
        date: "2025-11-02",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🧱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people watched the Apollo 11 moon landing live on TV?",
        answer: 650000000,
        category: "",
        explanation: "",
        hint: "The worldwide population in 1969 was around 3.62 billion people.",
        date: "2025-11-03",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚀%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many passengers passed through the gates of the Prague Airport in 2024?",
        answer: 16350000,
        category: "",
        explanation: "",
        hint: "1.4 million passengers used the direct flights between Prague and London in 2024.",
        date: "2025-11-04",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🛫%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new smartphones did Samsung sell worldwide in 2024?",
        answer: 222900000,
        category: "",
        explanation: "",
        hint: "Samsung’s US smartphone market share was around 24% in 2024.",
        date: "2025-11-05",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many macadamia nuts are harvested each year worldwide?",
        answer: 35000000000,
        category: "",
        explanation: "",
        hint: "In 2023, US per-capita consumption was about 12 macadamia nuts.",
        date: "2025-11-06",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🧑‍🌾%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people voted for Trump in the 2024 US presidential election?",
        answer: 77302580,
        category: "",
        explanation: "",
        hint: "Trump received 6.11 million votes in Florida alone.",
        date: "2025-11-07",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🇺🇸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many police officers work for the New York City Police Department?",
        answer: 33000,
        category: "",
        explanation: "",
        hint: "New York City had around 8.5 million residents as of 2024.",
        date: "2025-11-08",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️👮‍♂️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did Nike make in 2024?",
        answer: 51400000000,
        category: "",
        explanation: "",
        hint: "In 2024, footwear revenue made up around 70% of Nike's total revenue.",
        date: "2025-11-09",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️👟%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many pharmacies are there in Russia?",
        answer: 81700,
        category: "",
        explanation: "",
        hint: "Russia had a population of around 144 million in 2024.",
        date: "2025-11-10",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️💊%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many McDonald's restaurants are there in Australia?",
        answer: 1068,
        category: "",
        explanation: "",
        hint: "There are 172 McDonald's restaurants in New Zealand.",
        date: "2025-11-11",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍟%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new bicycles were sold in Germany in 2024?",
        answer: 3850000,
        category: "",
        explanation: "",
        hint: "Around 53% of bicycles sold in Germany in 2024 were e-bikes.",
        date: "2025-11-12",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚴‍♀️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many horses and ponies are there in the United Kingdom?",
        answer: 900000,
        category: "",
        explanation: "",
        hint: "There were around 2.1 million horses in Great Britain in 1920.",
        date: "2025-11-13",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🐴%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new iPads were sold by Apple in 2024?",
        answer: 57000000,
        category: "",
        explanation: "",
        hint: "iPad share of tablet shipments in 2024 was around 39%.",
        date: "2025-11-14",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍏%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people could live in the United States if it were as densely populated as New York City?",
        answer: 103000000000,
        category: "",
        explanation: "",
        hint: "US land area is about 9.15 million km² (≈3.53 million mi²).",
        date: "2025-11-15",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🇺🇸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many watches did Rolex produce in 2024?",
        answer: 1176000,
        category: "",
        explanation: "",
        hint: "Rolex made around $12 billion in revenue in 2024.",
        date: "2025-11-16",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🇨🇭%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many weddings took place in France in 2024?",
        answer: 247000,
        category: "",
        explanation: "",
        hint: "There were around 130,000 divorces in France in 2022.",
        date: "2025-11-17",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many European-born immigrants live in the United States?",
        answer: 4700000,
        category: "",
        explanation: "",
        hint: "Europeans made up 75% of all US immigrants in 1960, but only 10% by 2022.",
        date: "2025-11-18",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🇺🇸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people visited the Eiffel Tower’s observation platforms in 2024?",
        answer: 6300000,
        category: "",
        explanation: "",
        hint: "There are three public elevators that go from the ground to the observation levels.",
        date: "2025-11-19",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🗼%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many children aged 10 or younger live in the world today?",
        answer: 1450000000,
        category: "",
        explanation: "",
        hint: "15% of the Canadian population was aged 0-14 in 2024.",
        date: "2025-11-20",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e👨‍👨‍👦%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new cars were sold in Russia in 2024?",
        answer: 1550000,
        category: "",
        explanation: "",
        hint: "Around 55–60% of all new cars sold in Russia in 2024 were produced in China, up from 7% in 2021.",
        date: "2025-11-21",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many dermatologists worked in Germany in 2024?",
        answer: 6640,
        category: "",
        explanation: "",
        hint: "Roughly 77% of dermatologists in Germany practiced in ambulatory settings.",
        date: "2025-11-22",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e👨‍⚕️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people live south of the equator?",
        answer: 1100000000,
        category: "",
        explanation: "",
        hint: "Indonesia, Brazil, DR Congo, Tanzania and South Africa all have more than 50 million people living south of the equator.",
        date: "2025-11-23",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🌎%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many tennis courts were there in the United States in 2010?",
        answer: 270000,
        category: "",
        explanation: "",
        hint: "Around 117,000 tennis courts are at organized facilities like tennis clubs and schools.",
        date: "2025-11-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🎾%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did LVMH Moët Hennessy Louis Vuitton make in the first half of 2025?",
        answer: 46800000000,
        category: "",
        explanation: "",
        hint: "LVMH is the second largest company by market capitalization in the EU.",
        date: "2025-11-25",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️👜%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many practising lawyers are there in Canada?",
        answer: 106766,
        category: "",
        explanation: "",
        hint: "Canada's total population was appx. 30.8 million in 2000.",
        date: "2025-11-26",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️👩‍💼%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many cans of their energy drink did Red Bull sell in 2024?",
        answer: 12670000000,
        category: "",
        explanation: "",
        hint: "Red Bull had a net income of €650 million in 2018.",
        date: "2025-11-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️⚡️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How large is the total cryptocurrency market cap in US dollars as of November 27, 2025?",
        answer: 3200000000000,
        category: "",
        explanation: "",
        hint: "Nvidia, Apple, Alphabet (Google), and Microsoft each individually have a larger market cap than all crypto combined.",
        date: "2025-11-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️💸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many students are currently enrolled in medical school in Germany?",
        answer: 117916,
        category: "",
        explanation: "",
        hint: "There are 76,482 female students enrolled in medical school which in Germany has a minimum length of 6.25 years.",
        date: "2025-11-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef2f2'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🏥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people visited the St. Peter’s Basilica in 2024?",
        answer: 14640000,
        category: "",
        explanation: "",
        hint: "In 2024, the Vatican Museums were visited by 6.8 million people.",
        date: "2025-11-30",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef2f2'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🇻🇦%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did Barbie (2023) make at the box office?",
        answer: 1447138421,
        category: "",
        explanation: "",
        hint: "The highest grossing movie of all time was Avatar (2009) and made twice as much box office revenue.",
        date: "2025-12-01",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍿%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many passengers fly in and out of German airports every day?",
        answer: 579000,
        category: "",
        explanation: "",
        hint: "Around 61.6 million passengers traveled through Frankfurt Airport in 2024.",
        date: "2025-12-02",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e✈️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many public swimming pools are there in France?",
        answer: 4135,
        category: "",
        explanation: "",
        hint: "There are about 11.4 million people in France under 15 years old.",
        date: "2025-12-03",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🏊‍♀️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Americans have been either Boy Scouts or Girl Scouts since 1910?",
        answer: 180000000,
        category: "",
        explanation: "",
        hint: "In 1970, there were 4.7 million active Boy Scouts.",
        date: "2025-12-04",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🧗‍♀️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many correctional officers and jailers work in the United States?",
        answer: 361000,
        category: "",
        explanation: "",
        hint: "In spring 2024 there were about 1.8 million people incarcerated in the US.",
        date: "2025-12-05",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️👮‍♂️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many paying subscribers does Netflix have across Europe, Middle East & Africa?",
        answer: 101140000,
        category: "",
        explanation: "",
        hint: "Netflix had a market capitalization of around $425 billion on Dec 5, 2025.",
        date: "2025-12-06",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️📺%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people in the European Union were daily cigarette smokers in 2019?",
        answer: 70000000,
        category: "",
        explanation: "",
        hint: "Finland and Sweden were the only EU countries where less than 10% of the population were daily smokers in 2019.",
        date: "2025-12-07",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚬%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many students graduated from Law School in the United States in 2024?",
        answer: 38937,
        category: "",
        explanation: "",
        hint: "In 2000, about 4.06 million children were born in the United States.",
        date: "2025-12-08",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️⚖️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Teslas were sold in the United States from 2015 through 2024?",
        answer: 2805742,
        category: "",
        explanation: "",
        hint: "In 2024, Tesla's US car sales totaled around 630,000.",
        date: "2025-12-09",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many athletes have participated in the Summer or Winter Olympics between 1896 and 2012?",
        answer: 125051,
        category: "",
        explanation: "",
        hint: "10,518 athletes competed at the 2012 Summer Olympics in London.",
        date: "2025-12-10",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🏊‍♀️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many practicing veterinarians are there in Germany?",
        answer: 33845,
        category: "",
        explanation: "",
        hint: "About 11,400 veterinarians are self-employed in Germany.",
        date: "2025-12-11",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🐈%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many operational helicopters are there worldwide?",
        answer: 69728,
        category: "",
        explanation: "",
        hint: "Germany has around 890 civil helicopters and 361 military ones.",
        date: "2025-12-12",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚁%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many gas stations are there in the United States?",
        answer: 109174,
        category: "",
        explanation: "",
        hint: "There are around 229 million licensed drivers in the US.",
        date: "2025-12-13",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️⛽️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many ATMs are there in the United States?",
        answer: 530000,
        category: "",
        explanation: "",
        hint: "There are roughly 44,000 ATMs (cash machines) in the United Kingdom.",
        date: "2025-12-14",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️💳%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many elevators are there in New York City?",
        answer: 70000,
        category: "",
        explanation: "",
        hint: "The iconic Empire State Building has 73 elevators.",
        date: "2025-12-15",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🛗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many kilometers are driven per day by motor vehicles on US roads?",
        answer: 14460000000,
        category: "",
        explanation: "",
        hint: "In the UK, 12,700 km (≈ 7,870 miles) are driven annually per licensed driver.",
        date: "2025-12-16",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many hotel rooms are there in London?",
        answer: 158000,
        category: "",
        explanation: "",
        hint: "There were around 705,000 hotel rooms in the UK in 2024.",
        date: "2025-12-17",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🛎️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many bridges longer than 20 feet are there on public roads in the United States?",
        answer: 620000,
        category: "",
        explanation: "",
        hint: "California has 25,975 bridges 20 feet or longer on public roads.",
        date: "2025-12-18",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🌉%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many direct employees does Amazon have in the United States?",
        answer: 1100000,
        category: "",
        explanation: "",
        hint: "Walmart is the biggest employer in the US with 1.6 million employees.",
        date: "2025-12-19",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🛒%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many high school students took the SAT standardized test in 2024?",
        answer: 1970000,
        category: "",
        explanation: "",
        hint: "Around 21,000 students were admitted to a first-year Ivy League undergraduate class in 2024.",
        date: "2025-12-20",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🇺🇸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many US dollars were spent by NASA in 2024?",
        answer: 25000000000,
        category: "",
        explanation: "",
        hint: "While most of NASA's budget goes to contractors, NASA also employs 18,150 federal civilian employees.",
        date: "2025-12-21",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚀%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many commercial flights departed the US for Europe in 2024?",
        answer: 180000,
        category: "",
        explanation: "",
        hint: "The New York (JFK) to London (LHR) route alone carried roughly 1.6 million passengers in 2024.",
        date: "2025-12-22",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🛬%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many architects and interior designers are there in the United States?",
        answer: 211000,
        category: "",
        explanation: "",
        hint: "There are around 12,000 architects licensed in Florida.",
        date: "2025-12-23",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🏛️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people worldwide celebrate their 50th birthday today (December 24, 2025)?",
        answer: 275000,
        category: "",
        explanation: "",
        hint: "There were 3.1 million births in the US in all of 1975.",
        date: "2025-12-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎄%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people worldwide live within 10 km (6.2 miles) of a coast?",
        answer: 1160000000,
        category: "",
        explanation: "",
        hint: "Around 30% of the global population lives within 50 km of a coast.",
        date: "2025-12-25",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🌊%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many households worldwide owned a TV in 1970?",
        answer: 301000000,
        category: "",
        explanation: "",
        hint: "There were around 1.75 billion TV-owning households in 2023.",
        date: "2025-12-26",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e📺%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much was Roblox’s parent company worth in US dollars on December 26, 2025?",
        answer: 57700000000,
        category: "",
        explanation: "",
        hint: "Roblox made $1.36 billion in revenue in the third quarter of 2025, growing 48% year-over-year.",
        date: "2025-12-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎮%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people lived in the United States without being US citizens in 2023?",
        answer: 22000000,
        category: "",
        explanation: "",
        hint: "There are more undocumented/unauthorized non-citizens than documented non-citizens in the US.",
        date: "2025-12-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🇺🇸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many students in the European Union were studying law, business, or administration in 2023?",
        answer: 4100000,
        category: "",
        explanation: "",
        hint: "In 2023, the EU had a total of 18.8 million tertiary education students.",
        date: "2025-12-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎓%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people worldwide live at ≥1,500 meters above sea level?",
        answer: 500000000,
        category: "",
        explanation: "",
        hint: "Around 138 million people live between 2,000–2,499 meters.",
        date: "2025-12-30",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🗻%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did fireworks sales for New Year's Eve generate in Germany in 2024?",
        answer: 232000000,
        category: "",
        explanation: "",
        hint: "A survey found that only about 22% of people in Germany plan to set off their own fireworks on New Year's Eve.",
        date: "2025-12-31",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎆%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did UK gym and fitness centers earn from memberships in 2024?",
        answer: 6630000000,
        category: "",
        explanation: "",
        hint: "In 2021, 62.9% of the population of England and Wales was between 16 and 64 years old.",
        date: "2026-01-01",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🏋️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many gigabytes of mobile data are used in Germany per day?",
        answer: 26200000,
        category: "",
        explanation: "",
        hint: "Streaming a 20-minute YouTube video in 1080p typically uses about 1.2-1.5 GB of data.",
        date: "2026-01-02",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new cars were produced in the European Union in 2024?",
        answer: 11400000,
        category: "",
        explanation: "",
        hint: "The EU exported ~1.13 million more new cars than it imported in 2024",
        date: "2026-01-03",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🚙%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people travelled through the Channel Tunnel connecting the UK with France in 2022?",
        answer: 15900000,
        category: "",
        explanation: "",
        hint: "In addition to the passengers of the high-speed Eurostar trains, 2.12 million vehicles with its passengers were transported by 'Le Shuttle'.",
        date: "2026-01-04",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🚝%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many US dollars did YouTube pay out to creators and artists on its platform in 2024?",
        answer: 32000000000,
        category: "",
        explanation: "",
        hint: "YouTube's standard revenue share model gives creators 55% of ad/subscription revenue.",
        date: "2026-01-05",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many US soldiers and other active-duty troops are stationed outside the US?",
        answer: 177000,
        category: "",
        explanation: "",
        hint: "Ten countries, led by Japan, Germany and South Korea, host over 95% of all active-duty US troops overseas.",
        date: "2026-01-06",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🪖%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many paid subscribers do YouTube Music and YouTube Premium have as of 2025?",
        answer: 125000000,
        category: "",
        explanation: "",
        hint: "YouTube’s standard individual Premium plan costs about $1.65/month in India but $13.99/month in the US.",
        date: "2026-01-07",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many total hours were spent playing Fortnite in 2024?",
        answer: 14330000000,
        category: "",
        explanation: "",
        hint: "At 00:00 UTC on January 7, 2026, roughly 1.28 million people were playing Fortnite.",
        date: "2026-01-08",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎮%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many liters of beer were sold for consumption in Germany in 2024?",
        answer: 6800000000,
        category: "",
        explanation: "",
        hint: "Germany-based breweries exported around 1.5 billion liters (≈400 million gallons) in 2024.",
        date: "2026-01-09",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🍺%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many cows are kept for milk production in the United States?",
        answer: 9300000,
        category: "",
        explanation: "",
        hint: "In the US, an average dairy cow produces about 24,000 lb of milk per year (≈ 2,800 gallons / 10,600 liters).",
        date: "2026-01-10",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🐄%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many kiwi fruits were imported into the United States in 2024?",
        answer: 1200000000,
        category: "",
        explanation: "",
        hint: "76% of kiwis consumed in the US were imported, and Germany alone imported more kiwis than the US.",
        date: "2026-01-11",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🥝%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many ship crossings of the Suez Canal took place in 2019?",
        answer: 18880,
        category: "",
        explanation: "",
        hint: "The maximum speed limit in the 193-km-long canal is 7.65 knots (≈14.2 km/h).",
        date: "2026-01-12",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🛳️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many hours per day were spent in total watching YouTube on TV screens in 2024?",
        answer: 1000000000,
        category: "",
        explanation: "",
        hint: "In the UK, people spent 39 minutes on YouTube per day in 2024, with 16 minutes of this via the household's TV set.",
        date: "2026-01-13",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e📺%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many vehicles crossed the Golden Gate Bridge in 2025?",
        answer: 33755762,
        category: "",
        explanation: "",
        hint: "In 1950, around 25,518 vehicles crossed the bridge on an average day.",
        date: "2026-01-14",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🌉%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many kilograms of bananas did Germany import in 2023?",
        answer: 1378360000,
        category: "",
        explanation: "",
        hint: "Nearly all bananas are shipped in 18–18.5 kg boxes, each containing 100–120 bananas depending on size and grade",
        date: "2026-01-15",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🍌%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many movies with more than 1000 user ratings are listed on the movie review platform IMDb? worldwide celebrate their 50th birthday today (December 24, 2025)?",
        answer: 275000,
        category: "",
        explanation: "",
        hint: "There were 3.1 million births in the US in all of 1975.",
        date: "2026-12-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎄%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many teachers worked in schools in Germanyin the 2023/24 school year?",
        answer: 3175,
        category: "",
        explanation: "",
        hint: "The list price for a dedicated Falcon 9 rocket launch is $69.85 million.",
        date: "2026-12-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚀%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did LVMH (make in 2024",
        answer: 4575,
        category: "",
        explanation: "",
        hint: "In 2024, Tesla's US car sales totaled around 630,000.",
        date: "2026-12-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🚖%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many employees does Walmart have in the United States as of 2024?",
        answer: 1600000,
        category: "",
        explanation: "",
        hint: "The population of the United Kingdom was around 69 million in 2023.",
        date: "2026-12-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🛒%3c/text%3e%3c/svg%3e"
    }
];

// DOM elements
const questionText = document.getElementById('question-text');
const questionCategory = document.getElementById('question-category');
const questionImage = document.getElementById('question-image');
const questionImageContainer = document.getElementById('question-image-container');
const guessCounter = document.getElementById('guess-counter');
const hintContainer = document.getElementById('hint-container');
const hintText = document.getElementById('hint-text');
const hintBody = document.getElementById('hint-body');
const questionMeta = document.getElementById('question-meta');
const sourceBtn = document.getElementById('source-btn');
const sourceModal = document.getElementById('source-modal');
const sourceText = document.getElementById('source-text');
const closeSourceBtn = document.getElementById('close-source-btn');
const gameResult = document.getElementById('game-result');
const resultMessage = document.getElementById('result-message');
const resultEmoji = document.getElementById('result-emoji');
const correctAnswer = document.getElementById('correct-answer');
const guessesContainer = document.getElementById('guesses-container');
const guessInput = document.getElementById('guess-input');
const confidenceInput = document.getElementById('confidence-input');
const confidenceButton = document.getElementById('confidence-button');
const confidenceMenu = document.getElementById('confidence-menu');
const confidenceWrapper = document.querySelector('.confidence-wrapper');
const submitBtn = document.getElementById('submit-btn');
const quickButtons = document.querySelectorAll('.quick-btn');
const sendIcon = `\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M2 21L23 12L2 3v7l12 2L2 14v7z"/>
</svg>`;
const inputSection = document.getElementById('input-section');
const newGameSection = document.getElementById('new-game-section');
const gameContainer = document.querySelector('.game-container');

function resetConfidenceInput() {
    if (confidenceInput) confidenceInput.value = '';
    if (confidenceButton) confidenceButton.textContent = '..%';
    if (confidenceMenu) {
        confidenceMenu.querySelectorAll('.selected').forEach(btn => btn.classList.remove('selected'));
    }
}

function updateFooterPositioning() {
    const sections = [inputSection, newGameSection];
    let shouldAddPadding = false;
    const isMobileView = isSmallDevice();

    sections.forEach(section => {
        if (section) {
            section.classList.remove('sticky-footer');
        }
    });

    sections.forEach(section => {
        if (!section) return;
        if (section.offsetParent === null) return;
        if (isMobileView) {
            section.classList.add('sticky-footer');
            shouldAddPadding = true;
            return;
        }
        const rect = section.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            section.classList.add('sticky-footer');
            shouldAddPadding = true;
        }
    });

    if (gameContainer) {
        gameContainer.classList.toggle('has-sticky-footer', shouldAddPadding);
    }
}

let footerUpdateScheduled = false;
function scheduleFooterPositioningUpdate() {
    if (footerUpdateScheduled) return;
    footerUpdateScheduled = true;
    requestAnimationFrame(() => {
        footerUpdateScheduled = false;
        updateFooterPositioning();
    });
}
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
const strategyTipsBtn = document.getElementById('strategy-tips-btn');
// Hint elements
const hintModalBtn = document.getElementById('hint-modal-btn');
const questionsList = document.getElementById('questions-list');
const closeHelpBtn = document.getElementById('close-help-btn');
const closeStatsBtn = document.getElementById('close-stats-btn');
const closeQuestionsBtn = document.getElementById('close-questions-btn');
const shareBtn = document.getElementById('share-btn');
const shareStatsBtn = document.getElementById('share-stats-btn');
const medianFirstGuessText = document.getElementById('median-first-guess-text');
const firstGuessPercentileText = document.getElementById('first-guess-percentile-text');
const calibrationCheckboxes = document.querySelectorAll('.prob-calibration-checkbox');
const firstGuessCheckbox = document.getElementById('first-guess-checkbox');
const calibrationChart = document.getElementById('calibration-chart');
const calibrationTooltip = document.getElementById('calibration-tooltip');
const calibrationNote = document.querySelector('.calibration-note');
const commentsBtn = document.getElementById('comments-btn');
const commentsSection = document.getElementById('comments-section');
const commentsBackBtn = document.getElementById('comments-back-btn');
const commentsList = document.getElementById('comments-list');
const commentInput = document.getElementById('comment-input');
const commentSubmitBtn = document.getElementById('comment-submit-btn');
const commentCountEl = document.getElementById('comment-count');


// Confidence tooltip
function initConfidenceTooltip() {
    if (!confidenceWrapper) return;
    const dismissed = localStorage.getItem('confidenceTooltipDismissed');
    if (dismissed === 'true') return;
    confidenceWrapper.classList.add('show-tooltip');
    const hideTooltip = () => {
        confidenceWrapper.classList.remove('show-tooltip');
        localStorage.setItem('confidenceTooltipDismissed', 'true');
        document.removeEventListener('mousedown', hideTooltip);
        document.removeEventListener('keydown', hideTooltip);
        document.removeEventListener('touchstart', hideTooltip);
    };
    document.addEventListener('mousedown', hideTooltip, { once: true });
    document.addEventListener('keydown', hideTooltip, { once: true });
    document.addEventListener('touchstart', hideTooltip, { once: true });
}

// Initialize game
function initGame() {
    // Initialize Supabase first
    initSupabase();

    loadStats();
    loadCompletedQuestions();
    loadCalibrationSetting();
    initConfidenceTooltip();

    // If URL has a specific question date, navigate to it first
    let navigatedFromURL = false;
    const initialRouteDate = parseURL();
    if (initialRouteDate) {
        navigatedFromURL = navigateToQuestion(initialRouteDate);
    }

    // If no route navigation occurred, try restoring saved state; else start new
    let restoredFromSave = false;
    if (!navigatedFromURL) {
        restoredFromSave = loadCurrentGameState();
        if (!restoredFromSave) {
            startNewGame();
        }
    }

    setupEventListeners();
    // Always initialize routing; allow it to handle future navigations
    initRouting(false);
    updateFooterPositioning();
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
            updateFooterPositioning();
        };
        testImg.onerror = function() {
            // Image failed to load, hide container
            console.log('Failed to load image:', question.image);
            questionImageContainer.style.display = 'none';
            updateFooterPositioning();
        };
        testImg.src = question.image;
        updateFooterPositioning();
    } else {
        questionImageContainer.style.display = 'none';
        updateFooterPositioning();
    }

    updateCommentCount();
    subscribeToComments(question.date);
    updateFooterPositioning();
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
    clearGuesses();
    
    // Update page title
    updatePageTitle(currentQuestion);
    
    // Reset display elements
    guessCounter.style.display = 'block';
    hideHint();
    gameResult.style.display = 'none';
    if (questionMeta) {
        questionMeta.style.display = 'none';
    }
    inputSection.style.display = 'block';
    newGameSection.style.display = 'none';
    shareBtn.style.display = 'none'; // Hide share button for new game
    updateFooterPositioning();
    // Nudge attention to the counter on initial start (mobile only)
    triggerShake(guessCounter);
    
    // Reset input
    guessInput.value = '';
    guessInput.disabled = false;
    submitBtn.disabled = false;

    // Auto-focus only on non-touch devices (desktop)
    if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
        guessInput.focus();
    }

    // Reset confidence input for new game
    resetConfidenceInput();
    updateConfidenceInputVisibility();

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
    const confidenceValue = confidenceInput ? parseInt(confidenceInput.value) : null;
    let confPercent = null;
    if (calibrationEnabled && confidenceInput) {
        const sanitized = clampConfidencePercent(confidenceValue);
        if (sanitized !== null) {
            confPercent = sanitized;
        }
    }

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
    
    // Define these variables for all cases (needed for Supabase save)
    let isHigh = false;
    let isClose = false;
    
    if (isCorrect) {
        gameWon = true;
        gameOver = true;
        showFeedback(currentGuess - 1, 'correct', 'WIN');
    } else {
        isHigh = guessValue > currentQuestion.answer;
        
        // Check if guess is within 50% (close but not correct)
        const closeTolerance = currentQuestion.answer * 0.5;
        isClose = Math.abs(guessValue - currentQuestion.answer) <= closeTolerance;
        
        if (isClose) {
            showFeedback(currentGuess - 1, 'close', isHigh ? '↓' : '↑');
        } else {
            showFeedback(currentGuess - 1, isHigh ? 'high' : 'low', isHigh ? '↓' : '↑');
        }

        // Tutorial: auto-show tooltip on first-ever misses
        try {
            const guessRows = guessesContainer.querySelectorAll('.guess-row');
            const currentRow = guessRows[currentGuess - 1];
            const feedbackButton = currentRow.querySelector('.feedback-button');

            if (isClose) {
                const shownClose = localStorage.getItem('fermiTooltipTutorialCloseShown');
                if (!shownClose) {
                    feedbackButton.classList.add('show-tooltip');
                    setTimeout(() => feedbackButton.classList.remove('show-tooltip'), 3200);
                    localStorage.setItem('fermiTooltipTutorialCloseShown', '1');
                }
            } else {
                const shownBasic = localStorage.getItem('fermiTooltipTutorialBasicShown');
                if (!shownBasic) {
                    feedbackButton.classList.add('show-tooltip');
                    setTimeout(() => feedbackButton.classList.remove('show-tooltip'), 3200);
                    localStorage.setItem('fermiTooltipTutorialBasicShown', '1');
                }
            }
        } catch (e) {
            // ignore storage errors
        }
        
        if (currentGuess >= maxGuesses) {
            gameOver = true;
        }
    }
    
    // Clear input
    guessInput.value = '';

    if (calibrationEnabled && confidenceInput) {
        if (confPercent !== null) {
            stats.calibrationData.push({
                confidence: confPercent / 100,
                correct: isCorrect,
                guessNumber: currentGuess
            });
            saveStats();
        }

    }
    
    // Save current game state after each guess
    saveCurrentGameState();
    
    // Save guess to Supabase
    if (supabaseClient && currentUserId && currentQuestion) {
        const guessData = {
            user_id: currentUserId,
            question_date: currentQuestion.date,
            guess_number: currentGuess,
            value: guessValue,
            is_correct: isCorrect,
            is_close: isClose,
            is_high: isHigh,
            confidence_percent: confPercent,
            timestamp: new Date().toISOString()
        };
        
        // Save asynchronously without blocking
        supabaseClient
            .from('guesses')
            .insert(guessData)
            .then(({ error }) => {
                if (error) console.error('Error saving guess to Supabase:', error);
                else console.log('Guess saved to Supabase');
            })
            .catch(err => console.error('Error with Supabase guess save:', err));
    }
    
    // Show hint after 2nd guess if game not won
    if (currentGuess === 2 && !gameWon && currentQuestion.hint) {
        showHint();
    }
    
    // Check if game is over
    if (gameOver) {
        endGame();
    }

    resetConfidenceInput();
    // Hide confidence input after first guess if needed
    updateConfidenceInputVisibility();
    applySubmitButtonState();
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
        feedbackButton.textContent = symbol;
    }
    
    feedbackButton.className = `feedback-button ${type}`;

    // Set tooltip titles for low/high feedback
    if (type === 'low') {
        feedbackButton.setAttribute('data-tooltip', 'Too low! You need to go higher ↑');
        feedbackButton.title = '';
    } else if (type === 'high') {
        feedbackButton.setAttribute('data-tooltip', 'Too high! You need to go lower ↓');
        feedbackButton.title = '';
    } else if (type === 'close') {
        // Use the direction symbol to choose appropriate text
        if (symbol === '↑') {
            feedbackButton.setAttribute('data-tooltip', 'Too low, but within ±50% of the correct answer!');
        } else if (symbol === '↓') {
            feedbackButton.setAttribute('data-tooltip', 'Too high, but within ±50% of the correct answer!');
        } else {
            feedbackButton.removeAttribute('data-tooltip');
        }
        feedbackButton.title = '';
    } else if (type === 'correct') {
        feedbackButton.setAttribute('data-tooltip', "You're within ±20% of the correct answer!");
        feedbackButton.title = '';
    } else {
        feedbackButton.removeAttribute('data-tooltip');
        feedbackButton.title = '';
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

// Detect small devices for conditional animations
function isSmallDevice() {
    if (typeof window.matchMedia === 'function') {
        return window.matchMedia('(max-width: 768px)').matches;
    }
    return (window.innerWidth || document.documentElement.clientWidth || 0) <= 768;
}

// Briefly add a 'shake' animation class to an element (mobile only)
function triggerShake(element, durationMs = 500) {
    if (!element || !isSmallDevice()) return;
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), durationMs);
}

// Brief confetti animation when winning a game
function triggerConfetti(durationMs = 1200, particleCount = 80) {
    const onSmall = isSmallDevice();
    const total = onSmall ? Math.min(particleCount, 40) : particleCount;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10000';

    const ctx = canvas.getContext('2d');
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    function resizeCanvas() {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        canvas.width = Math.floor(vw * dpr);
        canvas.height = Math.floor(vh * dpr);
        canvas.style.width = `${vw}px`;
        canvas.style.height = `${vh}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    document.body.appendChild(canvas);

    const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22'];
    const width = () => canvas.clientWidth;
    const height = () => canvas.clientHeight;

    const particles = [];
    for (let i = 0; i < total; i++) {
        const size = 6 + Math.random() * 6; // 6-12px (slightly larger)
        particles.push({
            x: Math.random() * width(),
            y: -10 - Math.random() * 60,
            vx: (Math.random() - 0.5) * 260, // px/s
            vy: 120 + Math.random() * 240, // px/s
            ax: (Math.random() - 0.5) * 40,   // lateral drift
            ay: 540,                            // gravity px/s^2
            size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 6, // rad/s
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    let running = true;
    const start = performance.now();
    let last = start;

    function frame(now) {
        if (!running) return;
        const elapsed = now - start;
        const dt = Math.min(32, now - last) / 1000; // clamp dt to avoid big jumps
        last = now;

        ctx.clearRect(0, 0, width(), height());
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            // update physics
            p.vx += p.ax * dt;
            p.vy += p.ay * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.rotationSpeed * dt;

            // draw
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.6);
            ctx.restore();
        }

        if (elapsed < durationMs + 400) {
            requestAnimationFrame(frame);
        } else {
            cleanup();
        }
    }

    function cleanup() {
        running = false;
        try { document.body.removeChild(canvas); } catch (e) { /* noop */ }
    }

    // Resize handler for orientation changes during the brief animation
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize, { passive: true });
    const stopTimer = setTimeout(() => {
        window.removeEventListener('resize', onResize);
        cleanup();
    }, durationMs + 600);

    if (onSmall) {
        setTimeout(() => requestAnimationFrame(frame), 80);
    } else {
        requestAnimationFrame(frame);
    }
}

// Show hint after 2rd guess
function showHint() {
    if (currentQuestion.hint) {
        hintBody.textContent = currentQuestion.hint;
        guessCounter.style.display = 'none';
        hintContainer.style.display = 'block';
        hintContainer.classList.remove('open');
        if (hintModalBtn) {
            hintModalBtn.setAttribute('aria-expanded', 'false');
        }
        triggerShake(hintContainer);
    }
}

// Hide hint
function hideHint() {
    hintContainer.style.display = 'none';
    hintContainer.classList.remove('open');
    if (hintModalBtn) {
        hintModalBtn.setAttribute('aria-expanded', 'false');
    }
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
        
        // Save completed game to Supabase
        if (supabaseClient && currentUserId) {
            const gameData = {
                question_date: currentQuestion.date,
                question_text: currentQuestion.question,
                correct_answer: currentQuestion.answer,
                won: gameWon,
                total_guesses: currentGuess,
                guesses: savedGuesses,
                completed_at: new Date().toISOString()
            };
            
            saveGameToSupabase(gameData);
        }
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
    if (questionMeta) {
        questionMeta.style.display = 'flex';
    }
    
    // Set result message
    if (gameWon) {
        resultMessage.textContent = `You won!`;
        resultMessage.className = 'result-message won';
        resultEmoji.textContent = '🎉';
        // Brief confetti on win
        triggerConfetti(1200, 80);
    } else {
        resultMessage.textContent = 'You ran out of guesses!';
        resultMessage.className = 'result-message lost';
        resultEmoji.textContent = '🚫';
    }
    
    // Set correct answer
    correctAnswer.innerHTML = `The correct answer was <i>${formatNumber(currentQuestion.answer)}</i>`;
    
    // Average tries inline removed; stats shown in Source modal on demand

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

    // Simple scroll to top to ensure good positioning
    window.scrollTo(0, 0);
    updateFooterPositioning();
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
    
    // Compute Guess Average (count losses as 7 guesses)
    const guessAverageElement = document.getElementById('guess-average');
    if (guessAverageElement) {
        try {
            const completed = completedQuestions || {};
            const games = Object.values(completed);
            const totalGames = games.length;
            if (totalGames === 0) {
                guessAverageElement.textContent = '0';
            } else {
                const totalRatedGuesses = games.reduce((sum, game) => {
                    const won = !!game.won;
                    const guessesUsed = Number(game.guesses) || 0;
                    return sum + (won ? guessesUsed : 7);
                }, 0);
                const average = totalRatedGuesses / totalGames;
                guessAverageElement.textContent = Number.isInteger(average) ? `${average}` : average.toFixed(1);
            }
        } catch (e) {
            guessAverageElement.textContent = '0';
        }
    }
    
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

    updateCalibrationChart();
}

function showCalibrationTooltip(evt, sampleSize, declared, actual) {
    if (!calibrationTooltip) return;
    const x = (evt.clientX || 0) + 10;
    const y = (evt.clientY || 0) + 10;
    calibrationTooltip.style.left = `${x}px`;
    calibrationTooltip.style.top = `${y}px`;
    calibrationTooltip.innerHTML = `Sample Size: ${sampleSize}<br>Declared: ${declared}%<br>Actual: ${Math.round(actual)}%`;
    calibrationTooltip.style.display = 'block';
}

function hideCalibrationTooltip() {
    if (calibrationTooltip) calibrationTooltip.style.display = 'none';
}

function updateCalibrationChart() {
    const svg = calibrationChart;
    if (!svg) return;

    hideCalibrationTooltip();
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const width = svg.viewBox.baseVal?.width || svg.width.baseVal.value || 300;
    const height = svg.viewBox.baseVal?.height || svg.height.baseVal.value || 200;
    svg.setAttribute('overflow', 'visible');

    const firstOnly = firstGuessCheckbox && firstGuessCheckbox.checked;
    let data = stats.calibrationData || [];
    if (firstOnly) {
        data = data.filter(d => d.guessNumber === 1);
    }

    const declaredLevels = [10, 20, 30, 40, 50, 60, 70, 80, 90, MAX_CONFIDENCE_PERCENT];
    const bins = declaredLevels.map(() => ({ total: 0, correct: 0 }));
    data.forEach(d => {
        const confFraction = clampConfidenceFraction(d.confidence);
        if (confFraction === null) return;
        const confPercent = Math.round(confFraction * 100);
        const normalized = Math.min(
            MAX_CONFIDENCE_PERCENT,
            Math.max(10, Math.round(confPercent / 10) * 10)
        );
        const idx = declaredLevels.indexOf(normalized);
        if (idx >= 0) {
            bins[idx].total++;
            if (d.correct) bins[idx].correct++;
        }
    });

    const paddingLeft = 50,
        paddingBottom = 60,
        paddingTop = 20,
        paddingRight = 20;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const ns = 'http://www.w3.org/2000/svg';

    const hasData = bins.some(bin => bin.total > 0);
    if (calibrationNote) {
        calibrationNote.style.display = hasData ? 'none' : 'block';
    }

    // Axes
    const xAxis = document.createElementNS(ns, 'line');
    xAxis.setAttribute('x1', paddingLeft);
    xAxis.setAttribute('y1', height - paddingBottom);
    xAxis.setAttribute('x2', width - paddingRight);
    xAxis.setAttribute('y2', height - paddingBottom);
    xAxis.setAttribute('stroke', '#ccc');
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS(ns, 'line');
    yAxis.setAttribute('x1', paddingLeft);
    yAxis.setAttribute('y1', height - paddingBottom);
    yAxis.setAttribute('x2', paddingLeft);
    yAxis.setAttribute('y2', paddingTop);
    yAxis.setAttribute('stroke', '#ccc');
    svg.appendChild(yAxis);

    // Diagonal line
    const diag = document.createElementNS(ns, 'line');
    diag.setAttribute('x1', paddingLeft);
    diag.setAttribute('y1', height - paddingBottom);
    diag.setAttribute('x2', width - paddingRight);
    diag.setAttribute('y2', paddingTop);
    diag.setAttribute('stroke', '#eee');
    svg.appendChild(diag);

    // Ticks and labels
    const xTickValues = declaredLevels;
    xTickValues.forEach((value) => {
        const x = paddingLeft + (value / 100) * plotWidth;

        const xTick = document.createElementNS(ns, 'line');
        xTick.setAttribute('x1', x);
        xTick.setAttribute('y1', height - paddingBottom);
        xTick.setAttribute('x2', x);
        xTick.setAttribute('y2', height - paddingBottom + 5);
        xTick.setAttribute('stroke', '#ccc');
        svg.appendChild(xTick);

        const xLabel = document.createElementNS(ns, 'text');
        xLabel.setAttribute('x', x + 2);
        xLabel.setAttribute('y', height - paddingBottom + 20);
        xLabel.setAttribute('text-anchor', 'end');
        xLabel.setAttribute('font-size', '10');
        xLabel.setAttribute('transform', `rotate(-45 ${x} ${height - paddingBottom + 15})`);
        xLabel.textContent = `${value}%`;
        svg.appendChild(xLabel);
    });

    const yTickValues = Array.from(new Set([...declaredLevels, 100]))
        .filter((value) => value !== MAX_CONFIDENCE_PERCENT)
        .sort((a, b) => a - b);
    yTickValues.forEach((value) => {
        const y = height - paddingBottom - (value / 100) * plotHeight;

        const yTick = document.createElementNS(ns, 'line');
        yTick.setAttribute('x1', paddingLeft - 5);
        yTick.setAttribute('y1', y);
        yTick.setAttribute('x2', paddingLeft);
        yTick.setAttribute('y2', y);
        yTick.setAttribute('stroke', '#ccc');
        svg.appendChild(yTick);

        const yLabel = document.createElementNS(ns, 'text');
        yLabel.setAttribute('x', paddingLeft - 8);
        yLabel.setAttribute('y', y + 6);
        yLabel.setAttribute('text-anchor', 'end');
        yLabel.setAttribute('font-size', '10');
        yLabel.textContent = `${value}%`;
        svg.appendChild(yLabel);
    });

    // Calibration points
    bins.forEach((bin, i) => {
        if (!bin.total) return;
        const x = paddingLeft + (declaredLevels[i] / 100) * plotWidth;
        const ratio = bin.correct / bin.total;
        const y = height - paddingBottom - ratio * plotHeight;
        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 3);
        circle.setAttribute('fill', '#3498db');
        const declaredPercent = declaredLevels[i];
        circle.addEventListener('mouseenter', (e) => showCalibrationTooltip(e, bin.total, declaredPercent, ratio * 100));
        circle.addEventListener('mouseleave', hideCalibrationTooltip);
        circle.addEventListener('click', (e) => showCalibrationTooltip(e, bin.total, declaredPercent, ratio * 100));
        circle.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            if (t) showCalibrationTooltip(t, bin.total, declaredPercent, ratio * 100);
        }, { passive: true });
        svg.appendChild(circle);
    });
}

function clampConfidencePercent(value) {
    if (value === null || value === undefined) return null;
    let numeric = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(numeric)) return null;
    if (numeric > MAX_CONFIDENCE_PERCENT && numeric <= 100) {
        numeric = MAX_CONFIDENCE_PERCENT;
    } else if (numeric <= 1 && numeric >= 0) {
        numeric = numeric * 100;
    }
    return Math.max(0, Math.min(MAX_CONFIDENCE_PERCENT, numeric));
}

function clampConfidenceFraction(value) {
    if (value === null || value === undefined) return null;
    let numeric = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(numeric)) return null;
    if (numeric > 1) {
        numeric = numeric / 100;
    }
    return Math.max(0, Math.min(MAX_CONFIDENCE_FRACTION, numeric));
}

function normalizeCalibrationDataEntries(calibrationData) {
    if (!Array.isArray(calibrationData)) return [];
    return calibrationData.map(entry => {
        if (!entry || typeof entry !== 'object') return entry;
        const sanitizedConfidence = clampConfidenceFraction(entry.confidence);
        return sanitizedConfidence === null ? entry : { ...entry, confidence: sanitizedConfidence };
    });
}

// Close modals
function closeModal(modal) {
    modal.style.display = 'none';
}

// Save statistics to localStorage and Supabase
function saveStats() {
    localStorage.setItem('fermiGameStats', JSON.stringify(stats));
    
    // Also save to Supabase
    saveStatsToSupabase(stats);
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
                calibrationData: loadedStats.calibrationData || []
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
                calibrationData: []
            };
        }
    }

    const originalDataString = JSON.stringify(stats.calibrationData || []);
    const normalizedData = normalizeCalibrationDataEntries(stats.calibrationData);
    const normalizedDataString = JSON.stringify(normalizedData);
    stats.calibrationData = normalizedData;
    if (originalDataString !== normalizedDataString) {
        saveStats();
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

function loadCalibrationSetting() {
    const storedCalibration = localStorage.getItem('fermiCalibrationEnabled');
    calibrationEnabled = storedCalibration !== 'false';
    calibrationCheckboxes.forEach(cb => {
        cb.checked = calibrationEnabled;
    });
    const savedFirstOnly = localStorage.getItem('fermiFirstGuessOnly');
    if (firstGuessCheckbox && savedFirstOnly !== null) {
        firstGuessCheckbox.checked = savedFirstOnly === 'true';
    }
    updateConfidenceInputVisibility();
    updateCalibrationChart();
}

function setCalibrationEnabled(enabled) {
    calibrationEnabled = enabled;
    localStorage.setItem('fermiCalibrationEnabled', enabled ? 'true' : 'false');
    calibrationCheckboxes.forEach(cb => {
        cb.checked = enabled;
    });
    updateConfidenceInputVisibility();
}

function updateConfidenceInputVisibility() {
    const firstOnlyActive = firstGuessCheckbox && firstGuessCheckbox.checked;
    const showConfidence = calibrationEnabled && (!firstOnlyActive || currentGuess === 0);

    if (confidenceWrapper) {
        confidenceWrapper.style.display = showConfidence ? '' : 'none';
    }

    if (confidenceInput && confidenceButton) {
        if (showConfidence) {
            const val = confidenceInput.value;
            confidenceButton.textContent = val ? val + '%' : '..%';
        } else {
            resetConfidenceInput();
            confidenceMenu && confidenceMenu.classList.remove('open');
            confidenceButton.setAttribute('aria-expanded', 'false');
        }

        if (isSmallDevice()) {
            confidenceInput.style.display = 'none';
            confidenceButton.style.display = showConfidence ? 'block' : 'none';
        } else {
            confidenceInput.style.display = showConfidence ? 'block' : 'none';
            confidenceButton.style.display = 'none';
            confidenceMenu && confidenceMenu.classList.remove('open');
            confidenceButton.setAttribute('aria-expanded', 'false');
        }
    }
    applySubmitButtonState();
}

function applySubmitButtonState() {
    if (!submitBtn) return;
    if (calibrationEnabled && isSmallDevice()) {
        submitBtn.style.width = '54px';
        submitBtn.innerHTML = sendIcon;
    } else {
        submitBtn.style.width = '';
        submitBtn.textContent = 'Submit';
    }
}

// Save current game state to localStorage and Supabase (per question)
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
    
    // Also save in-progress game state to Supabase
    if (supabaseClient && currentUserId && !gameOver) {
        const gameData = {
            question_date: currentQuestion.date,
            question_text: currentQuestion.question,
            correct_answer: currentQuestion.answer,
            won: gameWon,
            total_guesses: currentGuess,
            guesses: guesses,
            completed_at: null // Not completed yet
        };
        
        // Save asynchronously without blocking
        saveGameToSupabase(gameData);
    }
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
            updateFooterPositioning();
        }

            // Ensure confidence input visibility matches current state
            updateConfidenceInputVisibility();

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

                    // Set tooltip titles for low/high feedback
                    if (guess.feedbackType === 'low') {
                        feedbackButton.setAttribute('data-tooltip', 'Too low! You need to go higher ↑');
                        feedbackButton.title = '';
                    } else if (guess.feedbackType === 'high') {
                        feedbackButton.setAttribute('data-tooltip', 'Too high! You need to go lower ↓');
                        feedbackButton.title = '';
                    } else if (guess.feedbackType === 'close') {
                        if (guess.feedbackSymbol === '↑') {
                            feedbackButton.setAttribute('data-tooltip', 'Too low, but within ±50% of the correct answer!');
                        } else if (guess.feedbackSymbol === '↓') {
                            feedbackButton.setAttribute('data-tooltip', 'Too high, but within ±50% of the correct answer!');
                        } else {
                            feedbackButton.removeAttribute('data-tooltip');
                        }
                        feedbackButton.title = '';
                    } else if (guess.feedbackType === 'correct') {
                        feedbackButton.setAttribute('data-tooltip', "You're within ±20% of the correct answer!");
                        feedbackButton.title = '';
                    } else {
                        feedbackButton.removeAttribute('data-tooltip');
                        feedbackButton.title = '';
                    }
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
    if (questionMeta) {
        questionMeta.style.display = 'flex';
    }
    
    // Set result message
    if (gameWon) {
        resultMessage.textContent = `You won!`;
        resultMessage.className = 'result-message won';
        resultEmoji.textContent = '🎉';
        // Brief confetti on win
        triggerConfetti(1200, 80);
    } else {
        resultMessage.textContent = 'You ran out of guesses!';
        resultMessage.className = 'result-message lost';
        resultEmoji.textContent = '🚫';
    }
    
    // Set correct answer
    correctAnswer.innerHTML = `The correct answer was <i>${formatNumber(currentQuestion.answer)}</i>`;
    
    // Average tries inline removed; stats shown in Source modal on demand

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
    updateFooterPositioning();
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
                        if (questionMeta) {
                            questionMeta.style.display = 'none';
                        }
                        inputSection.style.display = 'block';
                        newGameSection.style.display = 'none';
                        shareBtn.style.display = 'none';
                        // Nudge attention to the counter when selecting question
                        triggerShake(guessCounter);
                        
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

    // Adjust confidence input based on current guess
    updateConfidenceInputVisibility();

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
        if (questionMeta) {
            questionMeta.style.display = 'none';
        }
        inputSection.style.display = 'block';
        newGameSection.style.display = 'none';
        shareBtn.style.display = 'none';
        // Nudge attention for fresh selection
        triggerShake(guessCounter);
        
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

        // Show confidence input for first guess only
        updateConfidenceInputVisibility();
        updateFooterPositioning();
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

    quickButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const increment = parseInt(btn.dataset.value, 10);
            const current = parseInt(guessInput.value.replace(/[^\d]/g, ''), 10) || 0;
            const newValue = current + increment;
            guessInput.value = formatNumber(newValue);
            guessInput.focus();
        });
    });

    // Help button
    helpBtn.addEventListener('click', showHelp);
    
    // Stats button
    statsBtn.addEventListener('click', showStats);
    
    // Strategy tips (mobile link in guess counter)
    if (strategyTipsBtn) {
        strategyTipsBtn.addEventListener('click', showHelp);
    }

    // Hint accordion toggle (mobile)
    if (hintModalBtn && hintContainer) {
        hintModalBtn.addEventListener('click', () => {
            const isOpen = hintContainer.classList.contains('open');
            if (isOpen) {
                hintContainer.classList.remove('open');
                hintModalBtn.setAttribute('aria-expanded', 'false');
            } else {
                hintContainer.classList.add('open');
                hintModalBtn.setAttribute('aria-expanded', 'true');
            }
            scheduleFooterPositioningUpdate();
        });
    }
    
    // Questions history button (question category)
    questionCategory.addEventListener('click', showQuestionsHistory);

    if (calibrationCheckboxes.length) {
        calibrationCheckboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                setCalibrationEnabled(e.target.checked);
            });
        });
    }

    if (firstGuessCheckbox) {
        firstGuessCheckbox.addEventListener('change', () => {
            localStorage.setItem('fermiFirstGuessOnly', firstGuessCheckbox.checked ? 'true' : 'false');
            updateCalibrationChart();
            updateConfidenceInputVisibility();
        });
    }

    // Mobile-only custom confidence dropdown
    if (confidenceButton && confidenceMenu && guessInput) {
        const menuButtons = confidenceMenu.querySelectorAll('button[data-value]');

        const updateSelected = (value) => {
            menuButtons.forEach((btn) => {
                btn.classList.toggle('selected', btn.getAttribute('data-value') === String(value));
            });
        };

        const openMenu = () => {
            confidenceMenu.classList.add('open');
            confidenceButton.setAttribute('aria-expanded', 'true');
            const current = confidenceInput.value || confidenceButton.textContent.replace('%', '');
            updateSelected(current);
        };

        const closeMenu = () => {
            confidenceMenu.classList.remove('open');
            confidenceButton.setAttribute('aria-expanded', 'false');
        };

        const toggleMenu = (e) => {
            if (!isSmallDevice()) return;
            if (confidenceMenu.classList.contains('open')) {
                closeMenu();
            } else if (document.activeElement === guessInput) {
                e.preventDefault();
                guessInput.blur();
                setTimeout(() => {
                    confidenceButton.scrollIntoView({ block: 'center' });
                    openMenu();
                }, 100);
            } else {
                openMenu();
            }
        };

        confidenceButton.addEventListener('click', toggleMenu);

        confidenceMenu.addEventListener('click', (e) => {
            if (e.target.matches('button[data-value]')) {
                const value = e.target.getAttribute('data-value');
                confidenceInput.value = value;
                confidenceButton.textContent = value + '%';
                updateSelected(value);
                closeMenu();
            }
        });

        document.addEventListener('click', (e) => {
            if (confidenceMenu.classList.contains('open') && !confidenceMenu.contains(e.target) && e.target !== confidenceButton) {
                closeMenu();
            }
        });

        updateSelected(confidenceInput.value);
    }
    
    // Source button opens explanation modal
    if (sourceBtn && sourceModal) {
        sourceBtn.addEventListener('click', () => {
            if (currentQuestion && sourceText) {
                const explanation = currentQuestion.explanation || 'No source available for this question as of now. This is a new feature that will be available in the coming days.';
                // Allow simple links if present; otherwise treat as plain text
                sourceText.textContent = '';
                const asHtml = /<a\s|https?:\/\//i.test(explanation);
                if (asHtml) {
                    sourceText.innerHTML = explanation;
                } else {
                    sourceText.textContent = explanation;
                }
                // Reset stats placeholders before fetching
                if (medianFirstGuessText) medianFirstGuessText.textContent = '';
                const playersEl = document.getElementById('source-players-count');
                const winRateEl = document.getElementById('source-win-rate');
                const avgTriesEl = document.getElementById('source-avg-tries');
                if (playersEl) playersEl.textContent = '0';
                if (winRateEl) winRateEl.textContent = '0%';
                if (avgTriesEl) avgTriesEl.textContent = '0';

                // Fetch median first guess
                fetchMedianFirstGuess(currentQuestion.date)
                    .then(median => {
                        if (median != null && medianFirstGuessText) {
                            medianFirstGuessText.textContent = `The median first guess was ${formatNumber(median)}`;
                        }
                    })
                    .catch(() => {/* ignore */});

                // Fetch user's first-guess percentile
                if (firstGuessPercentileText) firstGuessPercentileText.textContent = '';
                fetchFirstGuessPercentile(currentQuestion.date)
                    .then(p => {
                        if (typeof p === 'number' && firstGuessPercentileText) {
                            firstGuessPercentileText.textContent = `Your first guess is in the ${p}th percentile, meaning you've performed as well or better than ${p}% of players.`;
                        }
                    })
                    .catch(() => {/* ignore */});

                // Fetch aggregate stats (players, win rate)
                fetchAverageGuesses(currentQuestion.date)
                    .then(avgData => {
                        if (!avgData) return;
                        if (playersEl && typeof avgData.totalPlayers === 'number') {
                            playersEl.textContent = `${avgData.totalPlayers}`;
                        }
                        if (winRateEl && typeof avgData.winRate === 'number') {
                            winRateEl.textContent = `${avgData.winRate}%`;
                        }
                        if (avgTriesEl && typeof avgData.average === 'number') {
                            const v = avgData.average;
                            avgTriesEl.textContent = Number.isInteger(v) ? `${v}` : v.toFixed(1);
                        }
                    })
                    .catch(() => {/* ignore */});
            }
            sourceModal.style.display = 'block';
        });
    }

    // Accordion toggles
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isOpen = item.classList.contains('open');
            if (isOpen) {
                item.classList.remove('open');
                header.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('open');
                header.setAttribute('aria-expanded', 'true');
            }
            scheduleFooterPositioningUpdate();
        });
    });
    
    // Close buttons
    closeHelpBtn.addEventListener('click', () => closeModal(helpModal));
    closeStatsBtn.addEventListener('click', () => closeModal(statsModal));
    closeQuestionsBtn.addEventListener('click', () => closeModal(questionsModal));

    // Comment buttons
    if (commentsBtn) commentsBtn.addEventListener('click', openComments);
    if (commentsBackBtn) commentsBackBtn.addEventListener('click', closeComments);
    if (commentSubmitBtn) {
        commentSubmitBtn.addEventListener('click', async () => {
            const text = commentInput.value.trim();
            if (!text) return;
            await addComment(currentQuestion.date, text);
            commentInput.value = '';
            await loadComments();
        });
    }

    // Share buttons
    shareBtn.addEventListener('click', shareGame);
    shareStatsBtn.addEventListener('click', shareStats);
        
    // Close modals when clicking outside (desktop + mobile)
    [helpModal, statsModal, questionsModal, sourceModal].forEach(modal => {
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

    // Close source modal via button
    if (closeSourceBtn && sourceModal) {
        closeSourceBtn.addEventListener('click', () => closeModal(sourceModal));
    }
}

if (calibrationChart) {
    calibrationChart.addEventListener('mouseleave', hideCalibrationTooltip);
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('#calibration-chart')) hideCalibrationTooltip();
});

// Initialize the game when the page loads
window.addEventListener('resize', updateConfidenceInputVisibility);
window.addEventListener('resize', updateFooterPositioning);
document.addEventListener('DOMContentLoaded', initGame);
