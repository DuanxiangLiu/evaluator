const isDev = import.meta.env.DEV;

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLogLevel = isDev ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', { hour12: false });
};

const formatPrefix = (level) => {
  const timestamp = formatTimestamp();
  return `[${timestamp}] [${level}]`;
};

export const logger = {
  debug: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.log(formatPrefix('DEBUG'), ...args);
    }
  },
  
  info: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(formatPrefix('INFO'), ...args);
    }
  },
  
  warn: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(formatPrefix('WARN'), ...args);
    }
  },
  
  error: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error(formatPrefix('ERROR'), ...args);
    }
  },
  
  group: (label) => {
    if (isDev) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },
  
  time: (label) => {
    if (isDev) {
      console.time(label);
    }
  },
  
  timeEnd: (label) => {
    if (isDev) {
      console.timeEnd(label);
    }
  }
};

export default logger;
