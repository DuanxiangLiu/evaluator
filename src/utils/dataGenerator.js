const random = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(random(min, max));

const generateCaseData = (caseName, instances, nets, macros, modules, baseAlgo, algo1, algo2) => {
  const baseHPWL = random(5000, 100000);
  const baseHbCount = randomInt(10, 1000);
  const baseTNS = random(-10000, -100);
  const baseCongestion = random(1.2, 1.8);
  const baseRuntime = random(1000, 30000);

  const algo1Imp = random(-0.1, 0.2);
  const algo2Imp = random(-0.05, 0.25);

  const algo1HPWL = baseHPWL * (1 - algo1Imp * random(0.8, 1.2));
  const algo2HPWL = baseHPWL * (1 - algo2Imp * random(0.8, 1.2));
  
  const algo1HbCount = Math.round(baseHbCount * (1 - algo1Imp * random(0.4, 1.0)));
  const algo2HbCount = Math.round(baseHbCount * (1 - algo2Imp * random(0.4, 1.0)));
  
  const algo1TNS = baseTNS * (1 - algo1Imp * random(0.5, 1.5));
  const algo2TNS = baseTNS * (1 - algo2Imp * random(0.5, 1.5));
  
  const algo1Congestion = baseCongestion * (1 - algo1Imp * random(0.3, 0.6));
  const algo2Congestion = baseCongestion * (1 - algo2Imp * random(0.3, 0.6));

  
  const algo1Runtime = baseRuntime * (1 - algo1Imp * random(0.3, 0.8));
  const algo2Runtime = baseRuntime * (1 - algo2Imp * random(0.3, 0.8));

  const addNaN = (value, decimals = 0) => Math.random() < 0.1 ? 'NaN' : value.toFixed(decimals);
  const addNaNInt = (value) => Math.random() < 0.1 ? 'NaN' : Math.round(value);

  return `${caseName},${instances},${nets},${macros},${modules},${baseHPWL.toFixed(0)},${addNaN(algo1HPWL)},${addNaN(algo2HPWL)},${baseHbCount},${addNaNInt(algo1HbCount)},${addNaNInt(algo2HbCount)},${baseCongestion.toFixed(2)},${addNaN(algo1Congestion, 2)},${addNaN(algo2Congestion, 2)},${baseTNS.toFixed(0)},${addNaN(algo1TNS)},${addNaN(algo2TNS)},${baseRuntime.toFixed(0)},${addNaN(algo1Runtime)},${addNaN(algo2Runtime)}`;
};

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
    const macros = randomInt(instances * 0.05, instances * 0.15);
    const modules = randomInt(instances * 0.02, instances * 0.08);
    cases.push(generateCaseData(caseName, instances, nets, macros, modules));
  }
  
  return `Case,#Inst,#Net,#Macro,#Module,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL,m_Base_HB,m_Algo1_HB,m_Algo2_HB,m_Base_Congestion,m_Algo1_Congestion,m_Algo2_Congestion,m_Base_TNS,m_Algo1_TNS,m_Algo2_TNS,m_Base_Runtime,m_Algo1_Runtime,m_Algo2_Runtime
${cases.join('\n')}`;
};

export const generateSmallDataset = () => {
  const cases = [];
  
  for (let i = 1; i <= 30; i++) {
    const caseName = `core_${i.toString().padStart(2, '0')}`;
    const instances = randomInt(5000, 100000);
    const nets = randomInt(instances * 0.8, instances * 1.5);
    const macros = randomInt(instances * 0.03, instances * 0.1);
    const modules = randomInt(instances * 0.02, instances * 0.06);
    
    const baseHPWL = random(500, 5000);
    const baseTNS = random(-500, -10);
    const baseCongestion = random(1.2, 1.8);
    
    const algo1Imp = random(-0.05, 0.15);
    const algo2Imp = random(-0.03, 0.18);
    
    const algo1HPWL = baseHPWL * (1 - algo1Imp);
    const algo2HPWL = baseHPWL * (1 - algo2Imp);
    const algo1TNS = baseTNS * (1 - algo1Imp * random(0.5, 1.5));
    const algo2TNS = baseTNS * (1 - algo2Imp * random(0.5, 1.5));
    const algo1Congestion = baseCongestion * (1 - algo1Imp * 0.4);
    const algo2Congestion = baseCongestion * (1 - algo2Imp * 0.4);
    
    cases.push(`${caseName},${instances},${nets},${macros},${modules},${baseHPWL.toFixed(0)},${algo1HPWL.toFixed(0)},${algo2HPWL.toFixed(0)},${baseTNS.toFixed(0)},${algo1TNS.toFixed(0)},${algo2TNS.toFixed(0)},${baseCongestion.toFixed(2)},${algo1Congestion.toFixed(2)},${algo2Congestion.toFixed(2)}`);
  }
  
  return `Case,#Inst,#Net,#Macro,#Module,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL,m_Base_TNS,m_Algo1_TNS,m_Algo2_TNS,m_Base_Congestion,m_Algo1_Congestion,m_Algo2_Congestion
${cases.join('\n')}`;
};

export const generateLargeDataset = () => {
  const cases = [];
  
  for (let i = 1; i <= 30; i++) {
    const caseName = `chip_${i.toString().padStart(2, '0')}`;
    const instances = randomInt(3000000, 10000000);
    const nets = randomInt(instances * 0.9, instances * 1.3);
    const macros = randomInt(instances * 0.04, instances * 0.12);
    const modules = randomInt(instances * 0.03, instances * 0.1);
    
    const baseHPWL = random(50000, 200000);
    const baseTNS = random(-20000, -1000);
    const baseCongestion = random(1.2, 1.8);
    const baseRuntime = random(10000, 50000);
    
    const algo1Imp = random(-0.08, 0.18);
    const algo2Imp = random(-0.05, 0.22);
    
    const algo1HPWL = baseHPWL * (1 - algo1Imp);
    const algo2HPWL = baseHPWL * (1 - algo2Imp);
    const algo1TNS = baseTNS * (1 - algo1Imp * random(0.6, 1.4));
    const algo2TNS = baseTNS * (1 - algo2Imp * random(0.6, 1.4));
    const algo1Congestion = baseCongestion * (1 - algo1Imp * 0.35);
    const algo2Congestion = baseCongestion * (1 - algo2Imp * 0.35);
    const algo1Runtime = baseRuntime * (1 - algo1Imp * 0.5);
    const algo2Runtime = baseRuntime * (1 - algo2Imp * 0.5);
    
    cases.push(`${caseName},${instances},${nets},${macros},${modules},${baseHPWL.toFixed(0)},${algo1HPWL.toFixed(0)},${algo2HPWL.toFixed(0)},${baseTNS.toFixed(0)},${algo1TNS.toFixed(0)},${algo2TNS.toFixed(0)},${baseCongestion.toFixed(2)},${algo1Congestion.toFixed(2)},${algo2Congestion.toFixed(2)},${baseRuntime.toFixed(0)},${algo1Runtime.toFixed(0)},${algo2Runtime.toFixed(0)}`);
  }
  
  return `Case,#Inst,#Net,#Macro,#Module,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL,m_Base_TNS,m_Algo1_TNS,m_Algo2_TNS,m_Base_Congestion,m_Algo1_Congestion,m_Algo2_Congestion,m_Base_Runtime,m_Algo1_Runtime,m_Algo2_Runtime
${cases.join('\n')}`;
};

export const generateCongestionDataset = () => {
  const cases = [];
  
  for (let i = 1; i <= 30; i++) {
    const caseName = `congestion_test_${i.toString().padStart(2, '0')}`;
    const instances = randomInt(50000, 800000);
    const nets = randomInt(instances * 0.85, instances * 1.2);
    const macros = randomInt(instances * 0.06, instances * 0.15);
    const modules = randomInt(instances * 0.04, instances * 0.1);
    
    const baseHPWL = random(3000, 30000);
    const baseCongestion = random(1.2, 1.8);
    const baseLeakage = random(5, 60);
    
    const algo1Imp = random(-0.03, 0.12);
    const algo2Imp = random(-0.02, 0.15);
    
    const algo1HPWL = baseHPWL * (1 - algo1Imp * 0.9);
    const algo2HPWL = baseHPWL * (1 - algo2Imp * 0.9);
    const algo1Congestion = baseCongestion * (1 - algo1Imp * 0.6);
    const algo2Congestion = baseCongestion * (1 - algo2Imp * 0.6);
    const algo1Leakage = baseLeakage * (1 - algo1Imp * 1.5);
    const algo2Leakage = baseLeakage * (1 - algo2Imp * 1.5);
    
    cases.push(`${caseName},${instances},${nets},${macros},${modules},${baseHPWL.toFixed(0)},${algo1HPWL.toFixed(0)},${algo2HPWL.toFixed(0)},${baseCongestion.toFixed(2)},${algo1Congestion.toFixed(2)},${algo2Congestion.toFixed(2)},${baseLeakage.toFixed(1)},${algo1Leakage.toFixed(1)},${algo2Leakage.toFixed(1)}`);
  }
  
  return `Case,#Inst,#Net,#Macro,#Module,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL,m_Base_Congestion,m_Algo1_Congestion,m_Algo2_Congestion,m_Base_Leakage,m_Algo1_Leakage,m_Algo2_Leakage
${cases.join('\n')}`;
};

export const generateTimingDataset = () => {
  const cases = [];
  
  for (let i = 1; i <= 30; i++) {
    const caseName = `timing_test_${i.toString().padStart(2, '0')}`;
    const instances = randomInt(100000, 1000000);
    const nets = randomInt(instances * 0.9, instances * 1.3);
    const macros = randomInt(instances * 0.05, instances * 0.15);
    const modules = randomInt(instances * 0.04, instances * 0.12);
    
    const baseTNS = random(-10000, -200);
    const baseWNS = random(-500, -10);
    const baseHPWL = random(10000, 80000);
    
    const algo1Imp = random(-0.05, 0.20);
    const algo2Imp = random(-0.03, 0.25);
    
    const algo1TNS = baseTNS * (1 - algo1Imp * 1.3);
    const algo2TNS = baseTNS * (1 - algo2Imp * 1.3);
    const algo1WNS = baseWNS * (1 - algo1Imp * 0.8);
    const algo2WNS = baseWNS * (1 - algo2Imp * 0.8);
    const algo1HPWL = baseHPWL * (1 - algo1Imp * 0.6);
    const algo2HPWL = baseHPWL * (1 - algo2Imp * 0.6);
    
    cases.push(`${caseName},${instances},${nets},${macros},${modules},${baseTNS.toFixed(0)},${algo1TNS.toFixed(0)},${algo2TNS.toFixed(0)},${baseWNS.toFixed(0)},${algo1WNS.toFixed(0)},${algo2WNS.toFixed(0)},${baseHPWL.toFixed(0)},${algo1HPWL.toFixed(0)},${algo2HPWL.toFixed(0)}`);
  }
  
  return `Case,#Inst,#Net,#Macro,#Module,m_Base_TNS,m_Algo1_TNS,m_Algo2_TNS,m_Base_WNS,m_Algo1_WNS,m_Algo2_WNS,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL
${cases.join('\n')}`;
};
