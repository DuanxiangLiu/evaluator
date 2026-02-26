// 生成随机数的辅助函数
const random = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(random(min, max));

// 生成单个case的数据
const generateCaseData = (caseName, instances, nets, baseAlgo, algo1, algo2) => {
  const baseHPWL = random(5000, 100000);
  // TNS通常为负数，表示时序违规的总和
  // 负数越大越好（比如-100比-1000好）
  const baseTNS = random(-10000, -100);
  const basePower = random(50, 1500);
  const baseRuntime = random(1000, 30000);
  const baseHbCount = random(10, 1000);

  // 算法1相对于基线的改进（-10% 到 +20%）
  const algo1Imp = random(-0.1, 0.2);
  const algo2Imp = random(-0.05, 0.25);

  const algo1HPWL = baseHPWL * (1 - algo1Imp * random(0.8, 1.2));
  const algo2HPWL = baseHPWL * (1 - algo2Imp * random(0.8, 1.2));
  
  // TNS改进：改进率越大，TNS值越大（越接近0或为正数）
  // 例如：基线TNS=-5000，改进20%，则新TNS=-5000*(1-0.2)=-4000（更好）
  const algo1TNS = baseTNS * (1 - algo1Imp * random(0.5, 1.5));
  const algo2TNS = baseTNS * (1 - algo2Imp * random(0.5, 1.5));
  
  const algo1Power = basePower * (1 - algo1Imp * random(0.6, 1.1));
  const algo2Power = basePower * (1 - algo2Imp * random(0.6, 1.1));
  
  const algo1Runtime = baseRuntime * (1 - algo1Imp * random(0.3, 0.8));
  const algo2Runtime = baseRuntime * (1 - algo2Imp * random(0.3, 0.8));
  
  const algo1HbCount = Math.round(baseHbCount * (1 - algo1Imp * random(0.4, 1.0)));
  const algo2HbCount = Math.round(baseHbCount * (1 - algo2Imp * random(0.4, 1.0)));

  // 随机生成一些NaN值（约10%的概率）
  const addNaN = (value) => Math.random() < 0.1 ? 'NaN' : value.toFixed(0);

  return `${caseName},${instances},${nets},${baseHPWL.toFixed(0)},${addNaN(algo1HPWL)},${addNaN(algo2HPWL)},${baseTNS.toFixed(0)},${addNaN(algo1TNS)},${addNaN(algo2TNS)},${basePower.toFixed(1)},${addNaN(algo1Power)},${addNaN(algo2Power)},${baseRuntime.toFixed(0)},${addNaN(algo1Runtime)},${addNaN(algo2Runtime)},${baseHbCount},${addNaN(algo1HbCount)},${addNaN(algo2HbCount)}`;
};

// 生成默认数据集（综合设计）
export const generateDefaultDataset = () => {
  const cases = [];
  const designs = [
    'superblue', 'bigblue', 'adaptec', 'ibm', 'ispd'
  ];
  
  for (let i = 1; i <= 30; i++) {
    const design = designs[(i - 1) % designs.length];
    const caseName = `${design}_${i}`;
    const instances = randomInt(50000, 5000000);
    const nets = randomInt(instances * 0.9, instances * 1.2);
    cases.push(generateCaseData(caseName, instances, nets));
  }
  
  return `Case,Instances,Nets,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL,m_Base_TNS,m_Algo1_TNS,m_Algo2_TNS,m_Base_Power,m_Algo1_Power,m_Algo2_Power,m_Base_Runtime,m_Algo1_Runtime,m_Algo2_Runtime,m_Base_Hb_Count,m_Algo1_Hb_Count,m_Algo2_Hb_Count
${cases.join('\n')}`;
};

// 生成小型设计数据集
export const generateSmallDataset = () => {
  const cases = [];
  
  for (let i = 1; i <= 30; i++) {
    const caseName = `core_${i.toString().padStart(2, '0')}`;
    const instances = randomInt(5000, 100000);
    const nets = randomInt(instances * 0.8, instances * 1.5);
    
    const baseHPWL = random(500, 5000);
    const baseTNS = random(-500, -10);
    const basePower = random(5, 50);
    
    const algo1Imp = random(-0.05, 0.15);
    const algo2Imp = random(-0.03, 0.18);
    
    const algo1HPWL = baseHPWL * (1 - algo1Imp);
    const algo2HPWL = baseHPWL * (1 - algo2Imp);
    const algo1TNS = baseTNS * (1 - algo1Imp * random(0.5, 1.5));
    const algo2TNS = baseTNS * (1 - algo2Imp * random(0.5, 1.5));
    const algo1Power = basePower * (1 - algo1Imp * 0.8);
    const algo2Power = basePower * (1 - algo2Imp * 0.8);
    
    cases.push(`${caseName},${instances},${nets},${baseHPWL.toFixed(0)},${algo1HPWL.toFixed(0)},${algo2HPWL.toFixed(0)},${baseTNS.toFixed(0)},${algo1TNS.toFixed(0)},${algo2TNS.toFixed(0)},${basePower.toFixed(1)},${algo1Power.toFixed(1)},${algo2Power.toFixed(1)}`);
  }
  
  return `Case,Instances,Nets,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL,m_Base_TNS,m_Algo1_TNS,m_Algo2_TNS,m_Base_Power,m_Algo1_Power,m_Algo2_Power
${cases.join('\n')}`;
};

// 生成大型设计数据集
export const generateLargeDataset = () => {
  const cases = [];
  
  for (let i = 1; i <= 30; i++) {
    const caseName = `chip_${i.toString().padStart(2, '0')}`;
    const instances = randomInt(3000000, 10000000);
    const nets = randomInt(instances * 0.9, instances * 1.3);
    
    const baseHPWL = random(50000, 200000);
    const baseTNS = random(-20000, -1000);
    const basePower = random(500, 2000);
    const baseRuntime = random(10000, 50000);
    
    const algo1Imp = random(-0.08, 0.18);
    const algo2Imp = random(-0.05, 0.22);
    
    const algo1HPWL = baseHPWL * (1 - algo1Imp);
    const algo2HPWL = baseHPWL * (1 - algo2Imp);
    const algo1TNS = baseTNS * (1 - algo1Imp * random(0.6, 1.4));
    const algo2TNS = baseTNS * (1 - algo2Imp * random(0.6, 1.4));
    const algo1Power = basePower * (1 - algo1Imp * 0.7);
    const algo2Power = basePower * (1 - algo2Imp * 0.7);
    const algo1Runtime = baseRuntime * (1 - algo1Imp * 0.5);
    const algo2Runtime = baseRuntime * (1 - algo2Imp * 0.5);
    
    cases.push(`${caseName},${instances},${nets},${baseHPWL.toFixed(0)},${algo1HPWL.toFixed(0)},${algo2HPWL.toFixed(0)},${baseTNS.toFixed(0)},${algo1TNS.toFixed(0)},${algo2TNS.toFixed(0)},${basePower.toFixed(1)},${algo1Power.toFixed(1)},${algo2Power.toFixed(1)},${baseRuntime.toFixed(0)},${algo1Runtime.toFixed(0)},${algo2Runtime.toFixed(0)}`);
  }
  
  return `Case,Instances,Nets,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL,m_Base_TNS,m_Algo1_TNS,m_Algo2_TNS,m_Base_Power,m_Algo1_Power,m_Algo2_Power,m_Base_Runtime,m_Algo1_Runtime,m_Algo2_Runtime
${cases.join('\n')}`;
};

// 生成功耗优化数据集
export const generatePowerDataset = () => {
  const cases = [];
  
  for (let i = 1; i <= 30; i++) {
    const caseName = `power_test_${i.toString().padStart(2, '0')}`;
    const instances = randomInt(50000, 800000);
    const nets = randomInt(instances * 0.85, instances * 1.2);
    
    const baseHPWL = random(3000, 30000);
    const basePower = random(50, 600);
    const baseLeakage = random(5, 60);
    
    const algo1Imp = random(-0.03, 0.12);
    const algo2Imp = random(-0.02, 0.15);
    
    const algo1HPWL = baseHPWL * (1 - algo1Imp * 0.9);
    const algo2HPWL = baseHPWL * (1 - algo2Imp * 0.9);
    const algo1Power = basePower * (1 - algo1Imp * 1.2);
    const algo2Power = basePower * (1 - algo2Imp * 1.2);
    const algo1Leakage = baseLeakage * (1 - algo1Imp * 1.5);
    const algo2Leakage = baseLeakage * (1 - algo2Imp * 1.5);
    
    cases.push(`${caseName},${instances},${nets},${baseHPWL.toFixed(0)},${algo1HPWL.toFixed(0)},${algo2HPWL.toFixed(0)},${basePower.toFixed(1)},${algo1Power.toFixed(1)},${algo2Power.toFixed(1)},${baseLeakage.toFixed(1)},${algo1Leakage.toFixed(1)},${algo2Leakage.toFixed(1)}`);
  }
  
  return `Case,Instances,Nets,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL,m_Base_Power,m_Algo1_Power,m_Algo2_Power,m_Base_Leakage,m_Algo1_Leakage,m_Algo2_Leakage
${cases.join('\n')}`;
};

// 生成时序优化数据集
export const generateTimingDataset = () => {
  const cases = [];
  
  for (let i = 1; i <= 30; i++) {
    const caseName = `timing_test_${i.toString().padStart(2, '0')}`;
    const instances = randomInt(100000, 1000000);
    const nets = randomInt(instances * 0.9, instances * 1.3);
    
    // TNS为负数，表示时序违规
    const baseTNS = random(-10000, -200);
    // WNS为负数，表示最坏的时序违规
    const baseWNS = random(-500, -10);
    const baseHPWL = random(10000, 80000);
    
    const algo1Imp = random(-0.05, 0.20);
    const algo2Imp = random(-0.03, 0.25);
    
    // 改进率越大，TNS和WNS越大（越接近0）
    const algo1TNS = baseTNS * (1 - algo1Imp * 1.3);
    const algo2TNS = baseTNS * (1 - algo2Imp * 1.3);
    const algo1WNS = baseWNS * (1 - algo1Imp * 0.8);
    const algo2WNS = baseWNS * (1 - algo2Imp * 0.8);
    const algo1HPWL = baseHPWL * (1 - algo1Imp * 0.6);
    const algo2HPWL = baseHPWL * (1 - algo2Imp * 0.6);
    
    cases.push(`${caseName},${instances},${nets},${baseTNS.toFixed(0)},${algo1TNS.toFixed(0)},${algo2TNS.toFixed(0)},${baseWNS.toFixed(0)},${algo1WNS.toFixed(0)},${algo2WNS.toFixed(0)},${baseHPWL.toFixed(0)},${algo1HPWL.toFixed(0)},${algo2HPWL.toFixed(0)}`);
  }
  
  return `Case,Instances,Nets,m_Base_TNS,m_Algo1_TNS,m_Algo2_TNS,m_Base_WNS,m_Algo1_WNS,m_Algo2_WNS,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL
${cases.join('\n')}`;
};
