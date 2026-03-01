# Project Context

Core context for AI assistant working on Algorithm Comparator.

## Architecture

```
User Input (CSV)
    ↓
CsvDataSource → parseCSV() → parsedData
    ↓
computeStatistics() → stats
    ↓
Views: Table, BoxPlot, Correlation, Pareto, Radar, AI Analysis
```

## Entry Points

| File | Purpose |
|------|---------|
| `src/main.jsx` | React entry |
| `src/App.jsx` | Root component |
| `src/context/AppContext.jsx` | Global state |

## Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `parseCSV()` | `services/csvParser.js` | Parse and validate CSV |
| `computeStatistics()` | `services/statisticsService.js` | Calculate stats, p-values, CI |
| `calculateImprovement()` | `utils/statistics.js` | Calculate improvement rate |
| `formatIndustrialNumber()` | `utils/formatters.js` | Format numbers (K, M suffix) |
| `generateAIInsights()` | `services/aiService.jsx` | Generate AI diagnosis |

## Constants

Located in `utils/constants.js`:

| Constant | Value | Purpose |
|----------|-------|---------|
| `Z_SCORE_95_PERCENT` | 1.96 | 95% confidence z-score |
| `MAX_SAVED_DATASETS` | 20 | Max saved datasets |
| `API_TIMEOUT_MS` | 60000 | API timeout |

## Data Flow

1. **Input**: CSV via `CsvDataSource` or `SavedDataSelector`
2. **Parse**: `parseCSV()` extracts cases, algorithms, metrics
3. **Stats**: `computeStatistics()` calculates per-metric statistics
4. **Display**: Charts and tables consume `stats` and `parsedData`
5. **AI**: `aiService.jsx` sends data to LLM for diagnosis

## State (AppContext)

```javascript
{
  parsedData: [],        // Parsed CSV rows
  stats: {},             // Current metric statistics
  allMetricsStats: [],   // All metrics statistics
  baseAlgo: '',          // Baseline algorithm
  compareAlgo: '',       // Compare algorithm
  activeMetric: '',      // Current metric
  selectedCases: Set,    // Selected case names
  aiInsights: '',        // AI diagnosis result
  llmConfig: {}          // LLM configuration
}
```
