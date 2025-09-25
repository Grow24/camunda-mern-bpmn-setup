import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, GitBranch, Shuffle, Send, BarChart3 } from 'lucide-react';

interface NodeCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  nodes: Array<{
    type: string;
    label: string;
    icon: React.ReactNode;
  }>;
}

const nodeCategories: NodeCategory[] = [
  {
    id: 'triggers',
    label: 'Triggers',
    icon: <Zap className="w-4 h-4" />,
    nodes: [
      { type: 'serial-input', label: 'Serial Input', icon: <Zap className="w-3 h-3" /> },
      { type: 'mqtt-input', label: 'MQTT Input', icon: <Zap className="w-3 h-3" /> },
      { type: 'gpio-input', label: 'GPIO Input', icon: <Zap className="w-3 h-3" /> },
      { type: 'webhook', label: 'Webhook', icon: <Zap className="w-3 h-3" /> },
      { type: 'manual-trigger', label: 'Manual', icon: <Zap className="w-3 h-3" /> },
    ],
  },
  {
    id: 'logic',
    label: 'Logic',
    icon: <GitBranch className="w-4 h-4" />,
    nodes: [
      { type: 'if-condition', label: 'If Condition', icon: <GitBranch className="w-3 h-3" /> },
      { type: 'switch', label: 'Switch', icon: <GitBranch className="w-3 h-3" /> },
      { type: 'loop', label: 'Loop', icon: <GitBranch className="w-3 h-3" /> },
      { type: 'delay', label: 'Delay', icon: <GitBranch className="w-3 h-3" /> },
    ],
  },
  {
    id: 'transforms',
    label: 'Transform',
    icon: <Shuffle className="w-4 h-4" />,
    nodes: [
      { type: 'math', label: 'Math', icon: <Shuffle className="w-3 h-3" /> },
      { type: 'convert', label: 'Convert', icon: <Shuffle className="w-3 h-3" /> },
      { type: 'filter', label: 'Filter', icon: <Shuffle className="w-3 h-3" /> },
      { type: 'map', label: 'Map', icon: <Shuffle className="w-3 h-3" /> },
    ],
  },
  {
    id: 'outputs',
    label: 'Outputs',
    icon: <Send className="w-4 h-4" />,
    nodes: [
      { type: 'mqtt-output', label: 'MQTT Out', icon: <Send className="w-3 h-3" /> },
      { type: 'serial-output', label: 'Serial Out', icon: <Send className="w-3 h-3" /> },
      { type: 'gpio-output', label: 'GPIO Out', icon: <Send className="w-3 h-3" /> },
      { type: 'lcd-display', label: 'LCD Display', icon: <Send className="w-3 h-3" /> },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitor',
    icon: <BarChart3 className="w-4 h-4" />,
    nodes: [
      { type: 'chart', label: 'Chart', icon: <BarChart3 className="w-3 h-3" /> },
      { type: 'debug', label: 'Debug', icon: <BarChart3 className="w-3 h-3" /> },
      { type: 'gauge', label: 'Gauge', icon: <BarChart3 className="w-3 h-3" /> },
      { type: 'log', label: 'Log', icon: <BarChart3 className="w-3 h-3" /> },
    ],
  },
];

export function Ribbon() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  const handleCategoryMouseEnter = (categoryId: string) => {
    if (!activeCategory) {
      setActiveCategory(categoryId);
    }
  };

  const handleCategoryMouseLeave = () => {
    setTimeout(() => {
      if (isMounted.current) {
        setActiveCategory(null);
      }
    }, 200);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-12 px-4 space-x-1">
        {nodeCategories.map((category) => (
          <div key={category.id} className="relative">
            <button
              className={`ribbon-button flex items-center space-x-2 ${
                activeCategory === category.id ? 'active' : ''
              }`}
              onClick={() => handleCategoryClick(category.id)}
              onMouseEnter={() => handleCategoryMouseEnter(category.id)}
              onMouseLeave={handleCategoryMouseLeave}
            >
              {category.icon}
              <span>{category.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {activeCategory === category.id && (
              <div 
                className="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 min-w-48"
                onMouseEnter={() => setActiveCategory(category.id)}
                onMouseLeave={handleCategoryMouseLeave}
              >
                <div className="grid grid-cols-2 gap-1">
                  {category.nodes.map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                      className="flex items-center space-x-2 p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-move transition-colors"
                    >
                      {node.icon}
                      <span>{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}