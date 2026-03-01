import { formatIndustrialNumber } from '../utils/formatters';
import { getMetricConfig } from './csvParser';

const REPORT_TEMPLATES = {
  brief: {
    name: '简报',
    description: '一页式摘要报告，适合快速汇报',
    sections: ['summary', 'key_metrics', 'recommendation']
  },
  detailed: {
    name: '详细报告',
    description: '完整分析报告，包含详细统计数据',
    sections: ['summary', 'key_metrics', 'all_metrics', 'cases_analysis', 'recommendation']
  },
  technical: {
    name: '技术报告',
    description: '技术深度报告，包含统计方法和原始数据',
    sections: ['summary', 'methodology', 'key_metrics', 'all_metrics', 'statistical_analysis', 'cases_analysis', 'raw_data', 'recommendation']
  }
};

const generateSummarySection = (data, algos, metrics, metaColumns, stats, baseAlgo, compareAlgo) => {
  const timestamp = new Date().toLocaleString('zh-CN');
  
  return {
    title: '一、评估概要',
    content: `
      <div class="summary-section">
        <table class="info-table">
          <tr><td class="label">报告生成时间</td><td>${timestamp}</td></tr>
          <tr><td class="label">测试用例数量</td><td>${data.length} 个</td></tr>
          <tr><td class="label">算法数量</td><td>${algos.length} 个 (${algos.join(', ')})</td></tr>
          <tr><td class="label">评估指标</td><td>${metrics.length} 个 (${metrics.join(', ')})</td></tr>
          <tr><td class="label">基线算法</td><td>${baseAlgo}</td></tr>
          <tr><td class="label">对比算法</td><td>${compareAlgo}</td></tr>
        </table>
      </div>
    `
  };
};

const generateKeyMetricsSection = (stats, allMetricsStats, baseAlgo, compareAlgo) => {
  if (!stats) return { title: '二、关键指标', content: '<p>无有效统计数据</p>' };
  
  const improvedCount = stats.nValid - stats.degradedCount;
  const improvedRate = stats.nValid > 0 ? (improvedCount / stats.nValid * 100).toFixed(1) : 0;
  
  return {
    title: '二、关键指标分析',
    content: `
      <div class="key-metrics-section">
        <h3>核心统计指标</h3>
        <table class="stats-table">
          <thead>
            <tr>
              <th>指标</th>
              <th>数值</th>
              <th>评估</th>
            </tr>
          </thead>
          <tbody>
            <tr class="${stats.geomeanImp >= 0 ? 'positive' : 'negative'}">
              <td>几何平均改进</td>
              <td>${stats.geomeanImp >= 0 ? '+' : ''}${stats.geomeanImp.toFixed(2)}%</td>
              <td>${stats.geomeanImp >= 0 ? '✓ 整体优化' : '✗ 整体退化'}</td>
            </tr>
            <tr class="${stats.meanImp >= 0 ? 'positive' : 'negative'}">
              <td>算术平均改进</td>
              <td>${stats.meanImp >= 0 ? '+' : ''}${stats.meanImp.toFixed(2)}%</td>
              <td>${stats.meanImp >= 0 ? '✓ 平均优化' : '✗ 平均退化'}</td>
            </tr>
            <tr class="${stats.pValue < 0.05 ? 'positive' : 'neutral'}">
              <td>显著性检验 (P-Value)</td>
              <td>${stats.pValue.toFixed(4)}</td>
              <td>${stats.pValue < 0.05 ? '✓ 统计显著' : '○ 不显著'}</td>
            </tr>
            <tr>
              <td>95% 置信区间</td>
              <td>[${stats.ciLower.toFixed(2)}%, ${stats.ciUpper.toFixed(2)}%]</td>
              <td>${stats.ciLower > 0 ? '✓ 下限为正' : stats.ciUpper < 0 ? '✗ 上限为负' : '○ 包含零'}</td>
            </tr>
            <tr class="${stats.degradedCount === 0 ? 'positive' : stats.degradedCount < stats.nValid * 0.2 ? 'neutral' : 'negative'}">
              <td>退化案例</td>
              <td>${stats.degradedCount}/${stats.nValid} (${(stats.degradedCount/stats.nValid*100).toFixed(1)}%)</td>
              <td>${stats.degradedCount === 0 ? '✓ 无退化' : stats.degradedCount < stats.nValid * 0.2 ? '○ 少量退化' : '✗ 较多退化'}</td>
            </tr>
            <tr class="${improvedRate >= 70 ? 'positive' : improvedRate >= 50 ? 'neutral' : 'negative'}">
              <td>改进案例</td>
              <td>${improvedCount}/${stats.nValid} (${improvedRate}%)</td>
              <td>${improvedRate >= 70 ? '✓ 多数改进' : improvedRate >= 50 ? '○ 过半改进' : '✗ 少数改进'}</td>
            </tr>
          </tbody>
        </table>
        
        <h3>极值与分布</h3>
        <table class="stats-table">
          <thead>
            <tr><th>指标</th><th>数值</th></tr>
          </thead>
          <tbody>
            <tr><td>最大改进</td><td class="positive">+${stats.maxImp.toFixed(2)}%</td></tr>
            <tr><td>最小改进</td><td class="${stats.minImp >= 0 ? 'positive' : 'negative'}">${stats.minImp.toFixed(2)}%</td></tr>
            <tr><td>中位数</td><td>${stats.median >= 0 ? '+' : ''}${stats.median.toFixed(2)}%</td></tr>
            <tr><td>标准差</td><td>${stats.std.toFixed(2)}%</td></tr>
            <tr><td>四分位距 (IQR)</td><td>${stats.iqr.toFixed(2)}%</td></tr>
          </tbody>
        </table>
      </div>
    `
  };
};

const generateAllMetricsSection = (allMetricsStats, baseAlgo, compareAlgo) => {
  if (!allMetricsStats || allMetricsStats.length === 0) {
    return { title: '三、各指标详细分析', content: '<p>无多指标数据</p>' };
  }
  
  const rows = allMetricsStats.map(({ metric, stats }) => {
    if (!stats) return '';
    const config = getMetricConfig(metric);
    return `
      <tr class="${stats.geomeanImp >= 0 ? 'positive' : 'negative'}">
        <td>${metric}</td>
        <td>${config.better === 'higher' ? '越高越好' : '越低越好'}</td>
        <td>${stats.geomeanImp >= 0 ? '+' : ''}${stats.geomeanImp.toFixed(2)}%</td>
        <td>${stats.pValue.toFixed(4)}</td>
        <td>${stats.nValid}</td>
        <td>${stats.degradedCount}</td>
      </tr>
    `;
  }).join('');
  
  return {
    title: '三、各指标详细分析',
    content: `
      <div class="all-metrics-section">
        <table class="stats-table">
          <thead>
            <tr>
              <th>指标</th>
              <th>优化方向</th>
              <th>几何平均改进</th>
              <th>P-Value</th>
              <th>有效样本</th>
              <th>退化数</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `
  };
};

const generateCasesAnalysisSection = (stats, parsedData, baseAlgo, compareAlgo, activeMetric) => {
  if (!stats || !stats.validCases) {
    return { title: '四、案例分析', content: '<p>无有效案例数据</p>' };
  }
  
  const topCases = [...stats.validCases]
    .sort((a, b) => b.imp - a.imp)
    .slice(0, 5);
  
  const worstCases = [...stats.validCases]
    .sort((a, b) => a.imp - b.imp)
    .slice(0, 5);
  
  const outlierCases = stats.validCases.filter(c => c.outlierType !== 'normal');
  
  const formatCaseRow = (c) => `
    <tr>
      <td>${c.Case}</td>
      <td>${formatIndustrialNumber(c.bVal)}</td>
      <td>${formatIndustrialNumber(c.cVal)}</td>
      <td class="${c.imp >= 0 ? 'positive' : 'negative'}">${c.imp >= 0 ? '+' : ''}${c.imp.toFixed(2)}%</td>
    </tr>
  `;
  
  return {
    title: '四、案例分析',
    content: `
      <div class="cases-section">
        <h3>最佳改进案例 (Top 5)</h3>
        <table class="stats-table">
          <thead>
            <tr><th>用例名称</th><th>基线值</th><th>对比值</th><th>改进率</th></tr>
          </thead>
          <tbody>
            ${topCases.map(formatCaseRow).join('')}
          </tbody>
        </table>
        
        <h3>最差退化案例 (Top 5)</h3>
        <table class="stats-table">
          <thead>
            <tr><th>用例名称</th><th>基线值</th><th>对比值</th><th>改进率</th></tr>
          </thead>
          <tbody>
            ${worstCases.map(formatCaseRow).join('')}
          </tbody>
        </table>
        
        ${outlierCases.length > 0 ? `
          <h3>异常值案例</h3>
          <table class="stats-table">
            <thead>
              <tr><th>用例名称</th><th>改进率</th><th>类型</th></tr>
            </thead>
            <tbody>
              ${outlierCases.map(c => `
                <tr class="${c.outlierType === 'positive' ? 'positive' : 'negative'}">
                  <td>${c.Case}</td>
                  <td>${c.imp >= 0 ? '+' : ''}${c.imp.toFixed(2)}%</td>
                  <td>${c.outlierType === 'positive' ? '显著优化' : '严重退化'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>
    `
  };
};

const generateRecommendationSection = (stats, allMetricsStats, baseAlgo, compareAlgo) => {
  if (!stats) {
    return { title: '五、结论与建议', content: '<p>数据不足，无法生成建议</p>' };
  }
  
  const isPositive = stats.geomeanImp > 0;
  const isSignificant = stats.pValue < 0.05;
  const isStable = stats.degradedCount < stats.nValid * 0.2;
  
  let recommendation = '';
  let confidence = '';
  
  if (isPositive && isSignificant && isStable) {
    recommendation = `推荐采用 ${compareAlgo}`;
    confidence = '高';
  } else if (isPositive && isSignificant) {
    recommendation = `建议采用 ${compareAlgo}，但需关注退化案例`;
    confidence = '中';
  } else if (isPositive) {
    recommendation = `${compareAlgo} 有改进，但统计显著性不足`;
    confidence = '低';
  } else if (!isPositive && isSignificant) {
    recommendation = `建议保持 ${baseAlgo}`;
    confidence = '高';
  } else {
    recommendation = `需进一步测试验证`;
    confidence = '低';
  }
  
  const positiveMetrics = allMetricsStats.filter(m => m.stats && m.stats.geomeanImp > 0);
  const negativeMetrics = allMetricsStats.filter(m => m.stats && m.stats.geomeanImp < 0);
  
  return {
    title: '五、结论与建议',
    content: `
      <div class="recommendation-section">
        <div class="recommendation-box ${isPositive ? 'positive' : 'negative'}">
          <h3>最终建议</h3>
          <p class="recommendation-text">${recommendation}</p>
          <p class="confidence">置信度: ${confidence}</p>
        </div>
        
        <h3>决策依据</h3>
        <ul class="decision-list">
          <li>几何平均改进: ${stats.geomeanImp >= 0 ? '+' : ''}${stats.geomeanImp.toFixed(2)}% ${isPositive ? '✓' : '✗'}</li>
          <li>统计显著性: P=${stats.pValue.toFixed(4)} ${isSignificant ? '✓ 显著' : '○ 不显著'}</li>
          <li>稳定性: ${(100 - stats.degradedCount/stats.nValid*100).toFixed(1)}% 改进率 ${isStable ? '✓' : '✗'}</li>
        </ul>
        
        ${allMetricsStats.length > 1 ? `
          <h3>多指标分析</h3>
          <p>改进指标: ${positiveMetrics.map(m => m.metric).join(', ') || '无'}</p>
          <p>退化指标: ${negativeMetrics.map(m => m.metric).join(', ') || '无'}</p>
        ` : ''}
        
        <h3>风险提示</h3>
        <ul class="risk-list">
          ${stats.degradedCount > 0 ? `<li>存在 ${stats.degradedCount} 个退化案例，需分析原因</li>` : ''}
          ${stats.std > Math.abs(stats.meanImp) ? '<li>标准差较大，算法表现不稳定</li>' : ''}
          ${stats.ciLower < 0 && stats.ciUpper > 0 ? '<li>置信区间包含零，改进效果不确定</li>' : ''}
          ${stats.pValue >= 0.05 ? '<li>统计显著性不足，建议增加测试样本</li>' : ''}
          ${stats.degradedCount === 0 && isPositive && isSignificant ? '<li>无明显风险点</li>' : ''}
        </ul>
      </div>
    `
  };
};

const generateMethodologySection = () => {
  return {
    title: '二、统计方法说明',
    content: `
      <div class="methodology-section">
        <h3>改进率计算</h3>
        <p>对于越低越好的指标: 改进率 = (基线值 - 对比值) / 基线值 × 100%</p>
        <p>对于越高越好的指标: 改进率 = (对比值 - 基线值) / 基线值 × 100%</p>
        
        <h3>几何平均</h3>
        <p>几何平均改进率 = (1 - Geomean(Ratio)) × 100%</p>
        <p>其中 Geomean(Ratio) = exp(mean(ln(Ratio)))</p>
        <p>几何平均能有效抵消极端异常值的影响，是评估算法整体改进比例的推荐指标。</p>
        
        <h3>Wilcoxon 符号秩检验</h3>
        <p>用于判断两组配对数据是否存在显著差异的非参数检验方法。</p>
        <p>P-Value < 0.05 表示差异具有统计显著性。</p>
        
        <h3>置信区间</h3>
        <p>95% 置信区间 = 均值 ± 1.96 × 标准误</p>
        <p>表示有 95% 的概率真实改进率落在此区间内。</p>
        
        <h3>异常值检测</h3>
        <p>使用 IQR 方法: 超出 [Q1 - 1.5×IQR, Q3 + 1.5×IQR] 范围的值被视为异常值。</p>
      </div>
    `
  };
};

const generateStatisticalAnalysisSection = (stats) => {
  if (!stats) return { title: '五、统计分析详情', content: '<p>无统计数据</p>' };
  
  return {
    title: '五、统计分析详情',
    content: `
      <div class="statistical-section">
        <h3>描述性统计</h3>
        <table class="stats-table">
          <tr><td>样本量</td><td>${stats.nValid}</td></tr>
          <tr><td>均值</td><td>${stats.meanImp.toFixed(4)}%</td></tr>
          <tr><td>中位数</td><td>${stats.median.toFixed(4)}%</td></tr>
          <tr><td>标准差</td><td>${stats.std.toFixed(4)}%</td></tr>
          <tr><td>方差</td><td>${(stats.std * stats.std).toFixed(4)}%</td></tr>
          <tr><td>最小值</td><td>${stats.minImp.toFixed(4)}%</td></tr>
          <tr><td>最大值</td><td>${stats.maxImp.toFixed(4)}%</td></tr>
          <tr><td>极差</td><td>${(stats.maxImp - stats.minImp).toFixed(4)}%</td></tr>
        </table>
        
        <h3>分位数</h3>
        <table class="stats-table">
          <tr><td>Q1 (25%)</td><td>${stats.q1.toFixed(4)}%</td></tr>
          <tr><td>Q2 (50%/中位数)</td><td>${stats.median.toFixed(4)}%</td></tr>
          <tr><td>Q3 (75%)</td><td>${stats.q3.toFixed(4)}%</td></tr>
          <tr><td>IQR</td><td>${stats.iqr.toFixed(4)}%</td></tr>
        </table>
        
        <h3>推断性统计</h3>
        <table class="stats-table">
          <tr><td>Wilcoxon P-Value</td><td>${stats.pValue.toFixed(6)}</td></tr>
          <tr><td>95% CI 下限</td><td>${stats.ciLower.toFixed(4)}%</td></tr>
          <tr><td>95% CI 上限</td><td>${stats.ciUpper.toFixed(4)}%</td></tr>
        </table>
        
        <h3>异常值边界</h3>
        <table class="stats-table">
          <tr><td>下边界</td><td>${stats.outlierLower.toFixed(4)}%</td></tr>
          <tr><td>上边界</td><td>${stats.outlierUpper.toFixed(4)}%</td></tr>
        </table>
      </div>
    `
  };
};

const generateRawDataSection = (stats, parsedData, baseAlgo, compareAlgo, activeMetric) => {
  if (!stats || !stats.validCases) {
    return { title: '六、原始数据', content: '<p>无有效数据</p>' };
  }
  
  const rows = stats.validCases.map(c => `
    <tr>
      <td>${c.Case}</td>
      <td>${formatIndustrialNumber(c.bVal)}</td>
      <td>${formatIndustrialNumber(c.cVal)}</td>
      <td class="${c.imp >= 0 ? 'positive' : 'negative'}">${c.imp >= 0 ? '+' : ''}${c.imp.toFixed(2)}%</td>
      <td>${c.outlierType === 'normal' ? '正常' : c.outlierType === 'positive' ? '显著优化' : '严重退化'}</td>
    </tr>
  `).join('');
  
  return {
    title: '六、原始数据',
    content: `
      <div class="raw-data-section">
        <table class="stats-table">
          <thead>
            <tr><th>用例名称</th><th>基线值</th><th>对比值</th><th>改进率</th><th>状态</th></tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `
  };
};

export const generateReport = (options) => {
  const {
    template = 'detailed',
    data,
    algos,
    metrics,
    metaColumns,
    stats,
    allMetricsStats,
    baseAlgo,
    compareAlgo,
    activeMetric,
    customInfo = {}
  } = options;
  
  const templateConfig = REPORT_TEMPLATES[template] || REPORT_TEMPLATES.detailed;
  
  const sections = [];
  
  templateConfig.sections.forEach(sectionId => {
    switch (sectionId) {
      case 'summary':
        sections.push(generateSummarySection(data, algos, metrics, metaColumns, stats, baseAlgo, compareAlgo));
        break;
      case 'key_metrics':
        sections.push(generateKeyMetricsSection(stats, allMetricsStats, baseAlgo, compareAlgo));
        break;
      case 'all_metrics':
        sections.push(generateAllMetricsSection(allMetricsStats, baseAlgo, compareAlgo));
        break;
      case 'cases_analysis':
        sections.push(generateCasesAnalysisSection(stats, data, baseAlgo, compareAlgo, activeMetric));
        break;
      case 'recommendation':
        sections.push(generateRecommendationSection(stats, allMetricsStats, baseAlgo, compareAlgo));
        break;
      case 'methodology':
        sections.push(generateMethodologySection());
        break;
      case 'statistical_analysis':
        sections.push(generateStatisticalAnalysisSection(stats));
        break;
      case 'raw_data':
        sections.push(generateRawDataSection(stats, data, baseAlgo, compareAlgo, activeMetric));
        break;
    }
  });
  
  return {
    template: templateConfig.name,
    generatedAt: new Date().toISOString(),
    customInfo,
    sections
  };
};

export const reportToHTML = (report, options = {}) => {
  const { title = 'EDA 算法评估报告', customLogo } = options;
  
  const styles = `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
      h2 { color: #374151; margin-top: 30px; border-left: 4px solid #4f46e5; padding-left: 10px; }
      h3 { color: #4b5563; margin-top: 20px; }
      .info-table, .stats-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      .info-table td, .stats-table td, .stats-table th {
        border: 1px solid #e5e7eb;
        padding: 10px 12px;
        text-align: left;
      }
      .info-table .label { font-weight: 600; background: #f9fafb; width: 150px; }
      .stats-table th { background: #f3f4f6; font-weight: 600; }
      .stats-table tr:nth-child(even) { background: #f9fafb; }
      .positive { color: #059669; }
      .negative { color: #dc2626; }
      .neutral { color: #6b7280; }
      .recommendation-box {
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .recommendation-box.positive { background: #ecfdf5; border: 2px solid #10b981; }
      .recommendation-box.negative { background: #fef2f2; border: 2px solid #ef4444; }
      .recommendation-text { font-size: 1.2em; font-weight: 600; margin: 10px 0; }
      .confidence { color: #6b7280; font-size: 0.9em; }
      .decision-list, .risk-list { margin: 15px 0; padding-left: 20px; }
      .decision-list li, .risk-list li { margin: 8px 0; }
      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
      .logo { max-height: 50px; }
      .timestamp { color: #6b7280; font-size: 0.9em; }
      @media print {
        body { padding: 0; }
        .page-break { page-break-before: always; }
      }
    </style>
  `;
  
  const sectionsHTML = report.sections.map(section => `
    <div class="section">
      <h2>${section.title}</h2>
      ${section.content}
    </div>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${customLogo ? `<img src="${customLogo}" alt="Logo" class="logo" />` : ''}
      </div>
      <p class="timestamp">报告生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}</p>
      ${sectionsHTML}
      <div class="page-break"></div>
      <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.8em;">
        <p>本报告由 EDA 算法评估器自动生成</p>
        <p>报告模板: ${report.template}</p>
      </footer>
    </body>
    </html>
  `;
};

export const downloadHTMLReport = (report, options = {}) => {
  const html = reportToHTML(report, options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `EDA_评估报告_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadPDFReport = async (report, options = {}) => {
  const html = reportToHTML(report, options);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export { REPORT_TEMPLATES };
