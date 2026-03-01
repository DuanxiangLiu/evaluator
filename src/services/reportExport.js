import { generateAIInsights, getFallbackAnalysis } from './aiService.jsx';
import { formatIndustrialNumber } from '../utils/formatters.js';
import { calculateImprovement } from '../utils/statistics.js';

const REPORT_TEMPLATES = {
  standard: {
    name: '标准报告',
    sections: ['summary', 'statistics', 'metrics', 'ai_analysis', 'recommendations']
  },
  detailed: {
    name: '详细报告',
    sections: ['summary', 'statistics', 'metrics', 'cases', 'ai_analysis', 'recommendations', 'appendix']
  },
  summary: {
    name: '简要报告',
    sections: ['summary', 'ai_analysis']
  }
};

export const generateReportSummary = (stats, allMetricsStats, baseAlgo, compareAlgo) => {
  if (!stats) return null;
  
  const improvedMetrics = allMetricsStats.filter(m => m.stats?.geomeanImp > 0);
  const degradedMetrics = allMetricsStats.filter(m => m.stats?.geomeanImp < 0);
  const significantMetrics = allMetricsStats.filter(m => m.stats?.pValue < 0.05);
  
  let conclusion = 'inconclusive';
  if (stats.geomeanImp > 0 && stats.pValue < 0.05) {
    conclusion = 'recommended';
  } else if (stats.geomeanImp < 0 && stats.pValue < 0.05) {
    conclusion = 'not_recommended';
  } else if (stats.geomeanImp > 0) {
    conclusion = 'tentatively_recommended';
  }
  
  return {
    conclusion,
    baseAlgo,
    compareAlgo,
    geomeanImp: stats.geomeanImp,
    pValue: stats.pValue,
    nValid: stats.nValid,
    degradedCount: stats.degradedCount,
    improvedMetricsCount: improvedMetrics.length,
    degradedMetricsCount: degradedMetrics.length,
    significantMetricsCount: significantMetrics.length,
    totalMetrics: allMetricsStats.length
  };
};

export const generateStatisticsSection = (stats, allMetricsStats) => {
  if (!stats) return null;
  
  return {
    primaryMetric: {
      name: stats.metric || 'Unknown',
      geomeanImp: stats.geomeanImp,
      meanImp: stats.meanImp,
      std: stats.std,
      pValue: stats.pValue,
      ciLower: stats.ciLower,
      ciUpper: stats.ciUpper,
      nValid: stats.nValid,
      nTotal: stats.nTotalChecked,
      degradedCount: stats.degradedCount,
      maxImp: stats.maxImp,
      minImp: stats.minImp
    },
    allMetrics: allMetricsStats.map(m => ({
      name: m.metric,
      geomeanImp: m.stats?.geomeanImp,
      meanImp: m.stats?.meanImp,
      pValue: m.stats?.pValue,
      nValid: m.stats?.nValid,
      degradedCount: m.stats?.degradedCount,
      isSignificant: m.stats?.pValue < 0.05
    }))
  };
};

export const generateCasesSection = (stats, parsedData, baseAlgo, compareAlgo, activeMetric) => {
  if (!stats?.validCases) return null;
  
  const topImprovements = [...stats.validCases]
    .filter(c => c.imp > 0)
    .sort((a, b) => b.imp - a.imp)
    .slice(0, 10)
    .map(c => ({
      case: c.Case,
      baseValue: c.bVal,
      compareValue: c.cVal,
      improvement: c.imp,
      outlierType: c.outlierType
    }));
  
  const topDegradations = [...stats.validCases]
    .filter(c => c.imp < 0)
    .sort((a, b) => a.imp - b.imp)
    .slice(0, 10)
    .map(c => ({
      case: c.Case,
      baseValue: c.bVal,
      compareValue: c.cVal,
      improvement: c.imp,
      outlierType: c.outlierType
    }));
  
  const outliers = stats.validCases.filter(c => c.outlierType !== 'normal');
  
  return {
    topImprovements,
    topDegradations,
    outliers: outliers.slice(0, 10),
    totalOutliers: outliers.length
  };
};

export const generateAIReport = async (config, params) => {
  const { stats, allMetricsStats, baseAlgo, compareAlgo, activeMetric, parsedData, selectedCases, metaColumns } = params;
  
  const reportData = {
    metadata: {
      title: `EDA算法评估报告 - ${baseAlgo} vs ${compareAlgo}`,
      generatedAt: new Date().toISOString(),
      baseAlgo,
      compareAlgo,
      activeMetric,
      template: 'standard'
    },
    summary: generateReportSummary(stats, allMetricsStats, baseAlgo, compareAlgo),
    statistics: generateStatisticsSection(stats, allMetricsStats),
    cases: generateCasesSection(stats, parsedData, baseAlgo, compareAlgo, activeMetric)
  };
  
  if (config?.apiKey || config?.provider === 'gemini') {
    try {
      const aiInsights = await generateAIInsights(
        config, baseAlgo, compareAlgo, activeMetric,
        stats, allMetricsStats, parsedData, selectedCases, metaColumns
      );
      reportData.aiAnalysis = aiInsights;
      reportData.aiAvailable = true;
    } catch (error) {
      reportData.aiAnalysis = getFallbackAnalysis(stats, allMetricsStats, baseAlgo, compareAlgo);
      reportData.aiAvailable = false;
      reportData.aiError = error.message;
    }
  } else {
    reportData.aiAnalysis = getFallbackAnalysis(stats, allMetricsStats, baseAlgo, compareAlgo);
    reportData.aiAvailable = false;
    reportData.aiError = 'API Key未配置';
  }
  
  reportData.recommendations = generateRecommendations(reportData);
  
  return reportData;
};

const generateRecommendations = (reportData) => {
  const recommendations = [];
  
  if (!reportData.summary) return recommendations;
  
  const { conclusion, geomeanImp, pValue, degradedCount, nValid } = reportData.summary;
  
  if (conclusion === 'recommended') {
    recommendations.push({
      type: 'adoption',
      priority: 'high',
      message: `建议采用 ${reportData.metadata.compareAlgo}，统计显著性验证通过`
    });
  } else if (conclusion === 'not_recommended') {
    recommendations.push({
      type: 'rejection',
      priority: 'high',
      message: `建议保持 ${reportData.metadata.baseAlgo}，新算法性能退化显著`
    });
  } else if (conclusion === 'tentatively_recommended') {
    recommendations.push({
      type: 'caution',
      priority: 'medium',
      message: '改进趋势积极但统计显著性不足，建议增加测试用例'
    });
  }
  
  if (degradedCount > nValid * 0.2) {
    recommendations.push({
      type: 'investigation',
      priority: 'medium',
      message: `${degradedCount}个案例出现退化，建议分析退化原因`
    });
  }
  
  if (pValue > 0.1) {
    recommendations.push({
      type: 'data_collection',
      priority: 'low',
      message: 'P值较高，建议收集更多数据以提高统计可靠性'
    });
  }
  
  return recommendations;
};

export const exportReportToJSON = (reportData) => {
  return JSON.stringify(reportData, null, 2);
};

export const exportReportToMarkdown = (reportData) => {
  const { metadata, summary, statistics, aiAnalysis, recommendations } = reportData;
  
  const conclusionLabels = {
    recommended: '✅ 推荐采用',
    not_recommended: '❌ 不建议采用',
    tentatively_recommended: '⚠️ 谨慎推荐',
    inconclusive: '❓ 结论不确定'
  };
  
  let markdown = `# ${metadata.title}\n\n`;
  markdown += `> 生成时间: ${new Date(metadata.generatedAt).toLocaleString('zh-CN')}\n\n`;
  markdown += `**对比**: ${metadata.baseAlgo} vs ${metadata.compareAlgo}\n\n`;
  
  if (summary) {
    markdown += `## 📊 执行摘要\n\n`;
    markdown += `**结论**: ${conclusionLabels[summary.conclusion] || '未知'}\n\n`;
    markdown += `| 指标 | 数值 |\n|------|------|\n`;
    markdown += `| 几何平均改进率 | ${summary.geomeanImp?.toFixed(2) || 'N/A'}% |\n`;
    markdown += `| P值 | ${summary.pValue?.toFixed(4) || 'N/A'} |\n`;
    markdown += `| 有效样本数 | ${summary.nValid || 0} |\n`;
    markdown += `| 退化案例数 | ${summary.degradedCount || 0} |\n\n`;
  }
  
  if (statistics?.allMetrics) {
    markdown += `## 📈 统计分析\n\n`;
    markdown += `| 指标 | Geomean改进 | P值 | 样本数 | 显著性 |\n`;
    markdown += `|------|-------------|-----|--------|--------|\n`;
    statistics.allMetrics.forEach(m => {
      const sig = m.isSignificant ? '✓' : '-';
      markdown += `| ${m.name} | ${m.geomeanImp?.toFixed(2) || 'N/A'}% | ${m.pValue?.toFixed(4) || 'N/A'} | ${m.nValid || 0} | ${sig} |\n`;
    });
    markdown += '\n';
  }
  
  if (aiAnalysis) {
    markdown += `## 🤖 AI分析报告\n\n`;
    markdown += `${aiAnalysis}\n\n`;
  }
  
  if (recommendations?.length > 0) {
    markdown += `## 💡 建议\n\n`;
    recommendations.forEach(rec => {
      const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵';
      markdown += `- ${priorityIcon} ${rec.message}\n`;
    });
    markdown += '\n';
  }
  
  markdown += `---\n\n`;
  markdown += `*本报告由 EDA Algorithm Evaluator 自动生成*\n`;
  
  return markdown;
};

export const exportReportToHTML = (reportData) => {
  const { metadata, summary, statistics, aiAnalysis, recommendations } = reportData;
  
  const conclusionLabels = {
    recommended: { text: '推荐采用', class: 'text-green-600' },
    not_recommended: { text: '不建议采用', class: 'text-red-600' },
    tentatively_recommended: { text: '谨慎推荐', class: 'text-amber-600' },
    inconclusive: { text: '结论不确定', class: 'text-gray-600' }
  };
  
  const conclusionInfo = conclusionLabels[summary?.conclusion] || conclusionLabels.inconclusive;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .prose h2 { margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 600; }
    .prose h3 { margin-top: 1rem; margin-bottom: 0.5rem; font-size: 1.1rem; font-weight: 600; }
    .prose p { margin-bottom: 0.5rem; }
    .prose ul { list-style-type: disc; padding-left: 1.5rem; }
    .prose li { margin-bottom: 0.25rem; }
    @media print {
      body { background: white; }
      .no-print { display: none; }
    }
  </style>
</head>
<body class="bg-gray-50 p-8">
  <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
    <header class="border-b border-gray-200 pb-6 mb-6">
      <h1 class="text-2xl font-bold text-gray-900">${metadata.title}</h1>
      <p class="text-sm text-gray-500 mt-2">生成时间: ${new Date(metadata.generatedAt).toLocaleString('zh-CN')}</p>
      <p class="text-sm text-gray-500">对比: ${metadata.baseAlgo} vs ${metadata.compareAlgo}</p>
    </header>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
        执行摘要
      </h2>
      <div class="bg-gray-50 rounded-lg p-4">
        <p class="text-lg ${conclusionInfo.class} font-semibold mb-2">${conclusionInfo.text}</p>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">几何平均改进率:</span>
            <span class="font-medium ml-2">${summary?.geomeanImp?.toFixed(2) || 'N/A'}%</span>
          </div>
          <div>
            <span class="text-gray-500">P值:</span>
            <span class="font-medium ml-2">${summary?.pValue?.toFixed(4) || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">有效样本数:</span>
            <span class="font-medium ml-2">${summary?.nValid || 0}</span>
          </div>
          <div>
            <span class="text-gray-500">退化案例数:</span>
            <span class="font-medium ml-2">${summary?.degradedCount || 0}</span>
          </div>
        </div>
      </div>
    </section>

    ${statistics ? `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
        统计分析
      </h2>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-gray-700">指标</th>
              <th class="px-4 py-2 text-right font-medium text-gray-700">Geomean改进</th>
              <th class="px-4 py-2 text-right font-medium text-gray-700">P值</th>
              <th class="px-4 py-2 text-right font-medium text-gray-700">样本数</th>
              <th class="px-4 py-2 text-center font-medium text-gray-700">显著性</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${statistics.allMetrics.map(m => `
              <tr class="${m.name === metadata.activeMetric ? 'bg-indigo-50' : ''}">
                <td class="px-4 py-2 font-medium">${m.name}</td>
                <td class="px-4 py-2 text-right ${m.geomeanImp > 0 ? 'text-green-600' : m.geomeanImp < 0 ? 'text-red-600' : ''}">${m.geomeanImp?.toFixed(2) || 'N/A'}%</td>
                <td class="px-4 py-2 text-right">${m.pValue?.toFixed(4) || 'N/A'}</td>
                <td class="px-4 py-2 text-right">${m.nValid || 0}</td>
                <td class="px-4 py-2 text-center">${m.isSignificant ? '<span class="text-green-600">✓</span>' : '<span class="text-gray-400">-</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
    ` : ''}

    ${aiAnalysis ? `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
        AI分析报告
      </h2>
      <div class="prose max-w-none bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 text-gray-700">
        ${formatAIAnalysisHTML(aiAnalysis)}
      </div>
    </section>
    ` : ''}

    ${recommendations?.length > 0 ? `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
        建议
      </h2>
      <ul class="space-y-2">
        ${recommendations.map(rec => `
          <li class="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <span class="w-2 h-2 mt-2 rounded-full ${rec.priority === 'high' ? 'bg-red-500' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}"></span>
            <span class="text-gray-700">${rec.message}</span>
          </li>
        `).join('')}
      </ul>
    </section>
    ` : ''}

    <footer class="border-t border-gray-200 pt-6 mt-8 text-center text-sm text-gray-500">
      <p>本报告由 EDA Algorithm Evaluator 自动生成</p>
      <p class="mt-1">报告生成时间: ${new Date(metadata.generatedAt).toLocaleString('zh-CN')}</p>
    </footer>
  </div>
</body>
</html>`;
};

const formatAIAnalysisHTML = (aiAnalysis) => {
  if (!aiAnalysis) return '';
  
  return aiAnalysis
    .split('\n')
    .map(line => {
      if (line.startsWith('## ')) {
        return `<h2 class="text-lg font-bold text-indigo-800 mt-4 mb-2">${line.replace('## ', '')}</h2>`;
      }
      if (line.startsWith('### ')) {
        return `<h3 class="text-base font-semibold text-indigo-700 mt-3 mb-1">${line.replace('### ', '')}</h3>`;
      }
      if (line.startsWith('- ')) {
        return `<li class="ml-4">${line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;
      }
      if (line.trim() === '---') {
        return '<hr class="my-4 border-gray-200" />';
      }
      if (line.trim()) {
        return `<p class="mb-1">${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
      }
      return '';
    })
    .join('\n');
};

export const downloadReport = (reportData, format = 'json') => {
  let content, filename, mimeType;
  
  switch (format) {
    case 'markdown':
      content = exportReportToMarkdown(reportData);
      filename = `eda_report_${Date.now()}.md`;
      mimeType = 'text/markdown';
      break;
    case 'json':
      content = exportReportToJSON(reportData);
      filename = `eda_report_${Date.now()}.json`;
      mimeType = 'application/json';
      break;
    case 'html':
    default:
      content = exportReportToHTML(reportData);
      filename = `eda_report_${Date.now()}.html`;
      mimeType = 'text/html';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadAIInsights = (insights, baseAlgo, compareAlgo, format = 'markdown') => {
  const reportData = {
    metadata: {
      title: `EDA算法评估报告 - ${baseAlgo} vs ${compareAlgo}`,
      generatedAt: new Date().toISOString(),
      baseAlgo,
      compareAlgo
    },
    aiAnalysis: insights
  };
  
  downloadReport(reportData, format);
};

export { REPORT_TEMPLATES };
export default {
  generateReportSummary,
  generateStatisticsSection,
  generateCasesSection,
  generateAIReport,
  exportReportToJSON,
  exportReportToMarkdown,
  exportReportToHTML,
  downloadReport,
  downloadAIInsights,
  REPORT_TEMPLATES
};
