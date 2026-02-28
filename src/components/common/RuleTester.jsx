import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Play, CheckCircle, XCircle, AlertTriangle, Search, Filter,
  ChevronDown, ChevronUp, Eye, Copy, RefreshCw, FileText
} from 'lucide-react';
import { testRuleAgainstLog, suggestImprovements } from '../../services/logRuleGenerator';
import { useToast } from '../common/Toast';

const RuleTester = ({
  rules = [],
  logContent = '',
  onRuleUpdate,
  className = ''
}) => {
  const [testResults, setTestResults] = useState({});
  const [selectedRule, setSelectedRule] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const toast = useToast();

  const handleTestRule = useCallback((rule) => {
    if (!logContent.trim()) {
      toast.warning('请先输入日志内容');
      return;
    }

    const result = testRuleAgainstLog(rule, logContent);
    setTestResults(prev => ({
      ...prev,
      [rule.id]: result
    }));

    if (result.validCount > 0) {
      toast.success('测试通过', `匹配 ${result.matchCount} 处，有效 ${result.validCount} 处`);
    } else if (result.matchCount > 0) {
      toast.warning('部分匹配', `匹配 ${result.matchCount} 处，但无有效数值`);
    } else {
      toast.error('未匹配', '规则未能匹配任何内容');
    }
  }, [logContent, toast]);

  const handleTestAll = useCallback(async () => {
    if (!logContent.trim()) {
      toast.warning('请先输入日志内容');
      return;
    }

    setIsTesting(true);

    const results = {};
    for (const rule of rules) {
      results[rule.id] = testRuleAgainstLog(rule, logContent);
    }

    setTestResults(results);
    setIsTesting(false);

    const totalMatches = Object.values(results).reduce((sum, r) => sum + r.matchCount, 0);
    const totalValid = Object.values(results).reduce((sum, r) => sum + r.validCount, 0);
    const failedRules = Object.values(results).filter(r => r.matchCount === 0).length;

    if (failedRules === 0) {
      toast.success('全部通过', `总计匹配 ${totalMatches} 处，有效 ${totalValid} 处`);
    } else {
      toast.warning('部分失败', `${failedRules} 条规则未匹配，总计有效 ${totalValid} 处`);
    }
  }, [rules, logContent, toast]);

  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const result = testResults[rule.id];

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!rule.name.toLowerCase().includes(term) && 
            !rule.metric.toLowerCase().includes(term)) {
          return false;
        }
      }

      switch (filterStatus) {
        case 'passed':
          return result && result.validCount > 0;
        case 'failed':
          return result && result.matchCount === 0;
        case 'partial':
          return result && result.matchCount > 0 && result.validCount === 0;
        case 'untested':
          return !result;
        default:
          return true;
      }
    });
  }, [rules, testResults, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = rules.length;
    const tested = Object.keys(testResults).length;
    const passed = Object.values(testResults).filter(r => r.validCount > 0).length;
    const failed = Object.values(testResults).filter(r => r.matchCount === 0).length;
    const partial = Object.values(testResults).filter(r => r.matchCount > 0 && r.validCount === 0).length;

    return { total, tested, passed, failed, partial, untested: total - tested };
  }, [rules, testResults]);

  const getRuleStatus = (rule) => {
    const result = testResults[rule.id];
    if (!result) return 'untested';
    if (result.validCount > 0) return 'passed';
    if (result.matchCount > 0) return 'partial';
    return 'failed';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const copyMatchedContent = useCallback((result) => {
    const lines = result.results
      .filter(r => r.isValid)
      .map(r => r.content)
      .join('\n');
    navigator.clipboard.writeText(lines);
    toast.success('已复制', `${result.validCount} 条匹配内容`);
  }, [toast]);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">规则测试</span>
          </div>
          <button
            onClick={handleTestAll}
            disabled={isTesting || rules.length === 0 || !logContent.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                测试全部
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span className="text-gray-600">通过: {stats.passed}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-gray-600">部分: {stats.partial}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-500" />
            <span className="text-gray-600">失败: {stats.failed}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
            <span className="text-gray-600">未测: {stats.untested}</span>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索规则..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="all">全部</option>
            <option value="passed">通过</option>
            <option value="partial">部分匹配</option>
            <option value="failed">失败</option>
            <option value="untested">未测试</option>
          </select>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {filteredRules.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">没有匹配的规则</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRules.map(rule => {
              const result = testResults[rule.id];
              const status = getRuleStatus(rule);
              const isSelected = selectedRule === rule.id;

              return (
                <div key={rule.id} className="hover:bg-gray-50">
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer"
                    onClick={() => setSelectedRule(isSelected ? null : rule.id)}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="text-sm font-medium text-gray-700">{rule.name}</span>
                      <span className="text-xs text-gray-400">({rule.metric})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result && (
                        <span className="text-xs text-gray-500">
                          {result.validCount}/{result.matchCount}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestRule(rule);
                        }}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="测试"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                      {isSelected ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isSelected && result && (
                    <div className="px-3 pb-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          匹配: {result.matchCount}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                          有效: {result.validCount}
                        </span>
                        {result.results?.filter(r => r.error).length > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                            错误: {result.results.filter(r => r.error).length}
                          </span>
                        )}
                      </div>

                      {result.results?.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 flex justify-between items-center">
                            <span>匹配详情</span>
                            <button
                              onClick={() => copyMatchedContent(result)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto">
                            {result.results.slice(0, 20).map((r, i) => (
                              <div
                                key={i}
                                className={`px-2 py-1 text-xs border-b border-gray-50 ${
                                  r.isValid ? 'bg-emerald-50/50' : r.error ? 'bg-red-50/50' : ''
                                }`}
                              >
                                {r.error ? (
                                  <span className="text-red-600">{r.error}</span>
                                ) : (
                                  <div className="flex items-start gap-2">
                                    <span className="text-gray-400 flex-shrink-0">L{r.line}</span>
                                    <span className="text-gray-600 flex-1 truncate">{r.content}</span>
                                    {r.extractedValue !== null && (
                                      <span className="text-indigo-600 font-mono flex-shrink-0">
                                        → {r.extractedValue}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                            {result.results.length > 20 && (
                              <div className="px-2 py-1 text-xs text-gray-400 text-center">
                                还有 {result.results.length - 20} 条...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {suggestImprovements(result, logContent).length > 0 && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="text-xs font-medium text-amber-700 mb-1">优化建议</div>
                          {suggestImprovements(result, logContent).map((s, i) => (
                            <div key={i} className="text-xs text-amber-600">
                              • {s.suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

RuleTester.propTypes = {
  rules: PropTypes.array,
  logContent: PropTypes.string,
  onRuleUpdate: PropTypes.func,
  className: PropTypes.string
};

export default RuleTester;
