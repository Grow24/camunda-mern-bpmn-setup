import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Usb, Activity, GripVertical, Settings, Play, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export function SerialInputNode({ data, selected }: NodeProps) {
  const [showOptions, setShowOptions] = useState(false);

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(!showOptions);
  };

  const handleOptionClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    console.log(`${action} clicked for node`);
    setShowOptions(false);
  };

  return (
    <div 
      className={clsx('workflow-node px-4 py-3 min-w-[160px] relative', {
        'selected': selected,
        'running': data.status === 'running',
        'complete': data.status === 'complete',
        'error': data.status === 'error',
      })}
      onClick={handleNodeClick}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className="drag-handle flex items-center space-x-2 mb-2 cursor-move">
        <GripVertical className="w-3 h-3 text-gray-400" />
        <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
          <Usb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white text-sm">
            {data.label || 'Serial Input'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {data.port || '/dev/ttyUSB0'}
          </div>
        </div>
      </div>
      
      {data.status === 'running' && (
        <div className="flex items-center space-x-1 text-xs text-yellow-600 dark:text-yellow-400">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>Reading...</span>
        </div>
      )}
      
      {data.output && (
        <div className="mt-2 text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">
          Value: {data.output.value}
        </div>
      )}

      {/* Node Options */}
      {showOptions && (
        <div className="absolute top-2 right-2 flex space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-1 z-10">
          <button
            onClick={(e) => handleOptionClick(e, 'configure')}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
            title="Configure"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => handleOptionClick(e, 'test')}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded transition-colors"
            title="Test"
          >
            <Play className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => handleOptionClick(e, 'delete')}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white dark:border-gray-800"
      />
    </div>
  );
}