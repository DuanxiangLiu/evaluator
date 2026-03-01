export const STAT_HELP_CONTENT = {
  geomean: { 
    title: '几何平均改进率 (Geomean)', 
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
    title: '算术平均改进率 (Arithmetic Mean)', 
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
  improved_count: { 
    title: '改进案例', 
    description: '改进率为正的测试用例数量',
    formula: '改进率 = 改进案例数 / 总案例数 × 100%',
    details: [
      { label: '定义', value: '改进率 > 0% 的案例为改进案例' },
      { label: '解读', value: '括号内为改进案例占总案例的百分比' },
      { label: '建议', value: '改进率应 > 70% 才说明算法有效' }
    ],
    example: '例如：42/50 (84%) 表示 50 个案例中有 42 个有改进效果'
  },
  median: { 
    title: '中位数 (Median)', 
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
    title: '标准差 (Standard Deviation)', 
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
    title: '变异系数 (Coefficient of Variation)', 
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
    title: '四分位距 (Interquartile Range)', 
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

export const AUXILIARY_STAT_HELP = {
  '中位数': {
    title: '中位数 (Median)',
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
    title: '标准差 (Standard Deviation)',
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
    title: '变异系数 (CV)',
    description: '相对离散程度，消除量纲影响',
    formula: 'CV = 标准差 / |平均值| × 100%',
    details: [
      { label: '特点', value: '无量纲，便于不同数据集间比较' },
      { label: '解读', value: 'CV < 50% 表示稳定性较好' },
      { label: '建议', value: 'CV > 100% 说明数据波动剧烈，需关注' }
    ],
    example: '当前：{{std}} / {{meanImp}} = {{value}}%'
  },
  '四分位距': {
    title: '四分位距 (Interquartile Range)',
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

export const getStatHelp = (helpId) => {
  return STAT_HELP_CONTENT[helpId] || { 
    title: '', 
    description: '', 
    formula: '', 
    details: [], 
    example: '' 
  };
};

export const getAuxiliaryStatHelp = (label) => {
  return AUXILIARY_STAT_HELP[label] || { 
    title: label, 
    description: '', 
    formula: '', 
    details: [], 
    example: '' 
  };
};
