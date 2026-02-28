# EDA Algorithm Evaluator - Project Rules

## Project Overview

| Property | Value |
|----------|-------|
| Name | EDA Algorithm Evaluator (eda-evaluator) |
| Version | v1.1.0 |
| Type | Pure frontend SPA |
| Tech Stack | React 18 + Vite 5 + Tailwind CSS 3 + Lucide React |

## Development Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run preview  # Preview build
```

## Code Conventions

### Naming
- Components: `PascalCase.jsx`
- Utilities: `camelCase.js`
- Constants: `UPPER_SNAKE_CASE`
- Private vars: `_prefix`

### Component Structure
1. Imports (grouped by type)
2. Constants
3. Main component with hooks, callbacks, effects
4. PropTypes
5. Default export

## Key Modules

| Module | Purpose |
|--------|---------|
| `context/AppContext.jsx` | Global state (React Context) |
| `services/dataService.js` | CSV parsing, statistics, export |
| `services/aiService.jsx` | LLM integration (DeepSeek/Gemini/OpenAI) |
| `utils/statistics.js` | Wilcoxon test, improvement calculation |
| `utils/formatters.js` | Number formatting |

## Reusable Components

- `ChartHeader` - Unified chart title bar
- `StatusBadge` - Status badges
- `EditableCell` - Editable table cells
- `Toast` - Message notifications

## Data Format

CSV columns:
- First: Case name
- Metadata: `#Inst`, `#Net`, etc.
- Metrics: `m_{Algo}_{Metric}` (e.g., `m_Base_HPWL`)

## Important Rules

1. Use `calculateImprovement()` from `utils/statistics.js` for improvement calculation
2. Use `formatIndustrialNumber()` from `utils/formatters.js` for number formatting
3. Use `ChartHeader` component for all chart titles
4. Use `fetchWithTimeout()` for API calls
5. Use `safeLocalStorage` for storage operations

## File Locations

- Charts: `src/components/charts/`
- Common: `src/components/common/`
- Layout: `src/components/layout/`
- Modals: `src/components/modals/`
- Utils: `src/utils/`
- Services: `src/services/`
