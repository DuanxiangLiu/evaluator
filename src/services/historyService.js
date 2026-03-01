import {
  saveExperiment,
  updateExperiment,
  getExperiment,
  getAllExperiments,
  deleteExperiment,
  saveSnapshot,
  getSnapshotsByExperiment,
  deleteSnapshotsByExperiment,
  saveVersion,
  getVersionsByExperiment,
  deleteVersionsByExperiment,
  getStorageStats,
  exportExperimentData,
  importExperimentData
} from '../utils/indexedDBStorage';
import { computeStatistics } from './statisticsService';

export const createExperiment = async (options) => {
  const {
    name,
    description = '',
    baseAlgo,
    compareAlgo,
    metrics,
    tags = []
  } = options;

  const experiment = {
    name,
    description,
    baseAlgo,
    compareAlgo,
    metrics,
    tags,
    status: 'active',
    snapshotCount: 0
  };

  return saveExperiment(experiment);
};

export const recordSnapshot = async (experimentId, options) => {
  const {
    parsedData,
    selectedCases,
    activeMetric,
    baseAlgo,
    compareAlgo,
    versionTag,
    notes = '',
    _mockStats,
    _mockTimestamp
  } = options;

  let stats = null;
  
  if (_mockStats) {
    stats = _mockStats;
  } else if (parsedData && parsedData.length > 0 && selectedCases && selectedCases.size > 0) {
    stats = computeStatistics(activeMetric, baseAlgo, compareAlgo, parsedData, selectedCases);
  }

  const snapshot = {
    experimentId,
    versionTag,
    notes,
    activeMetric,
    baseAlgo,
    compareAlgo,
    stats: stats ? {
      geomeanImp: stats.geomeanImp,
      meanImp: stats.meanImp,
      pValue: stats.pValue,
      ciLower: stats.ciLower,
      ciUpper: stats.ciUpper,
      degradedCount: stats.degradedCount,
      nValid: stats.nValid,
      median: stats.median,
      std: stats.std
    } : null,
    dataSize: parsedData?.length || 0,
    selectedCount: selectedCases?.size || 0
  };

  if (_mockTimestamp) {
    snapshot.timestamp = _mockTimestamp;
  }

  const savedSnapshot = await saveSnapshot(snapshot);

  const version = {
    experimentId,
    versionTag,
    snapshotId: savedSnapshot.id,
    notes,
    changes: stats ? {
      geomeanImp: stats.geomeanImp,
      pValue: stats.pValue
    } : null
  };

  await saveVersion(version);

  const experiment = await getExperiment(experimentId);
  if (experiment) {
    await updateExperiment(experimentId, {
      ...experiment,
      snapshotCount: (experiment.snapshotCount || 0) + 1
    });
  }

  return savedSnapshot;
};

export const getExperimentHistory = async (experimentId) => {
  const snapshots = await getSnapshotsByExperiment(experimentId);
  const versions = await getVersionsByExperiment(experimentId);

  return {
    snapshots,
    versions,
    timeline: snapshots.map((snapshot, idx) => ({
      ...snapshot,
      version: versions.find(v => v.snapshotId === snapshot.id),
      index: idx
    }))
  };
};

export const analyzeTrends = async (experimentId) => {
  const history = await getExperimentHistory(experimentId);
  const { snapshots } = history;

  if (snapshots.length < 2) {
    return {
      hasEnoughData: false,
      message: '需要至少 2 个快照才能进行趋势分析'
    };
  }

  const validSnapshots = snapshots.filter(s => s.stats);
  
  if (validSnapshots.length < 2) {
    return {
      hasEnoughData: false,
      message: '有效统计数据不足'
    };
  }

  const geomeanValues = validSnapshots.map(s => s.stats.geomeanImp);
  const pValues = validSnapshots.map(s => s.stats.pValue);
  const timestamps = validSnapshots.map(s => new Date(s.timestamp).getTime());

  const geomeanTrend = calculateTrend(geomeanValues, timestamps);
  const significanceTrend = calculateSignificanceTrend(pValues);

  const latestSnapshot = validSnapshots[validSnapshots.length - 1];
  const firstSnapshot = validSnapshots[0];

  const overallImprovement = latestSnapshot.stats.geomeanImp - firstSnapshot.stats.geomeanImp;
  const regressionDetected = detectRegression(validSnapshots);

  return {
    hasEnoughData: true,
    geomeanTrend,
    significanceTrend,
    overallImprovement,
    regressionDetected,
    summary: {
      totalSnapshots: snapshots.length,
      validSnapshots: validSnapshots.length,
      firstTimestamp: firstSnapshot.timestamp,
      latestTimestamp: latestSnapshot.timestamp,
      latestGeomean: latestSnapshot.stats.geomeanImp,
      latestPValue: latestSnapshot.stats.pValue
    },
    dataPoints: validSnapshots.map((s, idx) => ({
      index: idx,
      timestamp: s.timestamp,
      versionTag: s.versionTag,
      geomeanImp: s.stats.geomeanImp,
      pValue: s.stats.pValue,
      nValid: s.stats.nValid,
      degradedCount: s.stats.degradedCount
    }))
  };
};

const calculateTrend = (values, timestamps) => {
  if (values.length < 2) return { direction: 'stable', slope: 0 };

  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = timestamps[i];
    const y = values[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { direction: 'stable', slope: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  let direction = 'stable';
  if (slope > 0.00001) direction = 'improving';
  else if (slope < -0.00001) direction = 'degrading';

  return {
    direction,
    slope,
    intercept,
    description: direction === 'improving' ? '性能呈改进趋势' :
                 direction === 'degrading' ? '性能呈退化趋势' : '性能稳定'
  };
};

const calculateSignificanceTrend = (pValues) => {
  const significantCount = pValues.filter(p => p < 0.05).length;
  const ratio = significantCount / pValues.length;

  return {
    significantCount,
    totalCount: pValues.length,
    ratio,
    description: ratio >= 0.8 ? '大多数结果统计显著' :
                 ratio >= 0.5 ? '部分结果统计显著' : '多数结果不显著'
  };
};

const detectRegression = (snapshots) => {
  if (snapshots.length < 3) return { detected: false };

  const recentSnapshots = snapshots.slice(-5);
  const geomeanValues = recentSnapshots.map(s => s.stats.geomeanImp);

  let decreasingCount = 0;
  for (let i = 1; i < geomeanValues.length; i++) {
    if (geomeanValues[i] < geomeanValues[i - 1]) {
      decreasingCount++;
    }
  }

  const regressionRatio = decreasingCount / (geomeanValues.length - 1);

  if (regressionRatio >= 0.6) {
    return {
      detected: true,
      severity: regressionRatio >= 0.8 ? 'high' : 'medium',
      message: `检测到性能回归趋势，最近 ${recentSnapshots.length} 次快照中 ${decreasingCount} 次性能下降`
    };
  }

  return { detected: false };
};

export const compareSnapshots = async (snapshotId1, snapshotId2) => {
  const snapshot1 = await getSnapshotById(snapshotId1);
  const snapshot2 = await getSnapshotById(snapshotId2);

  if (!snapshot1 || !snapshot2) {
    return null;
  }

  const geomeanDiff = snapshot2.stats.geomeanImp - snapshot1.stats.geomeanImp;
  const pValueDiff = snapshot2.stats.pValue - snapshot1.stats.pValue;

  return {
    snapshot1,
    snapshot2,
    differences: {
      geomeanImp: {
        diff: geomeanDiff,
        percentChange: snapshot1.stats.geomeanImp !== 0 
          ? (geomeanDiff / Math.abs(snapshot1.stats.geomeanImp)) * 100 
          : 0,
        improved: geomeanDiff > 0
      },
      pValue: {
        diff: pValueDiff,
        improved: pValueDiff < 0
      },
      nValid: snapshot2.stats.nValid - snapshot1.stats.nValid,
      degradedCount: snapshot2.stats.degradedCount - snapshot1.stats.degradedCount
    }
  };
};

const getSnapshotById = async (id) => {
  const experiments = await getAllExperiments();
  for (const exp of experiments) {
    const snapshots = await getSnapshotsByExperiment(exp.id);
    const snapshot = snapshots.find(s => s.id === id);
    if (snapshot) return snapshot;
  }
  return null;
};

export const deleteExperimentCompletely = async (experimentId) => {
  await deleteSnapshotsByExperiment(experimentId);
  await deleteVersionsByExperiment(experimentId);
  await deleteExperiment(experimentId);
  return true;
};

export const getExperimentsList = async () => {
  const experiments = await getAllExperiments();
  const enhancedExperiments = await Promise.all(
    experiments.map(async (exp) => {
      const snapshots = await getSnapshotsByExperiment(exp.id);
      const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

      return {
        ...exp,
        snapshotCount: snapshots.length,
        latestSnapshot,
        latestGeomean: latestSnapshot?.stats?.geomeanImp ?? null,
        latestPValue: latestSnapshot?.stats?.pValue ?? null
      };
    })
  );

  return enhancedExperiments;
};

export {
  getAllExperiments,
  getExperiment,
  updateExperiment,
  getStorageStats,
  exportExperimentData,
  importExperimentData
};
