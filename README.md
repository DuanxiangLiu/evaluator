# EDA 算法评估器 v1.1

## 项目简介

EDA 算法评估器是一个专业的数据分析工具，用于评估和分析 EDA（Exploratory Data Analysis）算法的性能。它提供了丰富的数据可视化和统计分析功能，帮助用户快速了解数据特征和算法表现。

## 功能特点

### 核心功能
- **数据上传与解析**：支持 CSV 文件上传和解析
- **统计分析**：提供详细的统计指标计算，包括几何平均改进率、算术平均改进率、P-Value、置信区间等
- **数据可视化**：包括箱线图、相关性分析、帕累托图和雷达图
- **AI 分析**：集成 DeepSeek、Gemini 和 OpenAI 等 AI 模型，提供智能数据分析
- **多算法比较**：支持多个算法结果的对比分析
- **QoR 综合评估**：基于多指标加权综合评估算法性能

### 技术栈
- **前端框架**：React 18 + Vite
- **样式库**：Tailwind CSS
- **图标库**：Lucide React
- **数据可视化**：内置图表组件
- **AI 集成**：支持多种 AI 模型

## 如何使用

### 本地开发
1. 克隆仓库
   ```bash
   git clone https://github.com/DuanxiangLiu/evaluator.git
   cd evaluator
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动开发服务器
   ```bash
   npm run dev
   ```

4. 访问 http://localhost:3000

### 在线使用
访问 GitHub Pages 部署的版本：
https://duanxiangliu.github.io/evaluator/

## 主要功能模块

### 1. 数据源管理
- **预设数据源**：提供 5 种预设数据集，每个数据集包含 30 个测试案例
  - 综合设计数据集
  - 小型设计数据集
  - 大型设计数据集
  - 功耗优化数据集
  - 时序优化数据集
- **文件上传**：支持 CSV 文件上传
- **手动输入**：支持直接粘贴 CSV 数据

### 2. 统计分析
- **Geomean 改进**：几何平均改进率，工业界评估算法整体改进比例的绝对标准
- **Arith Mean**：算术平均改进率，直观的算术平均值
- **P-Value**：Wilcoxon 符号秩检验，判断数据分布的改变是否真实有效
- **95% 置信区间**：评估算法表现波动的 95% 上下限预测
- **退化案例数**：改进率 < 0% 的案例总数
- **最大退化幅度**：Worst Case 分析，评估算法在最差情况下的表现

### 3. 数据可视化
- **详细数据表格**：包含所有底层明细数据，支持排序和筛选
- **箱线图**：展示数据分布和离群值
- **特征相关性**：分析属性与指标之间的相关性
- **帕累托投影**：多目标优化分析
- **全局多维雷达图**：支持多算法对比，可勾选显示不同算法

### 4. QoR 综合评估
- **权重配置**：为每个指标分配权重
- **算法选择**：选择要评估的算法
- **综合得分排名**：基于权重计算综合得分
- **详细指标得分**：展示各指标的详细得分

### 5. AI 智能诊断
- **多模型支持**：支持 DeepSeek、Gemini、OpenAI 等
- **智能分析**：基于数据生成专业诊断报告
- **Markdown 渲染**：支持 Markdown 格式的报告展示

## 配置说明

### AI 配置
在使用 AI 分析功能前，需要配置 AI 模型的 API 密钥：
1. 点击顶部导航栏的 "AI 分析" 选项卡
2. 点击 "配置 AI" 按钮
3. 选择 AI 提供商并输入相应的 API 密钥
4. 点击 "保存配置" 按钮

### 支持的 AI 提供商
- DeepSeek
- Gemini
- OpenAI

## 数据格式说明

### CSV 格式要求
- **第一列**：Case 名称（测试用例标识）
- **元数据列**：如 Instances、Nets 等设计属性
- **指标列格式**：m_算法名_指标名
- **示例**：m_Base_HPWL, m_Algo1_HPWL
- **支持算法**：Base（基线）、Algo1、Algo2 等
- **缺失值**：使用 NaN 或 NA 表示

### 内置指标
- **物理设计指标**：HPWL、TNS、WNS、Power、Runtime、Hb_Count、Leakage、Cell_Area、Metal_Layers
- **性能指标**：Frequency、Throughput、IPC
- **可靠性指标**：MTBF、EDP

## 项目结构

```
eda-evaluator-pro/
├── src/
│   ├── components/         # 组件目录
│   │   ├── charts/         # 图表组件
│   │   │   ├── BoxPlotChart.jsx
│   │   │   ├── CorrelationChart.jsx
│   │   │   ├── ParetoChart.jsx
│   │   │   ├── RadarChart.jsx
│   │   │   └── QoRSimulator.jsx
│   │   ├── layout/         # 布局组件
│   │   ├── modals/         # 模态框组件
│   │   └── ui/             # UI 组件
│   ├── context/            # 上下文管理
│   ├── services/           # 服务层
│   ├── utils/              # 工具函数
│   │   ├── dataGenerator.js # 数据生成器
│   │   ├── formatters.js
│   │   └── statistics.js
│   ├── App.jsx             # 主应用组件
│   └── main.jsx            # 应用入口
├── public/                 # 静态资源
├── index.html              # HTML 入口
├── package.json            # 项目配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
└── vite.config.js          # Vite 配置
```

## 部署说明

项目使用 GitHub Pages 进行部署：
1. 构建项目
   ```bash
   npm run build
   ```

2. 部署到 GitHub Pages
   ```bash
   npm run deploy
   ```

## 更新日志

### v1.1 (2026-02-26)
- **SEO 优化**：改进 meta 标签，添加关键词和 Open Graph 标签
- **用户体验**：在标题栏添加 GitHub 链接按钮
- **版本标识**：优化版本号显示样式
- **代码质量**：优化项目结构和配置

### v1.0 (2026-02-26)
- 初始版本发布
- 实现核心统计分析功能
- 实现多种数据可视化图表
- 集成 AI 智能诊断功能
- 实现 QoR 综合评估功能
- 优化全局多维雷达图，支持多算法对比
- 丰富预设数据集，每个数据集包含 30 个测试案例
- 全面优化所有问号说明，提供更详细的帮助信息

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。
