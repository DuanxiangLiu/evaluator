const STORAGE_KEY = 'eda_log_extraction_rules';
const MAX_RULE_SETS = 20;

export const DEFAULT_RULE_SET = {
  id: 'default',
  name: '默认规则集',
  description: 'EDA工具日志默认提取规则',
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDefault: true,
  rules: [
    {
      id: 'hpwl',
      name: 'HPWL',
      metric: 'HPWL',
      patterns: [
        'HPWL\\s*[:=]?\\s*([\\d,\\.]+)',
        'Total\\s+HPWL\\s*[:=]?\\s*([\\d,\\.]+)',
        'hpwl\\s*=\\s*([\\d,\\.]+)',
        'Wirelength\\s*[:=]?\\s*([\\d,\\.]+)'
      ],
      description: '半周长线长',
      unit: 'um'
    },
    {
      id: 'tns',
      name: 'TNS',
      metric: 'TNS',
      patterns: [
        'TNS\\s*[:=]?\\s*([-\\d,\\.]+)',
        'Total\\s+Negative\\s+Slack\\s*[:=]?\\s*([-\\d,\\.]+)',
        'tns\\s*=\\s*([-\\d,\\.]+)'
      ],
      description: '时序负裕度总和',
      unit: 'ps'
    },
    {
      id: 'wns',
      name: 'WNS',
      metric: 'WNS',
      patterns: [
        'WNS\\s*[:=]?\\s*([-\\d,\\.]+)',
        'Worst\\s+Negative\\s+Slack\\s*[:=]?\\s*([-\\d,\\.]+)',
        'wns\\s*=\\s*([-\\d,\\.]+)'
      ],
      description: '最差时序负裕度',
      unit: 'ps'
    },
    {
      id: 'congestion',
      name: 'Congestion',
      metric: 'Congestion',
      patterns: [
        'Congestion\\s*[:=]?\\s*([\\d,\\.]+)',
        'congestion\\s*=\\s*([\\d,\\.]+)',
        'Overflow\\s*[:=]?\\s*([\\d,\\.]+)'
      ],
      description: '拥塞',
      unit: ''
    },
    {
      id: 'runtime',
      name: 'Runtime',
      metric: 'Runtime',
      patterns: [
        'Runtime\\s*[:=]?\\s*([\\d,\\.]+)\\s*(?:s|sec|seconds)?',
        'Total\\s+Time\\s*[:=]?\\s*([\\d,\\.]+)\\s*(?:s|sec|seconds)?',
        'Elapsed\\s+Time\\s*[:=]?\\s*([\\d,\\.]+)\\s*(?:s|sec|seconds)?',
        'CPU\\s+Time\\s*[:=]?\\s*([\\d,\\.]+)\\s*(?:s|sec|seconds)?'
      ],
      description: '运行时间',
      unit: 's'
    }
  ]
};

export const getAllRuleSets = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [DEFAULT_RULE_SET];
    }
    const ruleSets = JSON.parse(stored);
    const hasDefault = ruleSets.some(rs => rs.isDefault);
    if (!hasDefault) {
      ruleSets.unshift(DEFAULT_RULE_SET);
    }
    return ruleSets;
  } catch {
    return [DEFAULT_RULE_SET];
  }
};

export const getRuleSetById = (id) => {
  const ruleSets = getAllRuleSets();
  return ruleSets.find(rs => rs.id === id) || DEFAULT_RULE_SET;
};

export const saveRuleSet = (ruleSet) => {
  const ruleSets = getAllRuleSets();
  const existingIndex = ruleSets.findIndex(rs => rs.id === ruleSet.id);

  const updatedRuleSet = {
    ...ruleSet,
    updatedAt: new Date().toISOString()
  };

  if (!updatedRuleSet.createdAt) {
    updatedRuleSet.createdAt = updatedRuleSet.updatedAt;
  }

  if (existingIndex >= 0) {
    ruleSets[existingIndex] = updatedRuleSet;
  } else {
    if (ruleSets.length >= MAX_RULE_SETS) {
      const nonDefaultIndex = ruleSets.findIndex(rs => !rs.isDefault);
      if (nonDefaultIndex >= 0) {
        ruleSets.splice(nonDefaultIndex, 1);
      }
    }
    ruleSets.push(updatedRuleSet);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(ruleSets));
  return updatedRuleSet;
};

export const deleteRuleSet = (id) => {
  if (id === DEFAULT_RULE_SET.id) {
    throw new Error('不能删除默认规则集');
  }

  const ruleSets = getAllRuleSets();
  const filtered = ruleSets.filter(rs => rs.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

export const duplicateRuleSet = (id, newName) => {
  const original = getRuleSetById(id);
  if (!original) {
    throw new Error('找不到原始规则集');
  }

  const duplicated = {
    ...JSON.parse(JSON.stringify(original)),
    id: `ruleset_${Date.now()}`,
    name: newName || `${original.name} (副本)`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return saveRuleSet(duplicated);
};

export const exportRuleSet = (id) => {
  const ruleSet = getRuleSetById(id);
  return JSON.stringify(ruleSet, null, 2);
};

export const importRuleSet = (jsonString) => {
  try {
    const ruleSet = JSON.parse(jsonString);

    if (!ruleSet.rules || !Array.isArray(ruleSet.rules)) {
      throw new Error('无效的规则集格式：缺少rules数组');
    }

    const imported = {
      ...ruleSet,
      id: `ruleset_${Date.now()}`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!imported.name) {
      imported.name = '导入的规则集';
    }

    return saveRuleSet(imported);
  } catch (error) {
    throw new Error(`导入失败: ${error.message}`);
  }
};

export const addRuleToSet = (ruleSetId, rule) => {
  const ruleSet = getRuleSetById(ruleSetId);
  if (!ruleSet) {
    throw new Error('找不到规则集');
  }

  const newRule = {
    ...rule,
    id: rule.id || `rule_${Date.now()}`
  };

  ruleSet.rules.push(newRule);
  return saveRuleSet(ruleSet);
};

export const updateRuleInSet = (ruleSetId, ruleId, updatedRule) => {
  const ruleSet = getRuleSetById(ruleSetId);
  if (!ruleSet) {
    throw new Error('找不到规则集');
  }

  const ruleIndex = ruleSet.rules.findIndex(r => r.id === ruleId);
  if (ruleIndex < 0) {
    throw new Error('找不到规则');
  }

  ruleSet.rules[ruleIndex] = {
    ...ruleSet.rules[ruleIndex],
    ...updatedRule,
    id: ruleId
  };

  return saveRuleSet(ruleSet);
};

export const removeRuleFromSet = (ruleSetId, ruleId) => {
  const ruleSet = getRuleSetById(ruleSetId);
  if (!ruleSet) {
    throw new Error('找不到规则集');
  }

  ruleSet.rules = ruleSet.rules.filter(r => r.id !== ruleId);
  return saveRuleSet(ruleSet);
};

export const getActiveRuleSet = () => {
  const activeId = localStorage.getItem('eda_active_rule_set');
  if (activeId) {
    return getRuleSetById(activeId);
  }
  return DEFAULT_RULE_SET;
};

export const setActiveRuleSet = (id) => {
  const ruleSet = getRuleSetById(id);
  if (!ruleSet) {
    throw new Error('找不到规则集');
  }
  localStorage.setItem('eda_active_rule_set', id);
  return ruleSet;
};

export const getRuleSetStats = (ruleSetId) => {
  const ruleSet = getRuleSetById(ruleSetId);
  if (!ruleSet) return null;

  return {
    totalRules: ruleSet.rules.length,
    totalPatterns: ruleSet.rules.reduce((sum, r) => sum + (r.patterns?.length || 0), 0),
    metrics: ruleSet.rules.map(r => r.metric),
    createdAt: ruleSet.createdAt,
    updatedAt: ruleSet.updatedAt
  };
};

export const createEmptyRuleSet = (name, description = '') => {
  return saveRuleSet({
    id: `ruleset_${Date.now()}`,
    name: name || '新规则集',
    description,
    version: '1.0.0',
    isDefault: false,
    rules: []
  });
};

export const mergeRuleSets = (sourceId, targetId, strategy = 'append') => {
  const source = getRuleSetById(sourceId);
  const target = getRuleSetById(targetId);

  if (!source || !target) {
    throw new Error('找不到源或目标规则集');
  }

  if (target.isDefault) {
    throw new Error('不能修改默认规则集');
  }

  let mergedRules;

  if (strategy === 'replace') {
    mergedRules = [...source.rules];
  } else if (strategy === 'append') {
    mergedRules = [...target.rules];
    for (const rule of source.rules) {
      const existingIndex = mergedRules.findIndex(r => r.metric === rule.metric);
      if (existingIndex >= 0) {
        mergedRules[existingIndex] = {
          ...mergedRules[existingIndex],
          patterns: [...new Set([...mergedRules[existingIndex].patterns, ...rule.patterns])]
        };
      } else {
        mergedRules.push(rule);
      }
    }
  } else {
    mergedRules = [...target.rules, ...source.rules];
  }

  const merged = {
    ...target,
    rules: mergedRules
  };

  return saveRuleSet(merged);
};
