import React from 'react';
import { 
  Webhook, Globe, Terminal, FileText, MessageCircle, Play,
  ArrowRight, ArrowLeft, GitBranch, RotateCcw, Clock, List,
  Edit3, Calculator, Shuffle, BarChart3, Merge, Link, Archive,
  StickyNote, CodeSquareIcon
} from 'lucide-react';
import { nodeTypes, categoryLabels } from '../../data/nodeTypes';
import { NodeType } from '../../types';

const iconMap = {
  Webhook, Globe, Terminal, FileText, MessageCircle, Play,
  ArrowRight, ArrowLeft, GitBranch, RotateCcw, Clock, List,
  Edit3, Calculator, Shuffle, BarChart3, Merge, Link, Archive,
  StickyNote ,CodeSquareIcon
};

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: NodeType) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const groupedNodes = nodeTypes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeType[]>);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Node Library
      </h2>
      
      {Object.entries(groupedNodes).map(([category, nodes]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h3>
          
          <div className="space-y-2">
            {nodes.map((node) => {
              const IconComponent = iconMap[node.icon as keyof typeof iconMap] || FileText;
              
              return (
                <div
                  key={node.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, node)}
                  className="
                    flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg
                    cursor-grab hover:bg-gray-100 dark:hover:bg-gray-600
                    transition-colors duration-150 border border-transparent
                    hover:border-gray-200 dark:hover:border-gray-600
                  "
                >
                  <div
                    className="p-2 rounded-md flex-shrink-0"
                    style={{ backgroundColor: node.color }}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {node.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {node.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};