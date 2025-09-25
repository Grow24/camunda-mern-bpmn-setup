import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Connection,
  ReactFlowProvider,
  ReactFlowInstance,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Header } from './Header';
import { Ribbon } from './Ribbon';
import { Inspector } from './Inspector';
import { nodeTypes } from './nodes';
import { useWorkflowStore } from '../stores/workflowStore';
import { useWebSocket } from '../hooks/useWebSocket';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const { isExecuting, executeFlow } = useWorkflowStore();
  const { isConnected } = useWebSocket();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) {
        return;
      }

      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: nodeType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          status: 'idle'
        },
        dragHandle: '.drag-handle',
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    event.stopPropagation();
    console.log('Node clicked:', node.id);
    setSelectedNode(node);
    setIsInspectorOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setIsInspectorOpen(false);
  }, []);

  const handleExecuteFlow = async () => {
    const flow = {
      nodes,
      edges,
    };
    
    await executeFlow(flow);
  };

  const handleSaveFlow = async () => {
    const flow = {
      nodes,
      edges,
    };
    
    // Save flow logic would go here
    console.log('Saving flow:', flow);
  };

  const handleUpdateNode = useCallback((updatedNode: Node) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === updatedNode.id ? updatedNode : n))
    );
    setSelectedNode(updatedNode);
  }, [setNodes]);

  return (
    <div className="h-full flex flex-col">
      <Header 
        onSave={handleSaveFlow}
        onExecute={handleExecuteFlow}
        isExecuting={isExecuting}
        isConnected={isConnected}
      />
      <Ribbon />
      
      <div className="flex-1 flex">
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="top-right"
              className="bg-gray-50 dark:bg-gray-900"
              nodesDraggable={true}
              nodesConnectable={true}
              elementsSelectable={true}
              selectNodesOnDrag={false}
              panOnDrag={[1, 2]} // Allow panning with left and middle mouse buttons
              zoomOnScroll={true}
              zoomOnPinch={true}
              panOnScroll={false}
              preventScrolling={true}
              minZoom={0.1}
              maxZoom={2}
            >
              <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
              <MiniMap 
                className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                nodeColor="#3b82f6"
                maskColor="rgba(0, 0, 0, 0.1)"
              />
              <Background 
                color="#94a3b8" 
                gap={16} 
                className="dark:opacity-20"
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        
        {isInspectorOpen && selectedNode && (
          <Inspector 
            node={selectedNode}
            onClose={() => setIsInspectorOpen(false)}
            onUpdateNode={handleUpdateNode}
          />
        )}
      </div>
    </div>
  );
}