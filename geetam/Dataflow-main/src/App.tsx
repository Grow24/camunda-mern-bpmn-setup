import { useEffect, DragEvent } from 'react';
import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { NodePalette } from './components/Sidebar/NodePalette';
import { PropertiesPanel } from './components/Sidebar/PropertiesPanel';
import { Toolbar } from './components/Toolbar/Toolbar';
import { ExecutionLog } from './components/ExecutionLog/ExecutionLog';
import { useWorkflowStore } from './store/workflowStore';
import { useThemeStore } from './store/themeStore';
import { NodeType, WorkflowNode } from './types';
import { nodeTypes } from './data/nodeTypes';
import { Toaster } from 'react-hot-toast';

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

function App() {
  const { addNode } = useWorkflowStore();
  const { isDark, setTheme } = useThemeStore();

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setTheme(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, [setTheme]);

  // Update document class when theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleNodeDrop = (nodeType: NodeType, position: { x: number; y: number }) => {
    const nodeTypeData = nodeTypes.find(nt => nt.id === nodeType.id);
    if (!nodeTypeData) return;

    const newNode: WorkflowNode = {
      id: getId(),
      type: nodeType.id,
      position,
      data: {
        nodeType: nodeType.id,
        label: nodeType.label,
        icon: nodeType.icon,
        color: nodeType.color,
        category: nodeType.category,
        description: nodeType.description
      }
    };

    addNode(newNode);
  };

  const handleDragStart = (event: DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Visual Workflow Automation Builder
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Build powerful automation workflows with drag-and-drop simplicity
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <NodePalette onDragStart={handleDragStart} />

        {/* Canvas */}
        <WorkflowCanvas onNodeDrop={handleNodeDrop} />

        {/* Right Sidebar - Properties Panel */}
        <PropertiesPanel />
      </div>
      <Toaster position="top-right" />
      {/* Bottom Panel - Execution Log */}
      <ExecutionLog />
    </div>
  );
}

export default App;