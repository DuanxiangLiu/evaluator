export const EDA_METRICS_CONFIG = {
  HPWL: { 
    name: '半周长线长', 
    unit: 'um', 
    better: 'lower', 
    description: '布线总长度，值越小越好',
    displayName: 'HPWL (μm)'
  },
  TNS: { 
    name: '时序负裕度总和', 
    unit: 'ps', 
    better: 'higher', 
    description: '时序负裕度总和，值越大越好（越接近0或正值）',
    displayName: 'TNS (ps)'
  },
  WNS: { 
    name: '最差时序负裕度', 
    unit: 'ps', 
    better: 'higher', 
    description: '最差的时序负裕度，值越大越好（越接近0或正值）',
    displayName: 'WNS (ps)'
  },
  Congestion: { 
    name: '拥塞', 
    unit: '', 
    better: 'lower', 
    description: '布线拥塞程度，值越小越好',
    displayName: 'Congestion'
  },
  Runtime: { 
    name: '运行时间', 
    unit: 's', 
    better: 'lower', 
    description: '算法运行时间，值越小越好',
    displayName: 'Runtime (s)'
  },
  HB: { 
    name: 'hybrid bonding terminal', 
    unit: '个', 
    better: 'lower', 
    description: '混合键合终端数量，值越小越好',
    displayName: '#HB'
  },
  Leakage: { 
    name: '泄漏功耗', 
    unit: 'mW', 
    better: 'lower', 
    description: '泄漏功耗，值越小越好',
    displayName: 'Leakage (mW)'
  },
  Cell_Area: { 
    name: '单元面积', 
    unit: 'um²', 
    better: 'lower', 
    description: '单元总面积，值越小越好',
    displayName: 'Cell Area (μm²)'
  },
  Metal_Layers: { 
    name: '金属层数', 
    unit: '层', 
    better: 'lower', 
    description: '金属层数，值越小越好',
    displayName: 'Metal Layers'
  },
  Frequency: { 
    name: '工作频率', 
    unit: 'MHz', 
    better: 'higher', 
    description: '芯片工作频率，值越大越好',
    displayName: 'Frequency (MHz)'
  },
  Throughput: { 
    name: '吞吐量', 
    unit: 'GOPS', 
    better: 'higher', 
    description: '数据处理吞吐量，值越大越好',
    displayName: 'Throughput (GOPS)'
  },
  IPC: { 
    name: '每周期指令数', 
    unit: '', 
    better: 'higher', 
    description: '每周期执行的指令数，值越大越好',
    displayName: 'IPC'
  },
  MTBF: { 
    name: '平均无故障时间', 
    unit: 'h', 
    better: 'higher', 
    description: '平均无故障时间，值越大越好',
    displayName: 'MTBF (h)'
  },
  EDP: { 
    name: '能量延迟积', 
    unit: 'pJ', 
    better: 'lower', 
    description: '能量延迟积，值越小越好',
    displayName: 'EDP (pJ)'
  }
};

export const getMetricConfig = (metricName) => {
  return EDA_METRICS_CONFIG[metricName] || {
    name: metricName,
    unit: '',
    better: 'lower',
    description: '自定义指标',
    displayName: metricName
  };
};

export const isBuiltInMetric = (metricName) => {
  return !!EDA_METRICS_CONFIG[metricName];
};

export const getMetricDisplayName = (metricName) => {
  const config = getMetricConfig(metricName);
  return config.displayName || metricName;
};
