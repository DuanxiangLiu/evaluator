import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = window.location.pathname;
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';
      const errorMessage = this.state.error?.message || '未知错误';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">应用程序错误</h1>
                    <p className="text-white/80 text-sm">抱歉，应用程序遇到了意外错误</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Bug className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-1">错误信息</h3>
                      <p className="text-red-700 text-sm font-mono break-all">{errorMessage}</p>
                    </div>
                  </div>
                </div>

                {isDevelopment && componentStack && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2 text-sm">组件堆栈</h3>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                        {componentStack}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重试
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    刷新页面
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    返回首页
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    如果问题持续存在，请尝试清除浏览器缓存或联系技术支持。
                    {this.state.errorId && (
                      <span className="block mt-1">错误ID: <code className="bg-gray-100 px-1 rounded">{this.state.errorId}</code></span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node
};

export default ErrorBoundary;
