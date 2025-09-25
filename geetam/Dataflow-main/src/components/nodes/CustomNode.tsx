import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Webhook, Globe, Terminal, FileText, MessageCircle, Play,
  ArrowRight, ArrowLeft, GitBranch, RotateCcw, Clock, List,
  Edit3, Calculator, Shuffle, BarChart3, Merge, Link, Archive,
  StickyNote, CheckCircle, XCircle, Loader2, AlertCircle, CodeSquareIcon, Filter, Cpu, Usb 
} from 'lucide-react';
import { WorkflowNode } from '../../types';
import { useWorkflowStore } from '../../store/workflowStore';  
import NodeOutputImage from '../nodesoutput/NodeOutputImage';

const iconMap = {
  Webhook, Globe, Terminal, FileText, MessageCircle, Play,
  ArrowRight, ArrowLeft, GitBranch, RotateCcw, Clock, List,
  Edit3, Calculator, Shuffle, BarChart3, Merge, Link, Archive,
  StickyNote, CodeSquareIcon, Filter, Cpu, Usb
};

interface CustomNodeProps extends NodeProps {
  data: WorkflowNode['data'] & {
    nodeType: string;
    label: string;
    icon: string;
    color: string;
    category: string;
    executionStatus?: {
      status: 'idle' | 'running' | 'success' | 'error';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output?: any;
      error?: string;
    };
  };
}

export const CustomNode: React.FC<CustomNodeProps> = ({ data, id, selected }) => {
  const status = data.executionStatus;
  const IconComponent = iconMap[data.icon as keyof typeof iconMap] || FileText;

  const nodeInput = useWorkflowStore(state => state.getNodeInput(id));

  const getStatusIcon = () => {
    if (!status) return null;
    
    switch (status.status) {
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getNodeClassName = () => {
    let baseClass = `
      relative bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg cursor-pointer
      transition-all duration-200 hover:shadow-xl min-w-[160px] max-w-[200px]
    `;
    
    if (selected) {
      baseClass += ' border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800';
    } else {
      baseClass += ' border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500';
    }
    
    if (status?.status === 'running') {
      baseClass += ' animate-pulse-glow';
    }
    
    return baseClass;
  };

  const getHandles = () => {
    const handles = [];
    if (data.nodeType === 'codeNode' || data.nodeType==='imageClassifierNode' || data.nodeType==='kMeansNode' || data.nodeType==='csvToJsonNode' || data.nodeType==='linearRegressionNode' || data.nodeType==='logisticRegressionNode') {
      handles.push(
        <Handle
          key="input-left"
          type="target"
          position={Position.Left}
          id="input"
          className="w-3 h-3 bg-gray-400 border-2 left-[-7px] border-white dark:border-gray-800"
          style={{ top: '30%' }}
        />,
        <Handle
          key="output-right"
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-gray-400 border-2 right-[-7px] border-white dark:border-gray-800"
          style={{ top: '30%' }}
        />
      );
    }

    if (data.nodeType === 'dataOut' || data.nodeType==="filterNode") {
      handles.push(
        <Handle
          key="input-left"
          type="target"
          position={Position.Left}
          id="input"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
        />,
        <Handle
          key="output-right"
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
        />
      );
    }
    if (data.nodeType === 'waitNode') {
      handles.push(
        <Handle
          key="input-left"
          type="target"
          position={Position.Left}
          id="input"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
        />,
        <Handle
          key="output-right"
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
        />
      );
    }
    if (data.nodeType === 'removeDuplicateNode') {
      handles.push(
        <Handle
          key="input-left"
          type="target"
          position={Position.Left}
          id="input"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
        />,
        <Handle
          key="output-right"
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
        />
      );
    }

    if (data.nodeType === 'manualTrigger'){
      handles.push(
        <Handle
          key="output-right"
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800 right-[-7px]"
        />
      );
    }
    
    if (data.nodeType === 'loopNode') {
      handles.push(
        <Handle
          key="input-left"
          type="target"
          position={Position.Left}
          id="input"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
          style={{ top: '30%' }}
        />,
        <Handle
          key="output-right"
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
          style={{ top: '30%' }}
        />
      );
    }
    if (data.nodeType === 'httpTrigger') {
      handles.push(
        <Handle
          key="input-left"
          type="target"
          position={Position.Left}
          id="input"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
          style={{ top: '30%' }}
        />,
        <Handle
          key="output-right"
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
          style={{ top: '30%' }}
        />
      );
    }
    if (data.nodeType === 'ifNode') {
      handles.push(
        <Handle
          key="output-left"
          type="source"
          position={Position.Left}
          id="false"
          className="w-3 h-3 bg-red-400 border-2 border-white dark:border-gray-800"
          style={{ top: '60%' }}
        />,
        <Handle
          key="output-right"
          type="source"
          position={Position.Right}
          id="true"
          className="w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800"
          style={{ top: '60%' }}
        />
      );
    }
    
    if (data.nodeType === 'mergeNode' || data.nodeType === 'joinNode') {
      handles.push(
        <Handle
          key="input-left"
          type="target"
          position={Position.Left}
          id="input"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
          style={{ top: '30%' }}
        />,
        <Handle
          key="output-right"
          type="target"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
          style={{ top: '30%' }}
        />
      );
    }

    if (data.nodeType === "serialInNode") {
      handles.push(
        <Handle
          key="output-right"
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
          style={{ top: "30%" }}
        />
      );
    }
    
    return handles;
  };

  if (data.nodeType === 'stickyNote') {
    return (
      <div
        className={`
          bg-yellow-200 dark:bg-yellow-300 border border-yellow-300 dark:border-yellow-400
          rounded-lg p-4 shadow-lg cursor-pointer min-w-[200px] min-h-[120px]
          resize overflow-hidden hover:shadow-xl transition-shadow duration-200
          ${selected ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="w-4 h-4 text-yellow-700 dark:text-yellow-800" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-900">Note</span>
        </div>
        <div className="text-sm text-yellow-800 dark:text-yellow-900 whitespace-pre-wrap">
          {data.content || 'Click to edit note...'}
        </div>
      </div>
    );
  }

  return (
    <div className={getNodeClassName()}>
      {getHandles()}
      
      <div 
        className="flex items-center gap-2 p-3 rounded-t-lg"
        style={{ backgroundColor: `${data.color}20` }}
      >
        <div
          className="p-1.5 rounded-md"
          style={{ backgroundColor: data.color }}
        >
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {data.label}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
        </div>
      </div>
      
      <div className="p-3 pt-2">
        {data.nodeType === 'imageClassifierNode' && data.imageData && (
          <img
            src={data.imageData}
            alt="Uploaded"
            className="mb-2 max-w-full max-h-40 rounded border"
          />
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {Object.keys(data).length > 6 ? 'Configured' : 'Click to configure'}
        </div>

        {nodeInput !== undefined && nodeInput !== null && Object.keys(nodeInput).length > 0 && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono overflow-x-auto max-h-20 hide-scrollbar">
            <strong>Input:</strong> {JSON.stringify(nodeInput).substring(0, 100)}{JSON.stringify(nodeInput).length > 100 ? '...' : ''}
          </div>
        )}

        {data.url && (
          <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 truncate">
            {data.url}
          </div>
        )}
        {data.command && (
          <div className="mt-1 text-xs text-green-600 dark:text-green-400 truncate">
            {data.command}
          </div>
        )}
        {data.condition && (
          <div className="mt-1 text-xs text-orange-600 dark:text-orange-400 truncate">
            {data.condition}
          </div>
        )}
      </div>
      
      {data.nodeType !== 'imageClassifierNode' && status?.output && (
        <div className="border-t border-gray-200 dark:border-gray-600 p-2">
          <div className="text-xs text-gray-600 dark:text-gray-300 font-mono truncate">
            {JSON.stringify(status.output).substring(0, 50)}...
          </div>
        </div>
      )}
      {data.nodeType === "kMeansNode" && status?.output && (
        <NodeOutputImage src={status.output} />
      )}
      {(data.nodeType === "linearRegressionNode" || data.nodeType === "logisticRegressionNode") && status?.output && (
        <NodeOutputImage src={status.output} />
      )}
      {status?.error && (
        <div className="border-t border-red-200 dark:border-red-800 p-2 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-500" />
            <div className="text-xs text-red-600 dark:text-red-400 truncate">
              {status.error}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};