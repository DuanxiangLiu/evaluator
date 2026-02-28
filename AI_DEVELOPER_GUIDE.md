# EDA Algorithm Evaluator - AI 开发指南

> 本文档为 AI 开发助手提供项目核心信息。详细规则请参阅 `.trae/rules/` 目录。

## 1. 项目概览

| 属性 | 描述 |
|------|------|
| **项目名称** | EDA Algorithm Evaluator (eda-evaluator) |
| **版本** | v1.1.0 |
| **类型** | 纯前端单页应用 (SPA) |
| **技术栈** | React 18 + Vite 5 + Tailwind CSS 3 + Lucide React |

## 2. 开发命令

```bash
npm run dev      # 启动开发服务器 (端口 3000)
npm run build    # 生产构建
npm run preview  # 预览构建结果
```

## 3. 目录结构

```
src/
├── components/           # React 组件
│   ├── charts/          # 图表组件 (BoxPlot, Correlation, Radar, Pareto)
│   ├── common/          # 通用组件 (ChartHeader, StatusBadge, Toast)
│   ├── layout/          # 布局组件 (Header, Sidebar, ControlBar)
│   └── modals/          # 模态框 (AiConfigModal, DeepDiveModal)
├── context/             # 状态管理 (AppContext.jsx)
├── services/            # 业务服务 (dataService, aiService)
├── utils/               # 工具函数 (statistics, formatters, constants)
└── App.jsx              # 主应用组件
```

## 4. 核心模块

| 模块 | 功能 |
|------|------|
| `AppContext.jsx` | 全局状态管理 |
| `dataService.js` | CSV 解析、统计计算、数据导出 |
| `aiService.jsx` | LLM 集成 (DeepSeek/Gemini/OpenAI) |
| `statistics.js` | Wilcoxon 检验、改进率计算 |

## 5. 数据格式

CSV 文件要求：
- 第一列：Case 名称
- 元数据列：`#Inst`、`#Net` 等
- 指标列：`m_{算法}_{指标}` (如 `m_Base_HPWL`)

## 6. 重要规则

1. **改进率计算**：使用 `calculateImprovement()` (statistics.js)
2. **数字格式化**：使用 `formatIndustrialNumber()` (formatters.js)
3. **图表标题**：使用 `ChartHeader` 组件
4. **API 调用**：使用 `fetchWithTimeout()` 支持超时
5. **本地存储**：使用 `safeLocalStorage` 工具

## 7. 扩展指南

### 添加新图表
1. 在 `src/components/charts/` 创建组件
2. 使用 `ChartHeader` 作为标题栏
3. 在 `App.jsx` 添加 Tab 和路由

### 添加新指标
1. 在 `dataService.js` 的 `EDA_METRICS_CONFIG` 添加配置
2. 配置名称、单位、优化方向

### 添加新 LLM 提供商
1. 在 `aiService.jsx` 添加 API 调用逻辑
2. 在 `AiConfigModal.jsx` 添加配置选项

---

## 文档更新日志

| 日期 | 变更 |
|------|------|
| 2026-02-28 | 简化文档，创建 .trae/ 配置目录 |
