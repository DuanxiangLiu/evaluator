# Documentation Update Rules

## When to Update Docs

After completing significant work, update relevant documentation:

### Update `project_rules.md` when:
- Adding new reusable components
- Changing code conventions
- Adding new key modules or services
- Modifying data format requirements

### Update `project_context.md` when:
- Architecture changes
- New key functions added
- Constants modified

### Update `AI_DEVELOPER_GUIDE.md` when:
- Major feature additions
- New extension guides needed
- Workflow changes

## Update Format

Keep updates concise:
- Use bullet points
- Maximum 2-3 sentences per item
- Include file paths and function names

## Example Update

```markdown
## 2026-02-28: Added new chart component
- Added `TrendChart.jsx` in `src/components/charts/`
- Uses `ChartHeader` for consistency
- Depends on `calculateTrend()` from `utils/statistics.js`
```
