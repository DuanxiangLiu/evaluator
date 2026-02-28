# New Component Template

When creating new components, follow this structure:

## File Location

- Charts: `src/components/charts/`
- Common: `src/components/common/`
- Layout: `src/components/layout/`
- Modals: `src/components/modals/`

## Component Template

```jsx
import React, { useState, useMemo } from 'react';
import { IconName } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import { calculateImprovement } from '../../utils/statistics';
import { formatIndustrialNumber } from '../../utils/formatters';

const CONSTANT_VALUE = 'value';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);
  
  const derivedValue = useMemo(() => {
    return computeValue(prop1);
  }, [prop1]);
  
  return (
    <div className="...">
      <ChartHeader title="Title" metric="HPWL">
        {/* Controls */}
      </ChartHeader>
      {/* Content */}
    </div>
  );
};

export default ComponentName;
```

## Requirements

1. Use `ChartHeader` for chart components
2. Use existing utilities for calculations
3. Follow Tailwind CSS patterns
4. Keep components focused and reusable
