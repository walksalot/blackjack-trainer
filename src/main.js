/**
 * Blackjack Strategy Trainer - Main Entry Point
 * Optimized for Cosmo Casino High Limit Room
 */

import { GameEngine, ACTION_NAMES } from './game/engine.js';

// Global game instance
let game;
let isShowingFeedback = false;

/**
 * Initialize the application
 */
function init() {
    game = new GameEngine();

    // Bind event listeners
    bindKeyboardShortcuts();
    bindButtonClicks();
    bindModeSelector();
    bindSettingsModal();

    // Start with first hand
    nextHand();

    // Update stats display
    updateStatsDisplay();
}

/**
 * Keyboard shortcuts for rapid-fire training
 */
function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (isShowingFeedback) {
            // Space to advance during feedback
            if (e.code === 'Space') {
                e.preventDefault();
                nextHand();
            }
            return;
        }

        const keyMap = {
            'KeyH': 'H',
            'KeyS': 'S',
            'KeyD': 'D',
            'KeyP': 'P',
            'KeyR': 'R',
        };

        const action = keyMap[e.code];
        if (action) {
            e.preventDefault();
            submitAction(action);
        }
    });
}

/**
 * Button click handlers
 */
function bindButtonClicks() {
    const actions = ['H', 'S', 'D', 'P', 'R'];
    actions.forEach(action => {
        const btn = document.getElementById(`btn-${action}`);
        if (btn) {
            btn.addEventListener('click', () => {
                if (!isShowingFeedback) {
                    submitAction(action);
                }
            });
        }
    });
}

/**
 * Mode selector
 */
function bindModeSelector() {
    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            game.setMode(e.target.value);
        });
    }
}

/**
 * Settings modal
 */
function bindSettingsModal() {
    const settingsBtn = document.getElementById('settings-btn');
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('close-modal');
    const resetBtn = document.getElementById('reset-stats');

    if (settingsBtn && modal) {
        settingsBtn.addEventListener('click', () => {
            updateModalStats();
            modal.classList.add('active');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all statistics? This cannot be undone.')) {
                localStorage.removeItem('blackjack_trainer_stats');
                game = new GameEngine();
                updateStatsDisplay();
                updateModalStats();
            }
        });
    }
}

/**
 * Generate and display next hand
 */
function nextHand() {
    isShowingFeedback = false;

    const hand = game.generateHand();
    const display = game.getHandDisplay();

    // Clear feedback
    document.body.classList.remove('correct', 'incorrect');
    const feedbackEl = document.getElementById('feedback');
    if (feedbackEl) feedbackEl.classList.remove('show');

    // Render dealer card
    renderDealerCard(hand.dealerCard);

    // Render player cards
    renderPlayerCards(hand.playerCards);

    // Update hand label
    const labelEl = document.getElementById('hand-label');
    if (labelEl) labelEl.textContent = display.label;

    // Update available actions
    updateActionButtons(display.availableActions);

    // Focus for keyboard input
    document.body.focus();
}

/**
 * Render a single card
 */
function renderCard(card) {
    const div = document.createElement('div');
    div.className = `card ${card.isRed ? 'red' : 'black'}`;
    div.innerHTML = `
        <span class="card-value">${card.display}</span>
        <span class="card-suit">${card.symbol}</span>
    `;
    return div;
}

/**
 * Render dealer's upcard
 */
function renderDealerCard(card) {
    const container = document.getElementById('dealer-cards');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(renderCard(card));
}

/**
 * Render player's cards
 */
function renderPlayerCards(cards) {
    const container = document.getElementById('player-cards');
    if (!container) return;
    container.innerHTML = '';
    cards.forEach(card => {
        container.appendChild(renderCard(card));
    });
}

/**
 * Update which action buttons are enabled
 */
function updateActionButtons(availableActions) {
    const allActions = ['H', 'S', 'D', 'P', 'R'];
    allActions.forEach(action => {
        const btn = document.getElementById(`btn-${action}`);
        if (btn) {
            const isAvailable = availableActions.includes(action);
            btn.disabled = !isAvailable;
            btn.classList.toggle('disabled', !isAvailable);
        }
    });
}

/**
 * Submit player action
 */
function submitAction(action) {
    if (isShowingFeedback) return;

    const result = game.submitAction(action);
    if (!result) return;

    isShowingFeedback = true;

    // Visual feedback
    if (result.isCorrect) {
        document.body.classList.add('correct');
        playCorrectSound();

        // Auto-advance after correct answer
        setTimeout(() => {
            if (isShowingFeedback) nextHand();
        }, 400);
    } else {
        document.body.classList.add('incorrect');
        playIncorrectSound();

        // Show correct answer
        showFeedback(result);

        // Auto-advance after showing feedback
        setTimeout(() => {
            if (isShowingFeedback) nextHand();
        }, 2000);
    }

    // Update stats
    updateStatsDisplay();
}

/**
 * Show feedback for incorrect answer
 */
function showFeedback(result) {
    const feedbackEl = document.getElementById('feedback');
    if (!feedbackEl) return;

    feedbackEl.innerHTML = `
        <div class="feedback-content">
            <div class="feedback-wrong">You chose: ${ACTION_NAMES[result.userAction]}</div>
            <div class="feedback-correct">Correct: ${ACTION_NAMES[result.correctAction]}</div>
            <div class="feedback-explanation">${result.explanation}</div>
            <div class="feedback-continue">Press <kbd>SPACE</kbd> to continue</div>
        </div>
    `;
    feedbackEl.classList.add('show');
}

/**
 * Update stats display
 */
function updateStatsDisplay() {
    const stats = game.getSessionStats();

    const streakEl = document.getElementById('streak');
    if (streakEl) streakEl.textContent = stats.streak;

    const accuracyEl = document.getElementById('accuracy');
    if (accuracyEl) {
        accuracyEl.textContent = `${stats.accuracy}% (${stats.correct}/${stats.total})`;
    }

    const bestStreakEl = document.getElementById('best-streak');
    if (bestStreakEl) bestStreakEl.textContent = stats.bestStreak;
}

/**
 * Update modal statistics
 */
function updateModalStats() {
    const lifetime = game.getLifetimeStats();
    const weakSpots = game.getWeakSpots(3, 5);

    // Lifetime stats
    const lifetimeEl = document.getElementById('lifetime-stats');
    if (lifetimeEl) {
        lifetimeEl.innerHTML = `
            <div class="stat-row">
                <span>Total Hands:</span>
                <span>${lifetime.totalHands}</span>
            </div>
            <div class="stat-row">
                <span>Accuracy:</span>
                <span>${lifetime.accuracy}%</span>
            </div>
            <div class="stat-row">
                <span>Best Streak:</span>
                <span>${lifetime.bestStreak}</span>
            </div>
        `;
    }

    // Weak spots
    const weakSpotsEl = document.getElementById('weak-spots');
    if (weakSpotsEl) {
        if (weakSpots.length === 0) {
            weakSpotsEl.innerHTML = '<p class="no-data">Play more hands to see weak spots</p>';
        } else {
            weakSpotsEl.innerHTML = weakSpots.map(spot => `
                <div class="weak-spot">
                    <span class="weak-hand">${formatHandKey(spot.key)}</span>
                    <span class="weak-accuracy">${spot.accuracy}% (${spot.correct}/${spot.attempts})</span>
                </div>
            `).join('');
        }
    }
}

/**
 * Format hand key for display
 */
function formatHandKey(key) {
    // Convert 'hard_16_10' to 'Hard 16 vs 10'
    const parts = key.split('_');
    const type = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const hand = parts[1].replace(',', '/');
    const dealer = parts[2];
    return `${type} ${hand} vs ${dealer}`;
}

/**
 * Sound effects (using Web Audio API)
 */
let audioContext;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playCorrectSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        // Audio not supported or blocked
    }
}

function playIncorrectSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = 200;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
        // Audio not supported or blocked
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
