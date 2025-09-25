import React, { useState } from 'react';
import { X, Settings, Trash2, Copy } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { NodeForm } from '../NodeForm/NodeForm';
import { CodeEditorModal } from '../CodeEditorModal/CodeEditorModal';

export const PropertiesPanel: React.FC = () => {
  const {
    nodes,
    edges,
    selectedNode,
    selectedEdges,
    setSelectedNode,
    updateNode,
    deleteNode,
    duplicateNode,
    deleteEdge,
    nodeInputs,
    executionStatus,
    setNodeInput,
  } = useWorkflowStore();

  const [activeTab, setActiveTab] = useState<'about' | 'io'>('about');
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);

  const selectedNodeData = nodes.find((node) => node.id === selectedNode);
  const selectedNodeInput = selectedNode ? nodeInputs[selectedNode] : undefined;
  const selectedNodeExecution = selectedNode ? executionStatus[selectedNode] : undefined;
  const selectedNodeOutput = selectedNodeExecution?.output;

  const handleClose = () => {
    setSelectedNode(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateNode = (updates: Record<string, any>) => {
    if (selectedNode) {
      updateNode(selectedNode, { data: { ...selectedNodeData?.data, ...updates } });
    }
  };

  const openCodeEditor = () => {
    setIsCodeEditorOpen(true);
  };

  const closeCodeEditor = () => {
    setIsCodeEditorOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedNode) {
      try {
        const parsed = JSON.parse(e.target.value);
        setNodeInput(selectedNode, parsed);
      } catch {
        // Ignore invalid JSON input silently
      }
    }
  };

  const handleDeleteNode = () => {
    if (selectedNode && selectedNodeData) {
      const confirmed = window.confirm(`Delete node "${selectedNodeData.data.label}"?`);
      if (confirmed) {
        deleteNode(selectedNode);
      }
    }
  };

  const handleDuplicateNode = () => {
    if (selectedNode) {
      duplicateNode(selectedNode);
    }
  };

  const handleDeleteSelectedEdges = () => {
    if (selectedEdges.length > 0) {
      const confirmed = window.confirm(
        `Delete ${selectedEdges.length} connection${selectedEdges.length !== 1 ? 's' : ''}?`
      );
      if (confirmed) {
        selectedEdges.forEach((edgeId) => deleteEdge(edgeId));
      }
    }
  };

  // Extract unique keys from previous node input for _inputKeys (optional, can keep for other uses)
  let inputKeys: string[] = [];

  if (selectedNodeInput) {
    if (Array.isArray(selectedNodeInput)) {
      const keysSet = new Set<string>();
      selectedNodeInput.forEach((item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          Object.keys(item).forEach((k) => keysSet.add(k));
        }
      });
      inputKeys = Array.from(keysSet);
    } else if (typeof selectedNodeInput === 'object' && selectedNodeInput !== null) {
      inputKeys = Object.keys(selectedNodeInput);
    }
  }

  // Find incoming edges to selectedNode
  const incomingEdges = edges.filter(edge => edge.target === selectedNode);

  // Collect outputs from source nodes of incoming edges
  const previousNodeOutputs = incomingEdges
    .map(edge => executionStatus[edge.source]?.output)
    .filter(Boolean);

  // Determine if multiple inputs connected
  const multipleInputs = previousNodeOutputs.length > 1;

  // Pass previousNodeOutput as array if multiple, else single output or undefined
  const previousNodeOutput = multipleInputs ? previousNodeOutputs : previousNodeOutputs[0];

  // Pass _inputKeys to NodeForm data for other uses if needed
  const nodeDataForForm = {
    ...selectedNodeData?.data,
    _inputKeys: inputKeys,
  };

  // Show edge properties if edges selected but no node
  if (!selectedNode && selectedEdges.length > 0) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edge Properties</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edge Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Selected Connections
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedEdges.length} connection{selectedEdges.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleDeleteSelectedEdges}
              className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected Connections
            </button>
          </div>
        </div>

        {/* Edge Details */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Use the Delete key or right-click to remove connections.</p>
            <p className="mt-2">Connections can be moved by dragging their endpoints.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show placeholder if no node or edge selected
  if (!selectedNode || !selectedNodeData) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Settings className="w-5 h-5" />
          <span className="text-sm">Select a node or edge to edit properties</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Properties</h2>
        </div>
        <button
          onClick={handleClose}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-2 text-center text-sm font-medium ${
            activeTab === 'about'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button
          className={`flex-1 py-2 text-center text-sm font-medium ${
            activeTab === 'io'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('io')}
        >
          Input / Output
        </button>
      </div>

      {/* Content */}
      {activeTab === 'about' && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Node Info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="p-2 rounded-md"
                style={{ backgroundColor: selectedNodeData.data.color }}
              >
                <div className="w-4 h-4 bg-white rounded-sm" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedNodeData.data.label}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID: {selectedNode}</p>
              </div>
            </div>

            {/* Node Actions */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleDuplicateNode}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded transition-colors"
              >
                <Copy className="w-3 h-3" />
                Duplicate
              </button>
              <button
                onClick={handleDeleteNode}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>

            {/* Node Form */}
            <NodeForm
              nodeType={selectedNodeData.type}
              data={nodeDataForForm}
              onChange={handleUpdateNode}
              onOpenCodeEditor={openCodeEditor}
              previousNodeOutput={previousNodeOutput}
              multipleInputs={multipleInputs}
            />
          </div>
        </div>
      )}

      {activeTab === 'io' && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Node Input */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Input</h4>
            <textarea
              className="w-full p-2 border rounded resize-none dark:bg-gray-700 dark:text-white font-mono text-xs"
              rows={10}
              value={selectedNodeInput ? JSON.stringify(selectedNodeInput, null, 2) : ''}
              onChange={handleInputChange}
              placeholder="Input data (JSON)"
            />
          </div>

          {/* Node Output */}
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Output</h4>
            <pre className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs max-h-60 overflow-auto">
              {selectedNodeOutput ? JSON.stringify(selectedNodeOutput, null, 2) : 'No output yet'}
            </pre>
          </div>
        </div>
      )}

      {/* Code Editor Modal */}
      {selectedNodeData?.type === 'codeNode' && (
        <CodeEditorModal
          isOpen={isCodeEditorOpen}
          nodeId={selectedNode!}
          onClose={closeCodeEditor}
        />
      )}
    </div>
  );
};