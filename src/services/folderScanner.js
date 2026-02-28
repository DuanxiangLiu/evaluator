export const SUPPORTED_LOG_EXTENSIONS = ['.log', '.txt', '.out', '.rpt', '.report', '.summary'];
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILES_PER_SCAN = 1000;

export const isValidLogFile = (file) => {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return SUPPORTED_LOG_EXTENSIONS.includes(ext);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const scanFilesFromFileList = async (fileList, options = {}) => {
  const {
    maxFiles = MAX_FILES_PER_SCAN,
    maxSizeMB = MAX_FILE_SIZE_MB,
    onProgress = null
  } = options;

  const files = [];
  const skipped = [];
  const errors = [];
  let processedCount = 0;

  const fileArray = Array.from(fileList);

  for (const file of fileArray) {
    processedCount++;

    if (onProgress) {
      onProgress({
        current: processedCount,
        total: fileArray.length,
        fileName: file.name,
        phase: 'scanning'
      });
    }

    if (files.length >= maxFiles) {
      skipped.push({
        name: file.name,
        path: file.webkitRelativePath || file.name,
        reason: '超过最大文件数量限制'
      });
      continue;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      skipped.push({
        name: file.name,
        path: file.webkitRelativePath || file.name,
        reason: `文件超过 ${maxSizeMB}MB 限制`
      });
      continue;
    }

    if (!isValidLogFile(file)) {
      continue;
    }

    try {
      const content = await readFileContent(file);
      files.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        path: file.webkitRelativePath || file.name,
        size: file.size,
        content: content,
        lastModified: file.lastModified
      });
    } catch (error) {
      errors.push({
        name: file.name,
        path: file.webkitRelativePath || file.name,
        error: error.message
      });
    }
  }

  return {
    files,
    skipped,
    errors,
    stats: {
      totalScanned: fileArray.length,
      validFiles: files.length,
      skippedCount: skipped.length,
      errorCount: errors.length
    }
  };
};

export const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};

export const scanMultipleFolders = async (folderFileLists, options = {}) => {
  const allFiles = [];
  const allSkipped = [];
  const allErrors = [];
  let totalStats = {
    totalScanned: 0,
    validFiles: 0,
    skippedCount: 0,
    errorCount: 0
  };

  for (let i = 0; i < folderFileLists.length; i++) {
    const result = await scanFilesFromFileList(folderFileLists[i], {
      ...options,
      onProgress: options.onProgress ? (progress) => {
        options.onProgress({
          ...progress,
          folderIndex: i,
          totalFolders: folderFileLists.length
        });
      } : null
    });

    allFiles.push(...result.files);
    allSkipped.push(...result.skipped);
    allErrors.push(...result.errors);

    totalStats.totalScanned += result.stats.totalScanned;
    totalStats.validFiles += result.stats.validFiles;
    totalStats.skippedCount += result.stats.skippedCount;
    totalStats.errorCount += result.stats.errorCount;
  }

  return {
    files: allFiles,
    skipped: allSkipped,
    errors: allErrors,
    stats: totalStats
  };
};

export const groupFilesByDirectory = (files) => {
  const groups = {};

  for (const file of files) {
    const dirPath = file.path.substring(0, file.path.lastIndexOf('/')) || 'root';
    if (!groups[dirPath]) {
      groups[dirPath] = {
        path: dirPath,
        files: [],
        totalSize: 0
      };
    }
    groups[dirPath].files.push(file);
    groups[dirPath].totalSize += file.size;
  }

  return Object.values(groups).sort((a, b) => a.path.localeCompare(b.path));
};

export const groupFilesByAlgorithm = (files, algorithmRules) => {
  const groups = {};

  for (const file of files) {
    const path = file.path.toLowerCase();
    let matchedAlgo = null;

    for (const rule of algorithmRules) {
      for (const pattern of rule.patterns) {
        if (path.includes(pattern.toLowerCase())) {
          matchedAlgo = rule;
          break;
        }
      }
      if (matchedAlgo) break;
    }

    const algoId = matchedAlgo ? matchedAlgo.id : 'unknown';
    const algoName = matchedAlgo ? matchedAlgo.name : '未知算法';

    if (!groups[algoId]) {
      groups[algoId] = {
        id: algoId,
        name: algoName,
        color: matchedAlgo?.color || '#6B7280',
        files: [],
        totalSize: 0
      };
    }
    groups[algoId].files.push(file);
    groups[algoId].totalSize += file.size;
  }

  return Object.values(groups);
};

export const getScanSummary = (scanResult) => {
  const { files, skipped, errors, stats } = scanResult;

  const summary = {
    totalFiles: stats.totalScanned,
    validLogFiles: stats.validFiles,
    skippedFiles: stats.skippedCount,
    errorFiles: stats.errorCount,
    totalSize: 0,
    avgFileSize: 0,
    extensions: {},
    sizeDistribution: {
      small: 0,
      medium: 0,
      large: 0
    }
  };

  for (const file of files) {
    summary.totalSize += file.size;

    const ext = file.name.split('.').pop().toLowerCase();
    summary.extensions[ext] = (summary.extensions[ext] || 0) + 1;

    if (file.size < 100 * 1024) {
      summary.sizeDistribution.small++;
    } else if (file.size < 1024 * 1024) {
      summary.sizeDistribution.medium++;
    } else {
      summary.sizeDistribution.large++;
    }
  }

  summary.avgFileSize = files.length > 0 ? summary.totalSize / files.length : 0;

  return summary;
};

export const filterFiles = (files, filters = {}) => {
  const {
    namePattern = null,
    minSize = null,
    maxSize = null,
    extensions = null,
    algorithmId = null,
    algorithmRules = []
  } = filters;

  return files.filter(file => {
    if (namePattern) {
      const regex = new RegExp(namePattern, 'i');
      if (!regex.test(file.name) && !regex.test(file.path)) {
        return false;
      }
    }

    if (minSize !== null && file.size < minSize) {
      return false;
    }

    if (maxSize !== null && file.size > maxSize) {
      return false;
    }

    if (extensions && extensions.length > 0) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!extensions.map(e => e.toLowerCase()).includes(ext)) {
        return false;
      }
    }

    if (algorithmId && algorithmRules.length > 0) {
      const path = file.path.toLowerCase();
      let matches = false;

      const rule = algorithmRules.find(r => r.id === algorithmId);
      if (rule) {
        for (const pattern of rule.patterns) {
          if (path.includes(pattern.toLowerCase())) {
            matches = true;
            break;
          }
        }
      }

      if (!matches) {
        return false;
      }
    }

    return true;
  });
};

export const sortFiles = (files, sortBy = 'name', sortOrder = 'asc') => {
  const sorted = [...files];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'path':
        comparison = a.path.localeCompare(b.path);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'lastModified':
        comparison = (a.lastModified || 0) - (b.lastModified || 0);
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

export const createFileSelector = (options = {}) => {
  const {
    accept = SUPPORTED_LOG_EXTENSIONS.map(ext => ext.slice(1)).join(','),
    multiple = true,
    webkitdirectory = false
  } = options;

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept.split(',').map(ext => `.${ext}`).join(',');
    input.multiple = multiple;

    if (webkitdirectory) {
      input.webkitdirectory = true;
    }

    input.onchange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        resolve(files);
      } else {
        reject(new Error('未选择任何文件'));
      }
    };

    input.oncancel = () => {
      reject(new Error('用户取消选择'));
    };

    input.click();
  });
};

export const exportScanResult = (scanResult, format = 'json') => {
  const exportData = {
    timestamp: new Date().toISOString(),
    stats: scanResult.stats,
    files: scanResult.files.map(f => ({
      name: f.name,
      path: f.path,
      size: f.size,
      lastModified: f.lastModified
    })),
    skipped: scanResult.skipped,
    errors: scanResult.errors
  };

  switch (format) {
    case 'json':
      return JSON.stringify(exportData, null, 2);
    case 'csv':
      const headers = ['name', 'path', 'size', 'lastModified'];
      const rows = exportData.files.map(f =>
        headers.map(h => f[h] ?? '').join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    default:
      return JSON.stringify(exportData, null, 2);
  }
};
