/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { WorkflowNode, WorkflowEdge, ExecutionStatus } from "../types";
import { nodeExecutors } from "../execution";

interface WorkflowStore {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode: string | null;
  selectedEdges: string[];
  executionStatus: Record<string, ExecutionStatus>;
  nodeInputs: Record<string, any>;
  isExecuting: boolean;
  shouldStopExecution: boolean;
  executionLogs: Array<{
    nodeId: string;
    message: string;
    timestamp: Date;
    type: "info" | "success" | "error";
  }>;

  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, data: Partial<WorkflowNode>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdges: (ids: string[]) => void;

  setExecutionStatus: (status: Record<string, ExecutionStatus>) => void;
  updateNodeStatus: (nodeId: string, status: Partial<ExecutionStatus>) => void;
  setNodeInput: (nodeId: string, input: any) => void;
  getNodeInput: (nodeId: string) => any;
  setIsExecuting: (executing: boolean) => void;
  addExecutionLog: (log: {
    nodeId: string;
    message: string;
    type: "info" | "success" | "error";
  }) => void;
  clearExecutionLogs: () => void;

  loadWorkflow: (workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }) => void;
  resetWorkflow: () => void;

  deleteSelectedItems: () => void;
  duplicateNode: (nodeId: string) => void;

  stopWorkflow: () => void;
  executeMockWorkflow: () => Promise<void>;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdges: [],
  executionStatus: {},
  nodeInputs: {},
  isExecuting: false,
  shouldStopExecution: false,
  executionLogs: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
      selectedNode: state.selectedNode === id ? null : state.selectedNode,
      executionStatus: Object.fromEntries(
        Object.entries(state.executionStatus).filter(
          ([nodeId]) => nodeId !== id
        )
      ),
      nodeInputs: Object.fromEntries(
        Object.entries(state.nodeInputs).filter(([nodeId]) => nodeId !== id)
      ),
    })),

  deleteEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdges: state.selectedEdges.filter((edgeId) => edgeId !== id),
    })),

  setSelectedNode: (id) => set({ selectedNode: id }),
  setSelectedEdges: (ids) => set({ selectedEdges: ids }),

  setExecutionStatus: (status) => set({ executionStatus: status }),

  updateNodeStatus: (nodeId, status) => {
    const state = get();
    const prevStatus = state.executionStatus[nodeId] || {};
    let newOutput = status.output;

    // If output is undefined, keep previous output
    if (newOutput === undefined) {
      newOutput = prevStatus.output;
    }

    const newExecutionStatus = {
      ...state.executionStatus,
      [nodeId]: { ...prevStatus, ...status, output: newOutput },
    };
    set({ executionStatus: newExecutionStatus });

    if (status.output !== undefined) {
      const nextNodes = state.edges
        .filter((edge) => edge.source === nodeId)
        .map((edge) => edge.target);

      nextNodes.forEach((targetNodeId) => {
        get().setNodeInput(targetNodeId, newOutput);
      });
    }
  },

  setNodeInput: (nodeId, input) =>
    set((state) => ({
      nodeInputs: {
        ...state.nodeInputs,
        [nodeId]: input,
      },
    })),

  getNodeInput: (nodeId) => {
    const state = get();
    return state.nodeInputs[nodeId];
  },

  setIsExecuting: (executing) => set({ isExecuting: executing }),

  addExecutionLog: (log) =>
    set((state) => ({
      executionLogs: [
        ...state.executionLogs,
        { ...log, timestamp: new Date() },
      ],
    })),

  clearExecutionLogs: () => set({ executionLogs: [] }),

  loadWorkflow: (workflow) =>
    set({
      nodes: workflow.nodes,
      edges: workflow.edges,
      selectedNode: null,
      selectedEdges: [],
      executionStatus: {},
      nodeInputs: {},
      executionLogs: [],
    }),

  resetWorkflow: () =>
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdges: [],
      executionStatus: {},
      nodeInputs: {},
      isExecuting: false,
      shouldStopExecution: false,
      executionLogs: [],
    }),

  deleteSelectedItems: () => {
    const state = get();

    if (state.selectedNode) {
      get().deleteNode(state.selectedNode);
    }

    state.selectedEdges.forEach((edgeId) => {
      get().deleteEdge(edgeId);
    });

    set({ selectedNode: null, selectedEdges: [] });
  },

  duplicateNode: (nodeId) => {
    const state = get();
    const nodeToDuplicate = state.nodes.find((node) => node.id === nodeId);

    if (nodeToDuplicate) {
      const newNode: WorkflowNode = {
        ...nodeToDuplicate,
        id: `node_${Date.now()}`,
        position: {
          x: nodeToDuplicate.position.x + 50,
          y: nodeToDuplicate.position.y + 50,
        },
      };

      get().addNode(newNode);
      get().setSelectedNode(newNode.id);
    }
  },

  stopWorkflow: () => {
    set({ shouldStopExecution: true });
  },

  executeMockWorkflow: async () => {
    const state = get();
    if (state.isExecuting) return;
    set({ isExecuting: true, shouldStopExecution: false });
    set({ executionLogs: [] });

    const findNodeByType = (type: string) =>
      state.nodes.find((n) => n.type === type);

    const manualNode = findNodeByType("manualTrigger");
    if (!manualNode) {
      get().addExecutionLog({
        nodeId: "",
        message: "No manual trigger node found",
        type: "error",
      });
      set({ isExecuting: false });
      return;
    }

    const executeNode = async (nodeId: string, input: any) => {
      if (get().shouldStopExecution) {
        get().addExecutionLog({
          nodeId: "",
          message: "Workflow execution stopped by user",
          type: "info",
        });
        throw new Error("Execution stopped");
      }

      const state = get();
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      get().updateNodeStatus(nodeId, { status: "running" });
      get().addExecutionLog({
        nodeId,
        message: `Executing ${node.data.label}`,
        type: "info",
      });

      const executor = nodeExecutors[node.type];
      if (!executor) {
        get().updateNodeStatus(nodeId, { status: "success", output: input });
        return;
      }

      const ctx = {
        input,
        node,
        edges: state.edges,
        nodes: state.nodes,
        getNodeInput: get().getNodeInput,
        setNodeInput: get().setNodeInput,
        updateNodeStatus: get().updateNodeStatus,
        addExecutionLog: get().addExecutionLog,
        executeNode,
        shouldStopExecution: get().shouldStopExecution,
        getExecutionStatus: () => get().executionStatus,
      };

      try {
        const output = await executor(ctx);
        get().updateNodeStatus(nodeId, { status: "success", output });

        if (node.type !== "loopNode" && !get().shouldStopExecution) {
          const nextEdges = state.edges.filter((e) => e.source === nodeId);
          for (const edge of nextEdges) {
            await executeNode(edge.target, output);
          }
        }
      } catch (error) {
        get().addExecutionLog({
          nodeId,
          message: `Execution error: ${JSON.stringify(error)}`,
          type: "error",
        });
        throw error;
      }
    };

    try {
      await executeNode(manualNode.id, null);
    } catch (e: any) {
      if (e.message !== "Execution stopped") {
        get().addExecutionLog({
          nodeId: "",
          message: `Execution error: ${e}`,
          type: "error",
        });
      }
    }

    set({ isExecuting: false, shouldStopExecution: false });
  },
}));
