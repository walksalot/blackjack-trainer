/**
 * Difficulty Weights for Hand Selection
 *
 * Higher weight = more likely to appear during training
 * Focus on hands where players commonly make mistakes
 *
 * Weight Scale:
 * 5 = CRITICAL - Most commonly missed, costs the most money
 * 4 = HARD - Counter-intuitive or emotionally difficult
 * 3 = MODERATE - Requires memorization
 * 2 = EASY - Clear decisions
 * 1 = TRIVIAL - Obvious plays
 */

export const DIFFICULTY = {
    // ============================================
    // CRITICAL HANDS (Weight 5)
    // These are where players lose the most money
    // ============================================

    // Soft 18 - MOST MISPLAYED HAND IN BLACKJACK
    // Everyone stands on 18, but you should hit vs strong dealer
    soft_A7_9: { weight: 5, note: 'HIT soft 18 vs 9!' },
    soft_A7_10: { weight: 5, note: 'HIT soft 18 vs 10!' },
    soft_A7_A: { weight: 5, note: 'HIT soft 18 vs Ace!' },

    // Hard 12 vs weak dealer - people stand too early
    hard_12_2: { weight: 5, note: 'HIT 12 vs 2!' },
    hard_12_3: { weight: 5, note: 'HIT 12 vs 3!' },

    // Hard 16 vs strong dealer - surrender situations
    hard_16_9: { weight: 5, note: 'SURRENDER 16 vs 9!' },
    hard_16_10: { weight: 5, note: 'SURRENDER 16 vs 10!' },
    hard_16_A: { weight: 5, note: 'SURRENDER 16 vs Ace!' },

    // Splitting 8s against strong dealer - emotionally hard
    pair_88_10: { weight: 5, note: 'SPLIT 8s vs 10!' },
    pair_88_A: { weight: 5, note: 'SPLIT 8s vs Ace (or surrender)!' },

    // 9,9 vs 7 - Stand, don't split!
    pair_99_7: { weight: 5, note: 'STAND with 9s vs 7!' },

    // 11 vs Ace in 6-deck - HIT, not double
    hard_11_A: { weight: 5, note: 'HIT 11 vs Ace (6-deck)!' },

    // ============================================
    // HARD HANDS (Weight 4)
    // ============================================

    // 15 vs strong cards - surrender
    hard_15_10: { weight: 4, note: 'SURRENDER 15 vs 10!' },
    hard_15_A: { weight: 4, note: 'SURRENDER 15 vs Ace!' },

    // 17 vs Ace - surrender
    hard_17_A: { weight: 4, note: 'SURRENDER 17 vs Ace!' },

    // Soft 18 doubling situations
    soft_A7_2: { weight: 4, note: 'DOUBLE soft 18 vs 2!' },
    soft_A7_3: { weight: 4, note: 'DOUBLE soft 18 vs 3!' },
    soft_A7_4: { weight: 4, note: 'DOUBLE soft 18 vs 4!' },
    soft_A7_5: { weight: 4, note: 'DOUBLE soft 18 vs 5!' },
    soft_A7_6: { weight: 4, note: 'DOUBLE soft 18 vs 6!' },

    // 9 vs 2 - HIT not double
    hard_9_2: { weight: 4, note: 'HIT 9 vs 2!' },

    // 10 vs 10 or Ace - HIT not double
    hard_10_10: { weight: 4, note: 'HIT 10 vs 10!' },
    hard_10_A: { weight: 4, note: 'HIT 10 vs Ace!' },

    // ============================================
    // MODERATE HANDS (Weight 3)
    // ============================================

    // Soft 19 vs 6 - Double!
    soft_A8_6: { weight: 3, note: 'DOUBLE soft 19 vs 6!' },

    // Soft 17 - double vs 3-6
    soft_A6_3: { weight: 3, note: 'DOUBLE soft 17 vs 3!' },
    soft_A6_4: { weight: 3, note: 'DOUBLE soft 17 vs 4!' },
    soft_A6_5: { weight: 3, note: 'DOUBLE soft 17 vs 5!' },
    soft_A6_6: { weight: 3, note: 'DOUBLE soft 17 vs 6!' },

    // 9,9 vs 9 - SPLIT
    pair_99_9: { weight: 3, note: 'SPLIT 9s vs 9!' },

    // 9,9 vs 10, A - STAND
    pair_99_10: { weight: 3, note: 'STAND with 9s vs 10!' },
    pair_99_A: { weight: 3, note: 'STAND with 9s vs Ace!' },

    // 6,6 vs 2 - Split with DAS
    pair_66_2: { weight: 3, note: 'SPLIT 6s vs 2 (DAS)!' },

    // 4,4 vs 5,6 - Split with DAS
    pair_44_5: { weight: 3, note: 'SPLIT 4s vs 5 (DAS)!' },
    pair_44_6: { weight: 3, note: 'SPLIT 4s vs 6 (DAS)!' },
};

/**
 * Get all possible hands for training
 * Returns array of {handType, handKey, dealerCard, weight}
 */
export function getAllHands() {
    const hands = [];

    // Hard hands (5-21 vs 2-A)
    for (let total = 5; total <= 21; total++) {
        for (const dealer of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']) {
            const key = `hard_${total}_${dealer}`;
            const diffInfo = DIFFICULTY[key];
            hands.push({
                handType: 'hard',
                handKey: total,
                dealerCard: dealer,
                weight: diffInfo?.weight || getDefaultWeight('hard', total, dealer),
                note: diffInfo?.note || null,
            });
        }
    }

    // Soft hands (A,2 through A,9 vs 2-A)
    for (let other = 2; other <= 9; other++) {
        for (const dealer of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']) {
            const handKey = `A,${other}`;
            const key = `soft_A${other}_${dealer}`;
            const diffInfo = DIFFICULTY[key];
            hands.push({
                handType: 'soft',
                handKey,
                dealerCard: dealer,
                weight: diffInfo?.weight || getDefaultWeight('soft', handKey, dealer),
                note: diffInfo?.note || null,
            });
        }
    }

    // Pairs (2,2 through A,A vs 2-A)
    const pairValues = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'];
    for (const pv of pairValues) {
        for (const dealer of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']) {
            const handKey = `${pv},${pv}`;
            const key = `pair_${pv}${pv}_${dealer}`;
            const diffInfo = DIFFICULTY[key];
            hands.push({
                handType: 'pair',
                handKey,
                dealerCard: dealer,
                weight: diffInfo?.weight || getDefaultWeight('pair', handKey, dealer),
                note: diffInfo?.note || null,
            });
        }
    }

    return hands;
}

/**
 * Calculate default weight for hands not explicitly defined
 */
function getDefaultWeight(handType, handKey, dealer) {
    // Trivial hands (always obvious)
    if (handType === 'hard') {
        const total = typeof handKey === 'number' ? handKey : parseInt(handKey);
        if (total >= 17 && dealer !== 'A') return 1;  // Always stand
        if (total <= 8) return 1;  // Always hit
        if (total === 11 && dealer !== 'A') return 1;  // Always double
    }

    if (handType === 'pair') {
        if (handKey === 'A,A') return 2;  // Always split
        if (handKey === 'T,T') return 2;  // Never split
        if (handKey === '5,5') return 2;  // Never split (treat as 10)
    }

    // Default: moderate difficulty
    return 2;
}

/**
 * Get weighted random hand for training
 * @param {string} mode - 'critical', 'hard', 'balanced', 'random'
 */
export function getWeightedHand(mode = 'balanced') {
    const allHands = getAllHands();

    // Apply mode multipliers
    const modeMultipliers = {
        critical: { 1: 0, 2: 0.5, 3: 1, 4: 2, 5: 5 },
        hard: { 1: 0.5, 2: 1, 3: 2, 4: 3, 5: 4 },
        balanced: { 1: 1, 2: 1.5, 3: 2, 4: 2.5, 5: 3 },
        random: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    };

    const multipliers = modeMultipliers[mode] || modeMultipliers.balanced;

    // Calculate weighted selection
    const weighted = allHands.map(h => ({
        ...h,
        adjustedWeight: h.weight * (multipliers[h.weight] || 1),
    }));

    const totalWeight = weighted.reduce((sum, h) => sum + h.adjustedWeight, 0);
    let random = Math.random() * totalWeight;

    for (const hand of weighted) {
        random -= hand.adjustedWeight;
        if (random <= 0) {
            return hand;
        }
    }

    // Fallback
    return weighted[Math.floor(Math.random() * weighted.length)];
}
