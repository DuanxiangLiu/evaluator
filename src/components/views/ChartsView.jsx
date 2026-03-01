import React from 'react';
import PropTypes from 'prop-types';
import BoxPlotChart from '../charts/BoxPlotChart';
import CorrelationChart from '../charts/CorrelationChart';
import ParetoChart from '../charts/ParetoChart';
import RadarChart from '../charts/RadarChart';
import QoRSimulator from '../charts/QoRSimulator';
import HistoryView from '../charts/HistoryView';

const ChartsView = ({
  activeTab,
  stats,
  activeMetric,
  handleChartMouseMove,
  hoveredCase,
  setHoveredCase,
  setTooltipState,
  setDeepDiveCase,
  parsedData,
  selectedCases,
  metaColumns,
  availableMetrics,
  availableAlgos,
  baseAlgo,
  compareAlgo,
  corrX,
  setCorrX,
  corrY,
  setCorrY,
  paretoX,
  setParetoX,
  paretoY,
  setParetoY,
  paretoZ,
  setParetoZ,
  allMetricsStats,
  qorWeights,
  setQorWeights,
  savedQorWeights
}) => {
  return (
    <>
      {activeTab === 'single' && stats && (
        <BoxPlotChart
          stats={stats}
          activeMetric={activeMetric}
          handleChartMouseMove={handleChartMouseMove}
          hoveredCase={hoveredCase}
          setHoveredCase={setHoveredCase}
          setTooltipState={setTooltipState}
          onCaseClick={setDeepDiveCase}
          parsedData={parsedData}
          metaColumns={metaColumns}
        />
      )}

      {activeTab === 'correlation' && parsedData.length > 0 && (
        <CorrelationChart
          parsedData={parsedData}
          selectedCases={selectedCases}
          metaColumns={metaColumns}
          availableMetrics={availableMetrics}
          corrX={corrX}
          corrY={corrY}
          setCorrX={setCorrX}
          setCorrY={setCorrY}
          handleChartMouseMove={handleChartMouseMove}
          hoveredCase={hoveredCase}
          setHoveredCase={setHoveredCase}
          setTooltipState={setTooltipState}
          baseAlgo={baseAlgo}
          compareAlgo={compareAlgo}
          onCaseClick={setDeepDiveCase}
        />
      )}

      {activeTab === 'multi' && parsedData.length > 0 && (
        <ParetoChart
          parsedData={parsedData}
          selectedCases={selectedCases}
          availableMetrics={availableMetrics}
          paretoX={paretoX}
          paretoY={paretoY}
          paretoZ={paretoZ}
          setParetoX={setParetoX}
          setParetoY={setParetoY}
          setParetoZ={setParetoZ}
          handleChartMouseMove={handleChartMouseMove}
          hoveredCase={hoveredCase}
          setHoveredCase={setHoveredCase}
          setTooltipState={setTooltipState}
          baseAlgo={baseAlgo}
          compareAlgo={compareAlgo}
          onCaseClick={setDeepDiveCase}
        />
      )}

      {activeTab === 'all_metrics' && allMetricsStats.length > 0 && (
        <RadarChart
          allMetricsStats={allMetricsStats}
          availableAlgos={availableAlgos}
          baseAlgo={baseAlgo}
          compareAlgo={compareAlgo}
          parsedData={parsedData}
          selectedCases={selectedCases}
        />
      )}

      {activeTab === 'qor_simulator' && (
        <QoRSimulator
          allMetricsStats={allMetricsStats}
          availableMetrics={availableMetrics}
          availableAlgos={availableAlgos}
          baseAlgo={baseAlgo}
          compareAlgo={compareAlgo}
          qorWeights={qorWeights}
          setQorWeights={setQorWeights}
          parsedData={parsedData}
          selectedCases={selectedCases}
          savedQorWeights={savedQorWeights}
        />
      )}

      {activeTab === 'history' && (
        <HistoryView
          parsedData={parsedData}
          selectedCases={selectedCases}
          availableMetrics={availableMetrics}
          availableAlgos={availableAlgos}
          baseAlgo={baseAlgo}
          compareAlgo={compareAlgo}
          activeMetric={activeMetric}
        />
      )}
    </>
  );
};

ChartsView.propTypes = {
  activeTab: PropTypes.string.isRequired,
  stats: PropTypes.object,
  activeMetric: PropTypes.string.isRequired,
  handleChartMouseMove: PropTypes.func.isRequired,
  hoveredCase: PropTypes.string,
  setHoveredCase: PropTypes.func.isRequired,
  setTooltipState: PropTypes.func.isRequired,
  setDeepDiveCase: PropTypes.func.isRequired,
  parsedData: PropTypes.array.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  metaColumns: PropTypes.array.isRequired,
  availableMetrics: PropTypes.array.isRequired,
  availableAlgos: PropTypes.array.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  corrX: PropTypes.string,
  setCorrX: PropTypes.func.isRequired,
  corrY: PropTypes.string,
  setCorrY: PropTypes.func.isRequired,
  paretoX: PropTypes.string,
  setParetoX: PropTypes.func.isRequired,
  paretoY: PropTypes.string,
  setParetoY: PropTypes.func.isRequired,
  paretoZ: PropTypes.string,
  setParetoZ: PropTypes.func.isRequired,
  allMetricsStats: PropTypes.array.isRequired,
  qorWeights: PropTypes.object.isRequired,
  setQorWeights: PropTypes.func.isRequired,
  savedQorWeights: PropTypes.object
};

export default ChartsView;
