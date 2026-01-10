/**
 * Game Engine - Core logic for the blackjack trainer
 */

import { getCorrectAction, resolveAction, ACTION_NAMES, getExplanation } from '../data/strategy.js';
import { getWeightedHand } from '../data/weights.js';
import { saveStats, loadStats } from '../utils/storage.js';

// Card suits and values
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Get numeric value of a card
 */
function cardValue(card) {
    if (card === 'A') return 11;
    if (['K', 'Q', 'J'].includes(card)) return 10;
    return parseInt(card);
}

/**
 * Create a card object
 */
function createCard(value, suit) {
    return {
        value,
        suit,
        symbol: SUIT_SYMBOLS[suit],
        display: value === '10' ? '10' : value,
        isRed: suit === 'hearts' || suit === 'diamonds',
    };
}

/**
 * Generate cards to match a specific hand
 */
function generateHandCards(handType, handKey) {
    const randomSuit = () => SUITS[Math.floor(Math.random() * SUITS.length)];

    if (handType === 'pair') {
        // e.g., '8,8' or 'T,T' or 'A,A'
        let value = handKey.split(',')[0];
        if (value === 'T') value = ['10', 'J', 'Q', 'K'][Math.floor(Math.random() * 4)];
        return [
            createCard(value, randomSuit()),
            createCard(value, randomSuit()),
        ];
    }

    if (handType === 'soft') {
        // e.g., 'A,7'
        const parts = handKey.split(',');
        const otherValue = parts[1];
        return [
            createCard('A', randomSuit()),
            createCard(otherValue, randomSuit()),
        ];
    }

    if (handType === 'hard') {
        // Generate two cards that sum to the total
        const total = typeof handKey === 'number' ? handKey : parseInt(handKey);

        // For hard hands, we need to avoid creating soft hands
        // and avoid creating pairs
        const possibleCombos = [];

        for (let i = 2; i <= 11; i++) {
            const j = total - (i === 11 ? 1 : i);  // Ace counts as 1 in hard hands
            if (j >= 2 && j <= 10 && i !== j) {  // Avoid pairs
                if (i === 11) {
                    // Ace as 1 in hard hand (only for totals 12-21)
                    if (total >= 12 && total <= 21) {
                        possibleCombos.push(['A', j.toString()]);
                    }
                } else if (j >= 2 && j <= 10) {
                    possibleCombos.push([i.toString(), j.toString()]);
                }
            }
        }

        // Add 10-value cards
        const tenCards = ['10', 'J', 'Q', 'K'];
        for (const tc of tenCards) {
            const other = total - 10;
            if (other >= 2 && other <= 10 && other !== 10) {
                possibleCombos.push([tc, other.toString()]);
            }
        }

        // Filter out combos that would create soft hands
        const validCombos = possibleCombos.filter(([a, b]) => {
            if (a === 'A' || b === 'A') {
                // If there's an ace, make sure it's being used as 1
                const nonAce = a === 'A' ? b : a;
                const nonAceVal = cardValue(nonAce);
                return nonAceVal + 11 > 21;  // Ace must be 1
            }
            return true;
        });

        if (validCombos.length === 0) {
            // Fallback: just create a reasonable hand
            const half = Math.floor(total / 2);
            const remainder = total - half;
            return [
                createCard(half.toString(), randomSuit()),
                createCard(remainder.toString(), randomSuit()),
            ];
        }

        const combo = validCombos[Math.floor(Math.random() * validCombos.length)];
        return [
            createCard(combo[0], randomSuit()),
            createCard(combo[1], randomSuit()),
        ];
    }

    return [];
}

/**
 * Generate dealer upcard
 */
function generateDealerCard(targetValue = null) {
    const randomSuit = () => SUITS[Math.floor(Math.random() * SUITS.length)];

    if (targetValue) {
        let value = targetValue;
        if (targetValue === '10') {
            // Random 10-value card
            value = ['10', 'J', 'Q', 'K'][Math.floor(Math.random() * 4)];
        }
        return createCard(value, randomSuit());
    }

    // Random card
    const value = VALUES[Math.floor(Math.random() * VALUES.length)];
    return createCard(value, randomSuit());
}

/**
 * Main Game Engine class
 */
export class GameEngine {
    constructor() {
        this.stats = loadStats();
        this.currentHand = null;
        this.mode = 'balanced';  // 'critical', 'hard', 'balanced', 'random'
        this.streak = 0;
        this.sessionCorrect = 0;
        this.sessionTotal = 0;
    }

    /**
     * Set training mode
     */
    setMode(mode) {
        this.mode = mode;
    }

    /**
     * Generate a new hand for training
     */
    generateHand() {
        const hand = getWeightedHand(this.mode);

        const playerCards = generateHandCards(hand.handType, hand.handKey);
        const dealerCard = generateDealerCard(hand.dealerCard);

        // Get correct action
        const correctAction = getCorrectAction(
            hand.handType,
            hand.handKey,
            hand.dealerCard,
            true  // Can always double on first 2 cards
        );

        // Determine available actions
        const availableActions = ['H', 'S'];
        availableActions.push('D');  // Double always available on 2 cards
        if (hand.handType === 'pair') {
            availableActions.push('P');
        }
        availableActions.push('R');  // Surrender available at Cosmo

        this.currentHand = {
            ...hand,
            playerCards,
            dealerCard,
            correctAction,
            availableActions,
            startTime: Date.now(),
        };

        return this.currentHand;
    }

    /**
     * Submit player's action and check if correct
     */
    submitAction(action) {
        if (!this.currentHand) return null;

        const responseTime = Date.now() - this.currentHand.startTime;
        const isCorrect = this.isActionCorrect(action, this.currentHand.correctAction);

        // Update stats
        this.sessionTotal++;
        if (isCorrect) {
            this.sessionCorrect++;
            this.streak++;
            if (this.streak > (this.stats.bestStreak || 0)) {
                this.stats.bestStreak = this.streak;
            }
        } else {
            this.streak = 0;
        }

        // Track by hand type
        const handKey = this.getStatsKey();
        if (!this.stats.byHand[handKey]) {
            this.stats.byHand[handKey] = { attempts: 0, correct: 0, totalTime: 0 };
        }
        this.stats.byHand[handKey].attempts++;
        if (isCorrect) this.stats.byHand[handKey].correct++;
        this.stats.byHand[handKey].totalTime += responseTime;

        // Update totals
        this.stats.totalHands = (this.stats.totalHands || 0) + 1;
        this.stats.totalCorrect = (this.stats.totalCorrect || 0) + (isCorrect ? 1 : 0);

        saveStats(this.stats);

        const result = {
            isCorrect,
            userAction: action,
            correctAction: this.currentHand.correctAction,
            explanation: getExplanation(
                this.currentHand.handType,
                this.currentHand.handKey,
                this.currentHand.dealerCard,
                this.currentHand.correctAction
            ),
            responseTime,
            streak: this.streak,
            sessionAccuracy: this.sessionTotal > 0
                ? (this.sessionCorrect / this.sessionTotal * 100).toFixed(1)
                : 0,
        };

        return result;
    }

    /**
     * Check if user action matches correct action
     */
    isActionCorrect(userAction, correctAction) {
        if (userAction === correctAction) return true;

        // Handle equivalent actions:
        // - If correct is Double but user hits, that's acceptable (can't always double)
        if (correctAction === 'D' && userAction === 'H') return true;

        return false;
    }

    /**
     * Get stats key for current hand
     */
    getStatsKey() {
        const h = this.currentHand;
        return `${h.handType}_${h.handKey}_${h.dealerCard}`;
    }

    /**
     * Get session statistics
     */
    getSessionStats() {
        return {
            total: this.sessionTotal,
            correct: this.sessionCorrect,
            accuracy: this.sessionTotal > 0
                ? (this.sessionCorrect / this.sessionTotal * 100).toFixed(1)
                : 0,
            streak: this.streak,
            bestStreak: this.stats.bestStreak || 0,
        };
    }

    /**
     * Get weak spots (hands with lowest accuracy)
     */
    getWeakSpots(minAttempts = 3, limit = 5) {
        const weakSpots = [];

        for (const [key, data] of Object.entries(this.stats.byHand || {})) {
            if (data.attempts >= minAttempts) {
                const accuracy = data.correct / data.attempts;
                weakSpots.push({
                    key,
                    accuracy: (accuracy * 100).toFixed(1),
                    attempts: data.attempts,
                    correct: data.correct,
                    avgTime: (data.totalTime / data.attempts / 1000).toFixed(2),
                });
            }
        }

        // Sort by accuracy (lowest first)
        weakSpots.sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));

        return weakSpots.slice(0, limit);
    }

    /**
     * Get overall lifetime stats
     */
    getLifetimeStats() {
        return {
            totalHands: this.stats.totalHands || 0,
            totalCorrect: this.stats.totalCorrect || 0,
            accuracy: this.stats.totalHands > 0
                ? ((this.stats.totalCorrect || 0) / this.stats.totalHands * 100).toFixed(1)
                : 0,
            bestStreak: this.stats.bestStreak || 0,
        };
    }

    /**
     * Reset session (but keep lifetime stats)
     */
    resetSession() {
        this.streak = 0;
        this.sessionCorrect = 0;
        this.sessionTotal = 0;
        this.currentHand = null;
    }

    /**
     * Get display info for current hand
     */
    getHandDisplay() {
        if (!this.currentHand) return null;

        const h = this.currentHand;
        let label;

        if (h.handType === 'pair') {
            const val = h.handKey.split(',')[0];
            label = `Pair of ${val === 'T' ? '10s' : val + 's'}`;
        } else if (h.handType === 'soft') {
            const parts = h.handKey.split(',');
            const total = 11 + parseInt(parts[1]);
            label = `Soft ${total}`;
        } else {
            label = `Hard ${h.handKey}`;
        }

        return {
            label,
            handType: h.handType,
            playerCards: h.playerCards,
            dealerCard: h.dealerCard,
            availableActions: h.availableActions,
        };
    }
}

// Export action names for UI
export { ACTION_NAMES };
