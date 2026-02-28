import React from 'react';

export const KeyIndicatorHelpContent = () => (
  <div className="space-y-3">
    <div>
      <h3 className="font-bold text-indigo-400 text-sm mb-2">关键指标概览</h3>
      <p className="text-gray-300 text-xs mb-2">
        下方统计卡片展示当前选中指标的核心统计数据，帮助您快速了解算法性能。
      </p>
    </div>
    
    <div className="space-y-2">
      <h4 className="font-semibold text-emerald-300 text-xs">主要指标</h4>
      <ul className="text-gray-300 text-xs space-y-1">
        <li>• <strong>Geomean</strong>：几何平均改进率，整体改进的标准度量</li>
        <li>• <strong>P-Value</strong>：统计显著性检验，小于0.05表示显著</li>
        <li>• <strong>置信区间</strong>：算法表现的波动范围预测</li>
      </ul>
    </div>
    
    <div className="space-y-2">
      <h4 className="font-semibold text-amber-300 text-xs">切换方式</h4>
      <ul className="text-gray-300 text-xs space-y-1">
        <li>• 使用「指标」下拉框切换不同评估指标</li>
        <li>• 使用「基线」和「对比」下拉框选择比较对象</li>
      </ul>
    </div>
    
    <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
      💡 点击各指标旁的 <strong>?</strong> 图标可查看详细解释
    </div>
  </div>
);

export const ImprovementHelpContent = () => (
  <div className="space-y-2">
    <h4 className="font-semibold text-indigo-300 text-xs">改进率计算公式</h4>
    <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-300 font-mono">
      改进率 = (基准值 - 对比值) / 基准值 × 100%
    </div>
    <ul className="text-gray-300 text-xs space-y-1">
      <li>• <span className="text-emerald-400">正值</span>：对比算法优于基准</li>
      <li>• <span className="text-red-400">负值</span>：对比算法劣于基准</li>
    </ul>
  </div>
);

export const StatusHelpContent = () => (
  <div className="space-y-2">
    <h4 className="font-semibold text-indigo-300 text-xs">状态标识说明</h4>
    <ul className="text-gray-300 text-xs space-y-1">
      <li>• <strong>已选</strong>：当前选中用于图表分析的用例</li>
      <li>• <strong>退化</strong>：改进率为负的用例</li>
      <li>• <strong>异常</strong>：数据存在缺失或异常值</li>
    </ul>
    <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400 mt-2">
      💡 点击放大镜按钮可查看该用例的多维深度分析
    </div>
  </div>
);

export const TableHelpContent = () => (
  <div className="space-y-3">
    <div>
      <h3 className="font-bold text-indigo-400 text-sm mb-2">明细数据表格</h3>
      <p className="text-gray-300 text-xs mb-2">
        展示所有测试用例的详细数据，包括基准算法和对比算法的原始指标值及计算得出的改进率。
      </p>
    </div>
    
    <div className="space-y-2">
      <h4 className="font-semibold text-emerald-300 text-xs">改进率计算</h4>
      <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-300 font-mono">
        改进率 = (基准值 - 对比值) / 基准值 × 100%
      </div>
      <ul className="text-gray-300 text-xs space-y-1 mt-2">
        <li>• <span className="text-emerald-400">正值（绿色）</span>：对比算法优于基准算法</li>
        <li>• <span className="text-red-400">负值（红色）</span>：对比算法劣于基准算法</li>
      </ul>
    </div>
    
    <div className="space-y-2">
      <h4 className="font-semibold text-amber-300 text-xs">筛选功能</h4>
      <ul className="text-gray-300 text-xs space-y-1">
        <li>• <strong>全部</strong>：显示所有用例</li>
        <li>• <strong>退化</strong>：仅显示改进率为负的用例</li>
        <li>• <strong>异常</strong>：仅显示数据异常的用例</li>
      </ul>
    </div>
    
    <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
      💡 <strong>提示</strong>：勾选用例可将其纳入图表分析范围
    </div>
  </div>
);
