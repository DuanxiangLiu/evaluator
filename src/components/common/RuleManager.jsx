import React, { useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Settings, ChevronDown, ChevronUp, Edit2, Trash2, Copy, Download,
  Upload, Plus, Check, X, FolderOpen, FileText, Clock, Layers
} from 'lucide-react';
import {
  getAllRuleSets,
  getRuleSetById,
  saveRuleSet,
  deleteRuleSet,
  duplicateRuleSet,
  exportRuleSet,
  importRuleSet,
  setActiveRuleSet,
  getActiveRuleSet,
  getRuleSetStats
} from '../../services/ruleStorage';
import { useToast } from '../common/Toast';

const RuleManager = ({
  isOpen,
  onClose,
  onRuleSetSelect,
  className = ''
}) => {
  const [ruleSets, setRuleSets] = useState(() => getAllRuleSets());
  const [activeId, setActiveId] = useState(() => getActiveRuleSet()?.id);
  const [expandedSet, setExpandedSet] = useState(null);
  const [editingSet, setEditingSet] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editingRule, setEditingRule] = useState(null);
  const [ruleEditForm, setRuleEditForm] = useState({});
  const fileInputRef = useRef(null);

  const toast = useToast();

  const activeRuleSet = useMemo(() => {
    return ruleSets.find(rs => rs.id === activeId) || ruleSets[0];
  }, [ruleSets, activeId]);

  const handleSelectRuleSet = useCallback((id) => {
    setActiveId(id);
    setActiveRuleSet(id);
    const rs = getRuleSetById(id);
    if (onRuleSetSelect) {
      onRuleSetSelect(rs);
    }
    toast.success('已切换', `当前使用: ${rs?.name}`);
  }, [onRuleSetSelect, toast]);

  const handleCreateRuleSet = useCallback(() => {
    const newSet = {
      id: `ruleset_${Date.now()}`,
      name: '新规则集',
      description: '',
      version: '1.0.0',
      isDefault: false,
      rules: []
    };
    saveRuleSet(newSet);
    setRuleSets(getAllRuleSets());
    setEditingSet(newSet.id);
    setEditForm({
      name: newSet.name,
      description: newSet.description
    });
    toast.success('已创建', '新规则集已创建');
  }, [toast]);

  const handleDuplicateRuleSet = useCallback((id) => {
    try {
      const duplicated = duplicateRuleSet(id);
      setRuleSets(getAllRuleSets());
      toast.success('已复制', `已创建: ${duplicated.name}`);
    } catch (error) {
      toast.error('复制失败', error.message);
    }
  }, [toast]);

  const handleDeleteRuleSet = useCallback((id) => {
    try {
      deleteRuleSet(id);
      setRuleSets(getAllRuleSets());
      if (activeId === id) {
        const remaining = getAllRuleSets();
        if (remaining.length > 0) {
          handleSelectRuleSet(remaining[0].id);
        }
      }
      toast.success('已删除', '规则集已删除');
    } catch (error) {
      toast.error('删除失败', error.message);
    }
  }, [activeId, handleSelectRuleSet, toast]);

  const handleExportRuleSet = useCallback((id) => {
    try {
      const json = exportRuleSet(id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ruleset_${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } catch (error) {
      toast.error('导出失败', error.message);
    }
  }, [toast]);

  const handleImportRuleSet = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = importRuleSet(e.target.result);
        setRuleSets(getAllRuleSets());
        toast.success('导入成功', `已导入: ${imported.name}`);
      } catch (error) {
        toast.error('导入失败', error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [toast]);

  const handleEditRuleSet = useCallback((ruleSet) => {
    setEditingSet(ruleSet.id);
    setEditForm({
      name: ruleSet.name,
      description: ruleSet.description || ''
    });
  }, []);

  const handleSaveRuleSet = useCallback((id) => {
    const ruleSet = getRuleSetById(id);
    if (!ruleSet) return;

    const updated = {
      ...ruleSet,
      name: editForm.name,
      description: editForm.description
    };
    saveRuleSet(updated);
    setRuleSets(getAllRuleSets());
    setEditingSet(null);
    toast.success('已保存');
  }, [editForm, toast]);

  const handleAddRule = useCallback((ruleSetId) => {
    const ruleSet = getRuleSetById(ruleSetId);
    if (!ruleSet) return;

    const newRule = {
      id: `rule_${Date.now()}`,
      name: '新规则',
      metric: 'NewMetric',
      patterns: [],
      description: '',
      unit: ''
    };

    const updated = {
      ...ruleSet,
      rules: [...ruleSet.rules, newRule]
    };
    saveRuleSet(updated);
    setRuleSets(getAllRuleSets());
    setEditingRule(newRule.id);
    setRuleEditForm({
      name: newRule.name,
      metric: newRule.metric,
      description: newRule.description,
      unit: newRule.unit,
      patterns: ''
    });
  }, [toast]);

  const handleEditRule = useCallback((ruleSetId, rule) => {
    setEditingRule(rule.id);
    setRuleEditForm({
      name: rule.name,
      metric: rule.metric,
      description: rule.description || '',
      unit: rule.unit || '',
      patterns: rule.patterns?.join('\n') || ''
    });
  }, []);

  const handleSaveRule = useCallback((ruleSetId, ruleId) => {
    const ruleSet = getRuleSetById(ruleSetId);
    if (!ruleSet) return;

    const updated = {
      ...ruleSet,
      rules: ruleSet.rules.map(r => {
        if (r.id === ruleId) {
          return {
            ...r,
            name: ruleEditForm.name,
            metric: ruleEditForm.metric,
            description: ruleEditForm.description,
            unit: ruleEditForm.unit,
            patterns: ruleEditForm.patterns.split('\n').filter(p => p.trim())
          };
        }
        return r;
      })
    };
    saveRuleSet(updated);
    setRuleSets(getAllRuleSets());
    setEditingRule(null);
    toast.success('规则已保存');
  }, [ruleEditForm, toast]);

  const handleDeleteRule = useCallback((ruleSetId, ruleId) => {
    const ruleSet = getRuleSetById(ruleSetId);
    if (!ruleSet) return;

    const updated = {
      ...ruleSet,
      rules: ruleSet.rules.filter(r => r.id !== ruleId)
    };
    saveRuleSet(updated);
    setRuleSets(getAllRuleSets());
    toast.success('规则已删除');
  }, [toast]);

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">规则集管理</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCreateRuleSet}
              className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded"
            >
              <Plus className="w-3 h-3" />
              新建
            </button>
            <label className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded cursor-pointer">
              <Upload className="w-3 h-3" />
              导入
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportRuleSet}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {ruleSets.map(ruleSet => {
            const stats = getRuleSetStats(ruleSet.id);
            const isExpanded = expandedSet === ruleSet.id;
            const isEditing = editingSet === ruleSet.id;
            const isActive = activeId === ruleSet.id;

            return (
              <div key={ruleSet.id} className={`${isActive ? 'bg-indigo-50/50' : ''}`}>
                <div
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedSet(isExpanded ? null : ruleSet.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${isActive ? 'bg-indigo-500' : 'bg-gray-300'}`}
                      title={isActive ? '当前使用' : '点击切换'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRuleSet(ruleSet.id);
                      }}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="px-2 py-0.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700">{ruleSet.name}</span>
                    )}
                    {ruleSet.isDefault && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">默认</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setEditingSet(null)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleSaveRuleSet(ruleSet.id)}
                          className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditRuleSet(ruleSet)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="编辑"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDuplicateRuleSet(ruleSet.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="复制"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleExportRuleSet(ruleSet.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="导出"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        {!ruleSet.isDefault && (
                          <button
                            onClick={() => handleDeleteRuleSet(ruleSet.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-4 py-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {stats?.totalRules || 0} 条规则
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {stats?.totalPatterns || 0} 个模式
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ruleSet.updatedAt ? new Date(ruleSet.updatedAt).toLocaleDateString() : '-'}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mb-2">
                        <label className="block text-xs text-gray-500 mb-1">描述</label>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                          placeholder="规则集描述..."
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      {ruleSet.rules.map(rule => {
                        const isRuleEditing = editingRule === rule.id;

                        return (
                          <div key={rule.id} className="border border-gray-100 rounded p-2 bg-gray-50">
                            {isRuleEditing ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={ruleEditForm.name}
                                    onChange={(e) => setRuleEditForm({ ...ruleEditForm, name: e.target.value })}
                                    className="px-2 py-1 text-xs border border-gray-200 rounded"
                                    placeholder="名称"
                                  />
                                  <input
                                    type="text"
                                    value={ruleEditForm.metric}
                                    onChange={(e) => setRuleEditForm({ ...ruleEditForm, metric: e.target.value })}
                                    className="px-2 py-1 text-xs border border-gray-200 rounded"
                                    placeholder="指标"
                                  />
                                </div>
                                <textarea
                                  value={ruleEditForm.patterns}
                                  onChange={(e) => setRuleEditForm({ ...ruleEditForm, patterns: e.target.value })}
                                  className="w-full px-2 py-1 text-xs font-mono border border-gray-200 rounded h-16"
                                  placeholder="正则表达式（每行一个）"
                                />
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() => setEditingRule(null)}
                                    className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => handleSaveRule(ruleSet.id, rule.id)}
                                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                  >
                                    保存
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-700">{rule.name}</span>
                                    <span className="text-xs text-gray-400">({rule.metric})</span>
                                    {rule.unit && (
                                      <span className="text-xs text-gray-400">[{rule.unit}]</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {rule.patterns?.length || 0} 个正则模式
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleEditRule(ruleSet.id, rule)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                    title="编辑"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRule(ruleSet.id, rule.id)}
                                    className="p-1 text-red-400 hover:text-red-600"
                                    title="删除"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        onClick={() => handleAddRule(ruleSet.id)}
                        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-200 rounded"
                      >
                        <Plus className="w-3 h-3" />
                        添加规则
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

RuleManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onRuleSetSelect: PropTypes.func,
  className: PropTypes.string
};

export default RuleManager;
