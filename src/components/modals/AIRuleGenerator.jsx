import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Sparkles, Loader2, AlertCircle, CheckCircle, Copy, FileText,
  Play, Save, RefreshCw, ChevronDown, ChevronUp, Trash2, Edit2,
  X, Plus, Download, Upload, Settings, Zap, Info
} from 'lucide-react';
import {
  generateLogExtractionRules,
  testRuleAgainstLog,
  analyzeLogFormat,
  suggestImprovements
} from '../../services/logRuleGenerator';
import {
  saveRuleSet,
  createEmptyRuleSet,
  getAllRuleSets,
  getActiveRuleSet,
  setActiveRuleSet
} from '../../services/ruleStorage';
import { useToast } from '../common/Toast';

const AIRuleGenerator = ({
  isOpen,
  onClose,
  llmConfig,
  logSample: externalLogSample,
  onRulesGenerated,
  className = ''
}) => {
  const [logSample, setLogSample] = useState(externalLogSample || '');
  const [generatedRules, setGeneratedRules] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [expandedRules, setExpandedRules] = useState(new Set());
  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedRuleSet, setSelectedRuleSet] = useState(null);
  const [showRuleSetSelector, setShowRuleSetSelector] = useState(false);

  const toast = useToast();

  const ruleSets = useMemo(() => getAllRuleSets(), []);

  const handleAnalyze = useCallback(() => {
    if (!logSample.trim()) {
      toast.error('请输入日志样例');
      return;
    }

    const result = analyzeLogFormat(logSample);
    setAnalysis(result);
    toast.success('分析完成', `发现 ${result.potentialMetrics.length} 个潜在指标`);
  }, [logSample, toast]);

  const handleGenerate = useCallback(async () => {
    if (!logSample.trim()) {
      toast.error('请输入日志样例');
      return;
    }

    if (!llmConfig?.apiKey && llmConfig?.provider !== 'gemini') {
      toast.error('请先配置API Key');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedRules([]);

    try {
      const existingMetrics = analysis?.potentialMetrics?.map(m => m.name) || [];
      const rules = await generateLogExtractionRules(llmConfig, logSample, existingMetrics);
      setGeneratedRules(rules);
      toast.success('生成成功', `已生成 ${rules.length} 条提取规则`);

      const initialTestResults = {};
      for (const rule of rules) {
        initialTestResults[rule.id] = testRuleAgainstLog(rule, logSample);
      }
      setTestResults(initialTestResults);
    } catch (err) {
      setError(err.message);
      toast.error('生成失败', err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [logSample, llmConfig, analysis, toast]);

  const handleTestRule = useCallback((rule) => {
    if (!logSample.trim()) return;

    const result = testRuleAgainstLog(rule, logSample);
    setTestResults(prev => ({
      ...prev,
      [rule.id]: result
    }));

    const suggestions = suggestImprovements(result, logSample);
    if (suggestions.length > 0) {
      toast.info('测试完成', suggestions[0].message);
    } else {
      toast.success('测试通过', `匹配 ${result.matchCount} 处，有效 ${result.validCount} 处`);
    }
  }, [logSample, toast]);

  const handleTestAllRules = useCallback(() => {
    if (!logSample.trim() || generatedRules.length === 0) return;

    const results = {};
    for (const rule of generatedRules) {
      results[rule.id] = testRuleAgainstLog(rule, logSample);
    }
    setTestResults(results);

    const totalMatches = Object.values(results).reduce((sum, r) => sum + r.matchCount, 0);
    toast.success('测试完成', `总计匹配 ${totalMatches} 处`);
  }, [logSample, generatedRules, toast]);

  const toggleExpand = useCallback((ruleId) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  }, []);

  const handleEditRule = useCallback((rule) => {
    setEditingRule(rule.id);
    setEditForm({
      name: rule.name,
      metric: rule.metric,
      description: rule.description,
      unit: rule.unit,
      patterns: rule.patterns.join('\n')
    });
  }, []);

  const handleSaveEdit = useCallback((ruleId) => {
    setGeneratedRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          name: editForm.name,
          metric: editForm.metric,
          description: editForm.description,
          unit: editForm.unit,
          patterns: editForm.patterns.split('\n').filter(p => p.trim())
        };
      }
      return rule;
    }));
    setEditingRule(null);
    toast.success('已保存修改');
  }, [editForm, toast]);

  const handleDeleteRule = useCallback((ruleId) => {
    setGeneratedRules(prev => prev.filter(r => r.id !== ruleId));
    setTestResults(prev => {
      const next = { ...prev };
      delete next[ruleId];
      return next;
    });
    toast.success('已删除规则');
  }, [toast]);

  const handleAddRule = useCallback(() => {
    const newRule = {
      id: `rule_${Date.now()}`,
      name: '新规则',
      metric: 'NewMetric',
      patterns: [],
      description: '',
      unit: ''
    };
    setGeneratedRules(prev => [...prev, newRule]);
    setEditingRule(newRule.id);
    setEditForm({
      name: newRule.name,
      metric: newRule.metric,
      description: newRule.description,
      unit: newRule.unit,
      patterns: ''
    });
  }, []);

  const handleSaveToRuleSet = useCallback(() => {
    if (generatedRules.length === 0) {
      toast.error('没有规则可保存');
      return;
    }

    if (selectedRuleSet) {
      const existing = getAllRuleSets().find(rs => rs.id === selectedRuleSet);
      if (existing) {
        const merged = {
          ...existing,
          rules: [...existing.rules, ...generatedRules]
        };
        saveRuleSet(merged);
        toast.success('已保存', `规则已添加到 "${existing.name}"`);
      }
    } else {
      const newRuleSet = createEmptyRuleSet('AI生成的规则集');
      const updated = {
        ...newRuleSet,
        rules: generatedRules
      };
      saveRuleSet(updated);
      toast.success('已创建新规则集', `包含 ${generatedRules.length} 条规则`);
    }

    if (onRulesGenerated) {
      onRulesGenerated(generatedRules);
    }
  }, [generatedRules, selectedRuleSet, onRulesGenerated, toast]);

  const handleExportRules = useCallback(() => {
    if (generatedRules.length === 0) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      rules: generatedRules
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_rules_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  }, [generatedRules, toast]);

  const handleImportRules = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const rules = data.rules || data;
        if (Array.isArray(rules)) {
          setGeneratedRules(prev => [...prev, ...rules]);
          toast.success('导入成功', `导入 ${rules.length} 条规则`);
        }
      } catch {
        toast.error('导入失败', '无效的JSON文件');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[300] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-bold text-lg text-white">AI 规则生成器</h3>
              <p className="text-xs text-white/70">智能分析日志格式并生成提取规则</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">日志样例</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <Info className="w-3 h-3" />
                    分析
                  </button>
                  <button
                    onClick={() => setLogSample('')}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                    清空
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-3">
              <textarea
                value={logSample}
                onChange={(e) => setLogSample(e.target.value)}
                placeholder="粘贴日志内容或输入日志样例...&#10;&#10;例如：&#10;Design: cpu_core&#10;HPWL: 1,234,567&#10;TNS: -1234.56&#10;Runtime: 123.45s"
                className="w-full h-full min-h-[300px] p-3 text-xs font-mono border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            {analysis && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="text-xs font-medium text-gray-600 mb-2">分析结果</div>
                <div className="flex flex-wrap gap-1">
                  {analysis.potentialMetrics.map((m, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                    >
                      {m.name} ({m.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 border-t border-gray-200 bg-white">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !logSample.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在生成规则...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI 生成提取规则
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="w-1/2 flex flex-col">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  生成的规则 ({generatedRules.length})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRule}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    添加
                  </button>
                  <button
                    onClick={handleTestAllRules}
                    disabled={generatedRules.length === 0}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    测试全部
                  </button>
                  <label className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded cursor-pointer">
                    <Upload className="w-3 h-3" />
                    导入
                    <input type="file" accept=".json" onChange={handleImportRules} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-b border-red-200">
                <div className="flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {generatedRules.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无规则</p>
                  <p className="text-xs mt-1">粘贴日志样例后点击"AI生成提取规则"</p>
                </div>
              ) : (
                generatedRules.map(rule => {
                  const testResult = testResults[rule.id];
                  const isExpanded = expandedRules.has(rule.id);
                  const isEditing = editingRule === rule.id;

                  return (
                    <div key={rule.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleExpand(rule.id)}
                      >
                        <div className="flex items-center gap-2">
                          {testResult && (
                            <span className={`w-2 h-2 rounded-full ${testResult.validCount > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          )}
                          <span className="font-medium text-sm text-gray-700">{rule.name}</span>
                          <span className="text-xs text-gray-400">({rule.patterns.length} 条)</span>
                          {rule.unit && (
                            <span className="text-xs text-gray-400">[{rule.unit}]</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleTestRule(rule)}
                            className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                            title="测试"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="p-1 text-indigo-500 hover:bg-indigo-50 rounded"
                            title="编辑"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 text-red-400 hover:bg-red-50 rounded"
                            title="删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-3 bg-white border-t border-gray-100 space-y-2">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">名称</label>
                                  <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">指标</label>
                                  <input
                                    type="text"
                                    value={editForm.metric}
                                    onChange={(e) => setEditForm({ ...editForm, metric: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">描述</label>
                                  <input
                                    type="text"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">单位</label>
                                  <input
                                    type="text"
                                    value={editForm.unit}
                                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">正则表达式（每行一个）</label>
                                <textarea
                                  value={editForm.patterns}
                                  onChange={(e) => setEditForm({ ...editForm, patterns: e.target.value })}
                                  className="w-full px-2 py-1 text-xs font-mono border border-gray-200 rounded h-20"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingRule(null)}
                                  className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(rule.id)}
                                  className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-xs text-gray-500">{rule.description || '无描述'}</div>
                              <div className="space-y-1">
                                {rule.patterns.map((pattern, idx) => (
                                  <div key={idx} className="px-2 py-1 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all">
                                    {pattern}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {testResult && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500">测试结果:</span>
                                <span className="text-emerald-600">匹配 {testResult.matchCount}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-indigo-600">有效 {testResult.validCount}</span>
                              </div>
                              {testResult.results?.slice(0, 3).map((r, i) => (
                                <div key={i} className="mt-1 text-xs text-gray-500 truncate">
                                  <span className="text-gray-400">L{r.line}:</span> {r.matchedText}
                                  {r.extractedValue !== null && (
                                    <span className="ml-1 text-indigo-600">→ {r.extractedValue}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedRuleSet || ''}
                  onChange={(e) => setSelectedRuleSet(e.target.value || null)}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="">创建新规则集</option>
                  {ruleSets.filter(rs => !rs.isDefault).map(rs => (
                    <option key={rs.id} value={rs.id}>{rs.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportRules}
                  disabled={generatedRules.length === 0}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <Download className="w-3 h-3" />
                  导出
                </button>
                <button
                  onClick={handleSaveToRuleSet}
                  disabled={generatedRules.length === 0}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  保存规则集
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AIRuleGenerator.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  llmConfig: PropTypes.object,
  logSample: PropTypes.string,
  onRulesGenerated: PropTypes.func,
  className: PropTypes.string
};

export default AIRuleGenerator;
