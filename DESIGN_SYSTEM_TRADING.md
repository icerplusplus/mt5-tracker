# 🎨 MT5 Trading Dashboard - Design System

## Phân tích từ hình ảnh DexDuel

### Color Palette
```css
/* Background */
--bg-primary: #000000;      /* Main background */
--bg-secondary: #0A0A0A;    /* Panel background */
--bg-tertiary: #111111;     /* Card background */
--bg-hover: #1A1A1A;        /* Hover state */

/* Accent */
--accent-primary: #FFC107;  /* Yellow/Gold - CTAs */
--accent-secondary: #FFD54F; /* Light yellow - Hover */

/* Trading Colors */
--color-buy: #26A69A;       /* Green - Buy/Long */
--color-sell: #EF5350;      /* Red - Sell/Short */
--color-profit: #4CAF50;    /* Profit */
--color-loss: #F44336;      /* Loss */

/* Text */
--text-primary: #FFFFFF;    /* Main text */
--text-secondary: #9E9E9E;  /* Secondary text */
--text-tertiary: #616161;   /* Muted text */

/* Borders */
--border-primary: #1F1F1F;  /* Subtle borders */
--border-secondary: #2A2A2A; /* Visible borders */
```

### Typography
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header (60px)                                           │
│ Symbol | Timeframe | Price | Stats                     │
├──────┬──────────────────────────────────────────┬───────┤
│ Side │                                          │ Side  │
│ bar  │          Chart (Full Height)             │ bar   │
│ Left │                                          │ Right │
│ 60px │                                          │ 320px │
│      │                                          │       │
│ Tools│          Positions Table                 │Orders │
│      │          (Below Chart)                   │ Info  │
└──────┴──────────────────────────────────────────┴───────┘
```

### Components

#### 1. Header
- Height: 60px
- Background: #0A0A0A
- Border-bottom: 1px solid #1F1F1F
- Content: Symbol, Price, Stats, Controls

#### 2. Sidebar Left (Tools)
- Width: 60px
- Background: #000000
- Icons only, vertical layout
- Hover: #1A1A1A

#### 3. Chart Area
- Background: #000000
- Full height minus header
- Lightweight Charts
- Dark theme

#### 4. Sidebar Right (Orders/Positions)
- Width: 320px
- Background: #0A0A0A
- Scrollable
- Compact tables

#### 5. Positions Table
- Below chart
- Height: 200px
- Compact rows
- Monospace numbers

---

## Implementation Plan

### Phase 1: Layout Restructure
1. Create 3-column layout (Sidebar-Chart-Sidebar)
2. Move chart to center (full height)
3. Move positions table below chart
4. Add left sidebar for tools

### Phase 2: Color System
1. Update all backgrounds to black theme
2. Change accent colors to yellow/gold
3. Update buy/sell colors
4. Add hover states

### Phase 3: Typography
1. Use monospace for all numbers
2. Reduce font sizes (more compact)
3. Update font weights

### Phase 4: Components
1. Redesign header
2. Create compact position cards
3. Update order form
4. Add tool sidebar

---

## Key Differences from Current Design

| Current | New (DexDuel Style) |
|---------|---------------------|
| Gray theme (#111827) | Pure black (#000000) |
| Blue accents | Yellow/Gold accents |
| Large spacing | Compact spacing |
| Card-based | Panel-based |
| Rounded corners | Sharp corners |
| Separate sections | Integrated layout |

---

## Next Steps

1. Update globals.css with new color system
2. Create new layout component
3. Redesign OpenPositions (compact table)
4. Redesign OrderForm (sidebar style)
5. Add left sidebar with tools
6. Update chart styling
