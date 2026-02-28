# Project Context

This file contains context that should be loaded when AI assistant starts working on this project.

## Quick Reference

- **Main Entry**: `src/main.jsx` → `src/App.jsx`
- **State Management**: React Context in `src/context/AppContext.jsx`
- **Styling**: Tailwind CSS with custom typography in `src/styles/typography.css`

## Architecture

```
User Input (CSV)
    ↓
CsvDataSource → parseCSV() → parsedData
    ↓
computeStatistics() → stats
    ↓
Charts (BoxPlot, Correlation, Radar, Pareto)
```

## Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `parseCSV()` | dataService.js | Parse and validate CSV input |
| `computeStatistics()` | dataService.js | Calculate stats, p-values, CI |
| `calculateImprovement()` | statistics.js | Calculate improvement rate |
| `formatIndustrialNumber()` | formatters.js | Format numbers (K, M suffix) |

## Constants

Located in `utils/constants.js`:
- `Z_SCORE_95_PERCENT = 1.96`
- `CHART_BASE_RADIUS = 70`
- `MAX_SAVED_DATASETS = 20`
- `API_TIMEOUT_MS = 60000`
