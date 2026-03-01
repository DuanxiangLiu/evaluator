# EDA Algorithm Evaluator - Project Rules

## Project Overview

| Property | Value |
|----------|-------|
| Name | EDA Algorithm Evaluator (eda-evaluator) |
| Version | v1.2.0 |
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
| `services/statisticsService.js` | Data quality, statistics computation |
| `services/weightRecommendation.js` | Smart weight recommendation |
| `utils/statistics.js` | Wilcoxon test, improvement calculation |
| `utils/formatters.js` | Number formatting |
| `hooks/useChartInteraction.js` | Chart zoom/pan/selection hooks |

## Reusable Components

- `ChartHeader` - Unified chart title bar
- `StatusBadge` - Status badges
- `EditableCell` - Editable table cells
- `Toast` - Message notifications
- `InteractiveChartWrapper` - Zoom/pan/box-select wrapper

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
- Views: `src/components/views/`
- Utils: `src/utils/`
- Services: `src/services/`
- Hooks: `src/hooks/`

## Chart Features

### BoxPlot X-Axis Sorting
- BoxPlot chart x-axis is sorted in **descending order** by `inst` (or `#Inst`, `instance`, `instances`) values
- Sorting logic implemented in `services/statisticsService.js` `computeStatistics()` function
- Automatically detects inst column from metadata columns

### Chart Width Configuration
- All chart widths are managed via `CHART_WIDTH` constant in `utils/constants.js`
- Width options: `FULL` (max-w-5xl), `COMPACT` (max-w-2xl), `NARROW` (max-w-xl)
- Default: `CHART_WIDTH.COMPACT` (~60% of container width)
- To change all chart widths globally, modify the constant value

### Chart Header Styles
- All header controls (buttons, selects, labels) use `CHART_HEADER_STYLES` constant
- Available styles: `SELECT`, `SELECT_ACCENT`, `LABEL`, `LABEL_ACCENT`, `BUTTON`, `BUTTON_SELECTED`, `BUTTON_UNSELECTED`
- Import: `import { CHART_HEADER_STYLES } from '../../utils/constants'`

### Feature Panels (功能面板)
- The application contains multiple feature panels: BoxPlot, Correlation, Pareto, Radar, QoR Simulator, Matrix, History, Data Quality, AI Diagnosis
- Each panel uses unified components: `ChartContainer`, `ChartHeader`, `ChartArea`, `ChartLegend`
- All panels follow consistent styling through shared constants and components

## P1 Features (v1.2.0)

### Smart Weight Recommendation
- Service: `src/services/weightRecommendation.js`
- Integrated in QoR Simulator
- Presets: balanced, timing, power, area, runtime
- Auto-recommendation based on improvement magnitude, significance, stability

### Data Quality Dashboard
- Component: `src/components/views/DataQualityDashboard.jsx`
- Comprehensive quality score with factor breakdown
- Issue diagnosis with severity levels
- Improvement suggestions

### Chart Interaction Enhancement
- Hook: `src/hooks/useChartInteraction.js`
- Wrapper: `src/components/common/InteractiveChartWrapper.jsx`
- Features: zoom (Ctrl+wheel), pan (Shift+drag), box selection
