export const Z_SCORE_95_PERCENT = 1.96;

export const CHART_BASE_RADIUS = 70;
export const CHART_MAX_IMPROVEMENT = 20;
export const CHART_Y_PADDING = 5;

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
  systemPrompt: '你是一位顶级的EDA物理设计与算法评估专家。请基于提供的数据输出结构化的诊断报告，务必将最终推荐结论放在最前面。请使用Markdown排版。',
  userPrompt: `我正在评估EDA新算法。Baseline = {{baseAlgo}}, Compare = {{compareAlgo}}。

【焦点指标 ({{activeMetric}}) 异常预警】
{{badCases}}

【全局多目标表现 (全面权衡)】
{{allMetricsSummary}}

请按以下结构输出报告：
### 1. 🏆 最终对比判定
（明确结论：【推荐采用 {{compareAlgo}}】、【建议保持 {{baseAlgo}}】 或 【需修复重测】）

### 2. 📊 全局 Trade-off 分析
（总体得失，是否在特定指标间存在拆东墙补西墙？）

### 3. 🚨 异常深潜诊断
（推测退化陷阱及物理原因）

### 4. 🏢 扩展性评估
（基于巨型设计评估在大规模 Instance 下的鲁棒性）`
};
