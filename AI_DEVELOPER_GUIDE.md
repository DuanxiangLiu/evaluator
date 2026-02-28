# EDA Algorithm Evaluator - AI 开发助手必读文档

> 本文档是 AI 开发助手进行后续开发工作的前置必读材料，包含项目架构说明、模块划分、核心功能实现原理、接口定义规范、代码风格指南及开发流程说明。

## 1. 项目概览

| 属性 | 描述 |
|------|------|
| **项目名称** | EDA Algorithm Evaluator (eda-evaluator) |
| **版本** | v1.1.0 |
| **项目类型** | 纯前端单页应用 (SPA) |
| **主要功能** | EDA 算法性能评估工具，提供数据可视化和智能分析功能 |
| **在线地址** | https://duanxiangliu.github.io/evaluator/ |

## 2. 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | React | ^18.2.0 | UI 组件化开发 |
| **构建工具** | Vite | ^5.0.8 | 快速开发与构建 |
| **CSS 框架** | Tailwind CSS | ^3.4.0 | 原子化 CSS |
| **图标库** | Lucide React | ^0.323.0 | 现代图标组件 |

## 3. 目录结构

```
src/
├── components/           # React 组件
│   ├── charts/          # 图表组件
│   │   ├── BoxPlotChart.jsx      # 箱线图
│   │   ├── CorrelationChart.jsx  # 相关性散点图
│   │   ├── ParetoChart.jsx       # 帕累托投影图
│   │   ├── QoRSimulator.jsx      # QoR 模拟器
│   │   └── RadarChart.jsx        # 雷达图
│   ├── common/          # 通用组件
│   │   ├── ChartHeader.jsx       # 图表标题栏（可复用）
│   │   ├── StatusBadge.jsx       # 状态徽章（可复用）
│   │   ├── EditableCell.jsx      # 可编辑单元格
│   │   ├── HelpIcon.jsx          # 帮助图标
│   │   ├── SavedDataSelector.jsx # 数据选择器
│   │   ├── SortIcon.jsx          # 排序图标
│   │   ├── Toast.jsx             # 消息提示
│   │   └── ValidationResultPanel.jsx
│   ├── layout/          # 布局组件
│   │   ├── ControlBar.jsx        # 控制栏
│   │   ├── CsvDataSource.jsx     # CSV 数据源
│   │   ├── Header.jsx            # 页头
│   │   └── Sidebar.jsx           # 侧边栏
│   └── modals/          # 模态框组件
│       ├── AiConfigModal.jsx     # AI 配置弹窗
│       └── DeepDiveModal.jsx     # 深度分析弹窗
├── context/             # React Context
│   └── AppContext.jsx   # 全局状态管理
├── hooks/               # 自定义 Hooks
│   ├── useInputValidation.js     # 输入验证
│   └── useLocalStorage.js        # 本地存储
├── services/            # 业务服务
│   ├── aiService.jsx    # AI 服务 (LLM 集成)
│   └── dataService.js   # 数据服务
├── styles/              # 样式文件
│   └── typography.css   # 字体样式
├── utils/               # 工具函数
│   ├── constants.js     # 常量配置
│   ├── dataGenerator.js # 数据生成器
│   ├── datasetStorage.js# 数据集存储
│   ├── downloadUtils.js # 文件下载工具
│   ├── formatters.js    # 格式化工具
│   ├── statistics.js    # 统计计算
│   ├── typography.js    # 字体工具
│   └── validationUtils.js # 验证工具
├── App.jsx              # 主应用组件
├── main.jsx             # 应用入口
└── index.css            # 全局样式
```

## 4. 核心模块说明

### 4.1 状态管理层 (AppContext.jsx)

**功能**：全局状态管理，使用 React Context API

**主要状态**：
- `csvInput` - CSV 输入数据
- `llmConfig` - LLM 配置
- `parsedData` - 解析后的数据
- `availableMetrics` / `availableAlgos` - 可用指标和算法
- `baseAlgo` / `compareAlgo` - 基线和对比算法
- `stats` / `allMetricsStats` - 统计结果

### 4.2 数据服务层 (dataService.js)

**核心功能**：
- CSV 解析与验证
- 统计计算（几何平均改进率、P-Value、置信区间等）
- 数据导出（CSV/JSON/TSV）

**关键函数**：
```javascript
parseCSV()           // CSV 解析
computeStatistics()  // 统计计算
exportToCSV()        // 导出 CSV
exportToJSON()       // 导出 JSON
```

### 4.3 AI 服务层 (aiService.jsx)

**支持的 LLM 提供商**：
- DeepSeek (默认)
- Google Gemini
- OpenAI

**功能**：生成 EDA 算法性能分析报告

### 4.4 统计工具层 (statistics.js)

**统计方法**：
- Wilcoxon 符号秩检验
- 分位数计算
- 改进率计算
- 正态分布 CDF

## 5. 数据流

```
CSV 输入 → parseCSV() → parsedData
                              ↓
              computeStatistics() → stats
                              ↓
              ┌────────────────┼────────────────┐
              ↓                ↓                ↓
         BoxPlotChart    CorrelationChart   RadarChart
```

## 6. 代码规范

### 6.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `BoxPlotChart.jsx` |
| 工具函数文件 | camelCase | `dataService.js` |
| React 组件 | PascalCase | `const BoxPlotChart = () => {}` |
| 普通函数 | camelCase | `const parseCSV = () => {}` |
| 常量 | UPPER_SNAKE_CASE | `const MAX_DATASETS = 20` |
| 私有变量 | _前缀 | `const _internalState = {}` |

### 6.2 组件结构规范

```jsx
// 1. 导入语句（按类型分组）
import React, { useState, useEffect } from 'react';
import { IconName } from 'lucide-react';
import LocalComponent from './LocalComponent';
import { utilityFunction } from '../../utils/utility';

// 2. 常量定义
const CONSTANT_VALUE = 'value';

// 3. 主组件
const ComponentName = ({ prop1, prop2 }) => {
  // 3.1 Hooks
  const [state, setState] = useState(null);
  
  // 3.2 派生状态
  const derivedValue = useMemo(() => {}, []);
  
  // 3.3 回调函数
  const handleClick = useCallback(() => {}, []);
  
  // 3.4 副作用
  useEffect(() => {}, []);
  
  // 3.5 渲染
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};

// 4. PropTypes 定义
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

// 5. 默认导出
export default ComponentName;
```

### 6.3 注释规范

```javascript
/**
 * 函数说明
 * @param {string} param1 - 参数1说明
 * @param {number} param2 - 参数2说明
 * @returns {Object} 返回值说明
 */
export const functionName = (param1, param2) => {
  // 实现
};

// 单行注释用于简短说明
const value = compute();

/* 
 * 多行注释
 * 用于较长的说明
 */
```

## 7. 可复用组件

### 7.1 ChartHeader

统一的图表标题栏组件，用于所有图表组件。

```jsx
import ChartHeader from '../common/ChartHeader';

<ChartHeader
  title="图表标题"
  metric="HPWL"
  helpContent={<div>帮助内容</div>}
>
  {/* 额外的控制元素 */}
</ChartHeader>
```

### 7.2 StatusBadge

统一的状态徽章组件。

```jsx
import StatusBadge from '../common/StatusBadge';

<StatusBadge
  type="optimized"  // 'filtered' | 'significant_opt' | 'severe_degrade' | 'optimized' | 'degraded' | 'neutral'
/>
```

### 7.3 核心工具函数

#### calculateImprovement (statistics.js)

```javascript
import { calculateImprovement } from '../utils/statistics';

// 计算改进率
const imp = calculateImprovement(baseVal, compareVal);
// 返回: 正数表示优化，负数表示退化，null表示无效
```

#### formatIndustrialNumber (formatters.js)

```javascript
import { formatIndustrialNumber } from '../utils/formatters';

// 格式化数字为工业格式 (K, M)
const formatted = formatIndustrialNumber(1234567); // "1.23M"
```

## 8. 数据格式规范

CSV 文件要求：
- 第一列：Case 名称
- 元数据列：Instances、Nets 等设计属性
- 指标列格式：`m_算法名_指标名`（如 `m_Base_HPWL`、`m_Algo1_HPWL`）

示例：
```csv
Case,#Inst,#Net,m_Base_HPWL,m_Algo1_HPWL,m_Base_TNS,m_Algo1_TNS
case_1,100000,120000,50000,48000,-1000,-800
```

## 9. 常量配置 (constants.js)

所有魔法数字和配置常量统一管理：

```javascript
// 统计计算常量
export const Z_SCORE_95_PERCENT = 1.96;

// 图表配置
export const CHART_BASE_RADIUS = 70;
export const CHART_MAX_IMPROVEMENT = 20;

// 存储限制
export const MAX_SAVED_DATASETS = 20;
export const MAX_FILE_SIZE_MB = 10;

// API 配置
export const API_TIMEOUT_MS = 60000;
```

## 10. 开发流程

### 10.1 本地开发

```bash
npm run dev      # 启动开发服务器 (端口 3000)
npm run build    # 生产构建
npm run preview  # 预览构建结果
```

### 10.2 代码提交规范

- feat: 新功能
- fix: 修复 bug
- refactor: 重构
- docs: 文档更新
- style: 代码格式调整
- test: 测试相关

### 10.3 测试

```bash
npm run test     # 运行测试
```

## 11. 注意事项

1. **改进率计算**：统一使用 `calculateImprovement` 函数，不要在各组件中重复实现
2. **数字格式化**：统一使用 `formatIndustrialNumber` 函数
3. **图表标题栏**：使用 `ChartHeader` 组件保持风格一致
4. **状态徽章**：使用 `StatusBadge` 组件
5. **API 调用**：使用 `fetchWithTimeout` 函数，支持超时控制
6. **LocalStorage**：使用 `safeLocalStorage` 工具，包含容量检查

## 12. 扩展指南

### 12.1 添加新图表

1. 在 `src/components/charts/` 创建新组件
2. 使用 `ChartHeader` 组件作为标题栏
3. 使用 `calculateImprovement` 计算改进率
4. 在 `App.jsx` 中添加新的 Tab 和路由

### 12.2 添加新指标

1. 在 `dataService.js` 的 `EDA_METRICS_CONFIG` 中添加指标配置
2. 配置指标名称、单位、优化方向和描述

### 12.3 添加新的 LLM 提供商

1. 在 `aiService.jsx` 中添加新的 API 调用逻辑
2. 在 `AiConfigModal.jsx` 中添加配置选项
