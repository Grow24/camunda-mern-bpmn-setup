import React, { useState } from 'react';
import { Node } from 'reactflow';
import { X, Settings, Eye, Activity } from 'lucide-react';

interface InspectorProps {
  node: Node;
  onClose: () => void;
  onUpdateNode: (node: Node) => void;
}

export function Inspector({ node, onClose, onUpdateNode }: InspectorProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'output'>('config');
  const [config, setConfig] = useState(node.data || {});

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdateNode({
      ...node,
      data: newConfig,
    });
  };

  const renderConfigForm = () => {
    switch (node.type) {
      case 'serial-input':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Port
              </label>
              <input
                type="text"
                value={config.port || '/dev/ttyUSB0'}
                onChange={(e) => handleConfigChange('port', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Baud Rate
              </label>
              <select
                value={config.baudRate || '9600'}
                onChange={(e) => handleConfigChange('baudRate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="9600">9600</option>
                <option value="19200">19200</option>
                <option value="38400">38400</option>
                <option value="57600">57600</option>
                <option value="115200">115200</option>
              </select>
            </div>
          </div>
        );
      
      case 'mqtt-input':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Broker URL
              </label>
              <input
                type="text"
                value={config.broker || 'mqtt://localhost:1883'}
                onChange={(e) => handleConfigChange('broker', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Topic
              </label>
              <input
                type="text"
                value={config.topic || 'sensor/data'}
                onChange={(e) => handleConfigChange('topic', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        );
      
      case 'gpio-input':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pin Number
              </label>
              <input
                type="number"
                value={config.pin || 2}
                onChange={(e) => handleConfigChange('pin', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mode
              </label>
              <select
                value={config.mode || 'INPUT'}
                onChange={(e) => handleConfigChange('mode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="INPUT">Input</option>
                <option value="INPUT_PULLUP">Input Pull-up</option>
                <option value="INPUT_PULLDOWN">Input Pull-down</option>
              </select>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No configuration options available for this node type.
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {node.data?.label || node.type}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium ${
            activeTab === 'config'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Config</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium ${
            activeTab === 'preview'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium ${
            activeTab === 'output'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Output</span>
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'config' && renderConfigForm()}
        
        {activeTab === 'preview' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Live preview of node output will appear here during execution.
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Status</div>
              <div className="text-sm font-mono text-gray-900 dark:text-white">
                {node.data?.status || 'idle'}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'output' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Node output data will be displayed here after execution.
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
              <pre className="text-xs font-mono text-gray-900 dark:text-white whitespace-pre-wrap">
                {JSON.stringify(node.data?.output || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}