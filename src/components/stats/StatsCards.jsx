import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import { ImprovementFormulaHelp } from '../common/HelpContents';

const StatHelpContent = ({ helpId }) => {
  const helps = {
    geomean: { 
      title: '几何平均改进率', 
      description: '评估算法整体改进比例的黄金标准',
      formula: 'Geomean = exp(Σln(Ratio)/n)',
      details: [
        { label: '特点', value: '能有效抵消极端异常值的影响' },
        { label: '解读', value: '正值表示整体优化，负值表示整体退化' },
        { label: '建议', value: '与算术平均值对比，差异大说明存在极端值' }
      ],
      example: '例如：Geomean = +8% 表示整体改进约 8%，这是最可靠的改进指标'
    },
    arith: { 
      title: '算术平均改进率', 
      description: '直观的算术平均值，易受极端值影响',
      formula: 'Mean = Σ(改进率)/n',
      details: [
        { label: '特点', value: '直观易懂，但易受极端值影响' },
        { label: '解读', value: '若远大于 Geomean，说明个别案例被异常放大' },
        { label: '建议', value: '结合 Geomean 一起分析，两者差异大时需警惕' }
      ],
      example: '例如：Mean = +12%，Geomean = +8%，差异 4% 说明存在极端值'
    },
    pvalue: { 
      title: 'Wilcoxon 符号秩检验 P-Value', 
      description: '非参数统计检验的显著性指标',
      formula: '基于符号秩和计算的概率值',
      details: [
        { label: '原理', value: '判断数据分布改变是否真实有效' },
        { label: '解读', value: 'P < 0.05 表示提升具有统计学显著性' },
        { label: '建议', value: 'P 值越小，结果越可信，建议 P < 0.01' }
      ],
      example: '例如：P = 0.003 < 0.01，说明改进结果高度显著，可信度 99%+'
    },
    ci: { 
      title: '95% 置信区间', 
      description: '算法表现波动的预测范围',
      formula: 'CI = 均值 ± 1.96 × 标准误',
      details: [
        { label: '含义', value: '有 95% 概率真实改进率落在此区间内' },
        { label: '解读', value: '下限 > 0% 说明算法极为稳健' },
        { label: '建议', value: '区间越窄越稳定，关注下限是否为正' }
      ],
      example: '例如：[+3%, +12%] 表示有 95% 把握真实改进率在此范围内'
    },
    degraded: { 
      title: '退化案例统计', 
      description: '改进率为负的测试用例数量',
      formula: '退化率 = 退化案例数 / 总案例数 × 100%',
      details: [
        { label: '定义', value: '改进率 < 0% 的案例为退化案例' },
        { label: '解读', value: '括号内为退化案例占总案例的百分比' },
        { label: '建议', value: '通常退化率应控制在 10% 以内' }
      ],
      example: '例如：5/50 (10%) 表示 50 个案例中有 5 个退化，需分析原因'
    },
    extreme: { 
      title: '极值范围', 
      description: '算法表现的上下边界',
      formula: '范围 = [最小值, 最大值]',
      details: [
        { label: '展示', value: '最大退化幅度 ~ 最大改进幅度' },
        { label: '解读', value: '评估算法在最好和最差情况下的表现' },
        { label: '建议', value: '关注是否存在极端退化案例（<-20%）' }
      ],
      example: '例如：[-15%, +25%] 表示最差退化 15%，最好改进 25%'
    },
    median: { 
      title: '中位数', 
      description: '改进率的中位数值',
      formula: '将所有改进率排序后取中间值',
      details: [
        { label: '特点', value: '不受极端值影响，比平均值更稳健' },
        { label: '解读', value: '正值表示超过半数案例有优化效果' },
        { label: '建议', value: '与平均值对比，差异大说明存在极端值' }
      ],
      example: '例如：中位数 +5% 表示至少 50% 的案例改进率 ≥ 5%'
    },
    std: { 
      title: '标准差', 
      description: '数据离散程度的度量',
      formula: 'σ = √[Σ(xi-μ)²/n]',
      details: [
        { label: '含义', value: '数值越小，算法表现越稳定一致' },
        { label: '解读', value: '标准差大说明不同案例间表现差异大' },
        { label: '建议', value: '标准差 < 平均改进率的一半较为理想' }
      ],
      example: '例如：平均改进 10%，标准差 3%，说明大多数案例改进率在 7%~13% 之间'
    },
    cv: { 
      title: '变异系数', 
      description: '相对离散程度指标',
      formula: 'CV = 标准差 / |均值| × 100%',
      details: [
        { label: '特点', value: '无量纲，便于不同数据集间比较' },
        { label: '解读', value: 'CV < 50% 表示稳定性较好' },
        { label: '建议', value: 'CV > 100% 说明数据波动剧烈，需关注' }
      ],
      example: '例如：CV = 30% 表示相对稳定性良好'
    },
    iqr: { 
      title: '四分位距', 
      description: '中间 50% 数据的分布范围',
      formula: 'IQR = Q3(75%分位) - Q1(25%分位)',
      details: [
        { label: '特点', value: '不受极端值影响，反映核心数据分布' },
        { label: '解读', value: 'IQR 越小说明核心数据越集中' },
        { label: '应用', value: '箱线图的箱体高度就是 IQR' }
      ],
      example: '例如：IQR = 8% 表示中间 50% 案例的改进率跨度为 8 个百分点'
    }
  };
  const help = helps[helpId] || { title: '', description: '', formula: '', details: [], example: '' };
  const showImprovementFormula = ['geomean', 'arith', 'degraded', 'extreme', 'median'].includes(helpId);
  
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-indigo-400 text-sm">{help.title}</h3>
        <p className="text-gray-300 text-xs mt-1">{help.description}</p>
      </div>
      
      {help.formula && (
        <div className="bg-slate-800/50 rounded p-2">
          <span className="text-xs text-gray-400">计算公式：</span>
          <span className="text-xs text-emerald-300 font-mono ml-1">{help.formula}</span>
        </div>
      )}
      
      <div className="space-y-1.5">
        {help.details.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-amber-300 font-semibold min-w-[40px]">{item.label}：</span>
            <span className="text-gray-300">{item.value}</span>
          </div>
        ))}
      </div>
      
      {help.example && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-2 text-xs text-indigo-200">
          💡 {help.example}
        </div>
      )}
      
      {showImprovementFormula && <ImprovementFormulaHelp showTitle={true} />}
    </div>
  );
};

StatHelpContent.propTypes = {
  helpId: PropTypes.string.isRequired
};

const AuxiliaryStatHelp = ({ label, value, std, meanImp }) => {
  const helps = {
    '中位数': {
      title: '中位数',
      description: '改进率的中位数值，反映典型案例的表现',
      formula: '将所有改进率排序后取中间值',
      details: [
        { label: '特点', value: '不受极端值影响，比平均值更稳健' },
        { label: '解读', value: '正值表示超过半数案例有优化效果' },
        { label: '对比', value: '若与平均值差异大，说明存在极端值干扰' }
      ],
      example: '例如：中位数 +5% 表示至少 50% 的案例改进率 ≥ 5%'
    },
    '标准差': {
      title: '标准差',
      description: '衡量改进率的波动程度',
      formula: 'σ = √[Σ(xi-μ)²/n]',
      details: [
        { label: '含义', value: '数值越小，算法表现越稳定一致' },
        { label: '解读', value: '标准差大说明不同案例间表现差异大' },
        { label: '建议', value: '标准差 < 平均改进率的一半较为理想' }
      ],
      example: '例如：平均改进 10%，标准差 3%，说明大多数案例改进率在 7%~13% 之间'
    },
    '变异系数': {
      title: '变异系数',
      description: '相对离散程度，消除量纲影响',
      formula: 'CV = 标准差 / |平均值| × 100%',
      details: [
        { label: '特点', value: '无量纲，便于不同数据集间比较' },
        { label: '解读', value: 'CV < 50% 表示稳定性较好' },
        { label: '建议', value: 'CV > 100% 说明数据波动剧烈，需关注' }
      ],
      example: `当前：${std?.toFixed(2) || '-'} / ${Math.abs(meanImp || 0).toFixed(2)} = ${value?.toFixed(2) || '-'}%`
    },
    'IQR': {
      title: '四分位距',
      description: '中间 50% 数据的分布范围',
      formula: 'IQR = Q3(75%分位) - Q1(25%分位)',
      details: [
        { label: '特点', value: '不受极端值影响，反映核心数据分布' },
        { label: '解读', value: 'IQR 越小说明核心数据越集中' },
        { label: '应用', value: '箱线图的箱体高度就是 IQR' }
      ],
      example: '例如：IQR = 8% 表示中间 50% 案例的改进率跨度为 8 个百分点'
    }
  };

  const help = helps[label] || { title: label, description: '', formula: '', details: [], example: '' };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-indigo-400 text-sm">{help.title}</h3>
        <p className="text-gray-300 text-xs mt-1">{help.description}</p>
      </div>
      
      {help.formula && (
        <div className="bg-slate-800/50 rounded p-2">
          <span className="text-xs text-gray-400">计算公式：</span>
          <span className="text-xs text-emerald-300 font-mono ml-1">{help.formula}</span>
        </div>
      )}
      
      <div className="space-y-1.5">
        {help.details.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-amber-300 font-semibold min-w-[40px]">{item.label}：</span>
            <span className="text-gray-300">{item.value}</span>
          </div>
        ))}
      </div>
      
      {help.example && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-2 text-xs text-indigo-200">
          💡 {help.example}
        </div>
      )}
    </div>
  );
};

AuxiliaryStatHelp.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  std: PropTypes.number,
  meanImp: PropTypes.number
};

const StatsCards = ({ stats }) => {
  const [showAuxiliary, setShowAuxiliary] = useState(true);

  if (!stats) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4" />
        没有合法的对比数据。请检查数据源或切换目标。
      </div>
    );
  }

  const improvedCount = stats.nValid - stats.degradedCount;
  const improvedRate = stats.nValid > 0 ? (improvedCount / stats.nValid * 100) : 0;
  const degradedRate = stats.nValid > 0 ? (stats.degradedCount / stats.nValid * 100) : 0;
  const cv = (stats.meanImp !== 0 && !isNaN(stats.std) && stats.meanImp !== null) 
    ? (stats.std / Math.abs(stats.meanImp)) 
    : null;

  const iqr = stats.q3 - stats.q1;

  const mainCards = [
    { label: '几何平均改进', value: stats.geomeanImp, isPositive: stats.geomeanImp > 0, helpId: 'geomean' },
    { label: '算术平均改进', value: stats.meanImp, isPositive: stats.meanImp > 0, helpId: 'arith' },
    { label: '显著性检验', value: stats.pValue, isPositive: stats.pValue < 0.05, format: 'pvalue', helpId: 'pvalue' },
    { label: '95% 置信区间', value: `[${stats.ciLower.toFixed(1)}%, ${stats.ciUpper.toFixed(1)}%]`, isPositive: stats.ciLower > 0, helpId: 'ci' },
    { 
      label: '退化案例', 
      value: stats.degradedCount, 
      suffix: `/${stats.nValid}`,
      subValue: `(${degradedRate.toFixed(1)}%)`,
      isPositive: stats.degradedCount === 0, 
      helpId: 'degraded' 
    },
    { 
      label: '极值范围', 
      value: stats.maxImp, 
      minImp: stats.minImp,
      isPositive: stats.maxImp > Math.abs(stats.minImp || 0), 
      helpId: 'extreme',
      format: 'range'
    }
  ];

  const auxiliaryCards = [
    { label: '中位数', value: stats.median, isPositive: stats.median > 0, helpId: 'median', description: '改进率的中位数值' },
    { label: '标准差', value: stats.std, isPositive: true, neutral: true, helpId: 'std', description: '数据离散程度的度量' },
    { label: '变异系数', value: cv, std: stats.std, meanImp: stats.meanImp, isPositive: true, neutral: true, format: 'cv', helpId: 'cv', description: '标准差/均值，衡量相对离散程度' },
    { label: 'IQR', value: iqr, isPositive: iqr > 0, helpId: 'iqr', description: '四分位距 Q3-Q1，中间50%数据的范围' }
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {mainCards.map((card, i) => (
          <div key={i} className={`p-3 rounded-xl border ${card.isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`text-xs font-bold mb-1 flex items-center ${card.isPositive ? 'text-emerald-800' : 'text-red-800'}`}>
              {card.label}
              <HelpIcon content={<StatHelpContent helpId={card.helpId} />} position="bottom-right" className="w-4 h-4 ml-0.5" />
            </div>
            <div className={`text-2xl font-black ${card.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {card.format === 'pvalue' && typeof card.value === 'number' 
                ? card.value.toFixed(3) 
                : card.format === 'range'
                  ? <span className="flex items-center gap-1 text-lg">
                      <span className="text-red-600">{card.minImp.toFixed(1)}%</span>
                      <span className="text-gray-400 text-sm">~</span>
                      <span className="text-emerald-600">+{card.value.toFixed(1)}%</span>
                    </span>
                  : card.format === 'integer'
                    ? <span>{card.value}{card.suffix || ''} <span className="text-sm font-medium">{card.subValue}</span></span>
                    : card.suffix && card.subValue
                      ? <span>{card.value}{card.suffix} <span className="text-sm font-medium">{card.subValue}</span></span>
                      : typeof card.value === 'number' 
                        ? `${card.value > 0 ? '+' : ''}${card.value.toFixed(2)}%`
                        : card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAuxiliary(!showAuxiliary)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          {showAuxiliary ? '收起' : '展开'}辅助指标
          <svg className={`w-3 h-3 transition-transform ${showAuxiliary ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <span className="text-[10px] text-gray-400">中位数、标准差、变异系数、IQR</span>
      </div>

      {showAuxiliary && (
        <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-200">
          {auxiliaryCards.map((card, i) => (
            <div key={i} className={`px-2.5 py-1.5 rounded border ${card.neutral ? 'bg-gray-50 border-gray-200' : card.isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`text-[10px] font-bold flex items-center ${card.neutral ? 'text-gray-600' : card.isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                {card.label}
                <HelpIcon content={<AuxiliaryStatHelp label={card.label} value={card.value} std={card.std} meanImp={card.meanImp} />} position="bottom-right" className="w-4 h-4 ml-0.5" />
              </div>
              <div className={`text-base font-black ${card.neutral ? 'text-gray-700' : card.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {card.format === 'cv'
                  ? (card.value === null || isNaN(card.value) 
                    ? 'N/A'
                    : <span>
                        <span className="text-xs font-normal text-gray-400">{card.std.toFixed(2)}/{Math.abs(card.meanImp).toFixed(2)}=</span>
                        {card.value.toFixed(2)}
                      </span>)
                  : typeof card.value === 'number'
                    ? `${card.value > 0 ? '+' : ''}${card.value.toFixed(2)}%`
                    : card.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

StatsCards.propTypes = {
  stats: PropTypes.shape({
    geomeanImp: PropTypes.number,
    meanImp: PropTypes.number,
    pValue: PropTypes.number,
    ciLower: PropTypes.number,
    ciUpper: PropTypes.number,
    degradedCount: PropTypes.number,
    nValid: PropTypes.number,
    maxImp: PropTypes.number,
    minImp: PropTypes.number,
    median: PropTypes.number,
    std: PropTypes.number,
    q1: PropTypes.number,
    q3: PropTypes.number
  })
};

export default StatsCards;
