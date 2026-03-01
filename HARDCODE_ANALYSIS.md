# 硬编码分析报告

> **更新日期**: 2026-03-01
> **状态**: 已完成第一阶段优化

## 1. 硬编码定义

硬编码是指在代码中直接写入固定值或字符串，而不是通过配置文件、常量或参数化方式管理的代码模式。硬编码会降低代码的可维护性、可扩展性和可测试性。

## 2. 已完成的优化

### 2.1 创建的配置文件结构

```
src/config/
├── index.js        # 配置索引文件
├── metrics.js      # 指标配置
├── thresholds.js   # 阈值配置
├── business.js     # 业务逻辑配置
├── ui.js           # 界面配置
└── help.js         # 帮助内容配置
```

### 2.2 已重构的硬编码

#### 2.2.1 业务逻辑硬编码（已完成）

| 文件路径 | 原硬编码内容 | 优化方案 | 状态 |
|---------|-------------|---------|------|
| `src/services/csvParser.js` | `EDA_METRICS_CONFIG` | 移至 `config/metrics.js` | ✅ |
| `src/services/csvParser.js` | 'case' 列名 | 配置化列名映射 | ✅ |
| `src/services/csvParser.js` | 'm_' 前缀 | 配置化前缀规则 | ✅ |
| `src/services/csvParser.js` | 'NA', 'NAN' | 配置化缺失值标识 | ✅ |
| `src/services/statisticsService.js` | inst 列名检测 | 配置化列名映射规则 | ✅ |
| `src/services/statisticsService.js` | 数据质量阈值 | 移至 `config/thresholds.js` | ✅ |
| `src/services/statisticsService.js` | 质量评分扣分 | 配置化评分规则 | ✅ |
| `src/services/statisticsService.js` | 样本量阈值 | 配置化阈值 | ✅ |
| `src/services/statisticsService.js` | 缺失值阈值 | 配置化阈值 | ✅ |

#### 2.2.2 界面硬编码（已完成）

| 文件路径 | 原硬编码内容 | 优化方案 | 状态 |
|---------|-------------|---------|------|
| `src/App.jsx` | `TAB_CONFIG` 数组 | 移至 `config/ui.js` | ✅ |
| `src/App.jsx` | 指标显示名称映射 | 使用 `getMetricDisplayName()` | ✅ |
| `src/App.jsx` | 帮助内容 | 移至 `config/help.js` | ✅ |
| `src/components/charts/BoxPlotChart.jsx` | 布局参数 | 移至 `config/ui.js` | ✅ |
| `src/components/charts/BoxPlotChart.jsx` | 颜色值 | 移至 `config/ui.js` | ✅ |
| `src/components/charts/BoxPlotChart.jsx` | 点尺寸 | 移至 `config/ui.js` | ✅ |

## 3. 配置文件说明

### 3.1 `config/metrics.js`
- `EDA_METRICS_CONFIG`: EDA指标配置对象
- `getMetricConfig()`: 获取指标配置
- `isBuiltInMetric()`: 判断是否内置指标
- `getMetricDisplayName()`: 获取指标显示名称

### 3.2 `config/thresholds.js`
- `DATA_QUALITY_THRESHOLDS`: 数据质量阈值
- `QUALITY_SCORING`: 质量评分规则
- `STATISTICAL_THRESHOLDS`: 统计阈值
- `IMPROVEMENT_THRESHOLDS`: 改进率阈值
- `CHART_THRESHOLDS`: 图表阈值

### 3.3 `config/business.js`
- `COLUMN_MAPPINGS`: 列名映射规则
- `MISSING_VALUE_INDICATORS`: 缺失值标识
- `CSV_PARSING`: CSV解析配置
- `DATA_VALIDATION`: 数据验证配置
- `findInstColumn()`: 查找inst列
- `isCaseColumn()`: 判断是否case列
- `parseMetricColumn()`: 解析指标列
- `isMissingValue()`: 判断是否缺失值

### 3.4 `config/ui.js`
- `TAB_CONFIG`: 标签页配置
- `CHART_LAYOUT`: 图表布局参数
- `CHART_COLORS`: 图表颜色配置
- `CHART_POINT_SIZES`: 图表点尺寸配置
- `UI_TEXTS`: 界面文本
- `TAB_STYLES`: 标签页样式
- `getTabStyle()`: 获取标签页样式

### 3.5 `config/help.js`
- `STAT_HELP_CONTENT`: 统计帮助内容
- `AUXILIARY_STAT_HELP`: 辅助统计帮助内容
- `getStatHelp()`: 获取统计帮助
- `getAuxiliaryStatHelp()`: 获取辅助统计帮助

## 4. 剩余优化项（待实施）

### 4.1 中期优化

1. **国际化支持**：
   - 提取所有文本到国际化文件
   - 支持多语言切换

2. **主题系统**：
   - 实现可配置的主题系统
   - 支持暗色/亮色模式

3. **配置管理**：
   - 实现配置热加载
   - 支持环境变量覆盖配置

### 4.2 长期优化

1. **插件系统**：
   - 实现指标插件系统
   - 支持自定义分析规则

2. **动态配置**：
   - 实现配置UI界面
   - 支持用户自定义配置

3. **数据驱动**：
   - 实现基于数据的配置生成
   - 支持自动适应不同数据集

## 5. 预期收益

1. **可维护性提升**：配置集中管理，减少代码修改 ✅
2. **可扩展性提升**：支持动态配置和插件
3. **可测试性提升**：配置可独立测试 ✅
4. **用户体验提升**：支持主题和国际化
5. **开发效率提升**：减少硬编码修改的时间成本 ✅

## 6. 结论

第一阶段硬编码优化已完成，主要成果：
- 创建了完整的配置文件结构
- 重构了关键的业务逻辑和界面硬编码
- 所有功能正常运行，构建成功

后续可根据需要继续实施中期和长期优化计划。