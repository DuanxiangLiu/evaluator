# Code Review Prompt

After completing significant code changes, perform a code review:

## Checklist

1. **Code Style**
   - Follows naming conventions
   - Proper component structure
   - No unnecessary comments

2. **Best Practices**
   - Uses existing utilities (calculateImprovement, formatIndustrialNumber)
   - Reuses common components (ChartHeader, StatusBadge)
   - Proper error handling

3. **Performance**
   - No unnecessary re-renders
   - Proper use of useMemo/useCallback
   - Efficient data structures

4. **Security**
   - No exposed secrets
   - Input validation
   - Safe localStorage usage

## Output Format

```
## Code Review Summary
- [✓/✗] Style compliance
- [✓/✗] Best practices
- [✓/✗] Performance
- [✓/✗] Security

## Issues Found (if any)
1. [Issue description and fix suggestion]
```
