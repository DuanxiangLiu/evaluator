import { logger } from './logger';

const STORAGE_KEYS = {
  SAVED_DATASETS: 'eda_saved_datasets',
  CURRENT_DATASET_ID: 'eda_current_dataset_id'
};

const MAX_SAVED_DATASETS = 20;

const generateId = () => `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const datasetStorage = {
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_DATASETS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('读取保存的数据集失败:', error);
      return [];
    }
  },

  getById(id) {
    const datasets = this.getAll();
    return datasets.find(d => d.id === id) || null;
  },

  save(dataset) {
    try {
      const datasets = this.getAll();
      const now = new Date().toISOString();
      
      const newDataset = {
        id: dataset.id || generateId(),
        name: dataset.name || `数据集 ${datasets.length + 1}`,
        csvData: dataset.csvData,
        createdAt: dataset.createdAt || now,
        updatedAt: now,
        stats: dataset.stats || null,
        tags: dataset.tags || []
      };

      const existingIndex = datasets.findIndex(d => d.id === newDataset.id);
      
      if (existingIndex >= 0) {
        datasets[existingIndex] = newDataset;
      } else {
        datasets.unshift(newDataset);
        if (datasets.length > MAX_SAVED_DATASETS) {
          datasets.pop();
        }
      }

      localStorage.setItem(STORAGE_KEYS.SAVED_DATASETS, JSON.stringify(datasets));
      return newDataset;
    } catch (error) {
      logger.error('保存数据集失败:', error);
      throw error;
    }
  },

  delete(id) {
    try {
      const datasets = this.getAll();
      const filtered = datasets.filter(d => d.id !== id);
      localStorage.setItem(STORAGE_KEYS.SAVED_DATASETS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      logger.error('删除数据集失败:', error);
      return false;
    }
  },

  update(id, updates) {
    try {
      const datasets = this.getAll();
      const index = datasets.findIndex(d => d.id === id);
      
      if (index >= 0) {
        datasets[index] = {
          ...datasets[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.SAVED_DATASETS, JSON.stringify(datasets));
        return datasets[index];
      }
      return null;
    } catch (error) {
      logger.error('更新数据集失败:', error);
      return null;
    }
  },

  rename(id, newName) {
    return this.update(id, { name: newName });
  },

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SAVED_DATASETS);
      return true;
    } catch (error) {
      logger.error('清空数据集失败:', error);
      return false;
    }
  },

  setCurrentId(id) {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_DATASET_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_DATASET_ID);
      }
    } catch (error) {
      logger.error('设置当前数据集ID失败:', error);
    }
  },

  getCurrentId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_DATASET_ID);
    } catch (error) {
      logger.error('获取当前数据集ID失败:', error);
      return null;
    }
  },

  exportDataset(id) {
    const dataset = this.getById(id);
    if (!dataset) return null;
    
    return JSON.stringify(dataset, null, 2);
  },

  importDataset(jsonString) {
    try {
      const dataset = JSON.parse(jsonString);
      if (!dataset.csvData) {
        throw new Error('Invalid dataset format: missing csvData');
      }
      return this.save({
        ...dataset,
        id: null,
        name: `${dataset.name} (导入)`
      });
    } catch (error) {
      logger.error('导入数据集失败:', error);
      throw error;
    }
  }
};

export const formatDatasetDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDatasetSize = (csvData) => {
  if (!csvData) return '0 KB';
  const bytes = new Blob([csvData]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const getDatasetRowCount = (csvData) => {
  if (!csvData) return 0;
  return csvData.trim().split('\n').length - 1;
};

export default datasetStorage;
