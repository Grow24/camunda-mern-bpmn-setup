import React, { useCallback, useRef, DragEvent, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  // MiniMap,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  Edge,
  Node,
  NodeTypes,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  SelectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../../store/workflowStore';
import { CustomNode } from '../nodes/CustomNode';
import { LLMNode } from '../nodes/LLMNode';
import { AgentNode } from '../nodes/AgentNode';
import { NodeType } from '../../types';
import ChatModal from '../Chatmodal/ChatModal';
import { useChatStore } from '../../store/chatStore';
import { serialInNode } from '../../execution/serialInNode';

const nodeTypes_RF: NodeTypes = {
  webhookTrigger: CustomNode,
  httpTrigger: CustomNode,
  commandTrigger: CustomNode,
  formTrigger: CustomNode,
  chatTrigger: CustomNode,
  manualTrigger: CustomNode,
  agentNode: AgentNode,
  llmNode: LLMNode,
  dataIn: CustomNode,
  dataOut: CustomNode,
  ifNode: CustomNode,
  switchNode: CustomNode,
  loopNode: CustomNode,
  waitNode: CustomNode,
  optionsNode: CustomNode,
  editNode: CustomNode,
  formulaNode: CustomNode,
  transformNode: CustomNode,
  summarizeNode: CustomNode,
  mergeNode: CustomNode,
  joinNode: CustomNode,
  aggregateNode: CustomNode,
  stickyNote: CustomNode,
  removeDuplicateNode:CustomNode,
  codeNode:CustomNode,
  filterNode:CustomNode,
  imageClassifierNode:CustomNode,
  kMeansNode:CustomNode,
  linearRegressionNode:CustomNode,
  logisticRegressionNode:CustomNode,
  csvToJsonNode:CustomNode,
  serialInNode:CustomNode,
};

interface WorkflowCanvasInternalProps {
  onNodeDrop: (nodeType: NodeType, position: { x: number; y: number }) => void;
}

const WorkflowCanvasInternal: React.FC<WorkflowCanvasInternalProps> = ({ onNodeDrop }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    deleteNode,
    deleteEdge,
    executionStatus,
    selectedNode,
    setSelectedNode,
    selectedEdges,
    setSelectedEdges
  } = useWorkflowStore();

  const conversations = useChatStore(state => state.conversations);
  const sendMessage = useChatStore(state => state.sendMessage);
  const stopStreaming = useChatStore(state => state.stopStreaming);
  const setConversationMapping = useChatStore(state => state.setConversationMapping);

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeAgentNodeId, setActiveAgentNodeId] = useState<string | null>(null);

  useEffect(() => {
    const convertedNodes: Node[] = nodes.map(node => {
      let chatStatus = undefined;
      let chatError = undefined;

      if (node.type === 'agentNode' || node.type === 'llmNode') {
        const conv = conversations[node.id];
        if (conv) {
          chatStatus = conv.status;
          chatError = conv.error;
        } else if (node.type === 'agentNode') {
          const connectedEdge = edges.find(e => e.source === node.id && nodes.find(n => n.id === e.target && n.type === 'llmNode'));
          if (connectedEdge) {
            setConversationMapping(node.id, connectedEdge.target);
          }
        }
      }

      return {
        id: node.id,
        type: node.type,  
        position: node.position,
        data: {
          ...node.data,
          nodeType: node.type,
          executionStatus: executionStatus[node.id],
          chatStatus,
          chatError,
        },
        selected: selectedNode === node.id,
      };
    });
    setReactFlowNodes(convertedNodes);
  }, [nodes, executionStatus, selectedNode, conversations, edges, setReactFlowNodes, setConversationMapping]);

  useEffect(() => {
    const styledEdges = edges.map(edge => {
      const sourceStatus = executionStatus[edge.source];
      let edgeStyle = { stroke: '#6b7280', strokeWidth: 2 };
      
      if (sourceStatus?.status === 'running') {
        edgeStyle = { 
          stroke: '#3b82f6', 
          strokeWidth: 3,
        };
      } else if (sourceStatus?.status === 'success') {
        edgeStyle = { stroke: '#10b981', strokeWidth: 2 };
      } else if (sourceStatus?.status === 'error') {
        edgeStyle = { stroke: '#ef4444', strokeWidth: 2 };
      }
      
      return {
        ...edge,
        style: edgeStyle,
        animated: sourceStatus?.status === 'running',
        selected: selectedEdges.includes(edge.id)
      };
    });
    setReactFlowEdges(styledEdges);
  }, [edges, executionStatus, selectedEdges, setReactFlowEdges]);

  const isValidConnection = useCallback((connection: Connection) => {
    return (
      connection.sourceHandle === 'output' &&
      connection.targetHandle === 'input' &&
      connection.source !== connection.target
    );
  }, []);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      if (params.source === params.target) return;
      const existingEdge = edges.find(edge => 
        edge.source === params.source && 
        edge.target === params.target &&
        edge.sourceHandle === params.sourceHandle &&
        edge.targetHandle === params.targetHandle
      );
      if (existingEdge) return;
      const newEdge: Edge = {
        id: `edge_${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle ?? undefined,
        targetHandle: params.targetHandle ?? undefined,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      };
      setEdges([...edges, newEdge]);
    },
    [edges, setEdges]
  );

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          const node = nodes.find(n => n.id === change.id);
          if (node) {
            const updatedNodes = nodes.map(n => 
              n.id === change.id 
                ? { ...n, position: change.position! }
                : n
            );
            setNodes(updatedNodes);
          }
        }
        if (change.type === 'remove') {
          deleteNode(change.id);
        }
      });
    },
    [onNodesChange, nodes, setNodes, deleteNode]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      changes.forEach(change => {
        if (change.type === 'remove') {
          deleteEdge(change.id);
        }
      });
    },
    [onEdgesChange, deleteEdge]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const nodeTypeData = event.dataTransfer.getData('application/reactflow');
      if (!nodeTypeData || !reactFlowWrapper.current) return;
      try {
        const nodeType: NodeType = JSON.parse(nodeTypeData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        onNodeDrop(nodeType, position);

        if (nodeType.type === 'agentNode') {
          setTimeout(() => {
            const newAgentNode = nodes.find(n => n.type === 'agentNode' && !conversations[n.id]);
            if (newAgentNode) {
              setActiveAgentNodeId(newAgentNode.id);
              setIsChatModalOpen(true);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error parsing dropped node data:', error);
      }
    },
    [screenToFlowPosition, onNodeDrop, nodes, conversations]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (window.confirm(`Delete node "${node.data.label}"?`)) {
        deleteNode(node.id);
      }
    },
    [deleteNode]
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      if (window.confirm('Delete this connection?')) {
        deleteEdge(edge.id);
      }
    },
    [deleteEdge]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      setSelectedNode(selectedNode === node.id ? null : node.id);
      setSelectedEdges([]);
    },
    [selectedNode, setSelectedNode, setSelectedEdges]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      setSelectedNode(null);
      const isSelected = selectedEdges.includes(edge.id);
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        if (isSelected) {
          setSelectedEdges(selectedEdges.filter(id => id !== edge.id));
        } else {
          setSelectedEdges([...selectedEdges, edge.id]);
        }
      } else {
        setSelectedEdges(isSelected ? [] : [edge.id]);
      }
    },
    [selectedEdges, setSelectedEdges, setSelectedNode]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
      if (selectedNodes.length === 1 && selectedEdges.length === 0) {
        setSelectedNode(selectedNodes[0].id);
        setSelectedEdges([]);
      } else if (selectedNodes.length === 0 && selectedEdges.length > 0) {
        setSelectedNode(null);
        setSelectedEdges(selectedEdges.map(edge => edge.id));
      } else if (selectedNodes.length === 0 && selectedEdges.length === 0) {
        setSelectedNode(null);
        setSelectedEdges([]);
      }
    },
    [setSelectedNode, setSelectedEdges]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdges([]);
  }, [setSelectedNode, setSelectedEdges]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && !event.repeat) {
        const activeElement = document.activeElement as HTMLElement | null;
        const isInInput = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );
        if (!isInInput) {
          event.preventDefault();
          if (selectedNode) {
            deleteNode(selectedNode);
            setSelectedNode(null);
          }
          if (selectedEdges.length > 0) {
            selectedEdges.forEach(edgeId => deleteEdge(edgeId));
            setSelectedEdges([]);
          }
        }
      }
      if (event.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdges([]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdges, deleteNode, deleteEdge, setSelectedNode, setSelectedEdges]);

  const closeChatModal = () => {
    setIsChatModalOpen(false);
    setActiveAgentNodeId(null);
  };

  const onSendMessage = async (message: string) => {
    if (!activeAgentNodeId) return;
    await sendMessage(activeAgentNodeId, message);
  };

  const onStopStreaming = () => {
    stopStreaming();
  };

  const messages = activeAgentNodeId
    ? (conversations[activeAgentNodeId]?.messages || []).map(msg => ({
        ...msg,
        sender: msg.sender === 'llm' ? 'agent' : msg.sender, 
      }))
    : [];

  const loading = activeAgentNodeId ? conversations[activeAgentNodeId]?.status === 'running' : false;
  const hasAgentNode = React.useMemo(() => nodes.some(n => n.type === 'agentNode'), [nodes]);

  const isAgentConnectedToLLM = React.useMemo(() => {
    if (!nodes.length || !edges.length) return false;

    const agentNodeIds = nodes.filter(n => n.type === 'agentNode').map(n => n.id);
    const llmNodeIds = nodes.filter(n => n.type === 'llmNode').map(n => n.id);

    return edges.some(edge =>
      (agentNodeIds.includes(edge.source) && llmNodeIds.includes(edge.target)) ||
      (llmNodeIds.includes(edge.source) && agentNodeIds.includes(edge.target))
    );
  }, [nodes, edges]);

  const openChatModal = () => {
    const firstAgentNode = nodes.find(n => n.type === 'agentNode');
    if (firstAgentNode) {
      setActiveAgentNodeId(firstAgentNode.id);
      setIsChatModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes_RF}
          fitView
          attributionPosition="bottom-left"
          className="bg-gray-50 dark:bg-gray-900"
          deleteKeyCode={['Delete']}
          multiSelectionKeyCode={['Meta', 'Ctrl']}
          selectionMode={SelectionMode.Partial}
          panOnDrag={true}
          selectionKeyCode={['Shift']}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          isValidConnection={isValidConnection}
        >
          <Background gap={30} size={3} className="dark:opacity-40 text-[#94a3b8] dark:text-white" />
          <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg" />
          {/* <MiniMap
            nodeColor={(node) => node.data.color || '#6b7280'}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
          /> */}
        </ReactFlow>
      </div>

      {hasAgentNode && (
        <button
          onClick={openChatModal}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition"
        >
          Chat Now
        </button>
      )}

      {/* Chat Modal */}
      {activeAgentNodeId && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={closeChatModal}
          canChat={isAgentConnectedToLLM}  
          onSendMessage={onSendMessage}
          onStop={onStopStreaming}
          messages={messages}
          loading={loading}
        />
      )}

      {/* Keyboard shortcuts help */}
      {/* <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-lg text-xs text-gray-600 dark:text-gray-400">
        <div className="font-medium mb-1">Keyboard Shortcuts:</div>
        <div>Delete: Delete selected</div>
        <div>Escape: Deselect all</div>
        <div>Shift + Click: Multi-select</div>
        <div>Right-click: Context menu</div>
      </div> */}
    </>
  );
};

interface WorkflowCanvasProps {
  onNodeDrop: (nodeType: NodeType, position: { x: number; y: number }) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ onNodeDrop }) => (
  <ReactFlowProvider>
    <WorkflowCanvasInternal onNodeDrop={onNodeDrop} />
  </ReactFlowProvider>
);