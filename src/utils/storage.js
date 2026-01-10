/**
 * LocalStorage utilities for persisting statistics
 */

const STATS_KEY = 'blackjack_trainer_stats';

/**
 * Default stats structure
 */
const DEFAULT_STATS = {
    totalHands: 0,
    totalCorrect: 0,
    bestStreak: 0,
    byHand: {},
    sessions: [],
    lastPlayed: null,
};

/**
 * Load stats from localStorage
 */
export function loadStats() {
    try {
        const stored = localStorage.getItem(STATS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_STATS, ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load stats:', e);
    }
    return { ...DEFAULT_STATS };
}

/**
 * Save stats to localStorage
 */
export function saveStats(stats) {
    try {
        stats.lastPlayed = new Date().toISOString();
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.warn('Failed to save stats:', e);
    }
}

/**
 * Clear all stats
 */
export function clearStats() {
    try {
        localStorage.removeItem(STATS_KEY);
    } catch (e) {
        console.warn('Failed to clear stats:', e);
    }
}

/**
 * Export stats as JSON
 */
export function exportStats() {
    const stats = loadStats();
    return JSON.stringify(stats, null, 2);
}

/**
 * Import stats from JSON
 */
export function importStats(json) {
    try {
        const parsed = JSON.parse(json);
        saveStats(parsed);
        return true;
    } catch (e) {
        console.warn('Failed to import stats:', e);
        return false;
    }
}
