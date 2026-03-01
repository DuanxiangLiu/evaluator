import { formatIndustrialNumber } from '../utils/formatters.js';
import { calculateImprovement } from '../utils/statistics.js';

const generateQuickReport = (params) => {
  const { stats, allMetricsStats, baseAlgo, compareAlgo, activeMetric } = params;
  
  if (!stats) return null;
  
  const significantMetrics = allMetricsStats.filter(m => m.stats?.pValue < 0.05);
  const improvedMetrics = allMetricsStats.filter(m => m.stats?.geomeanImp > 0);
  
  let conclusion = 'inconclusive';
  let recommendation = '';
  
  if (stats.geomeanImp > 0 && stats.pValue < 0.05) {
    conclusion = 'recommended';
    recommendation = `建议采用 ${compareAlgo}，统计显著性验证通过，预期改进 ${stats.geomeanImp.toFixed(2)}%`;
  } else if (stats.geomeanImp < 0 && stats.pValue < 0.05) {
    conclusion = 'not_recommended';
    recommendation = `建议保持 ${baseAlgo}，新算法性能退化显著`;
  } else if (stats.geomeanImp > 0) {
    conclusion = 'tentatively_recommended';
    recommendation = '改进趋势积极但统计显著性不足，建议增加测试用例';
  } else {
    recommendation = '数据不足以支持明确建议，需要更多测试';
  }
  
  return {
    metadata: {
      title: `快速摘要 - ${baseAlgo} vs ${compareAlgo}`,
      generatedAt: new Date().toISOString(),
      baseAlgo,
      compareAlgo,
      activeMetric,
      mode: 'quick'
    },
    summary: {
      conclusion,
      recommendation,
      geomeanImp: stats.geomeanImp,
      pValue: stats.pValue,
      nValid: stats.nValid,
      degradedCount: stats.degradedCount
    },
    keyMetrics: {
      primary: {
        name: activeMetric,
        geomeanImp: stats.geomeanImp,
        pValue: stats.pValue,
        isSignificant: stats.pValue < 0.05
      },
      significant: significantMetrics.slice(0, 5).map(m => ({
        name: m.metric,
        geomeanImp: m.stats?.geomeanImp,
        pValue: m.stats?.pValue
      })),
      improved: improvedMetrics.length,
      total: allMetricsStats.length
    }
  };
};

const generateDetailedReport = (params) => {
  const { stats, allMetricsStats, baseAlgo, compareAlgo, activeMetric, parsedData, selectedCases, metaColumns, aiInsights } = params;
  
  const quickReport = generateQuickReport(params);
  if (!quickReport) return null;
  
  const topImprovements = stats?.validCases
    ? [...stats.validCases]
        .filter(c => c.imp > 0)
        .sort((a, b) => b.imp - a.imp)
        .slice(0, 10)
        .map(c => ({
          case: c.Case,
          baseValue: c.bVal,
          compareValue: c.cVal,
          improvement: c.imp,
          metadata: metaColumns?.reduce((acc, col) => {
            acc[col] = c[col];
            return acc;
          }, {})
        }))
    : [];
  
  const topDegradations = stats?.validCases
    ? [...stats.validCases]
        .filter(c => c.imp < 0)
        .sort((a, b) => a.imp - b.imp)
        .slice(0, 10)
        .map(c => ({
          case: c.Case,
          baseValue: c.bVal,
          compareValue: c.cVal,
          improvement: c.imp,
          metadata: metaColumns?.reduce((acc, col) => {
            acc[col] = c[col];
            return acc;
          }, {})
        }))
    : [];
  
  const outliers = stats?.validCases
    ? stats.validCases
        .filter(c => c.outlierType !== 'normal')
        .slice(0, 10)
        .map(c => ({
          case: c.Case,
          improvement: c.imp,
          outlierType: c.outlierType,
          baseValue: c.bVal,
          compareValue: c.cVal
        }))
    : [];
  
  return {
    ...quickReport,
    metadata: {
      ...quickReport.metadata,
      title: `详细分析报告 - ${baseAlgo} vs ${compareAlgo}`,
      mode: 'detailed'
    },
    statistics: {
      primary: {
        name: activeMetric,
        geomeanImp: stats?.geomeanImp,
        meanImp: stats?.meanImp,
        median: stats?.median,
        std: stats?.std,
        pValue: stats?.pValue,
        ciLower: stats?.ciLower,
        ciUpper: stats?.ciUpper,
        nValid: stats?.nValid,
        nTotal: stats?.nTotalChecked,
        degradedCount: stats?.degradedCount,
        maxImp: stats?.maxImp,
        minImp: stats?.minImp
      },
      allMetrics: allMetricsStats.map(m => ({
        name: m.metric,
        geomeanImp: m.stats?.geomeanImp,
        meanImp: m.stats?.meanImp,
        median: m.stats?.median,
        std: m.stats?.std,
        pValue: m.stats?.pValue,
        nValid: m.stats?.nValid,
        degradedCount: m.stats?.degradedCount,
        isSignificant: m.stats?.pValue < 0.05
      }))
    },
    cases: {
      topImprovements,
      topDegradations,
      outliers,
      totalOutliers: outliers.length
    },
    aiAnalysis: aiInsights || null,
    recommendations: generateRecommendations(quickReport.summary, stats)
  };
};

const generateExecutiveReport = (params) => {
  const { stats, allMetricsStats, baseAlgo, compareAlgo, activeMetric, parsedData } = params;
  
  const quickReport = generateQuickReport(params);
  if (!quickReport) return null;
  
  const improvedMetrics = allMetricsStats.filter(m => m.stats?.geomeanImp > 0);
  const degradedMetrics = allMetricsStats.filter(m => m.stats?.geomeanImp < 0);
  const significantMetrics = allMetricsStats.filter(m => m.stats?.pValue < 0.05);
  
  const businessImpact = {
    overallImprovement: stats?.geomeanImp || 0,
    confidence: stats?.pValue < 0.05 ? 'high' : stats?.pValue < 0.1 ? 'medium' : 'low',
    riskLevel: (stats?.degradedCount / stats?.nValid) > 0.2 ? 'high' : 
               (stats?.degradedCount / stats?.nValid) > 0.1 ? 'medium' : 'low',
    affectedAreas: {
      improved: improvedMetrics.length,
      degraded: degradedMetrics.length,
      neutral: allMetricsStats.length - improvedMetrics.length - degradedMetrics.length
    }
  };
  
  const riskAssessment = {
    statisticalRisk: stats?.pValue > 0.1 ? '数据统计显著性不足，结论可靠性较低' : 
                     stats?.pValue > 0.05 ? '统计显著性处于临界值，建议增加样本量' : 
                     '统计显著性良好',
    operationalRisk: businessImpact.riskLevel === 'high' ? 
                     `${stats?.degradedCount} 个案例出现退化，需要详细评估` :
                     businessImpact.riskLevel === 'medium' ?
                     '部分案例存在退化风险，建议分阶段部署' :
                     '风险可控，建议推进',
    dataQualityRisk: stats?.nValid < 30 ? '样本量较小，建议补充测试' :
                     stats?.nValid < 100 ? '样本量适中，结论具有一定参考价值' :
                     '样本量充足，结论可靠'
  };
  
  return {
    ...quickReport,
    metadata: {
      ...quickReport.metadata,
      title: `执行报告 - ${baseAlgo} vs ${compareAlgo}`,
      mode: 'executive'
    },
    executiveSummary: {
      headline: stats?.geomeanImp > 0 ? 
                `${compareAlgo} 相比 ${baseAlgo} 平均改进 ${Math.abs(stats?.geomeanImp).toFixed(2)}%` :
                `${compareAlgo} 相比 ${baseAlgo} 平均退化 ${Math.abs(stats?.geomeanImp).toFixed(2)}%`,
      keyFindings: [
        `基于 ${stats?.nValid} 个有效测试案例`,
        `${significantMetrics.length} 个指标达到统计显著性`,
        `${improvedMetrics.length} 个指标改进，${degradedMetrics.length} 个指标退化`,
        `${stats?.degradedCount} 个案例出现性能退化`
      ],
      recommendation: quickReport.summary.recommendation
    },
    businessImpact,
    riskAssessment,
    recommendations: generateRecommendations(quickReport.summary, stats)
  };
};

const generateTechnicalReport = (params) => {
  const { stats, allMetricsStats, baseAlgo, compareAlgo, activeMetric, parsedData } = params;
  
  const detailedReport = generateDetailedReport(params);
  if (!detailedReport) return null;
  
  const methodology = {
    statisticalTests: [
      {
        name: 'Wilcoxon Signed-Rank Test',
        purpose: '非参数检验，评估改进的统计显著性',
        result: stats?.pValue,
        interpretation: stats?.pValue < 0.05 ? '显著' : '不显著'
      },
      {
        name: 'Geometric Mean',
        purpose: '计算平均改进率，减少极值影响',
        result: stats?.geomeanImp,
        unit: '%'
      },
      {
        name: 'Confidence Interval (95%)',
        purpose: '估计改进率的置信范围',
        result: `[${stats?.ciLower?.toFixed(2)}%, ${stats?.ciUpper?.toFixed(2)}%]`
      }
    ],
    dataProcessing: {
      totalCases: parsedData?.length || 0,
      validCases: stats?.nValid || 0,
      excludedCases: (parsedData?.length || 0) - (stats?.nValid || 0),
      outlierDetection: 'IQR method (1.5x)'
    }
  };
  
  const significanceTests = allMetricsStats.map(m => ({
    metric: m.metric,
    pValue: m.stats?.pValue,
    isSignificant: m.stats?.pValue < 0.05,
    significanceLevel: m.stats?.pValue < 0.01 ? 'highly_significant' :
                       m.stats?.pValue < 0.05 ? 'significant' :
                       m.stats?.pValue < 0.1 ? 'marginal' : 'not_significant',
    effectSize: Math.abs(m.stats?.geomeanImp || 0),
    sampleSize: m.stats?.nValid
  }));
  
  return {
    ...detailedReport,
    metadata: {
      ...detailedReport.metadata,
      title: `技术深潜报告 - ${baseAlgo} vs ${compareAlgo}`,
      mode: 'technical'
    },
    methodology,
    significanceTests,
    outlierAnalysis: {
      total: detailedReport.cases.totalOutliers,
      types: detailedReport.cases.outliers.reduce((acc, o) => {
        acc[o.outlierType] = (acc[o.outlierType] || 0) + 1;
        return acc;
      }, {}),
      cases: detailedReport.cases.outliers
    }
  };
};

const generateRecommendations = (summary, stats) => {
  const recommendations = [];
  
  if (!summary) return recommendations;
  
  const { conclusion, geomeanImp, pValue, degradedCount, nValid } = summary;
  
  if (conclusion === 'recommended') {
    recommendations.push({
      type: 'adoption',
      priority: 'high',
      message: `建议采用新算法，统计显著性验证通过`,
      details: `几何平均改进 ${geomeanImp?.toFixed(2)}%，P值 ${pValue?.toFixed(4)}`
    });
  } else if (conclusion === 'not_recommended') {
    recommendations.push({
      type: 'rejection',
      priority: 'high',
      message: `建议保持当前算法，新算法性能退化显著`,
      details: `几何平均退化 ${Math.abs(geomeanImp).toFixed(2)}%`
    });
  } else if (conclusion === 'tentatively_recommended') {
    recommendations.push({
      type: 'caution',
      priority: 'medium',
      message: '改进趋势积极但统计显著性不足',
      details: '建议增加测试用例数量以提高统计可靠性'
    });
  }
  
  if (degradedCount > nValid * 0.2) {
    recommendations.push({
      type: 'investigation',
      priority: 'high',
      message: `${degradedCount} 个案例出现退化（占比超过20%）`,
      details: '建议分析退化案例的共同特征，识别潜在问题场景'
    });
  } else if (degradedCount > 0) {
    recommendations.push({
      type: 'monitoring',
      priority: 'medium',
      message: `${degradedCount} 个案例出现退化`,
      details: '建议在部署后重点监控这些案例的实际表现'
    });
  }
  
  if (pValue > 0.1) {
    recommendations.push({
      type: 'data_collection',
      priority: 'medium',
      message: 'P值较高，统计显著性不足',
      details: '建议收集更多测试数据以提高结论可靠性'
    });
  }
  
  if (nValid < 30) {
    recommendations.push({
      type: 'sample_size',
      priority: 'low',
      message: '样本量较小',
      details: '当前样本量可能不足以得出可靠结论，建议扩充测试集'
    });
  }
  
  return recommendations;
};

export const generateReportByMode = (mode, params) => {
  switch (mode) {
    case 'quick':
      return generateQuickReport(params);
    case 'detailed':
      return generateDetailedReport(params);
    case 'executive':
      return generateExecutiveReport(params);
    case 'technical':
      return generateTechnicalReport(params);
    default:
      return generateDetailedReport(params);
  }
};

export const exportReportToJSON = (reportData) => {
  return JSON.stringify(reportData, null, 2);
};

export const exportReportToHTML = (reportData) => {
  const { metadata, summary, statistics, executiveSummary, businessImpact, riskAssessment, cases, aiAnalysis, recommendations, methodology, significanceTests, outlierAnalysis } = reportData;
  
  const conclusionLabels = {
    recommended: { text: '推荐采用', class: 'text-green-600', bg: 'bg-green-50' },
    not_recommended: { text: '不建议采用', class: 'text-red-600', bg: 'bg-red-50' },
    tentatively_recommended: { text: '谨慎推荐', class: 'text-amber-600', bg: 'bg-amber-50' },
    inconclusive: { text: '结论不确定', class: 'text-gray-600', bg: 'bg-gray-50' }
  };
  
  const conclusionInfo = conclusionLabels[summary?.conclusion] || conclusionLabels.inconclusive;
  
  const renderMetricRow = (m, isPrimary = false) => `
    <tr class="${isPrimary ? 'bg-indigo-50 font-semibold' : ''}">
      <td class="px-4 py-2 ${isPrimary ? 'text-indigo-700' : ''}">${m.name}</td>
      <td class="px-4 py-2 text-right ${m.geomeanImp > 0 ? 'text-green-600' : m.geomeanImp < 0 ? 'text-red-600' : ''}">${m.geomeanImp?.toFixed(2) || 'N/A'}%</td>
      <td class="px-4 py-2 text-right">${m.pValue?.toFixed(4) || 'N/A'}</td>
      <td class="px-4 py-2 text-right">${m.nValid || 0}</td>
      <td class="px-4 py-2 text-center">${m.isSignificant ? '<span class="text-green-600">✓</span>' : '<span class="text-gray-400">-</span>'}</td>
    </tr>
  `;
  
  const renderCaseRow = (c) => `
    <tr>
      <td class="px-4 py-2 font-medium">${c.case}</td>
      <td class="px-4 py-2 text-right">${formatIndustrialNumber(c.baseValue)}</td>
      <td class="px-4 py-2 text-right">${formatIndustrialNumber(c.compareValue)}</td>
      <td class="px-4 py-2 text-right ${c.improvement > 0 ? 'text-green-600' : 'text-red-600'}">${c.improvement?.toFixed(2)}%</td>
    </tr>
  `;
  
  const renderRecommendation = (rec) => `
    <li class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span class="w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
        rec.priority === 'high' ? 'bg-red-500' : 
        rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
      }"></span>
      <div class="flex-1">
        <span class="text-gray-800 font-medium">${rec.message}</span>
        ${rec.details ? `<p class="text-xs text-gray-500 mt-1">${rec.details}</p>` : ''}
      </div>
    </li>
  `;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media print { body { -webkit-print-color-adjust: exact; } }
    .prose h2 { margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 600; }
    .prose h3 { margin-top: 1rem; margin-bottom: 0.5rem; font-size: 1.1rem; font-weight: 600; }
    .prose p { margin-bottom: 0.5rem; }
    .prose ul { list-style-type: disc; padding-left: 1.5rem; }
    .prose li { margin-bottom: 0.25rem; }
  </style>
</head>
<body class="bg-gray-50 p-8">
  <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
    <header class="border-b border-gray-200 pb-6 mb-6">
      <h1 class="text-2xl font-bold text-gray-900">${metadata.title}</h1>
      <p class="text-sm text-gray-500 mt-2">生成时间: ${new Date(metadata.generatedAt).toLocaleString('zh-CN')}</p>
      <p class="text-sm text-gray-500">对比: ${metadata.baseAlgo} vs ${metadata.compareAlgo}</p>
      <p class="text-sm text-gray-500">报告模式: ${metadata.mode}</p>
    </header>

    ${executiveSummary ? `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
        执行摘要
      </h2>
      <div class="${conclusionInfo.bg} rounded-lg p-4 border border-gray-200">
        <p class="text-lg ${conclusionInfo.class} font-semibold mb-2">${executiveSummary.headline}</p>
        <ul class="space-y-1 text-sm text-gray-700">
          ${executiveSummary.keyFindings.map(f => `<li class="flex items-start gap-2"><span class="text-emerald-500">•</span>${f}</li>`).join('')}
        </ul>
      </div>
    </section>
    ` : `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
        执行摘要
      </h2>
      <div class="${conclusionInfo.bg} rounded-lg p-4">
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
    `}

    ${businessImpact ? `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
        业务影响评估
      </h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-blue-50 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold ${businessImpact.overallImprovement > 0 ? 'text-green-600' : 'text-red-600'}">
            ${businessImpact.overallImprovement?.toFixed(2)}%
          </p>
          <p class="text-xs text-gray-600 mt-1">整体改进</p>
        </div>
        <div class="bg-indigo-50 rounded-lg p-4 text-center">
          <p class="text-lg font-bold text-indigo-600 capitalize">${businessImpact.confidence}</p>
          <p class="text-xs text-gray-600 mt-1">置信度</p>
        </div>
        <div class="bg-amber-50 rounded-lg p-4 text-center">
          <p class="text-lg font-bold text-amber-600 capitalize">${businessImpact.riskLevel}</p>
          <p class="text-xs text-gray-600 mt-1">风险等级</p>
        </div>
      </div>
    </section>
    ` : ''}

    ${riskAssessment ? `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
        风险评估
      </h2>
      <div class="space-y-3">
        <div class="p-3 bg-gray-50 rounded-lg">
          <p class="font-semibold text-sm text-gray-700">统计风险</p>
          <p class="text-sm text-gray-600">${riskAssessment.statisticalRisk}</p>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <p class="font-semibold text-sm text-gray-700">运营风险</p>
          <p class="text-sm text-gray-600">${riskAssessment.operationalRisk}</p>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <p class="font-semibold text-sm text-gray-700">数据质量风险</p>
          <p class="text-sm text-gray-600">${riskAssessment.dataQualityRisk}</p>
        </div>
      </div>
    </section>
    ` : ''}

    ${statistics ? `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
        统计分析
      </h2>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-gray-700 border-b">指标</th>
              <th class="px-4 py-2 text-right font-medium text-gray-700 border-b">Geomean改进</th>
              <th class="px-4 py-2 text-right font-medium text-gray-700 border-b">P值</th>
              <th class="px-4 py-2 text-right font-medium text-gray-700 border-b">样本数</th>
              <th class="px-4 py-2 text-center font-medium text-gray-700 border-b">显著性</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${renderMetricRow(statistics.primary, true)}
            ${statistics.allMetrics.filter(m => m.name !== metadata.activeMetric).map(m => renderMetricRow(m)).join('')}
          </tbody>
        </table>
      </div>
    </section>
    ` : ''}

    ${methodology ? `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
        方法论
      </h2>
      <div class="space-y-3">
        ${methodology.statisticalTests.map(test => `
          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="font-semibold text-sm text-gray-700">${test.name}</p>
            <p class="text-xs text-gray-500">${test.purpose}</p>
            <p class="text-sm text-gray-600 mt-1">结果: ${test.result}${test.unit || ''} ${test.interpretation ? `(${test.interpretation})` : ''}</p>
          </div>
        `).join('')}
      </div>
    </section>
    ` : ''}

    ${cases ? `
    <section class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
        案例分析
      </h2>
      
      ${cases.topImprovements.length > 0 ? `
      <div class="mb-4">
        <h3 class="font-semibold text-gray-700 mb-2">Top 10 改进案例</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead class="bg-green-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700 border-b">案例</th>
                <th class="px-3 py-2 text-right font-medium text-gray-700 border-b">${metadata.baseAlgo}</th>
                <th class="px-3 py-2 text-right font-medium text-gray-700 border-b">${metadata.compareAlgo}</th>
                <th class="px-3 py-2 text-right font-medium text-gray-700 border-b">改进</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${cases.topImprovements.map(c => renderCaseRow(c)).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
      
      ${cases.topDegradations.length > 0 ? `
      <div>
        <h3 class="font-semibold text-gray-700 mb-2">Top 10 退化案例</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead class="bg-red-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700 border-b">案例</th>
                <th class="px-3 py-2 text-right font-medium text-gray-700 border-b">${metadata.baseAlgo}</th>
                <th class="px-3 py-2 text-right font-medium text-gray-700 border-b">${metadata.compareAlgo}</th>
                <th class="px-3 py-2 text-right font-medium text-gray-700 border-b">改进</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${cases.topDegradations.map(c => renderCaseRow(c)).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
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
        ${recommendations.map(rec => renderRecommendation(rec)).join('')}
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

export const exportReportToMarkdown = (reportData) => {
  const { metadata, summary, statistics, executiveSummary, businessImpact, riskAssessment, cases, aiAnalysis, recommendations } = reportData;
  
  const conclusionLabels = {
    recommended: '✅ 推荐采用',
    not_recommended: '❌ 不建议采用',
    tentatively_recommended: '⚠️ 谨慎推荐',
    inconclusive: '❓ 结论不确定'
  };
  
  let markdown = `# ${metadata.title}\n\n`;
  markdown += `> 生成时间: ${new Date(metadata.generatedAt).toLocaleString('zh-CN')}\n\n`;
  markdown += `**对比**: ${metadata.baseAlgo} vs ${metadata.compareAlgo}\n\n`;
  
  if (executiveSummary) {
    markdown += `## 📋 执行摘要\n\n`;
    markdown += `**${executiveSummary.headline}**\n\n`;
    executiveSummary.keyFindings.forEach(f => {
      markdown += `- ${f}\n`;
    });
    markdown += '\n';
  } else if (summary) {
    markdown += `## 📊 执行摘要\n\n`;
    markdown += `**结论**: ${conclusionLabels[summary.conclusion] || '未知'}\n\n`;
    markdown += `| 指标 | 数值 |\n|------|------|\n`;
    markdown += `| 几何平均改进率 | ${summary.geomeanImp?.toFixed(2) || 'N/A'}% |\n`;
    markdown += `| P值 | ${summary.pValue?.toFixed(4) || 'N/A'} |\n`;
    markdown += `| 有效样本数 | ${summary.nValid || 0} |\n`;
    markdown += `| 退化案例数 | ${summary.degradedCount || 0} |\n\n`;
  }
  
  if (businessImpact) {
    markdown += `## 💰 业务影响评估\n\n`;
    markdown += `| 指标 | 数值 |\n|------|------|\n`;
    markdown += `| 整体改进 | ${businessImpact.overallImprovement?.toFixed(2)}% |\n`;
    markdown += `| 置信度 | ${businessImpact.confidence} |\n`;
    markdown += `| 风险等级 | ${businessImpact.riskLevel} |\n\n`;
  }
  
  if (riskAssessment) {
    markdown += `## ⚠️ 风险评估\n\n`;
    markdown += `- **统计风险**: ${riskAssessment.statisticalRisk}\n`;
    markdown += `- **运营风险**: ${riskAssessment.operationalRisk}\n`;
    markdown += `- **数据质量风险**: ${riskAssessment.dataQualityRisk}\n\n`;
  }
  
  if (statistics?.allMetrics) {
    markdown += `## 📈 统计分析\n\n`;
    markdown += `| 指标 | Geomean改进 | P值 | 样本数 | 显著性 |\n`;
    markdown += `|------|-------------|-----|--------|--------|\n`;
    markdown += `| **${statistics.primary.name}** | ${statistics.primary.geomeanImp?.toFixed(2) || 'N/A'}% | ${statistics.primary.pValue?.toFixed(4) || 'N/A'} | ${statistics.primary.nValid || 0} | ${statistics.primary.isSignificant ? '✓' : '-'} |\n`;
    statistics.allMetrics.filter(m => m.name !== metadata.activeMetric).forEach(m => {
      const sig = m.isSignificant ? '✓' : '-';
      markdown += `| ${m.name} | ${m.geomeanImp?.toFixed(2) || 'N/A'}% | ${m.pValue?.toFixed(4) || 'N/A'} | ${m.nValid || 0} | ${sig} |\n`;
    });
    markdown += '\n';
  }
  
  if (cases) {
    markdown += `## 🔍 案例分析\n\n`;
    
    if (cases.topImprovements.length > 0) {
      markdown += `### Top 10 改进案例\n\n`;
      markdown += `| 案例 | ${metadata.baseAlgo} | ${metadata.compareAlgo} | 改进 |\n`;
      markdown += `|------|------|------|------|\n`;
      cases.topImprovements.forEach(c => {
        markdown += `| ${c.case} | ${formatIndustrialNumber(c.baseValue)} | ${formatIndustrialNumber(c.compareValue)} | ${c.improvement?.toFixed(2)}% |\n`;
      });
      markdown += '\n';
    }
    
    if (cases.topDegradations.length > 0) {
      markdown += `### Top 10 退化案例\n\n`;
      markdown += `| 案例 | ${metadata.baseAlgo} | ${metadata.compareAlgo} | 改进 |\n`;
      markdown += `|------|------|------|------|\n`;
      cases.topDegradations.forEach(c => {
        markdown += `| ${c.case} | ${formatIndustrialNumber(c.baseValue)} | ${formatIndustrialNumber(c.compareValue)} | ${c.improvement?.toFixed(2)}% |\n`;
      });
      markdown += '\n';
    }
  }
  
  if (aiAnalysis) {
    markdown += `## 🤖 AI分析报告\n\n`;
    markdown += `${aiAnalysis}\n\n`;
  }
  
  if (recommendations?.length > 0) {
    markdown += `## 💡 建议\n\n`;
    recommendations.forEach(rec => {
      const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵';
      markdown += `- ${priorityIcon} **${rec.message}**`;
      if (rec.details) {
        markdown += ` - ${rec.details}`;
      }
      markdown += '\n';
    });
    markdown += '\n';
  }
  
  markdown += `---\n\n`;
  markdown += `*本报告由 EDA Algorithm Evaluator 自动生成*\n`;
  
  return markdown;
};

export const downloadReport = (reportData, format = 'json') => {
  let content, filename, mimeType;
  
  switch (format) {
    case 'markdown':
    case 'md':
      content = exportReportToMarkdown(reportData);
      filename = `eda_report_${reportData.metadata.mode}_${Date.now()}.md`;
      mimeType = 'text/markdown';
      break;
    case 'json':
      content = exportReportToJSON(reportData);
      filename = `eda_report_${reportData.metadata.mode}_${Date.now()}.json`;
      mimeType = 'application/json';
      break;
    case 'html':
    default:
      content = exportReportToHTML(reportData);
      filename = `eda_report_${reportData.metadata.mode}_${Date.now()}.html`;
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

export default {
  generateReportByMode,
  exportReportToJSON,
  exportReportToHTML,
  downloadReport
};
