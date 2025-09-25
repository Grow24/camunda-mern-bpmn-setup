import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Terminal, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export const ExecutionLog: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { executionLogs, clearExecutionLogs } = useWorkflowStore();

  if (executionLogs.length === 0) {
    return null;
  }

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-700 dark:text-green-300';
      case 'error':
        return 'text-red-700 dark:text-red-300';
      default:
        return 'text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <Terminal className="w-4 h-4" />
          <span>Execution Log ({executionLogs.length})</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
        
        <button
          onClick={clearExecutionLogs}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Clear logs"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Log Content */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto p-4">
          <div className="space-y-2 font-mono text-sm">
            {executionLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {log.nodeId}
                    </span>
                  </div>
                  <div className={`text-sm ${getLogTextColor(log.type)}`}>
                    {log.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};