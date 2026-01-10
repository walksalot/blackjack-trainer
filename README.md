# Blackjack Strategy Trainer

Rapid-fire training app for mastering blackjack basic strategy. Built specifically for Cosmo Casino's high-limit room rules.

## Live Demo

**[Play Now](https://walksalot.github.io/blackjack-trainer/)**

## Features

- **Perfect Basic Strategy** - Mathematically optimal plays for 6-deck, dealer stands on soft 17
- **Keyboard Shortcuts** - Use H/S/D/P/R keys for rapid-fire drilling
- **Weighted Training** - Focuses on commonly missed hands (soft 18 vs 9, 12 vs 2, etc.)
- **Statistics Tracking** - Identifies your weak spots for targeted practice
- **Casino-Quality UI** - Beautiful felt-green aesthetic with instant feedback

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| H | Hit |
| S | Stand |
| D | Double Down |
| P | Split |
| R | Surrender |
| Space | Next hand (after feedback) |

## Training Modes

- **Critical Hands** - Focus on the hardest decisions
- **Hard Focus** - Emphasize difficult plays
- **Balanced** - Mix of all hand types
- **Full Random** - Equal probability for all hands

## Casino Rules (Cosmo High Limit)

- 6-deck shoe
- Dealer stands on soft 17 (S17)
- Double after split allowed (DAS)
- Late surrender allowed
- Blackjack pays 3:2

## Critical Hands to Master

| Hand | vs Dealer | Correct Play | Why It's Tricky |
|------|-----------|--------------|-----------------|
| A,7 (Soft 18) | 9, 10, A | **HIT** | Everyone stands on 18 |
| Hard 12 | 2, 3 | **HIT** | Feels wrong to hit |
| Hard 16 | 9, 10, A | **SURRENDER** | Painful but correct |
| 8,8 | 10, A | **SPLIT** | Scary to split 16 |
| 9,9 | 7 | **STAND** | Don't split winners |
| Hard 11 | A | **HIT** | Miss the double (6-deck) |

## Development

Simple vanilla JavaScript - no build step required.

```bash
# Serve locally
python3 -m http.server 8080

# Open http://localhost:8080
```

## License

MIT
