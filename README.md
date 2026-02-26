# EDA 算法评估器

专业的 EDA 算法性能评估工具，提供数据可视化和智能分析功能。

## 功能特点

- 数据上传与解析（CSV 格式）
- 统计分析（几何平均改进率、P-Value、置信区间等）
- 数据可视化（箱线图、相关性分析、帕累托图、雷达图）
- AI 智能分析（支持 DeepSeek、Gemini、OpenAI）
- 多算法对比与 QoR 综合评估

## 快速开始

### 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

### 在线使用

https://duanxiangliu.github.io/evaluator/

## 技术栈

- React 18 + Vite
- Tailwind CSS
- Lucide React

## 数据格式

CSV 文件要求：
- 第一列：Case 名称
- 元数据列：Instances、Nets 等设计属性
- 指标列格式：m_算法名_指标名（如 m_Base_HPWL、m_Algo1_HPWL）

## 许可证

MIT
