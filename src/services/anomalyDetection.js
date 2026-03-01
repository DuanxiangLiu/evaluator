import { diagnoseDataIssues, checkDataQuality } from './statisticsService.js';
import { fetchWithTimeout } from './aiService.jsx';
import { API_TIMEOUT_MS } from '../utils/constants';

const ANOMALY_THRESHOLDS = {
  HIGH_DEGRADATION: -10,
  HIGH_IMPROVEMENT: 20,
  LOW_PVALUE: 0.01,
  HIGH_PVALUE: 0.5,
  LOW_SAMPLE_SIZE: 10,
  HIGH_VARIANCE: 50
};

export const detectStatisticalAnomalies = (stats, allMetricsStats) => {
  const anomalies = [];
  
  if (!stats) return anomalies;
  
  if (stats.geomeanImp < ANOMALY_THRESHOLDS.HIGH_DEGRADATION) {
    anomalies.push({
      type: 'high_degradation',
      severity: 'error',
      metric: stats.metric || 'unknown',
      value: stats.geomeanImp,
      message: `整体性能严重退化 (${stats.geomeanImp.toFixed(2)}%)`,
      suggestion: '建议检查算法配置或测试数据是否正确'
    });
  }
  
  if (stats.geomeanImp > ANOMALY_THRESHOLDS.HIGH_IMPROVEMENT) {
    anomalies.push({
      type: 'suspicious_improvement',
      severity: 'warning',
      metric: stats.metric || 'unknown',
      value: stats.geomeanImp,
      message: `改进率异常偏高 (${stats.geomeanImp.toFixed(2)}%)`,
      suggestion: '建议验证数据来源和计算方法'
    });
  }
  
  if (stats.pValue > ANOMALY_THRESHOLDS.HIGH_PVALUE) {
    anomalies.push({
      type: 'not_significant',
      severity: 'info',
      metric: stats.metric || 'unknown',
      value: stats.pValue,
      message: `统计显著性不足 (P=${stats.pValue.toFixed(4)})`,
      suggestion: '建议增加测试用例数量以获得更可靠的结论'
    });
  }
  
  if (stats.nValid < ANOMALY_THRESHOLDS.LOW_SAMPLE_SIZE) {
    anomalies.push({
      type: 'low_sample_size',
      severity: 'warning',
      value: stats.nValid,
      message: `有效样本量较小 (${stats.nValid}个)`,
      suggestion: '样本量不足可能影响统计可靠性'
    });
  }
  
  if (stats.std && stats.std > ANOMALY_THRESHOLDS.HIGH_VARIANCE) {
    anomalies.push({
      type: 'high_variance',
      severity: 'warning',
      value: stats.std,
      message: `数据波动较大 (标准差=${stats.std.toFixed(2)})`,
      suggestion: '算法性能不稳定，建议分析波动原因'
    });
  }
  
  if (stats.degradedCount > stats.nValid * 0.3) {
    anomalies.push({
      type: 'high_degradation_rate',
      severity: 'error',
      value: (stats.degradedCount / stats.nValid * 100).toFixed(1),
      message: `退化案例比例过高 (${(stats.degradedCount / stats.nValid * 100).toFixed(1)}%)`,
      suggestion: '超过30%的案例出现退化，建议检查算法适用性'
    });
  }
  
  if (allMetricsStats && allMetricsStats.length > 1) {
    const improvedCount = allMetricsStats.filter(m => m.stats?.geomeanImp > 0).length;
    const degradedCount = allMetricsStats.filter(m => m.stats?.geomeanImp < 0).length;
    
    if (improvedCount > 0 && degradedCount > 0) {
      anomalies.push({
        type: 'mixed_results',
        severity: 'info',
        value: `${improvedCount}改进/${degradedCount}退化`,
        message: '多指标结果不一致',
        suggestion: '部分指标改进、部分退化，需要权衡取舍'
      });
    }
  }
  
  return anomalies;
};

export const detectOutlierPatterns = (stats) => {
  const patterns = [];
  
  if (!stats || !stats.validCases) return patterns;
  
  const positiveOutliers = stats.validCases.filter(c => c.outlierType === 'positive');
  const negativeOutliers = stats.validCases.filter(c => c.outlierType === 'negative');
  
  if (positiveOutliers.length > stats.nValid * 0.1) {
    patterns.push({
      type: 'many_positive_outliers',
      severity: 'info',
      count: positiveOutliers.length,
      cases: positiveOutliers.slice(0, 5).map(c => c.Case),
      message: `发现${positiveOutliers.length}个正向异常案例`,
      suggestion: '这些案例可能有特殊优化空间'
    });
  }
  
  if (negativeOutliers.length > stats.nValid * 0.1) {
    patterns.push({
      type: 'many_negative_outliers',
      severity: 'warning',
      count: negativeOutliers.length,
      cases: negativeOutliers.slice(0, 5).map(c => c.Case),
      message: `发现${negativeOutliers.length}个负向异常案例`,
      suggestion: '这些案例可能存在特殊情况需要关注'
    });
  }
  
  const consecutiveDegradation = findConsecutiveDegradation(stats.validCases);
  if (consecutiveDegradation.length >= 3) {
    patterns.push({
      type: 'consecutive_degradation',
      severity: 'warning',
      cases: consecutiveDegradation.map(c => c.Case),
      message: '发现连续退化的案例',
      suggestion: '可能存在系统性问题'
    });
  }
  
  return patterns;
};

const findConsecutiveDegradation = (validCases) => {
  const sorted = [...validCases].sort((a, b) => b.imp - a.imp);
  let consecutive = [];
  let maxConsecutive = [];
  
  for (const c of sorted) {
    if (c.imp < 0) {
      consecutive.push(c);
    } else {
      if (consecutive.length > maxConsecutive.length) {
        maxConsecutive = consecutive;
      }
      consecutive = [];
    }
  }
  
  if (consecutive.length > maxConsecutive.length) {
    maxConsecutive = consecutive;
  }
  
  return maxConsecutive;
};

export const assessDataQualityWithAI = async (config, parsedData, availableAlgos, availableMetrics) => {
  const basicAssessment = diagnoseDataIssues(parsedData, availableAlgos, availableMetrics);
  const qualityScore = checkDataQuality(parsedData, availableAlgos, availableMetrics);
  
  if (!config.apiKey && config.provider !== 'gemini') {
    return {
      ...basicAssessment,
      qualityScore,
      aiAssessment: null,
      aiAvailable: false
    };
  }
  
  const promptPayload = `请分析以下EDA算法评估数据的质量，并提供专业评估和建议。

数据概况：
- 案例数量：${parsedData.length}
- 算法数量：${availableAlgos.length} (${availableAlgos.join(', ')})
- 指标数量：${availableMetrics.length}

质量问题：
${basicAssessment.issues.map(issue => `- [${issue.type}] ${issue.message}`).join('\n')}

质量评分：${qualityScore.score}/100

请提供：
1. 整体数据质量评估（优秀/良好/一般/较差）
2. 主要问题分析
3. 数据修复建议
4. 对分析结果可靠性的影响

请用简洁的中文回答，控制在200字以内。`;

  try {
    let text = '';
    
    if (config.provider === 'gemini') {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptPayload }] }],
            systemInstruction: { parts: [{ text: '你是一位EDA数据分析专家，专注于数据质量评估。请用简洁的中文回答。' }] }
          })
        }
      );
      
      const result = await response.json();
      text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: '你是一位EDA数据分析专家，专注于数据质量评估。请用简洁的中文回答。' },
            { role: 'user', content: promptPayload }
          ],
          temperature: 0.3
        })
      });
      
      const result = await response.json();
      text = result.choices?.[0]?.message?.content;
    }
    
    return {
      ...basicAssessment,
      qualityScore,
      aiAssessment: text,
      aiAvailable: true
    };
  } catch (error) {
    return {
      ...basicAssessment,
      qualityScore,
      aiAssessment: null,
      aiAvailable: false,
      aiError: error.message
    };
  }
};

export const generateAnomalyReport = (stats, allMetricsStats, parsedData) => {
  const anomalies = detectStatisticalAnomalies(stats, allMetricsStats);
  const patterns = detectOutlierPatterns(stats);
  const allIssues = [...anomalies, ...patterns];
  
  const severityCount = {
    error: allIssues.filter(a => a.severity === 'error').length,
    warning: allIssues.filter(a => a.severity === 'warning').length,
    info: allIssues.filter(a => a.severity === 'info').length
  };
  
  let overallStatus = 'good';
  if (severityCount.error > 0) {
    overallStatus = 'critical';
  } else if (severityCount.warning > 0) {
    overallStatus = 'warning';
  } else if (severityCount.info > 0) {
    overallStatus = 'notice';
  }
  
  return {
    overallStatus,
    severityCount,
    anomalies: allIssues,
    summary: generateAnomalySummary(allIssues, overallStatus),
    recommendations: generateRecommendations(allIssues)
  };
};

const generateAnomalySummary = (issues, status) => {
  if (issues.length === 0) {
    return '数据质量良好，未发现明显异常';
  }
  
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  if (status === 'critical') {
    return `发现${errorCount}个严重问题需要立即处理`;
  } else if (status === 'warning') {
    return `发现${warningCount}个警告需要注意`;
  } else {
    return `发现${issues.length}个提示信息`;
  }
};

const generateRecommendations = (issues) => {
  const recommendations = new Set();
  
  issues.forEach(issue => {
    if (issue.suggestion) {
      recommendations.add(issue.suggestion);
    }
  });
  
  return Array.from(recommendations);
};

export default {
  detectStatisticalAnomalies,
  detectOutlierPatterns,
  assessDataQualityWithAI,
  generateAnomalyReport
};
