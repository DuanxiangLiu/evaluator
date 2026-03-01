# 算法对比器

算法性能对比分析工具，支持多维度统计分析、可视化和 AI 智能诊断。

> **⚠️ 声明**：本项目由 AI 辅助构建，仅供学习参考。

## 功能

- **数据导入**：CSV 文件上传或直接粘贴
- **统计分析**：改进率、P-Value、置信区间
- **可视化**：箱线图、相关性分析、帕累托图、雷达图
- **AI 诊断**：支持 DeepSeek、Gemini、OpenAI
- **QoR 模拟器**：多指标权重综合评估

## 快速开始

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 数据格式

CSV 文件要求：
- 第一列：Case 名称
- 元数据列：`#Inst`、`#Net` 等
- 指标列：`m_{算法}_{指标}`（如 `m_Base_HPWL`）

## 技术栈

React 18 + Vite 5 + Tailwind CSS 3 + Lucide React

## 许可证

MIT
