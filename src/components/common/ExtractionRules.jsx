import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp,
  AlertCircle, Info, Code, Save, RotateCcw
} from 'lucide-react';
import {
  DEFAULT_EXTRACTION_RULES,
  DEFAULT_ALGORITHM_RULES,
  validateExtractionRules,
  createCustomRule
} from '../../services/logParser';
import { useToast } from '../common/Toast';

const ExtractionRules = ({
  extractionRules = DEFAULT_EXTRACTION_RULES,
  algorithmRules = DEFAULT_ALGORITHM_RULES,
  onExtractionRulesChange,
  onAlgorithmRulesChange,
  className = ''
}) => {
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState(null);
  const [expandedRules, setExpandedRules] = useState(new Set());
  const [activeTab, setActiveTab] = useState('extraction');
  const [newPattern, setNewPattern] = useState('');

  const toast = useToast();

  const validation = useMemo(() => {
    return validateExtractionRules(extractionRules);
  }, [extractionRules]);

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

  const handleAddRule = useCallback(() => {
    setNewRule({
      id: `custom_${Date.now()}`,
      name: '',
      metric: '',
      patterns: [],
      description: '',
      unit: ''
    });
  }, []);

  const handleSaveNewRule = useCallback(() => {
    if (!newRule.name || !newRule.metric || newRule.patterns.length === 0) {
      toast.error('验证失败', '请填写规则名称、指标名称和至少一个正则表达式');
      return;
    }

    const updated = [...extractionRules, newRule];
    onExtractionRulesChange?.(updated);
    setNewRule(null);
    toast.success('添加成功', `已添加规则: ${newRule.name}`);
  }, [newRule, extractionRules, onExtractionRulesChange, toast]);

  const handleDeleteRule = useCallback((ruleId) => {
    const updated = extractionRules.filter(r => r.id !== ruleId);
    onExtractionRulesChange?.(updated);
    toast.success('删除成功', '规则已删除');
  }, [extractionRules, onExtractionRulesChange, toast]);

  const handleAddPattern = useCallback((ruleId, pattern) => {
    if (!pattern.trim()) return;

    try {
      new RegExp(pattern);
    } catch (e) {
      toast.error('正则表达式无效', e.message);
      return;
    }

    const updated = extractionRules.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          patterns: [...rule.patterns, pattern]
        };
      }
      return rule;
    });

    onExtractionRulesChange?.(updated);
    setNewPattern('');
    toast.success('添加成功', '正则表达式已添加');
  }, [extractionRules, onExtractionRulesChange, toast]);

  const handleRemovePattern = useCallback((ruleId, patternIndex) => {
    const updated = extractionRules.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          patterns: rule.patterns.filter((_, i) => i !== patternIndex)
        };
      }
      return rule;
    });

    onExtractionRulesChange?.(updated);
  }, [extractionRules, onExtractionRulesChange]);

  const handleResetExtractionRules = useCallback(() => {
    onExtractionRulesChange?.(DEFAULT_EXTRACTION_RULES);
    toast.success('重置成功', '已恢复默认提取规则');
  }, [onExtractionRulesChange, toast]);

  const handleResetAlgorithmRules = useCallback(() => {
    onAlgorithmRulesChange?.(DEFAULT_ALGORITHM_RULES);
    toast.success('重置成功', '已恢复默认算法规则');
  }, [onAlgorithmRulesChange, toast]);

  const handleAddAlgorithmPattern = useCallback((ruleId, pattern) => {
    if (!pattern.trim()) return;

    const updated = algorithmRules.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          patterns: [...rule.patterns, pattern]
        };
      }
      return rule;
    });

    onAlgorithmRulesChange?.(updated);
    toast.success('添加成功', '关键词已添加');
  }, [algorithmRules, onAlgorithmRulesChange, toast]);

  const handleRemoveAlgorithmPattern = useCallback((ruleId, patternIndex) => {
    const updated = algorithmRules.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          patterns: rule.patterns.filter((_, i) => i !== patternIndex)
        };
      }
      return rule;
    });

    onAlgorithmRulesChange?.(updated);
  }, [algorithmRules, onAlgorithmRulesChange]);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('extraction')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'extraction'
              ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Code className="w-4 h-4 inline mr-2" />
          提取规则 ({extractionRules.length})
        </button>
        <button
          onClick={() => setActiveTab('algorithm')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'algorithm'
              ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
>
          算法识别 ({algorithmRules.length})
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'extraction' && (
          <div className="space-y-3">
            {!validation.valid && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-700">
                  {validation.errors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700">
                  {validation.warnings.map((warn, i) => (
                    <div key={i}>{warn}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                定义正则表达式以从日志中提取指标数据
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleResetExtractionRules}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <RotateCcw className="w-3 h-3" />
                  重置
                </button>
                <button
                  onClick={handleAddRule}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                >
                  <Plus className="w-3 h-3" />
                  添加规则
                </button>
              </div>
            </div>

            {newRule && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">规则名称</label>
                    <input
                      type="text"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      placeholder="如: HPWL"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">指标名称</label>
                    <input
                      type="text"
                      value={newRule.metric}
                      onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                      placeholder="如: HPWL"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">描述</label>
                  <input
                    type="text"
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    placeholder="指标描述"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">单位</label>
                  <input
                    type="text"
                    value={newRule.unit}
                    onChange={(e) => setNewRule({ ...newRule, unit: e.target.value })}
                    placeholder="如: um"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setNewRule(null)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveNewRule}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    <Check className="w-3 h-3" />
                    保存
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {extractionRules.map(rule => (
                <div
                  key={rule.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleExpand(rule.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-700">{rule.name}</span>
                      <span className="text-xs text-gray-400">({rule.patterns.length} 条规则)</span>
                      {rule.unit && (
                        <span className="text-xs text-gray-400">[{rule.unit}]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!DEFAULT_EXTRACTION_RULES.find(r => r.id === rule.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRule(rule.id);
                          }}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      {expandedRules.has(rule.id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedRules.has(rule.id) && (
                    <div className="p-3 space-y-2 bg-white border-t border-gray-100">
                      {rule.description && (
                        <p className="text-xs text-gray-500">{rule.description}</p>
                      )}

                      <div className="space-y-1">
                        {rule.patterns.map((pattern, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded text-xs font-mono"
                          >
                            <span className="text-gray-600 truncate flex-1">{pattern.toString()}</span>
                            <button
                              onClick={() => handleRemovePattern(rule.id, idx)}
                              className="ml-2 p-0.5 text-red-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="添加正则表达式..."
                          className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) {
                              handleAddPattern(rule.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.target.previousSibling;
                            if (input.value) {
                              handleAddPattern(rule.id, input.value);
                              input.value = '';
                            }
                          }}
                          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'algorithm' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                定义关键词以从文件名/路径中识别算法
              </span>
              <button
                onClick={handleResetAlgorithmRules}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <RotateCcw className="w-3 h-3" />
                重置
              </button>
            </div>

            <div className="space-y-2">
              {algorithmRules.map(rule => (
                <div
                  key={rule.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleExpand(rule.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: rule.color }}
                      />
                      <span className="font-medium text-sm text-gray-700">{rule.name}</span>
                      <span className="text-xs text-gray-400">({rule.patterns.length} 个关键词)</span>
                    </div>
                    {expandedRules.has(rule.id) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {expandedRules.has(rule.id) && (
                    <div className="p-3 space-y-2 bg-white border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {rule.patterns.map((pattern, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs"
                          >
                            {pattern}
                            <button
                              onClick={() => handleRemoveAlgorithmPattern(rule.id, idx)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="添加关键词..."
                          className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) {
                              handleAddAlgorithmPattern(rule.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.target.previousSibling;
                            if (input.value) {
                              handleAddAlgorithmPattern(rule.id, input.value);
                              input.value = '';
                            }
                          }}
                          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ExtractionRules.propTypes = {
  extractionRules: PropTypes.array,
  algorithmRules: PropTypes.array,
  onExtractionRulesChange: PropTypes.func,
  onAlgorithmRulesChange: PropTypes.func,
  className: PropTypes.string
};

export default ExtractionRules;
