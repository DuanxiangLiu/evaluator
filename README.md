# EDA Algorithm Evaluator Pro

## 项目简介

EDA Algorithm Evaluator Pro 是一个专业的数据分析工具，用于评估和分析 EDA（Exploratory Data Analysis）算法的性能。它提供了丰富的数据可视化和统计分析功能，帮助用户快速了解数据特征和算法表现。

## 功能特点

### 核心功能
- **数据上传与解析**：支持 CSV 文件上传和解析
- **统计分析**：提供详细的统计指标计算
- **数据可视化**：包括箱线图、相关性分析、帕累托图和雷达图
- **AI 分析**：集成 DeepSeek、Gemini 和 OpenAI 等 AI 模型，提供智能数据分析
- **多算法比较**：支持多个算法结果的对比分析

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

## 项目结构

```
eda-evaluator-pro/
├── src/
│   ├── components/         # 组件目录
│   │   ├── charts/         # 图表组件
│   │   ├── layout/         # 布局组件
│   │   ├── modals/         # 模态框组件
│   │   └── ui/             # UI 组件
│   ├── context/            # 上下文管理
│   ├── services/           # 服务层
│   ├── utils/              # 工具函数
│   ├── App.jsx             # 主应用组件
│   └── main.jsx            # 应用入口
├── public/                 # 静态资源
├── index.html              # HTML 入口
├── package.json            # 项目配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
└── vite.config.js          # Vite 配置
```

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。
