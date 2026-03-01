# Code Review Checklist

## Style

- [ ] Naming conventions (PascalCase components, camelCase utils)
- [ ] Component structure (imports → constants → component → propTypes → export)
- [ ] No unnecessary comments

## Best Practices

- [ ] Uses `calculateImprovement()` from `utils/statistics.js`
- [ ] Uses `formatIndustrialNumber()` from `utils/formatters.js`
- [ ] Uses `ChartHeader` for chart titles
- [ ] Uses `fetchWithTimeout()` for API calls

## Performance

- [ ] Proper `useMemo`/`useCallback` usage
- [ ] No unnecessary re-renders

## Security

- [ ] No exposed secrets
- [ ] Input validation
- [ ] Safe localStorage usage
