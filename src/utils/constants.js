export const Z_SCORE_95_PERCENT = 1.96;

export const CHART_BASE_RADIUS = 70;
export const CHART_MAX_IMPROVEMENT = 20;
export const CHART_Y_PADDING = 5;

export const CHART_WIDTH = {
  FULL: 'max-w-5xl',
  COMPACT: 'max-w-lg',
  NARROW: 'max-w-xs'
};

export const CHART_SIZE_OPTIONS = [
  { id: 'sm', label: '小', width: 'max-w-sm', scale: 0.75 },
  { id: 'md', label: '中', width: 'max-w-md', scale: 0.88 },
  { id: 'lg', label: '默认', width: 'max-w-lg', scale: 1 },
  { id: 'xl', label: '大', width: 'max-w-xl', scale: 1.25 },
  { id: '2xl', label: '特大', width: 'max-w-2xl', scale: 1.5 }
];

export const DEFAULT_CHART_SIZE = 'lg';

export const CHART_HEADER_STYLES = {
  SELECT: 'font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 text-xs',
  SELECT_ACCENT: 'font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-amber-100 text-amber-800 text-xs',
  LABEL: 'font-semibold text-white/80',
  LABEL_ACCENT: 'font-semibold text-amber-200',
  BUTTON: 'px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5',
  BUTTON_SELECTED: 'shadow-md',
  BUTTON_UNSELECTED: 'opacity-60 hover:opacity-100'
};

export const MAX_SAVED_DATASETS = 20;
export const MAX_FILE_SIZE_MB = 10;

export const API_TIMEOUT_MS = 60000;

export const NORMAL_CDF_COEFFICIENTS = {
  T_COEFFICIENT: 0.2316419,
  D_COEFFICIENT: 0.3989423,
  P_COEFFICIENTS: [0.3193815, -0.3565638, 1.781478, -1.821256, 1.330274]
};

export const OUTLIER_MULTIPLIER = 1.5;

export const DATA_GENERATOR_RANGES = {
  HPWL: { min: 5000, max: 100000 },
  TNS: { min: -10000, max: -100 },
  CONGESTION: { min: 0.9, max: 2.0 },
  RUNTIME: { min: 1000, max: 30000 },
  HB_COUNT: { min: 10, max: 1000 }
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

export const DEFAULT_LLM_CONFIG = {
  provider: 'deepseek',
  apiKey: '',
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  systemPrompt: `你是一位资深的EDA物理设计算法评估专家，拥有丰富的芯片设计流程经验。你的职责是基于完整的统计数据为算法优化提供专业、可操作的诊断建议。

**输出要求：**
1. 使用Markdown格式排版，结构清晰
2. 结论先行，数据支撑，避免空泛描述
3. 针对EDA领域使用专业术语（如时序收敛、绕线拥塞、功耗优化等）
4. 给出具体可执行的优化建议
5. 综合考虑所有指标，不要过度关注单一指标`,
  userPrompt: `## 算法综合评估任务

**对比配置：**
- 基线算法：{{baseAlgo}}
- 对比算法：{{compareAlgo}}
- 评估指标：{{allMetrics}}

---

## 一、全部指标统计数据汇总
{{allMetricsSummary}}

## 二、各指标异常案例（退化预警）
{{badCases}}

## 三、各指标最佳案例（改进最大）
{{topCases}}

## 四、大规模设计案例（扩展性参考）
\`\`\`json
{{largeCases}}
\`\`\`

---

## 请基于以上完整数据输出综合诊断报告：

### 🎯 1. 最终判定结论
- **推荐结论**：【推荐采用 {{compareAlgo}}】/【建议保持 {{baseAlgo}}】/【需修复后重测】
- **核心依据**：一句话概括关键数据支撑

### 📊 2. 全局指标综合分析
- 各指标改进/退化情况汇总
- 统计显著性分析（P-Value解读）
- 改进幅度评估（Geomean vs Arith Mean差异分析）
- 置信区间解读

### ⚖️ 3. Trade-off分析
- 各指标得失平衡评估
- 是否存在"拆东墙补西墙"的权衡
- 多目标优化的整体效果
- 综合性价比评估

### 🚨 4. 风险点诊断
- 退化案例的潜在原因分析
- 可能的设计特征或边界条件
- 规避建议

### 🏢 5. 扩展性与鲁棒性评估
- 大规模设计下的表现预测
- 算法稳定性评估
- 潜在风险点

### 💡 6. 优化建议
- 短期可执行的改进方向
- 中长期算法演进建议`
};

export const CORRELATION_ANALYSIS_PROMPT = {
  systemPrompt: `你是一位数据分析专家，专注于EDA（电子设计自动化）领域的数据关系分析。你的任务是基于相关性分析结果，为用户提供专业、易懂的解读和洞察。

**输出要求：**
1. 使用Markdown格式排版，简洁清晰
2. 用通俗语言解释统计概念
3. 结合EDA领域背景给出专业解读
4. 提供可操作的建议
5. 控制在300字以内`,
  userPrompt: `## 相关性分析解读任务

**分析配置：**
- X轴变量：{{corrX}}
- Y轴变量：{{corrY}} 改进率
- 数据点数量：{{dataPoints}}

**统计结果：**
- Pearson相关系数：{{pearsonR}}
- Spearman相关系数：{{spearmanR}}
- 线性回归斜率：{{slope}}
- R² 决定系数：{{rSquared}}
- 异常点数量：{{outlierCount}}

**数据分布特征：**
{{distributionInfo}}

---

## 请输出相关性解读报告：

### 📈 1. 相关性结论
- 相关性强度与方向判断
- 统计意义解读

### 💡 2. 业务洞察
- 对算法优化的启示
- 变量关系的实际意义

### ⚠️ 3. 注意事项
- 异常点影响
- 潜在的混淆因素`
};
