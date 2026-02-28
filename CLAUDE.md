# Hole in the Wall - Japan Restaurant Discovery

A visually stunning, mobile-first website for discovering authentic hole-in-the-wall restaurants across Japan.

## Project Overview

**Purpose**: Curated guide to Japan's hidden restaurants - the 3rd-floor yakitori joints, basement izakayas, and counter-only ramen shops that locals know but tourists miss.

**Key Differentiators**:
- Narrative wayfinding ("look for the blue noren, stairs on your right")
- Pre-visit anxiety reduction (what to expect, how to order)
- Solo diner optimization (counter seats, comfort ratings)
- Authentic local signals (years operating, local ratio, Tabelog ratings)

## Architecture

```
hole-in-the-wall/
├── data/restaurants/     # YAML files per restaurant
├── scripts/build.py      # Compiles YAML → JSON
├── src/                  # Frontend source
│   ├── css/              # Design system + components
│   ├── js/               # Vanilla JS app
│   └── index.html
└── dist/                 # Build output (deployed)
```

## Tech Stack

- **Frontend**: Vanilla JS (no framework)
- **Maps**: Mapbox GL JS
- **Styling**: Custom CSS with variables
- **Data**: YAML → JSON compilation
- **Deploy**: GitHub Pages

## Design System

### Colors (Dark Mode Default)
```css
--bg-primary: #0a0a0a;
--bg-secondary: #141414;
--bg-elevated: #242424;
--text-primary: #fafaf8;
--text-secondary: #a0a0a0;
--accent-warm: #e07a5f;     /* Terracotta */
--accent-gold: #d4a574;     /* Lantern glow */
--accent-sage: #87a878;     /* Matcha */
```

### Typography
- **Display/Body**: Space Grotesk
- **Monospace**: JetBrains Mono
- **Japanese**: Noto Sans JP

## Key Components

1. **Restaurant Card** - Dark bg, warm border on hover
2. **Wayfinding Block** - Gold left-border callout
3. **Solo Rating** - Dot visualization (●●●●○)
4. **Payment Pill** - "💴 Cash only" badge
5. **Bottom Sheet** - Mobile-native detail view

## Data Model

Restaurant YAML files live in `data/restaurants/{region}/{area}/`. Key fields:
- `name_en`, `name_ja`, `tagline`
- `location.wayfinding` - narrative directions
- `visit_info.solo_friendly` - rating + counter seats
- `authenticity.local_ratio` - percentage local customers
- `authenticity.tabelog_rating` - for credibility

## Build Process

```bash
python scripts/build.py    # Compiles data → dist/restaurants.json
```

## Development

Local preview:
```bash
cd src && python -m http.server 8000
```

## Commands

- `python scripts/build.py` - Build the site
- `git push` - Triggers GitHub Actions deploy

## Design Principles

1. **Anti-AI-slop**: Distinctive typography, no generic patterns
2. **Japanese warmth**: Terracotta, gold, sage - like an izakaya at night
3. **Mobile-first**: Bottom sheet patterns, touch-friendly
4. **Information density**: Show what matters without overwhelming
