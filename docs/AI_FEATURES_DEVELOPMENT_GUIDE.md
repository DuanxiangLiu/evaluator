# EDA 算法评估器 - AI 功能开发指南

> 文档版本：v1.0.0
> 创建日期：2026-03-01
> 适用版本：v1.2.0+

---

## 目录

1. [概述](#一概述)
2. [现有AI架构](#二现有ai架构)
3. [第一阶段：增强现有AI诊断](#三第一阶段增强现有ai诊断)
4. [第二阶段：智能异常预警系统](#四第二阶段智能异常预警系统)
5. [第三阶段：AI报告导出功能](#五第三阶段ai报告导出功能)
6. [第四阶段：多指标权衡决策系统](#六第四阶段多指标权衡决策系统)
7. [第五阶段：自然语言查询接口](#七第五阶段自然语言查询接口)
8. [统一AI服务接口规范](#八统一ai服务接口规范)
9. [测试与验证](#九测试与验证)
10. [部署与配置](#十部署与配置)

---

## 一、概述

### 1.1 文档目的

本文档为EDA算法评估器的AI功能扩展提供详细的开发指南，包含：
- 功能需求规格
- 技术实现方案
- 代码示例与模板
- 接口定义
- 测试用例

### 1.2 开发优先级

| 阶段 | 功能名称 | 优先级 | 预计工作量 | 价值评估 |
|------|----------|--------|------------|----------|
| 第一阶段 | 增强现有AI诊断 | P0 | 1周 | ⭐⭐⭐ |
| 第二阶段 | 智能异常预警系统 | P0 | 1.5周 | ⭐⭐⭐ |
| 第三阶段 | AI报告导出功能 | P1 | 1周 | ⭐⭐ |
| 第四阶段 | 多指标权衡决策系统 | P1 | 2周 | ⭐⭐⭐ |
| 第五阶段 | 自然语言查询接口 | P2 | 2周 | ⭐⭐ |

### 1.3 技术栈

- **前端框架**: React 18
- **状态管理**: React Context
- **AI服务**: DeepSeek / Gemini / OpenAI API
- **数据存储**: localStorage / IndexedDB
- **构建工具**: Vite 5

---

## 二、现有AI架构

### 2.1 目录结构

```
src/
├── services/
│   ├── aiService.jsx          # 核心AI服务
│   └── logRuleGenerator.js    # 日志规则AI生成
├── components/
│   ├── views/
│   │   └── AIAnalysisView.jsx # AI诊断视图
│   ├── charts/
│   │   └── CorrelationChart.jsx # 相关性分析（含AI解读）
│   └── modals/
│       ├── AiConfigModal.jsx  # AI配置弹窗
│       ├── PromptConfigModal.jsx # 提示词配置
│       └── AIRuleGenerator.jsx # 规则生成器
└── utils/
    └── constants.js           # AI相关常量定义
```

### 2.2 现有AI服务接口

```javascript
// src/services/aiService.jsx

// 带超时的API调用
export const fetchWithTimeout = async (url, options, timeout = API_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`请求超时 (${timeout / 1000}秒)`);
    }
    throw error;
  }
};

// 生成AI诊断报告
export const generateAIInsights = async (config, baseAlgo, compareAlgo, activeMetric, stats, allMetricsStats, parsedData, selectedCases, metaColumns) => {
  // ... 现有实现
};

// 生成相关性分析解读
export const generateCorrelationInsight = async (config, params) => {
  // ... 现有实现
};
```

### 2.3 LLM配置结构

```javascript
// src/utils/constants.js

export const DEFAULT_LLM_CONFIG = {
  provider: 'deepseek',        // 'deepseek' | 'gemini' | 'openai'
  apiKey: '',
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  systemPrompt: '...',          // 系统提示词
  userPrompt: '...'             // 用户提示词模板
};

export const LLM_PROVIDERS = {
  DEEPSEEK: {
    name: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat'
  },
  GEMINI: {
    name: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash'
  },
  OPENAI: {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4'
  }
};
```

---

## 三、第一阶段：增强现有AI诊断

### 3.1 功能需求

#### 3.1.1 历史对比分析

**需求描述**：
- 支持保存历史诊断结果
- 自动对比当前分析与历史结果
- 识别改进/退化的指标
- 生成变化趋势说明

**用户场景**：
```
用户场景：算法迭代追踪
1. 用户完成第一版算法测试，生成AI诊断报告
2. 系统自动保存报告到历史记录
3. 用户优化算法后进行第二次测试
4. 生成新报告时，AI自动对比历史结果
5. 输出："相比上次测试，HPWL改进率从5.2%提升至7.8%，TNS退化问题已解决"
```

#### 3.1.2 自动触发机制

**需求描述**：
- 数据更新后自动触发AI分析（可选）
- 智能判断是否需要重新分析
- 提供分析状态提示

**触发条件**：
- 数据版本变化
- 算法对比组合变化
- 用户手动触发

#### 3.1.3 增强的提示词模板

**需求描述**：
- 支持更多上下文变量
- 分层输出（摘要/详细）
- 多语言支持

### 3.2 技术实现

#### 3.2.1 历史记录存储服务

**新建文件**: `src/services/aiHistoryService.js`

```javascript
/**
 * AI诊断历史记录服务
 * 负责保存、检索、对比历史AI分析结果
 */

const HISTORY_STORAGE_KEY = 'eda_ai_diagnosis_history';
const MAX_HISTORY_RECORDS = 50;

/**
 * 保存诊断记录
 * @param {Object} record - 诊断记录
 * @param {string} record.baseAlgo - 基线算法
 * @param {string} record.compareAlgo - 对比算法
 * @param {string} record.insights - AI诊断内容
 * @param {Object} record.stats - 统计数据快照
 * @param {number} record.timestamp - 时间戳
 */
export const saveDiagnosisRecord = (record) => {
  const history = getDiagnosisHistory();
  
  const newRecord = {
    id: `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    baseAlgo: record.baseAlgo,
    compareAlgo: record.compareAlgo,
    insights: record.insights,
    statsSnapshot: {
      geomeanImp: record.stats?.geomeanImp,
      pValue: record.stats?.pValue,
      degradedCount: record.stats?.degradedCount,
      nValid: record.stats?.nValid
    },
    allMetricsSummary: record.allMetricsSummary,
    timestamp: Date.now(),
    dataHash: record.dataHash
  };
  
  history.unshift(newRecord);
  
  // 限制历史记录数量
  if (history.length > MAX_HISTORY_RECORDS) {
    history.splice(MAX_HISTORY_RECORDS);
  }
  
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  return newRecord.id;
};

/**
 * 获取诊断历史
 * @param {Object} filters - 过滤条件
 * @returns {Array} 历史记录列表
 */
export const getDiagnosisHistory = (filters = {}) => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    let history = stored ? JSON.parse(stored) : [];
    
    if (filters.baseAlgo) {
      history = history.filter(r => r.baseAlgo === filters.baseAlgo);
    }
    if (filters.compareAlgo) {
      history = history.filter(r => r.compareAlgo === filters.compareAlgo);
    }
    if (filters.limit) {
      history = history.slice(0, filters.limit);
    }
    
    return history;
  } catch {
    return [];
  }
};

/**
 * 获取最近一次诊断
 * @param {string} baseAlgo - 基线算法
 * @param {string} compareAlgo - 对比算法
 * @returns {Object|null} 最近诊断记录
 */
export const getLatestDiagnosis = (baseAlgo, compareAlgo) => {
  const history = getDiagnosisHistory({ baseAlgo, compareAlgo, limit: 1 });
  return history[0] || null;
};

/**
 * 对比两次诊断结果
 * @param {Object} current - 当前诊断
 * @param {Object} previous - 历史诊断
 * @returns {Object} 对比结果
 */
export const compareDiagnoses = (current, previous) => {
  if (!previous) return null;
  
  const changes = [];
  const currentMetrics = current.allMetricsSummary || {};
  const previousMetrics = previous.allMetricsSummary || {};
  
  // 提取指标数据
  const extractMetricData = (summary) => {
    const data = {};
    summary.split('\n').forEach(line => {
      const match = line.match(/- (\w+): Geomean=([-\d.]+)%, P-Value=([\d.]+)/);
      if (match) {
        data[match[1]] = {
          geomean: parseFloat(match[2]),
          pValue: parseFloat(match[3])
        };
      }
    });
    return data;
  };
  
  const currentData = extractMetricData(currentMetrics);
  const previousData = extractMetricData(previousMetrics);
  
  // 对比每个指标
  Object.keys({ ...currentData, ...previousData }).forEach(metric => {
    const curr = currentData[metric];
    const prev = previousData[metric];
    
    if (curr && prev) {
      const diff = curr.geomean - prev.geomean;
      if (Math.abs(diff) > 0.5) {
        changes.push({
          metric,
          previous: prev.geomean,
          current: curr.geomean,
          diff,
          direction: diff > 0 ? 'improved' : 'degraded',
          significance: Math.abs(diff) > 2 ? 'significant' : 'minor'
        });
      }
    }
  });
  
  return {
    previousTimestamp: previous.timestamp,
    timeDiff: Date.now() - previous.timestamp,
    changes,
    summary: generateComparisonSummary(changes)
  };
};

/**
 * 生成对比摘要
 */
const generateComparisonSummary = (changes) => {
  if (changes.length === 0) return '与上次分析结果基本一致';
  
  const improved = changes.filter(c => c.direction === 'improved');
  const degraded = changes.filter(c => c.direction === 'degraded');
  
  let summary = [];
  
  if (improved.length > 0) {
    const topImproved = improved.sort((a, b) => b.diff - a.diff)[0];
    summary.push(`${topImproved.metric}改进率提升${topImproved.diff.toFixed(1)}%`);
  }
  
  if (degraded.length > 0) {
    const topDegraded = degraded.sort((a, b) => a.diff - b.diff)[0];
    summary.push(`${topDegraded.metric}出现退化${Math.abs(topDegraded.diff).toFixed(1)}%`);
  }
  
  return summary.join('，');
};

/**
 * 清理过期历史
 * @param {number} daysToKeep - 保留天数
 */
export const cleanupOldHistory = (daysToKeep = 30) => {
  const history = getDiagnosisHistory();
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  
  const filtered = history.filter(r => r.timestamp > cutoff);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
  
  return history.length - filtered.length;
};

export default {
  saveDiagnosisRecord,
  getDiagnosisHistory,
  getLatestDiagnosis,
  compareDiagnoses,
  cleanupOldHistory
};
```

#### 3.2.2 增强的AI服务

**修改文件**: `src/services/aiService.jsx`

```javascript
// 新增：带历史对比的诊断生成
import { getLatestDiagnosis, compareDiagnoses, saveDiagnosisRecord } from './aiHistoryService';

/**
 * 生成带历史对比的AI诊断
 * @param {Object} config - LLM配置
 * @param {string} baseAlgo - 基线算法
 * @param {string} compareAlgo - 对比算法
 * @param {string} activeMetric - 当前指标
 * @param {Object} stats - 统计数据
 * @param {Array} allMetricsStats - 所有指标统计
 * @param {Array} parsedData - 解析后的数据
 * @param {Set} selectedCases - 选中的案例
 * @param {Array} metaColumns - 元数据列
 * @returns {Promise<Object>} 诊断结果
 */
export const generateAIInsightsWithComparison = async (
  config, baseAlgo, compareAlgo, activeMetric, stats, 
  allMetricsStats, parsedData, selectedCases, metaColumns
) => {
  // 获取历史记录
  const previousDiagnosis = getLatestDiagnosis(baseAlgo, compareAlgo);
  
  // 构建增强的提示词
  const enhancedPrompt = buildEnhancedPrompt({
    baseAlgo,
    compareAlgo,
    activeMetric,
    stats,
    allMetricsStats,
    parsedData,
    selectedCases,
    metaColumns,
    previousDiagnosis
  });
  
  // 调用LLM
  const insights = await callLLM(config, enhancedPrompt);
  
  // 对比历史
  const comparison = previousDiagnosis ? compareDiagnoses(
    { insights, allMetricsSummary: enhancedPrompt.allMetricsSummary },
    previousDiagnosis
  ) : null;
  
  // 保存当前诊断
  const recordId = saveDiagnosisRecord({
    baseAlgo,
    compareAlgo,
    insights,
    stats,
    allMetricsSummary: enhancedPrompt.allMetricsSummary,
    dataHash: generateDataHash(parsedData, selectedCases)
  });
  
  return {
    insights,
    comparison,
    recordId,
    timestamp: Date.now()
  };
};

/**
 * 构建增强提示词
 */
const buildEnhancedPrompt = (params) => {
  const { previousDiagnosis, ...rest } = params;
  
  // 基础数据准备（复用现有逻辑）
  const badCases = extractBadCases(rest);
  const topCases = extractTopCases(rest);
  const largeCases = extractLargeCases(rest);
  const allMetricsSummary = buildAllMetricsSummary(rest.allMetricsStats);
  
  // 构建历史对比部分
  let historySection = '';
  if (previousDiagnosis) {
    const timeDiff = formatTimeDiff(Date.now() - previousDiagnosis.timestamp);
    historySection = `
## 五、历史对比参考

**上次分析时间**：${timeDiff}前

**上次关键指标**：
\`\`\`json
${JSON.stringify(previousDiagnosis.statsSnapshot, null, 2)}
\`\`\`

**要求**：请对比当前数据与历史数据，指出显著变化和趋势。
`;
  }
  
  return {
    systemPrompt: params.config?.systemPrompt || DEFAULT_LLM_CONFIG.systemPrompt,
    userPrompt: `
## 算法综合评估任务

**对比配置：**
- 基线算法：${params.baseAlgo}
- 对比算法：${params.compareAlgo}

---

## 一、全部指标统计数据汇总
${allMetricsSummary}

## 二、各指标异常案例（退化预警）
${JSON.stringify(badCases, null, 2)}

## 三、各指标最佳案例（改进最大）
${JSON.stringify(topCases, null, 2)}

## 四、大规模设计案例（扩展性参考）
${JSON.stringify(largeCases, null, 2)}

${historySection}

---

## 请输出综合诊断报告：

### 🎯 1. 最终判定结论
- **推荐结论**：【推荐采用/建议保持/需修复后重测】
- **核心依据**：一句话概括

### 📊 2. 全局指标综合分析
- 各指标改进/退化情况汇总
- 统计显著性分析

### 📈 3. 历史趋势分析（如有）
- 与上次测试的对比
- 改进/退化趋势

### 💡 4. 优化建议
- 短期可执行的改进方向
`,
    allMetricsSummary
  };
};

/**
 * 格式化时间差
 */
const formatTimeDiff = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  
  if (days > 0) return `${days}天`;
  if (hours > 0) return `${hours}小时`;
  return `${minutes}分钟`;
};

/**
 * 生成数据哈希
 */
const generateDataHash = (data, selectedCases) => {
  const selectedData = data.filter(d => selectedCases.has(d.Case));
  const hash = selectedData.reduce((acc, d) => {
    return acc + d.Case.length + Object.keys(d.raw).length;
  }, 0);
  return `hash_${hash}_${selectedData.length}`;
};
```

#### 3.2.3 自动触发Hook

**新建文件**: `src/hooks/useAutoAnalysis.js`

```javascript
import { useEffect, useRef, useCallback } from 'react';

/**
 * 自动AI分析Hook
 * @param {Object} options - 配置选项
 * @param {boolean} options.enabled - 是否启用自动分析
 * @param {number} options.debounceMs - 防抖延迟（毫秒）
 * @param {Function} options.onTrigger - 触发回调
 * @param {Array} options.dependencies - 依赖项
 */
export const useAutoAnalysis = (options) => {
  const {
    enabled = false,
    debounceMs = 2000,
    onTrigger,
    dependencies = []
  } = options;
  
  const timeoutRef = useRef(null);
  const lastTriggerRef = useRef(null);
  const isManualTrigger = useRef(false);
  
  // 清理定时器
  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // 触发分析
  const trigger = useCallback((isManual = false) => {
    if (!enabled && !isManual) return;
    
    isManualTrigger.current = isManual;
    clearTimer();
    
    timeoutRef.current = setTimeout(() => {
      if (onTrigger) {
        onTrigger({
          isManual,
          lastTrigger: lastTriggerRef.current,
          timestamp: Date.now()
        });
        lastTriggerRef.current = Date.now();
      }
    }, debounceMs);
  }, [enabled, debounceMs, onTrigger, clearTimer]);
  
  // 手动触发
  const manualTrigger = useCallback(() => {
    trigger(true);
  }, [trigger]);
  
  // 监听依赖变化
  useEffect(() => {
    if (enabled && !isManualTrigger.current) {
      trigger(false);
    }
    isManualTrigger.current = false;
    
    return clearTimer;
  }, [...dependencies, enabled, trigger, clearTimer]);
  
  return {
    trigger: manualTrigger,
    lastTrigger: lastTriggerRef.current
  };
};

export default useAutoAnalysis;
```

### 3.3 UI组件修改

#### 3.3.1 修改AIAnalysisView

**修改文件**: `src/components/views/AIAnalysisView.jsx`

```jsx
// 新增历史对比显示区域

import { getDiagnosisHistory, compareDiagnoses } from '../../services/aiHistoryService';
import useAutoAnalysis from '../../hooks/useAutoAnalysis';

const AIAnalysisView = ({
  // ... 现有props
  autoAnalyze = false,  // 新增：是否启用自动分析
}) => {
  const [history, setHistory] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // 加载历史记录
  useEffect(() => {
    if (baseAlgo && compareAlgo) {
      const records = getDiagnosisHistory({ baseAlgo, compareAlgo, limit: 10 });
      setHistory(records);
    }
  }, [baseAlgo, compareAlgo]);
  
  // 自动分析Hook
  const { trigger: autoTrigger } = useAutoAnalysis({
    enabled: autoAnalyze,
    debounceMs: 3000,
    onTrigger: () => {
      if (!aiInsights) {
        handleGenerateAIInsights();
      }
    },
    dependencies: [stats, baseAlgo, compareAlgo]
  });
  
  // 渲染历史对比区域
  const renderComparison = () => {
    if (!comparison) return null;
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
        <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
          <History className="w-4 h-4" />
          历史对比分析
        </h4>
        
        <div className="space-y-2">
          {comparison.changes.map((change, idx) => (
            <div 
              key={idx}
              className={`flex items-center gap-2 text-sm ${
                change.direction === 'improved' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {change.direction === 'improved' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {change.metric}: {change.previous.toFixed(1)}% → {change.current.toFixed(1)}%
                ({change.diff > 0 ? '+' : ''}{change.diff.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-blue-600 mt-3">
          上次分析: {formatTimestamp(comparison.previousTimestamp)}
        </p>
      </div>
    );
  };
  
  // 渲染历史记录列表
  const renderHistoryList = () => {
    if (!showHistory || history.length === 0) return null;
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <h4 className="font-bold text-gray-700 mb-3">历史诊断记录</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {history.map((record, idx) => (
            <div 
              key={record.id}
              className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 hover:border-indigo-200 cursor-pointer"
              onClick={() => loadHistoryRecord(record)}
            >
              <div>
                <span className="text-sm font-medium">{record.baseAlgo} vs {record.compareAlgo}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {formatTimestamp(record.timestamp)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Geomean: {record.statsSnapshot?.geomeanImp?.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col p-4">
      {/* ... 现有内容 */}
      
      {renderComparison()}
      {renderHistoryList()}
      
      {/* ... 其余内容 */}
    </div>
  );
};
```

### 3.4 测试用例

**新建文件**: `src/services/__tests__/aiHistoryService.test.js`

```javascript
import { 
  saveDiagnosisRecord, 
  getDiagnosisHistory, 
  compareDiagnoses 
} from '../aiHistoryService';

describe('AI History Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  test('should save diagnosis record', () => {
    const record = {
      baseAlgo: 'algo1',
      compareAlgo: 'algo2',
      insights: 'Test insights',
      stats: { geomeanImp: 5.5, pValue: 0.01 }
    };
    
    const id = saveDiagnosisRecord(record);
    expect(id).toMatch(/^diag_/);
    
    const history = getDiagnosisHistory();
    expect(history.length).toBe(1);
    expect(history[0].baseAlgo).toBe('algo1');
  });
  
  test('should compare two diagnoses', () => {
    const current = {
      allMetricsSummary: '- HPWL: Geomean=7.8%, P-Value=0.001\n- TNS: Geomean=3.2%, P-Value=0.05'
    };
    
    const previous = {
      timestamp: Date.now() - 3600000,
      allMetricsSummary: '- HPWL: Geomean=5.2%, P-Value=0.01\n- TNS: Geomean=3.5%, P-Value=0.04'
    };
    
    const result = compareDiagnoses(current, previous);
    
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.changes[0].metric).toBe('HPWL');
    expect(result.changes[0].diff).toBeCloseTo(2.6);
  });
  
  test('should limit history records', () => {
    for (let i = 0; i < 60; i++) {
      saveDiagnosisRecord({
        baseAlgo: `algo_${i}`,
        compareAlgo: 'algo2',
        insights: `Test ${i}`
      });
    }
    
    const history = getDiagnosisHistory();
    expect(history.length).toBe(50);
  });
});
```

---

## 四、第二阶段：智能异常预警系统

### 4.1 功能需求

#### 4.1.1 数据导入时自动检测

**需求描述**：
- CSV导入完成后自动执行异常检测
- 使用规则引擎+AI双重检测
- 实时显示检测结果和风险等级

**检测项目**：

| 检测项 | 规则方法 | AI方法 | 风险等级 |
|--------|----------|--------|----------|
| 数据缺失 | 缺失值比例统计 | - | 高/中/低 |
| 异常值 | IQR方法 | LLM分析原因 | 高/中 |
| 分布异常 | 偏度/峰度检测 | LLM判断合理性 | 中 |
| 一致性 | 跨指标关联检查 | LLM综合判断 | 高 |
| 规模异常 | 与历史对比 | LLM趋势分析 | 中 |

#### 4.1.2 实时预警提示

**需求描述**：
- 在数据表格中高亮异常数据
- 侧边栏显示预警摘要
- 点击预警项跳转到对应数据

#### 4.1.3 AI异常原因分析

**需求描述**：
- 对检测到的异常进行AI分析
- 提供可能的原因假设
- 给出排查建议

### 4.2 技术实现

#### 4.2.1 异常检测服务

**新建文件**: `src/services/anomalyDetectionService.js`

```javascript
/**
 * 异常检测服务
 * 结合规则引擎和AI分析，检测数据异常
 */

import { detectOutliers, calculatePearsonCorrelation } from '../utils/statistics';
import { getDiagnosisHistory } from './aiHistoryService';

/**
 * 异常类型定义
 */
export const ANOMALY_TYPES = {
  MISSING_DATA: {
    id: 'missing_data',
    name: '数据缺失',
    severity: 'high',
    icon: 'AlertTriangle'
  },
  OUTLIER: {
    id: 'outlier',
    name: '异常值',
    severity: 'medium',
    icon: 'Zap'
  },
  DISTRIBUTION: {
    id: 'distribution',
    name: '分布异常',
    severity: 'low',
    icon: 'Activity'
  },
  CONSISTENCY: {
    id: 'consistency',
    name: '一致性异常',
    severity: 'high',
    icon: 'AlertCircle'
  },
  SCALE: {
    id: 'scale',
    name: '规模异常',
    severity: 'medium',
    icon: 'TrendingUp'
  }
};

/**
 * 执行全面异常检测
 * @param {Object} params - 检测参数
 * @returns {Promise<Object>} 检测结果
 */
export const detectAnomalies = async (params) => {
  const { data, algos, metrics, metaColumns, historicalData } = params;
  
  const results = [];
  
  // 1. 数据缺失检测
  const missingDataResult = detectMissingData(data, algos, metrics);
  if (missingDataResult.anomalies.length > 0) {
    results.push(missingDataResult);
  }
  
  // 2. 异常值检测
  const outlierResult = detectOutliersInData(data, algos, metrics);
  if (outlierResult.anomalies.length > 0) {
    results.push(outlierResult);
  }
  
  // 3. 分布异常检测
  const distributionResult = detectDistributionAnomalies(data, algos, metrics);
  if (distributionResult.anomalies.length > 0) {
    results.push(distributionResult);
  }
  
  // 4. 一致性检测
  const consistencyResult = detectConsistencyAnomalies(data, algos, metrics);
  if (consistencyResult.anomalies.length > 0) {
    results.push(consistencyResult);
  }
  
  // 5. 规模异常检测（需要历史数据）
  if (historicalData) {
    const scaleResult = detectScaleAnomalies(data, historicalData, metrics);
    if (scaleResult.anomalies.length > 0) {
      results.push(scaleResult);
    }
  }
  
  // 计算整体风险评分
  const riskScore = calculateRiskScore(results);
  
  return {
    results,
    riskScore,
    summary: generateSummary(results),
    timestamp: Date.now()
  };
};

/**
 * 数据缺失检测
 */
const detectMissingData = (data, algos, metrics) => {
  const anomalies = [];
  const threshold = {
    high: 0.3,    // 30%以上高风险
    medium: 0.1,  // 10%以上中风险
    low: 0.05     // 5%以上低风险
  };
  
  metrics.forEach(metric => {
    algos.forEach(algo => {
      let missing = 0;
      const missingCases = [];
      
      data.forEach(row => {
        const val = row.raw[metric]?.[algo];
        if (val == null) {
          missing++;
          missingCases.push(row.Case);
        }
      });
      
      const ratio = missing / data.length;
      
      if (ratio >= threshold.low) {
        let severity = 'low';
        if (ratio >= threshold.high) severity = 'high';
        else if (ratio >= threshold.medium) severity = 'medium';
        
        anomalies.push({
          type: ANOMALY_TYPES.MISSING_DATA,
          metric,
          algorithm: algo,
          severity,
          details: {
            missingCount: missing,
            totalCount: data.length,
            ratio: (ratio * 100).toFixed(1) + '%',
            affectedCases: missingCases.slice(0, 10)
          }
        });
      }
    });
  });
  
  return {
    type: ANOMALY_TYPES.MISSING_DATA,
    anomalies,
    summary: `发现 ${anomalies.length} 个数据缺失问题`
  };
};

/**
 * 异常值检测
 */
const detectOutliersInData = (data, algos, metrics) => {
  const anomalies = [];
  
  metrics.forEach(metric => {
    algos.forEach(algo => {
      const values = data
        .map(row => ({ case: row.Case, val: row.raw[metric]?.[algo] }))
        .filter(item => item.val != null);
      
      if (values.length < 4) return;
      
      const outliers = detectOutliers(values.map(v => v.val));
      
      if (outliers.length > 0) {
        const outlierCases = outliers.map(o => ({
          case: values[o.index].case,
          value: o.value,
          type: o.type
        }));
        
        anomalies.push({
          type: ANOMALY_TYPES.OUTLIER,
          metric,
          algorithm: algo,
          severity: outliers.length > values.length * 0.1 ? 'high' : 'medium',
          details: {
            outlierCount: outliers.length,
            totalCount: values.length,
            outliers: outlierCases
          }
        });
      }
    });
  });
  
  return {
    type: ANOMALY_TYPES.OUTLIER,
    anomalies,
    summary: `发现 ${anomalies.length} 个异常值问题`
  };
};

/**
 * 分布异常检测
 */
const detectDistributionAnomalies = (data, algos, metrics) => {
  const anomalies = [];
  
  metrics.forEach(metric => {
    algos.forEach(algo => {
      const values = data
        .map(row => row.raw[metric]?.[algo])
        .filter(v => v != null);
      
      if (values.length < 10) return;
      
      // 计算偏度和峰度
      const stats = calculateDistributionStats(values);
      
      // 判断是否异常
      const isSkewed = Math.abs(stats.skewness) > 2;
      const isKurtotic = stats.kurtosis > 7 || stats.kurtosis < -3;
      
      if (isSkewed || isKurtotic) {
        anomalies.push({
          type: ANOMALY_TYPES.DISTRIBUTION,
          metric,
          algorithm: algo,
          severity: 'low',
          details: {
            skewness: stats.skewness.toFixed(2),
            kurtosis: stats.kurtosis.toFixed(2),
            isSkewed,
            isKurtotic,
            interpretation: interpretDistribution(stats)
          }
        });
      }
    });
  });
  
  return {
    type: ANOMALY_TYPES.DISTRIBUTION,
    anomalies,
    summary: `发现 ${anomalies.length} 个分布异常`
  };
};

/**
 * 一致性异常检测
 */
const detectConsistencyAnomalies = (data, algos, metrics) => {
  const anomalies = [];
  
  // 检查指标间的相关性是否合理
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const metric1 = metrics[i];
      const metric2 = metrics[j];
      
      algos.forEach(algo => {
        const values1 = data.map(row => row.raw[metric1]?.[algo]).filter(v => v != null);
        const values2 = data.map(row => row.raw[metric2]?.[algo]).filter(v => v != null);
        
        if (values1.length !== values2.length || values1.length < 5) return;
        
        const correlation = calculatePearsonCorrelation(values1, values2);
        
        // 检查相关性是否异常（通常应该有某种关联）
        if (correlation !== null && Math.abs(correlation) < 0.1) {
          anomalies.push({
            type: ANOMALY_TYPES.CONSISTENCY,
            severity: 'medium',
            details: {
              metric1,
              metric2,
              algorithm: algo,
              correlation: correlation.toFixed(3),
              interpretation: `${metric1} 与 ${metric2} 几乎无相关性，可能存在数据问题`
            }
          });
        }
      });
    }
  }
  
  return {
    type: ANOMALY_TYPES.CONSISTENCY,
    anomalies,
    summary: `发现 ${anomalies.length} 个一致性问题`
  };
};

/**
 * 规模异常检测
 */
const detectScaleAnomalies = (currentData, historicalData, metrics) => {
  const anomalies = [];
  
  // 对比当前数据与历史数据的规模
  const currentSize = currentData.length;
  const historicalSizes = historicalData.map(h => h.dataSize);
  const avgHistoricalSize = historicalSizes.reduce((a, b) => a + b, 0) / historicalSizes.length;
  
  const sizeChange = (currentSize - avgHistoricalSize) / avgHistoricalSize;
  
  if (Math.abs(sizeChange) > 0.5) {
    anomalies.push({
      type: ANOMALY_TYPES.SCALE,
      severity: 'medium',
      details: {
        currentSize,
        avgHistoricalSize: avgHistoricalSize.toFixed(0),
        changePercent: (sizeChange * 100).toFixed(1) + '%',
        interpretation: sizeChange > 0 
          ? '数据规模显著增加，请确认是否为预期行为'
          : '数据规模显著减少，可能存在数据丢失'
      }
    });
  }
  
  return {
    type: ANOMALY_TYPES.SCALE,
    anomalies,
    summary: anomalies.length > 0 ? '发现规模异常' : '规模正常'
  };
};

/**
 * 计算分布统计
 */
const calculateDistributionStats = (values) => {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  
  // 偏度
  const skewness = values.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / n;
  
  // 峰度
  const kurtosis = values.reduce((a, b) => a + Math.pow((b - mean) / std, 4), 0) / n - 3;
  
  return { mean, std, skewness, kurtosis };
};

/**
 * 解释分布特征
 */
const interpretDistribution = (stats) => {
  const parts = [];
  
  if (stats.skewness > 1) parts.push('右偏分布（长尾在右侧）');
  else if (stats.skewness < -1) parts.push('左偏分布（长尾在左侧）');
  
  if (stats.kurtosis > 3) parts.push('尖峰分布');
  else if (stats.kurtosis < -1) parts.push('平坦分布');
  
  return parts.join('，') || '接近正态分布';
};

/**
 * 计算风险评分
 */
const calculateRiskScore = (results) => {
  let score = 100;
  
  results.forEach(result => {
    result.anomalies.forEach(anomaly => {
      switch (anomaly.severity) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });
  });
  
  return Math.max(0, Math.min(100, score));
};

/**
 * 生成摘要
 */
const generateSummary = (results) => {
  const total = results.reduce((sum, r) => sum + r.anomalies.length, 0);
  const highCount = results.reduce((sum, r) => 
    sum + r.anomalies.filter(a => a.severity === 'high').length, 0);
  
  if (total === 0) return '数据质量良好，未检测到异常';
  if (highCount > 0) return `检测到 ${total} 个问题，其中 ${highCount} 个高风险问题需要立即处理`;
  return `检测到 ${total} 个问题，建议检查后继续`;
};

/**
 * AI异常原因分析
 * @param {Object} config - LLM配置
 * @param {Object} anomaly - 异常详情
 * @param {Object} context - 上下文数据
 * @returns {Promise<Object>} 分析结果
 */
export const analyzeAnomalyWithAI = async (config, anomaly, context) => {
  const prompt = buildAnomalyAnalysisPrompt(anomaly, context);
  
  try {
    const response = await fetch(buildAPIUrl(config), {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify(buildRequestBody(config, prompt))
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const result = await response.json();
    const analysis = extractContent(config, result);
    
    return {
      anomaly,
      analysis,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      anomaly,
      error: error.message,
      timestamp: Date.now()
    };
  }
};

/**
 * 构建异常分析提示词
 */
const buildAnomalyAnalysisPrompt = (anomaly, context) => {
  return {
    system: `你是一位EDA数据分析专家，专门负责诊断数据异常的原因。你的任务是分析异常数据，提供可能的原因假设和排查建议。

输出要求：
1. 使用Markdown格式
2. 先给出最可能的原因
3. 提供具体的排查步骤
4. 控制在200字以内`,
    user: `## 异常类型：${anomaly.type.name}

**严重程度**：${anomaly.severity}

**详细信息**：
\`\`\`json
${JSON.stringify(anomaly.details, null, 2)}
\`\`\`

**上下文**：
- 指标：${anomaly.metric || 'N/A'}
- 算法：${anomaly.algorithm || 'N/A'}
- 数据总量：${context.totalCases} 条

请分析可能的原因并给出排查建议。`
  };
};

export default {
  detectAnomalies,
  analyzeAnomalyWithAI,
  ANOMALY_TYPES
};
```

#### 4.2.2 预警面板组件

**新建文件**: `src/components/common/AnomalyAlertPanel.jsx`

```jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  AlertTriangle, AlertCircle, Zap, Activity, TrendingUp,
  ChevronDown, ChevronUp, X, RefreshCw, Sparkles, Loader2
} from 'lucide-react';
import { ANOMALY_TYPES, analyzeAnomalyWithAI } from '../../services/anomalyDetectionService';
import { useToast } from './Toast';

const SEVERITY_COLORS = {
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' }
};

const TYPE_ICONS = {
  [ANOMALY_TYPES.MISSING_DATA.id]: AlertTriangle,
  [ANOMALY_TYPES.OUTLIER.id]: Zap,
  [ANOMALY_TYPES.DISTRIBUTION.id]: Activity,
  [ANOMALY_TYPES.CONSISTENCY.id]: AlertCircle,
  [ANOMALY_TYPES.SCALE.id]: TrendingUp
};

/**
 * 异常预警面板
 */
const AnomalyAlertPanel = ({
  anomalies,
  riskScore,
  onAnomalyClick,
  onRefresh,
  llmConfig,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const toast = useToast();
  
  // 按严重程度分组
  const groupedAnomalies = useMemo(() => {
    const groups = { high: [], medium: [], low: [] };
    anomalies.forEach(a => {
      groups[a.severity]?.push(a);
    });
    return groups;
  }, [anomalies]);
  
  // 处理AI分析
  const handleAIAnalysis = async (anomaly) => {
    if (!llmConfig?.apiKey) {
      toast.error('请先配置API Key');
      return;
    }
    
    setSelectedAnomaly(anomaly);
    setIsAnalyzing(true);
    setAiAnalysis(null);
    
    try {
      const result = await analyzeAnomalyWithAI(llmConfig, anomaly, {
        totalCases: anomaly.details?.totalCount || 0
      });
      setAiAnalysis(result);
    } catch (error) {
      toast.error('AI分析失败', error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 渲染单个异常项
  const renderAnomalyItem = (anomaly, index) => {
    const Icon = TYPE_ICONS[anomaly.type.id] || AlertTriangle;
    const colors = SEVERITY_COLORS[anomaly.severity];
    
    return (
      <div
        key={`${anomaly.type.id}-${index}`}
        className={`p-3 rounded-lg border ${colors.border} ${colors.bg} cursor-pointer hover:shadow-sm transition-shadow`}
        onClick={() => onAnomalyClick?.(anomaly)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <Icon className={`w-4 h-4 mt-0.5 ${colors.text}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-medium text-sm ${colors.text}`}>
                  {anomaly.type.name}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${colors.badge}`}>
                  {anomaly.severity === 'high' ? '高风险' : anomaly.severity === 'medium' ? '中风险' : '低风险'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {anomaly.metric && <span>指标: {anomaly.metric} </span>}
                {anomaly.algorithm && <span>算法: {anomaly.algorithm}</span>}
              </p>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAIAnalysis(anomaly);
            }}
            className="p-1 hover:bg-white/50 rounded transition-colors"
            title="AI分析"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </button>
        </div>
        
        {/* 详情 */}
        {anomaly.details && (
          <div className="mt-2 text-xs text-gray-600 pl-6">
            {anomaly.details.ratio && <span>缺失率: {anomaly.details.ratio}</span>}
            {anomaly.details.outlierCount && <span>异常值: {anomaly.details.outlierCount} 个</span>}
          </div>
        )}
      </div>
    );
  };
  
  // 渲染AI分析结果
  const renderAIAnalysis = () => {
    if (!selectedAnomaly) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAnomaly(null)}>
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">AI 异常分析</h3>
              <button onClick={() => setSelectedAnomaly(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-gray-500 mt-2">AI 正在分析...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="prose prose-sm prose-indigo max-w-none">
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {aiAnalysis.analysis}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center">分析失败</p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // 风险评分圆环
  const renderRiskScore = () => {
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (riskScore / 100) * circumference;
    const color = riskScore >= 80 ? '#10b981' : riskScore >= 60 ? '#f59e0b' : '#ef4444';
    
    return (
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48" cy="48" r="40"
            stroke="#e5e7eb" strokeWidth="8" fill="none"
          />
          <circle
            cx="48" cy="48" r="40"
            stroke={color} strokeWidth="8" fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{riskScore}</span>
        </div>
      </div>
    );
  };
  
  if (anomalies.length === 0) {
    return (
      <div className={`bg-emerald-50 border border-emerald-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-emerald-800">数据质量良好</p>
            <p className="text-xs text-emerald-600">未检测到异常问题</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* 头部 */}
      <div 
        className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {renderRiskScore()}
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                数据异常预警
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                发现 {anomalies.length} 个问题
                {groupedAnomalies.high.length > 0 && (
                  <span className="text-red-600 ml-2">
                    ({groupedAnomalies.high.length} 个高风险)
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh?.();
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="刷新检测"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
            {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
      </div>
      
      {/* 内容 */}
      {expanded && (
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* 高风险 */}
          {groupedAnomalies.high.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wide">高风险问题</h4>
              {groupedAnomalies.high.map((a, i) => renderAnomalyItem(a, i))}
            </div>
          )}
          
          {/* 中风险 */}
          {groupedAnomalies.medium.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide">中风险问题</h4>
              {groupedAnomalies.medium.map((a, i) => renderAnomalyItem(a, i))}
            </div>
          )}
          
          {/* 低风险 */}
          {groupedAnomalies.low.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide">低风险问题</h4>
              {groupedAnomalies.low.map((a, i) => renderAnomalyItem(a, i))}
            </div>
          )}
        </div>
      )}
      
      {/* AI分析弹窗 */}
      {renderAIAnalysis()}
    </div>
  );
};

AnomalyAlertPanel.propTypes = {
  anomalies: PropTypes.array.isRequired,
  riskScore: PropTypes.number.isRequired,
  onAnomalyClick: PropTypes.func,
  onRefresh: PropTypes.func,
  llmConfig: PropTypes.object,
  className: PropTypes.string
};

export default AnomalyAlertPanel;
```

### 4.3 集成到数据导入流程

**修改文件**: `src/components/layout/CsvDataSource.jsx`

```jsx
// 在数据导入完成后自动触发异常检测

import { detectAnomalies } from '../../services/anomalyDetectionService';

const CsvDataSource = ({ onDataLoaded }) => {
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // 数据加载完成后的处理
  const handleDataParsed = async (data, algos, metrics, metaColumns) => {
    // 先通知父组件
    onDataLoaded(data, algos, metrics, metaColumns);
    
    // 执行异常检测
    setIsDetecting(true);
    try {
      const result = await detectAnomalies({
        data,
        algos,
        metrics,
        metaColumns
      });
      setAnomalyResult(result);
      
      // 如果有高风险问题，显示警告
      if (result.riskScore < 70) {
        toast.warning('数据质量警告', result.summary);
      }
    } catch (error) {
      console.error('Anomaly detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };
  
  return (
    <div>
      {/* 现有的CSV输入区域 */}
      
      {/* 异常检测结果显示 */}
      {anomalyResult && (
        <AnomalyAlertPanel
          anomalies={anomalyResult.results.flatMap(r => r.anomalies)}
          riskScore={anomalyResult.riskScore}
          onRefresh={() => handleDataParsed(data, algos, metrics, metaColumns)}
        />
      )}
    </div>
  );
};
```

---

## 五、第三阶段：AI报告导出功能

### 5.1 功能需求

#### 5.1.1 报告模板

| 模板名称 | 用途 | 包含内容 |
|----------|------|----------|
| 简报 | 快速汇报 | 核心结论、关键指标、推荐建议 |
| 标准报告 | 项目交付 | 完整分析、所有图表、详细数据 |
| 技术报告 | 深度分析 | 统计方法、数据验证、技术细节 |

#### 5.1.2 导出格式

- **HTML**: 可在浏览器中查看，支持交互
- **PDF**: 适合打印和分发
- **Markdown**: 适合版本控制和文档集成

### 5.2 技术实现

#### 5.2.1 报告生成服务

**新建文件**: `src/services/reportGeneratorService.js`

```javascript
/**
 * AI报告生成服务
 * 负责生成各种格式的评估报告
 */

import { formatIndustrialNumber } from '../utils/formatters';

/**
 * 报告模板定义
 */
export const REPORT_TEMPLATES = {
  BRIEF: {
    id: 'brief',
    name: '简报',
    description: '快速汇报，包含核心结论和关键指标',
    sections: ['summary', 'key_metrics', 'recommendation']
  },
  STANDARD: {
    id: 'standard',
    name: '标准报告',
    description: '项目交付，包含完整分析和所有图表',
    sections: ['summary', 'key_metrics', 'detailed_analysis', 'charts', 'recommendation']
  },
  TECHNICAL: {
    id: 'technical',
    name: '技术报告',
    description: '深度分析，包含统计方法和技术细节',
    sections: ['summary', 'methodology', 'data_validation', 'detailed_analysis', 'charts', 'recommendation', 'appendix']
  }
};

/**
 * 生成报告
 * @param {Object} params - 报告参数
 * @returns {Promise<Object>} 生成的报告
 */
export const generateReport = async (params) => {
  const {
    template = REPORT_TEMPLATES.STANDARD,
    baseAlgo,
    compareAlgo,
    stats,
    allMetricsStats,
    parsedData,
    selectedCases,
    metaColumns,
    aiInsights,
    charts, // 图表截图数据
    llmConfig
  } = params;
  
  // 构建报告数据
  const reportData = {
    meta: {
      generatedAt: new Date().toISOString(),
      template: template.id,
      baseAlgo,
      compareAlgo
    },
    sections: {}
  };
  
  // 按模板生成各部分
  for (const sectionId of template.sections) {
    reportData.sections[sectionId] = await generateSection(sectionId, {
      baseAlgo,
      compareAlgo,
      stats,
      allMetricsStats,
      parsedData,
      selectedCases,
      metaColumns,
      aiInsights,
      charts,
      llmConfig
    });
  }
  
  return reportData;
};

/**
 * 生成单个部分
 */
const generateSection = async (sectionId, params) => {
  switch (sectionId) {
    case 'summary':
      return generateSummarySection(params);
    case 'key_metrics':
      return generateKeyMetricsSection(params);
    case 'detailed_analysis':
      return generateDetailedAnalysisSection(params);
    case 'methodology':
      return generateMethodologySection(params);
    case 'data_validation':
      return generateDataValidationSection(params);
    case 'charts':
      return generateChartsSection(params);
    case 'recommendation':
      return generateRecommendationSection(params);
    case 'appendix':
      return generateAppendixSection(params);
    default:
      return null;
  }
};

/**
 * 生成摘要部分
 */
const generateSummarySection = (params) => {
  const { stats, allMetricsStats, aiInsights } = params;
  
  return {
    title: '执行摘要',
    content: {
      overview: aiInsights ? extractExecutiveSummary(aiInsights) : generateAutoSummary(stats, allMetricsStats),
      keyFindings: extractKeyFindings(stats, allMetricsStats),
      recommendation: aiInsights ? extractRecommendation(aiInsights) : null
    }
  };
};

/**
 * 从AI诊断中提取执行摘要
 */
const extractExecutiveSummary = (insights) => {
  // 提取第一段或标注为结论的部分
  const lines = insights.split('\n');
  const summaryLines = [];
  let inSummary = false;
  
  for (const line of lines) {
    if (line.includes('结论') || line.includes('摘要')) {
      inSummary = true;
    }
    if (inSummary && line.trim()) {
      summaryLines.push(line);
      if (summaryLines.length >= 5) break;
    }
  }
  
  return summaryLines.join('\n') || lines.slice(0, 5).join('\n');
};

/**
 * 自动生成摘要（无AI时）
 */
const generateAutoSummary = (stats, allMetricsStats) => {
  if (!stats) return '暂无统计数据';
  
  const improved = allMetricsStats.filter(m => m.stats?.geomeanImp > 0).length;
  const degraded = allMetricsStats.filter(m => m.stats?.geomeanImp < 0).length;
  
  return `本次评估共分析 ${allMetricsStats.length} 个指标，其中 ${improved} 个指标表现改善，${degraded} 个指标出现退化。主要指标 ${stats.geomeanImp > 0 ? '整体改善' : '整体退化'} ${Math.abs(stats.geomeanImp).toFixed(2)}%。`;
};

/**
 * 提取关键发现
 */
const extractKeyFindings = (stats, allMetricsStats) => {
  const findings = [];
  
  allMetricsStats.forEach(({ metric, stats: mStats }) => {
    if (!mStats) return;
    
    if (Math.abs(mStats.geomeanImp) > 5) {
      findings.push({
        metric,
        type: mStats.geomeanImp > 0 ? 'improvement' : 'degradation',
        value: mStats.geomeanImp.toFixed(2) + '%',
        significance: mStats.pValue < 0.05 ? 'significant' : 'not_significant'
      });
    }
  });
  
  return findings.sort((a, b) => Math.abs(parseFloat(b.value)) - Math.abs(parseFloat(a.value)));
};

/**
 * 生成关键指标部分
 */
const generateKeyMetricsSection = (params) => {
  const { allMetricsStats, baseAlgo, compareAlgo } = params;
  
  const metrics = allMetricsStats.map(({ metric, stats }) => ({
    name: metric,
    geomeanImp: stats?.geomeanImp?.toFixed(2) ?? 'N/A',
    meanImp: stats?.meanImp?.toFixed(2) ?? 'N/A',
    pValue: stats?.pValue?.toFixed(4) ?? 'N/A',
    isSignificant: stats?.pValue < 0.05,
    degradedCount: stats?.degradedCount ?? 0,
    nValid: stats?.nValid ?? 0
  }));
  
  return {
    title: '关键指标分析',
    content: {
      metrics,
      summary: {
        total: metrics.length,
        improved: metrics.filter(m => parseFloat(m.geomeanImp) > 0).length,
        degraded: metrics.filter(m => parseFloat(m.geomeanImp) < 0).length,
        significant: metrics.filter(m => m.isSignificant).length
      }
    }
  };
};

/**
 * 生成详细分析部分
 */
const generateDetailedAnalysisSection = (params) => {
  const { stats, allMetricsStats, aiInsights } = params;
  
  return {
    title: '详细分析',
    content: {
      statisticalAnalysis: generateStatisticalAnalysis(stats, allMetricsStats),
      aiInsights: aiInsights || '未生成AI诊断'
    }
  };
};

/**
 * 生成统计分析内容
 */
const generateStatisticalAnalysis = (stats, allMetricsStats) => {
  const analysis = [];
  
  allMetricsStats.forEach(({ metric, stats: mStats }) => {
    if (!mStats) return;
    
    analysis.push({
      metric,
      interpretation: interpretMetricStats(mStats)
    });
  });
  
  return analysis;
};

/**
 * 解读指标统计
 */
const interpretMetricStats = (stats) => {
  const parts = [];
  
  parts.push(`几何平均改进率: ${stats.geomeanImp.toFixed(2)}%`);
  parts.push(`算术平均改进率: ${stats.meanImp.toFixed(2)}%`);
  
  if (stats.pValue < 0.05) {
    parts.push(`统计显著 (p=${stats.pValue.toFixed(4)})`);
  } else {
    parts.push(`统计不显著 (p=${stats.pValue.toFixed(4)})`);
  }
  
  parts.push(`有效样本: ${stats.nValid}`);
  parts.push(`退化案例: ${stats.degradedCount}`);
  
  return parts.join('；');
};

/**
 * 生成方法论部分
 */
const generateMethodologySection = (params) => {
  return {
    title: '分析方法',
    content: {
      statisticalMethods: [
        {
          name: '几何平均改进率',
          description: '使用几何平均计算改进率，避免极端值的影响',
          formula: 'Geomean(Compare/Base) - 1'
        },
        {
          name: 'Wilcoxon符号秩检验',
          description: '非参数检验方法，用于判断改进是否具有统计显著性',
          formula: '基于差值的秩和计算p值'
        },
        {
          name: '置信区间',
          description: '95%置信区间，表示改进率的可信范围',
          formula: 'mean ± 1.96 * std / sqrt(n)'
        },
        {
          name: '离群值检测',
          description: '使用IQR方法检测异常值',
          formula: 'Q1 - 1.5*IQR ~ Q3 + 1.5*IQR'
        }
      ],
      dataProcessing: [
        '缺失值处理：标记为无效数据，不参与统计计算',
        '零值处理：根据指标特性判断是否为有效值',
        '负值处理：支持TNS等可能为负的指标'
      ]
    }
  };
};

/**
 * 生成数据验证部分
 */
const generateDataValidationSection = (params) => {
  const { parsedData, selectedCases, stats } = params;
  
  return {
    title: '数据验证',
    content: {
      dataQuality: {
        totalCases: parsedData.length,
        selectedCases: selectedCases.size,
        validCases: stats?.nValid ?? 0,
        invalidCases: (stats?.nTotalChecked ?? 0) - (stats?.nValid ?? 0)
      },
      dataCompleteness: calculateDataCompleteness(parsedData),
      assumptions: [
        { name: '数据独立性', status: 'assumed', note: '假设各测试用例相互独立' },
        { name: '正态分布', status: 'not_required', note: '使用非参数检验，不要求正态分布' },
        { name: '样本量充足', status: stats?.nValid >= 10 ? 'passed' : 'warning', note: `样本量: ${stats?.nValid ?? 0}` }
      ]
    }
  };
};

/**
 * 计算数据完整性
 */
const calculateDataCompleteness = (data) => {
  if (data.length === 0) return 0;
  
  let totalCells = 0;
  let validCells = 0;
  
  data.forEach(row => {
    Object.values(row.raw).forEach(metricData => {
      Object.values(metricData).forEach(val => {
        totalCells++;
        if (val != null) validCells++;
      });
    });
  });
  
  return totalCells > 0 ? ((validCells / totalCells) * 100).toFixed(1) : 0;
};

/**
 * 生成图表部分
 */
const generateChartsSection = (params) => {
  const { charts } = params;
  
  return {
    title: '图表分析',
    content: {
      charts: charts || [],
      note: '图表截图在导出时生成'
    }
  };
};

/**
 * 生成建议部分
 */
const generateRecommendationSection = (params) => {
  const { aiInsights, stats, allMetricsStats } = params;
  
  let recommendations = [];
  
  // 从AI诊断中提取建议
  if (aiInsights) {
    recommendations = extractRecommendations(aiInsights);
  } else {
    // 自动生成建议
    recommendations = generateAutoRecommendations(stats, allMetricsStats);
  }
  
  return {
    title: '建议与结论',
    content: {
      recommendations,
      conclusion: generateConclusion(stats, allMetricsStats)
    }
  };
};

/**
 * 从AI诊断提取建议
 */
const extractRecommendations = (insights) => {
  const recommendations = [];
  const lines = insights.split('\n');
  let inRecommendation = false;
  
  for (const line of lines) {
    if (line.includes('建议') || line.includes('优化')) {
      inRecommendation = true;
    }
    if (inRecommendation && line.trim().startsWith('-')) {
      recommendations.push(line.replace(/^-\s*/, '').trim());
    }
  }
  
  return recommendations.length > 0 ? recommendations : ['请参考AI诊断报告获取详细建议'];
};

/**
 * 自动生成建议
 */
const generateAutoRecommendations = (stats, allMetricsStats) => {
  const recommendations = [];
  
  // 检查退化指标
  const degradedMetrics = allMetricsStats.filter(m => m.stats?.geomeanImp < 0);
  if (degradedMetrics.length > 0) {
    recommendations.push(`关注退化指标: ${degradedMetrics.map(m => m.metric).join(', ')}，建议分析退化原因`);
  }
  
  // 检查统计显著性
  const notSignificant = allMetricsStats.filter(m => m.stats?.pValue >= 0.05);
  if (notSignificant.length > 0) {
    recommendations.push('部分指标改进不显著，建议增加测试用例数量');
  }
  
  // 检查离群值
  if (stats?.degradedCount > stats?.nValid * 0.2) {
    recommendations.push('退化案例比例较高，建议检查是否存在特定场景问题');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('整体表现良好，建议继续监控后续版本表现');
  }
  
  return recommendations;
};

/**
 * 生成结论
 */
const generateConclusion = (stats, allMetricsStats) => {
  if (!stats) return '数据不足，无法得出结论';
  
  const avgImp = allMetricsStats.reduce((sum, m) => sum + (m.stats?.geomeanImp ?? 0), 0) / allMetricsStats.length;
  
  if (avgImp > 2) {
    return '综合评估结果积极，建议采用新算法';
  } else if (avgImp > 0) {
    return '综合评估结果略有改善，可根据具体需求决定是否采用';
  } else if (avgImp > -2) {
    return '综合评估结果略有退化，建议优化后再评估';
  } else {
    return '综合评估结果退化明显，不建议采用当前版本';
  }
};

/**
 * 生成附录部分
 */
const generateAppendixSection = (params) => {
  const { parsedData, metaColumns, allMetricsStats } = params;
  
  return {
    title: '附录',
    content: {
      rawDataSummary: {
        totalCases: parsedData.length,
        metaColumns,
        metrics: allMetricsStats.map(m => m.metric)
      },
      glossary: [
        { term: 'Geomean', definition: '几何平均，对数值取对数后求平均再取指数' },
        { term: 'P-Value', definition: '统计显著性p值，小于0.05表示显著' },
        { term: 'CI', definition: '置信区间，表示真值的可信范围' },
        { term: 'IQR', definition: '四分位距，Q3-Q1，用于检测离群值' }
      ]
    }
  };
};

/**
 * 导出为HTML
 */
export const exportToHTML = (reportData) => {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EDA算法评估报告 - ${reportData.meta.baseAlgo} vs ${reportData.meta.compareAlgo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    h3 { color: #374151; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #f3f4f6; }
    .improved { color: #059669; }
    .degraded { color: #dc2626; }
    .meta { color: #6b7280; font-size: 14px; }
    .section { margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
  </style>
</head>
<body>
  <header>
    <h1>EDA算法评估报告</h1>
    <p class="meta">
      基线算法: ${reportData.meta.baseAlgo} | 
      对比算法: ${reportData.meta.compareAlgo} |
      生成时间: ${new Date(reportData.meta.generatedAt).toLocaleString('zh-CN')}
    </p>
  </header>
  
  ${renderSectionsHTML(reportData.sections)}
  
  <footer>
    <p class="meta">本报告由 EDA Algorithm Evaluator 自动生成</p>
  </footer>
</body>
</html>
  `;
  
  return html;
};

/**
 * 渲染各部分HTML
 */
const renderSectionsHTML = (sections) => {
  return Object.entries(sections).map(([id, section]) => {
    if (!section) return '';
    
    return `
      <div class="section" id="${id}">
        <h2>${section.title}</h2>
        ${renderSectionContent(id, section.content)}
      </div>
    `;
  }).join('\n');
};

/**
 * 渲染部分内容
 */
const renderSectionContent = (sectionId, content) => {
  switch (sectionId) {
    case 'summary':
      return `
        <p>${content.overview}</p>
        ${content.keyFindings.length > 0 ? `
          <h3>关键发现</h3>
          <ul>
            ${content.keyFindings.map(f => `
              <li class="${f.type === 'improvement' ? 'improved' : 'degraded'}">
                ${f.metric}: ${f.value} ${f.significance === 'significant' ? '(显著)' : ''}
              </li>
            `).join('')}
          </ul>
        ` : ''}
      `;
      
    case 'key_metrics':
      return `
        <table>
          <thead>
            <tr>
              <th>指标</th>
              <th>几何平均改进</th>
              <th>算术平均改进</th>
              <th>P值</th>
              <th>退化案例</th>
            </tr>
          </thead>
          <tbody>
            ${content.metrics.map(m => `
              <tr>
                <td>${m.name}</td>
                <td class="${parseFloat(m.geomeanImp) > 0 ? 'improved' : 'degraded'}">${m.geomeanImp}%</td>
                <td>${m.meanImp}%</td>
                <td>${m.pValue} ${m.isSignificant ? '✓' : ''}</td>
                <td>${m.degradedCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p>统计: ${content.summary.improved} 个指标改善, ${content.summary.degraded} 个指标退化, ${content.summary.significant} 个统计显著</p>
      `;
      
    case 'recommendation':
      return `
        <h3>建议</h3>
        <ul>
          ${content.recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
        <h3>结论</h3>
        <p>${content.conclusion}</p>
      `;
      
    default:
      return `<pre>${JSON.stringify(content, null, 2)}</pre>`;
  }
};

/**
 * 导出为Markdown
 */
export const exportToMarkdown = (reportData) => {
  const lines = [];
  
  lines.push(`# EDA算法评估报告`);
  lines.push(``);
  lines.push(`> 基线算法: ${reportData.meta.baseAlgo}`);
  lines.push(`> 对比算法: ${reportData.meta.compareAlgo}`);
  lines.push(`> 生成时间: ${new Date(reportData.meta.generatedAt).toLocaleString('zh-CN')}`);
  lines.push(``);
  
  Object.entries(reportData.sections).forEach(([id, section]) => {
    if (!section) return;
    
    lines.push(`## ${section.title}`);
    lines.push(``);
    lines.push(renderSectionMarkdown(id, section.content));
    lines.push(``);
  });
  
  lines.push(`---`);
  lines.push(`*本报告由 EDA Algorithm Evaluator 自动生成*`);
  
  return lines.join('\n');
};

/**
 * 渲染Markdown内容
 */
const renderSectionMarkdown = (sectionId, content) => {
  switch (sectionId) {
    case 'summary':
      return [
        content.overview,
        ``,
        `### 关键发现`,
        ...content.keyFindings.map(f => `- **${f.metric}**: ${f.value} ${f.significance === 'significant' ? '(显著)' : ''}`)
      ].join('\n');
      
    case 'key_metrics':
      return [
        `| 指标 | 几何平均改进 | P值 | 退化案例 |`,
        `|------|-------------|-----|----------|`,
        ...content.metrics.map(m => `| ${m.name} | ${m.geomeanImp}% | ${m.pValue} | ${m.degradedCount} |`)
      ].join('\n');
      
    default:
      return '```json\n' + JSON.stringify(content, null, 2) + '\n```';
  }
};

export default {
  REPORT_TEMPLATES,
  generateReport,
  exportToHTML,
  exportToMarkdown
};
```

#### 5.2.2 报告导出组件

**新建文件**: `src/components/modals/ReportExportModal.jsx`

```jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  X, FileText, Download, Loader2, CheckCircle, 
  FileDown, Code, FileSpreadsheet
} from 'lucide-react';
import { REPORT_TEMPLATES, generateReport, exportToHTML, exportToMarkdown } from '../../services/reportGeneratorService';
import { useToast } from '../common/Toast';

const ReportExportModal = ({
  isOpen,
  onClose,
  baseAlgo,
  compareAlgo,
  stats,
  allMetricsStats,
  parsedData,
  selectedCases,
  metaColumns,
  aiInsights,
  llmConfig
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(REPORT_TEMPLATES.STANDARD.id);
  const [exportFormat, setExportFormat] = useState('html');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState(null);
  
  const toast = useToast();
  
  const handleGeneratePreview = useCallback(async () => {
    setIsGenerating(true);
    try {
      const report = await generateReport({
        template: Object.values(REPORT_TEMPLATES).find(t => t.id === selectedTemplate),
        baseAlgo,
        compareAlgo,
        stats,
        allMetricsStats,
        parsedData,
        selectedCases,
        metaColumns,
        aiInsights,
        llmConfig
      });
      
      setPreview(report);
      toast.success('预览生成成功');
    } catch (error) {
      toast.error('生成失败', error.message);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, baseAlgo, compareAlgo, stats, allMetricsStats, parsedData, selectedCases, metaColumns, aiInsights, llmConfig, toast]);
  
  const handleExport = useCallback(() => {
    if (!preview) {
      toast.error('请先生成预览');
      return;
    }
    
    let content, filename, mimeType;
    
    switch (exportFormat) {
      case 'html':
        content = exportToHTML(preview);
        filename = `eda_report_${baseAlgo}_vs_${compareAlgo}_${Date.now()}.html`;
        mimeType = 'text/html';
        break;
      case 'markdown':
        content = exportToMarkdown(preview);
        filename = `eda_report_${baseAlgo}_vs_${compareAlgo}_${Date.now()}.md`;
        mimeType = 'text/markdown';
        break;
      case 'json':
        content = JSON.stringify(preview, null, 2);
        filename = `eda_report_${baseAlgo}_vs_${compareAlgo}_${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      default:
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('导出成功', `已导出为 ${filename}`);
    onClose();
  }, [preview, exportFormat, baseAlgo, compareAlgo, toast, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-bold text-lg text-white">导出评估报告</h3>
              <p className="text-xs text-white/70">{baseAlgo} vs {compareAlgo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 左侧：配置 */}
            <div className="space-y-6">
              {/* 模板选择 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">报告模板</label>
                <div className="space-y-2">
                  {Object.values(REPORT_TEMPLATES).map(template => (
                    <label
                      key={template.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplate === template.id}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-gray-800">{template.name}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* 格式选择 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">导出格式</label>
                <div className="flex gap-2">
                  {[
                    { id: 'html', label: 'HTML', icon: FileText },
                    { id: 'markdown', label: 'Markdown', icon: Code },
                    { id: 'json', label: 'JSON', icon: FileSpreadsheet }
                  ].map(format => (
                    <button
                      key={format.id}
                      onClick={() => setExportFormat(format.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        exportFormat === format.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <format.icon className="w-4 h-4" />
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 生成按钮 */}
              <button
                onClick={handleGeneratePreview}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    生成预览
                  </>
                )}
              </button>
            </div>
            
            {/* 右侧：预览 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">报告预览</label>
              <div className="border border-gray-200 rounded-lg h-80 overflow-y-auto bg-gray-50 p-4">
                {preview ? (
                  <div className="text-sm text-gray-700">
                    <div className="font-bold text-lg text-indigo-800 mb-2">{preview.sections?.summary?.title}</div>
                    <p className="text-gray-600">{preview.sections?.summary?.content?.overview}</p>
                    <div className="mt-4 text-xs text-gray-400">
                      包含 {Object.keys(preview.sections || {}).length} 个部分
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <p>点击"生成预览"查看报告内容</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 底部 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={!preview}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>
      </div>
    </div>
  );
};

ReportExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  stats: PropTypes.object,
  allMetricsStats: PropTypes.array.isRequired,
  parsedData: PropTypes.array.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  metaColumns: PropTypes.array.isRequired,
  aiInsights: PropTypes.string,
  llmConfig: PropTypes.object
};

export default ReportExportModal;
```

---

## 六、第四阶段：多指标权衡决策系统

### 6.1 功能需求

#### 6.1.1 智能权重推荐

**需求描述**：
- 基于场景自动推荐权重配置
- 支持自定义优化目标
- 提供权重敏感性分析

**预设场景**：

| 场景 | 权重配置 | 说明 |
|------|----------|------|
| 时序优先 | TNS: 40%, WNS: 30%, HPWL: 20%, Runtime: 10% | 适合时序收敛困难的设计 |
| 功耗优先 | Leakage: 40%, HPWL: 30%, TNS: 20%, Runtime: 10% | 适合低功耗设计 |
| 面积优先 | Area: 40%, HPWL: 30%, Congestion: 20%, Runtime: 10% | 适合面积受限设计 |
| 均衡模式 | 各指标均分 | 适合综合评估 |

#### 6.1.2 算法推荐引擎

**需求描述**：
- 基于多指标综合评分推荐最优算法
- 考虑指标间的权衡关系
- 提供推荐理由说明

#### 6.1.3 Trade-off可视化

**需求描述**：
- 展示指标间的权衡关系
- 标注帕累托前沿
- 支持交互式探索

### 6.2 技术实现

#### 6.2.1 决策服务

**新建文件**: `src/services/decisionService.js`

```javascript
/**
 * 多指标决策服务
 * 负责权重推荐、算法评估、权衡分析
 */

import { calculatePearsonCorrelation } from '../utils/statistics';

/**
 * 预设场景配置
 */
export const PRESET_SCENARIOS = {
  TIMING_PRIORITY: {
    id: 'timing_priority',
    name: '时序优先',
    description: '适合时序收敛困难的设计',
    weights: {
      TNS: 0.4,
      WNS: 0.3,
      HPWL: 0.2,
      Runtime: 0.1
    },
    keywords: ['timing', '时序', '收敛', 'frequency']
  },
  POWER_PRIORITY: {
    id: 'power_priority',
    name: '功耗优先',
    description: '适合低功耗设计',
    weights: {
      Leakage: 0.4,
      HPWL: 0.3,
      TNS: 0.2,
      Runtime: 0.1
    },
    keywords: ['power', '功耗', 'leakage', 'low-power']
  },
  AREA_PRIORITY: {
    id: 'area_priority',
    name: '面积优先',
    description: '适合面积受限设计',
    weights: {
      Cell_Area: 0.4,
      HPWL: 0.3,
      Congestion: 0.2,
      Runtime: 0.1
    },
    keywords: ['area', '面积', 'density', 'congestion']
  },
  BALANCED: {
    id: 'balanced',
    name: '均衡模式',
    description: '综合评估所有指标',
    weights: {}, // 动态计算均分
    keywords: ['balanced', '均衡', '综合']
  },
  RUNTIME_PRIORITY: {
    id: 'runtime_priority',
    name: '效率优先',
    description: '适合快速迭代场景',
    weights: {
      Runtime: 0.5,
      HPWL: 0.25,
      TNS: 0.15,
      Congestion: 0.1
    },
    keywords: ['runtime', '效率', '快速', '迭代']
  }
};

/**
 * 推荐权重配置
 * @param {Object} params - 参数
 * @returns {Object} 推荐结果
 */
export const recommendWeights = (params) => {
  const { metrics, scenario, customObjective, historicalData } = params;
  
  let recommendedWeights = {};
  
  if (scenario && PRESET_SCENARIOS[scenario]) {
    // 使用预设场景
    const preset = PRESET_SCENARIOS[scenario];
    recommendedWeights = mapPresetToMetrics(preset.weights, metrics);
  } else if (customObjective) {
    // 基于自定义目标
    recommendedWeights = generateWeightsFromObjective(customObjective, metrics);
  } else {
    // 自动推荐
    recommendedWeights = autoRecommendWeights(metrics, historicalData);
  }
  
  // 验证并归一化权重
  recommendedWeights = normalizeWeights(recommendedWeights, metrics);
  
  return {
    weights: recommendedWeights,
    scenario: scenario || 'auto',
    confidence: calculateConfidence(recommendedWeights, metrics),
    explanation: generateWeightExplanation(recommendedWeights, scenario)
  };
};

/**
 * 将预设权重映射到实际指标
 */
const mapPresetToMetrics = (presetWeights, actualMetrics) => {
  const weights = {};
  const totalWeight = Object.values(presetWeights).reduce((a, b) => a + b, 0);
  
  actualMetrics.forEach(metric => {
    // 尝试匹配预设权重
    const upperMetric = metric.toUpperCase();
    let matched = false;
    
    for (const [key, value] of Object.entries(presetWeights)) {
      if (upperMetric.includes(key.toUpperCase()) || key.toUpperCase().includes(upperMetric)) {
        weights[metric] = value;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // 未匹配的指标分配剩余权重
      weights[metric] = (1 - totalWeight) / actualMetrics.length;
    }
  });
  
  return weights;
};

/**
 * 从自定义目标生成权重
 */
const generateWeightsFromObjective = (objective, metrics) => {
  const weights = {};
  
  // 解析目标描述，提取关键词
  const keywords = objective.toLowerCase().split(/[,，\s]+/);
  
  metrics.forEach(metric => {
    const lowerMetric = metric.toLowerCase();
    let weight = 1 / metrics.length; // 默认均分
    
    // 根据关键词调整权重
    keywords.forEach(keyword => {
      if (lowerMetric.includes(keyword)) {
        weight *= 2; // 匹配的指标权重翻倍
      }
    });
    
    weights[metric] = weight;
  });
  
  return weights;
};

/**
 * 自动推荐权重
 */
const autoRecommendWeights = (metrics, historicalData) => {
  const weights = {};
  
  if (historicalData && historicalData.length > 0) {
    // 基于历史数据分析指标重要性
    const importance = analyzeMetricImportance(metrics, historicalData);
    metrics.forEach(metric => {
      weights[metric] = importance[metric] || 1;
    });
  } else {
    // 无