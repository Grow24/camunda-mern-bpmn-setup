import { forwardRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { clsx } from 'clsx';
import { NodeData } from '../../types';
import { useThemeStore } from '../../store/themeStore';
import { useWorkflowStore } from '../../store/workflowStore';  // Import workflow store
import { nodeFormFields } from '../../data/nodeTypes'; 

interface LLMNodeProps extends NodeProps {
  data: NodeData & {
    status?: 'idle' | 'running' | 'error' | 'success';
    error?: string;
  };
}

const categoryColors = {
  action: {
    light: 'border-primary-500 bg-primary-50',
    dark: 'border-primary-400 bg-primary-900/20',
  },
};

export const LLMNode = forwardRef<HTMLDivElement, LLMNodeProps>(({ data, selected, id }, ref) => {
  const { isDark } = useThemeStore();
  const status = data.status || 'idle';

  // Use data as config source, fallback to empty object
  const config = data.config || {};

  // Get form fields for llmNode
  const formFields = nodeFormFields['llmNode'] || [];

  // Get node input from workflow store
  const nodeInput = useWorkflowStore(state => state.getNodeInput(id));

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={clsx(
        'relative rounded-lg border-2 shadow-lg transition-all duration-200',
        isDark ? categoryColors.action.dark : categoryColors.action.light,
        isDark ? 'bg-gray-800' : 'bg-white',
        selected && 'ring-2 ring-primary-400 ring-offset-2',
        'min-w-[200px] max-w-[300px]'
      )}
      style={{ minHeight: 140 }}
      ref={ref}
    >
      {/* Status indicator */}
      <div
        aria-label={`Status: ${status}`}
        className={clsx(
          'absolute top-2 right-2 rounded-full border-2 border-white shadow',
          {
            'bg-green-500': status === 'success',
            'bg-yellow-400 animate-pulse': status === 'running',
            'bg-red-500': status === 'error',
            'bg-gray-400': status === 'idle',
          }
        )}
        style={{ width: 14, height: 14, zIndex: 10 }}
      />

      {/* Header */}
      <div
        className={clsx(
          'flex items-center gap-3 p-4 border-b',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white"
          style={{ backgroundColor: '#3B82F6' }}
        >
          <Icons.Cpu size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={clsx(
              'font-semibold truncate',
              isDark ? 'text-gray-100' : 'text-gray-900'
            )}
          >
            {data.label || 'LLM Node'}
          </h3>
          {data.description && (
            <p
              className={clsx(
                'text-sm truncate',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}
            >
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {data.error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
            {data.error}
          </div>
        )}

        {formFields.length > 0 && (
          <div className="space-y-2">
            {formFields.map(field => {
              const value = config[field.name];
              if (value === undefined || value === null || value === '') return null;
              return (
                <div key={field.name} className="flex items-center gap-2 text-sm">
                  <span
                    className={clsx(
                      'font-medium capitalize',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    {field.label}:
                  </span>
                  <span
                    className={clsx(
                      'truncate',
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    )}
                  >
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Display input data from previous node */}
        {nodeInput !== undefined && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono overflow-x-auto max-h-20">
            <strong>Input:</strong> {JSON.stringify(nodeInput).substring(0, 100)}{JSON.stringify(nodeInput).length > 100 ? '...' : ''}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          top: 60,
          left: -10,
          backgroundColor: '#3B82F6',
          border: `2px solid ${isDark ? '#1f2937' : 'white'}`,
          width: 15,
          height: 15,
        }}
        className="!bg-blue-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          top: 60,
          right: -10,
          backgroundColor: '#3B82F6',
          border: `2px solid ${isDark ? '#1f2937' : 'white'}`,
          width: 15,
          height: 15,
        }}
        className="!bg-blue-400"
      />
    </motion.div>
  );
});