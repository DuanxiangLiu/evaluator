import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody } from '../common/ChartContainer';
import TrendChart from './TrendChart';
import { useChartWidth } from '../../hooks/useChartWidth';
import {
  getExperimentsList,
  createExperiment,
  recordSnapshot,
  getExperimentHistory,
  analyzeTrends,
  deleteExperimentCompletely,
  exportExperimentData,
  importExperimentData
} from '../../services/historyService';
import { History, Plus, Trash2, Download, Upload, Save, Clock, TrendingUp, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

const DEFAULT_EXPERIMENT_DATA = {
  name: '示例实验：算法迭代优化',
  description: '这是一个示例实验，展示算法从 v1.0 到 v1.5 的迭代改进过程',
  snapshots: [
    { versionTag: 'v1.0', geomeanImp: 2.5, pValue: 0.12, nValid: 45, degradedCount: 8, notes: '初始版本' },
    { versionTag: 'v1.1', geomeanImp: 4.2, pValue: 0.08, nValid: 45, degradedCount: 6, notes: '优化参数配置' },
    { versionTag: 'v1.2', geomeanImp: 5.8, pValue: 0.03, nValid: 45, degradedCount: 5, notes: '修复边界条件' },
    { versionTag: 'v1.3', geomeanImp: 7.1, pValue: 0.01, nValid: 45, degradedCount: 4, notes: '改进核心算法' },
    { versionTag: 'v1.4', geomeanImp: 8.5, pValue: 0.005, nValid: 45, degradedCount: 3, notes: '性能优化' },
    { versionTag: 'v1.5', geomeanImp: 9.2, pValue: 0.002, nValid: 45, degradedCount: 2, notes: '最终稳定版本' }
  ]
};

const createDefaultExperiment = async () => {
  const experiment = await createExperiment({
    name: DEFAULT_EXPERIMENT_DATA.name,
    description: DEFAULT_EXPERIMENT_DATA.description,
    baseAlgo: 'Base',
    compareAlgo: 'New',
    metrics: ['HPWL', 'TNS', 'Congestion'],
    tags: ['示例', '演示']
  });

  const baseTime = Date.now() - (DEFAULT_EXPERIMENT_DATA.snapshots.length * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < DEFAULT_EXPERIMENT_DATA.snapshots.length; i++) {
    const snapshot = DEFAULT_EXPERIMENT_DATA.snapshots[i];
    const snapshotTime = new Date(baseTime + i * 24 * 60 * 60 * 1000).toISOString();
    
    await recordSnapshot(experiment.id, {
      parsedData: [],
      selectedCases: new Set(),
      activeMetric: 'HPWL',
      baseAlgo: 'Base',
      compareAlgo: 'New',
      versionTag: snapshot.versionTag,
      notes: snapshot.notes,
      _mockStats: {
        geomeanImp: snapshot.geomeanImp,
        meanImp: snapshot.geomeanImp + 0.3,
        pValue: snapshot.pValue,
        ciLower: snapshot.geomeanImp - 1.5,
        ciUpper: snapshot.geomeanImp + 1.5,
        degradedCount: snapshot.degradedCount,
        nValid: snapshot.nValid,
        median: snapshot.geomeanImp - 0.2,
        std: 2.5
      },
      _mockTimestamp: snapshotTime
    });
  }

  return experiment;
};

const HistoryView = ({
  parsedData,
  selectedCases,
  availableMetrics,
  availableAlgos,
  baseAlgo,
  compareAlgo,
  activeMetric,
  onVersionSelect
}) => {
  const chartWidth = useChartWidth();
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [history, setHistory] = useState(null);
  const [trends, setTrends] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewExperiment, setShowNewExperiment] = useState(false);
  const [newExperimentName, setNewExperimentName] = useState('');
  const [newExperimentDesc, setNewExperimentDesc] = useState('');
  const [versionTag, setVersionTag] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');

  useEffect(() => {
    loadExperiments();
  }, []);

  useEffect(() => {
    if (selectedExperiment) {
      loadExperimentHistory(selectedExperiment.id);
    }
  }, [selectedExperiment]);

  const loadExperiments = async () => {
    setIsLoading(true);
    try {
      const list = await getExperimentsList();
      setExperiments(list);
    } catch (err) {
      console.error('Failed to load experiments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDefaultExperiment = async () => {
    setIsLoading(true);
    try {
      const experiment = await createDefaultExperiment();
      setExperiments(prev => [experiment, ...prev]);
      setSelectedExperiment(experiment);
    } catch (err) {
      console.error('Failed to create default experiment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExperimentHistory = async (experimentId) => {
    setIsLoading(true);
    try {
      const hist = await getExperimentHistory(experimentId);
      setHistory(hist);
      
      const trendAnalysis = await analyzeTrends(experimentId);
      setTrends(trendAnalysis);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExperiment = async () => {
    if (!newExperimentName.trim()) return;

    try {
      const experiment = await createExperiment({
        name: newExperimentName,
        description: newExperimentDesc,
        baseAlgo,
        compareAlgo,
        metrics: availableMetrics
      });
      
      setExperiments(prev => [experiment, ...prev]);
      setSelectedExperiment(experiment);
      setShowNewExperiment(false);
      setNewExperimentName('');
      setNewExperimentDesc('');
    } catch (err) {
      console.error('Failed to create experiment:', err);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!selectedExperiment) return;

    try {
      await recordSnapshot(selectedExperiment.id, {
        parsedData,
        selectedCases,
        activeMetric,
        baseAlgo,
        compareAlgo,
        versionTag: versionTag || `v${(history?.snapshots?.length || 0) + 1}`,
        notes: snapshotNotes
      });

      setVersionTag('');
      setSnapshotNotes('');
      loadExperimentHistory(selectedExperiment.id);
      loadExperiments();
    } catch (err) {
      console.error('Failed to save snapshot:', err);
    }
  };

  const handleDeleteExperiment = async (experimentId) => {
    if (!confirm('确定要删除此实验及其所有历史数据吗？')) return;

    try {
      await deleteExperimentCompletely(experimentId);
      setExperiments(prev => prev.filter(e => e.id !== experimentId));
      if (selectedExperiment?.id === experimentId) {
        setSelectedExperiment(null);
        setHistory(null);
        setTrends(null);
      }
    } catch (err) {
      console.error('Failed to delete experiment:', err);
    }
  };

  const handleExportExperiment = async (experimentId) => {
    try {
      const data = await exportExperimentData(experimentId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `experiment_${experimentId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export experiment:', err);
    }
  };

  const handleImportExperiment = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { importExperimentData } = await import('../../services/historyService');
      await importExperimentData(data);
      loadExperiments();
    } catch (err) {
      console.error('Failed to import experiment:', err);
      alert('导入失败，请检查文件格式');
    }
    event.target.value = '';
  };

  const dataPoints = useMemo(() => {
    if (!trends?.hasEnoughData) return [];
    return trends.dataPoints;
  }, [trends]);

  return (
    <div className="space-y-4">
      <ChartContainer>
        <ChartHeader
          title="历史数据管理"
          icon={History}
          helpContent={
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-indigo-400 text-sm mb-2">历史数据趋势分析</h3>
                <p className="text-gray-300 text-xs mb-2">
                  保存多次实验结果，追踪算法迭代效果，识别性能回归点。
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-emerald-300 text-xs">功能说明</h4>
                <ul className="text-gray-300 text-xs space-y-1.5">
                  <li>• <strong>实验管理</strong>：创建和管理多个实验项目</li>
                  <li>• <strong>快照保存</strong>：保存当前数据的统计快照</li>
                  <li>• <strong>趋势分析</strong>：自动分析性能变化趋势</li>
                  <li>• <strong>回归检测</strong>：自动检测性能回归</li>
                </ul>
              </div>
              
              <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
                💡 数据存储在浏览器本地 IndexedDB 中，不会上传到服务器
              </div>
            </div>
          }
          rightContent={
            experiments.length === 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-xs">暂无实验数据</span>
                <button
                  onClick={handleCreateDefaultExperiment}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  创建示例实验
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewExperiment(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold hover:bg-white/30 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  新建实验
                </button>
                
                <button
                  onClick={handleCreateDefaultExperiment}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  创建示例实验
                </button>
                
                <label className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold hover:bg-white/30 transition-colors cursor-pointer">
                  <Upload className="w-3 h-3" />
                  导入
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportExperiment}
                    className="hidden"
                  />
                </label>
              </div>
            )
          }
        />

        <ChartBody className={`${chartWidth} mx-auto w-full`}>
          {experiments.length > 0 && (
            <div className="p-4">
              <div className="grid gap-2">
                {experiments.map(exp => (
                  <div
                    key={exp.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedExperiment?.id === exp.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedExperiment(exp)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">{exp.name}</div>
                        {exp.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{exp.description}</div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(exp.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                          <span>{exp.snapshotCount || 0} 个快照</span>
                          <span>{exp.baseAlgo} vs {exp.compareAlgo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {exp.latestGeomean != null && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            exp.latestGeomean >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {exp.latestGeomean >= 0 ? '+' : ''}{exp.latestGeomean.toFixed(2)}%
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportExperiment(exp.id);
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExperiment(exp.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartBody>
      </ChartContainer>

      {selectedExperiment && (
        <>
          <ChartContainer>
            <ChartHeader
              title="保存快照"
              icon={Save}
            />
            <ChartBody className={`${chartWidth} mx-auto w-full`}>
              <div className="p-4">
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">版本标签</label>
                    <input
                      type="text"
                      value={versionTag}
                      onChange={(e) => setVersionTag(e.target.value)}
                      placeholder={`例如: v${(history?.snapshots?.length || 0) + 1}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">备注</label>
                    <input
                      type="text"
                      value={snapshotNotes}
                      onChange={(e) => setSnapshotNotes(e.target.value)}
                      placeholder="可选的备注信息"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleSaveSnapshot}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    保存当前快照
                  </button>
                </div>
              </div>
            </ChartBody>
          </ChartContainer>

          {trends?.hasEnoughData && (
            <>
              <TrendChart
                dataPoints={dataPoints}
                title={`${selectedExperiment.name} - 迭代改进曲线`}
                showRegressionWarning={trends.regressionDetected?.detected}
              />

              <ChartContainer>
                <ChartHeader
                  title="趋势分析结果"
                  icon={TrendingUp}
                />
                <ChartBody className={`${chartWidth} mx-auto w-full`}>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">整体改进</div>
                        <div className={`text-lg font-bold ${trends.overallImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trends.overallImprovement >= 0 ? '+' : ''}{trends.overallImprovement.toFixed(2)}%
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">趋势方向</div>
                        <div className="text-lg font-bold text-gray-800">
                          {trends.geomeanTrend.description}
                        </div>
                      </div>
                    </div>

                    {trends.regressionDetected?.detected && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-700 font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          性能回归警告
                        </div>
                        <p className="text-sm text-amber-600 mt-1">
                          {trends.regressionDetected.message}
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-2">统计显著性</div>
                      <div className="flex items-center gap-2">
                        {trends.significanceTrend.ratio >= 0.8 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-sm text-gray-700">
                          {trends.significanceTrend.description}
                        </span>
                      </div>
                    </div>
                  </div>
                </ChartBody>
              </ChartContainer>
            </>
          )}

          {history && history.snapshots.length > 0 && (
            <ChartContainer>
              <ChartHeader
                title="历史快照列表"
                icon={Clock}
              />
              <ChartBody className={`${chartWidth} mx-auto w-full`}>
                <div className="p-4">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-gray-500 font-semibold">版本</th>
                          <th className="text-left py-2 text-gray-500 font-semibold">时间</th>
                          <th className="text-right py-2 text-gray-500 font-semibold">改进率</th>
                          <th className="text-right py-2 text-gray-500 font-semibold">P-Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.snapshots.map((snapshot, idx) => (
                          <tr
                            key={snapshot.id}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => onVersionSelect && onVersionSelect(snapshot)}
                          >
                            <td className="py-2">{snapshot.versionTag || `#${idx + 1}`}</td>
                            <td className="py-2 text-gray-500">
                              {new Date(snapshot.timestamp).toLocaleString('zh-CN')}
                            </td>
                            <td className={`py-2 text-right font-medium ${
                              snapshot.stats?.geomeanImp >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {snapshot.stats?.geomeanImp >= 0 ? '+' : ''}{snapshot.stats?.geomeanImp?.toFixed(2) || '-'}%
                            </td>
                            <td className="py-2 text-right text-gray-500">
                              {snapshot.stats?.pValue?.toFixed(3) || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ChartBody>
            </ChartContainer>
          )}
        </>
      )}

      {showNewExperiment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新建实验</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">实验名称</label>
                <input
                  type="text"
                  value={newExperimentName}
                  onChange={(e) => setNewExperimentName(e.target.value)}
                  placeholder="输入实验名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">描述 (可选)</label>
                <textarea
                  value={newExperimentDesc}
                  onChange={(e) => setNewExperimentDesc(e.target.value)}
                  placeholder="输入实验描述"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowNewExperiment(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateExperiment}
                  disabled={!newExperimentName.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

HistoryView.propTypes = {
  parsedData: PropTypes.array.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  availableMetrics: PropTypes.array.isRequired,
  availableAlgos: PropTypes.array.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  activeMetric: PropTypes.string.isRequired,
  onVersionSelect: PropTypes.func
};

export default HistoryView;
