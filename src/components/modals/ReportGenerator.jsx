import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FileText, Download, Eye, Settings, X, FileSpreadsheet, File } from 'lucide-react';
import { generateReport, downloadHTMLReport, downloadPDFReport, REPORT_TEMPLATES, reportToHTML } from '../../services/reportService';

const ReportGenerator = ({
  isOpen,
  onClose,
  parsedData,
  availableAlgos,
  availableMetrics,
  metaColumns,
  stats,
  allMetricsStats,
  baseAlgo,
  compareAlgo,
  activeMetric
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('detailed');
  const [reportTitle, setReportTitle] = useState('EDA 算法评估报告');
  const [customLogo, setCustomLogo] = useState('');
  const [previewHTML, setPreviewHTML] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const report = useMemo(() => {
    if (!parsedData || !availableAlgos || !availableMetrics) return null;
    
    return generateReport({
      template: selectedTemplate,
      data: parsedData,
      algos: availableAlgos,
      metrics: availableMetrics,
      metaColumns,
      stats,
      allMetricsStats,
      baseAlgo,
      compareAlgo,
      activeMetric
    });
  }, [selectedTemplate, parsedData, availableAlgos, availableMetrics, metaColumns, stats, allMetricsStats, baseAlgo, compareAlgo, activeMetric]);

  const handlePreview = () => {
    if (!report) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      const html = reportToHTML(report, { title: reportTitle, customLogo });
      setPreviewHTML(html);
      setIsGenerating(false);
    }, 100);
  };

  const handleDownloadHTML = () => {
    if (!report) return;
    downloadHTMLReport(report, { title: reportTitle, customLogo });
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    downloadPDFReport(report, { title: reportTitle, customLogo });
  };

  const handleClosePreview = () => {
    setPreviewHTML(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-violet-600">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5" />
            <h2 className="text-lg font-bold">专业报告生成器</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              报告标题
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="输入报告标题"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              报告模板
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate === key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-800">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              自定义 Logo URL (可选)
            </label>
            <input
              type="text"
              value={customLogo}
              onChange={(e) => setCustomLogo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="输入 Logo 图片 URL"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              报告内容预览
            </h3>
            {report ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">模板:</span> {report.template}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">包含章节:</span>
                </div>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  {report.sections.map((section, idx) => (
                    <li key={idx}>{section.title}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-400">无可用数据生成报告</p>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              <strong>提示:</strong> HTML 格式可直接在浏览器中查看和打印为 PDF。选择"打印 PDF"将打开打印预览窗口。
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between gap-2">
          <button
            onClick={handlePreview}
            disabled={!report || isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHTML}
              disabled={!report}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <File className="w-4 h-4" />
              下载 HTML
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={!report}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              打印 PDF
            </button>
          </div>
        </div>
      </div>

      {previewHTML && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col">
          <div className="bg-white p-2 flex items-center justify-between border-b">
            <span className="font-semibold text-gray-700">报告预览</span>
            <button
              onClick={handleClosePreview}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-gray-600"
            >
              关闭预览
            </button>
          </div>
          <iframe
            srcDoc={previewHTML}
            className="flex-1 w-full bg-white"
            title="报告预览"
          />
        </div>
      )}
    </div>
  );
};

ReportGenerator.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  parsedData: PropTypes.array.isRequired,
  availableAlgos: PropTypes.array.isRequired,
  availableMetrics: PropTypes.array.isRequired,
  metaColumns: PropTypes.array.isRequired,
  stats: PropTypes.object,
  allMetricsStats: PropTypes.array.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  activeMetric: PropTypes.string.isRequired
};

export default ReportGenerator;
