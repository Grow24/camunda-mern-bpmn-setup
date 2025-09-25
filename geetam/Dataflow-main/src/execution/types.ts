/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorkflowNode, WorkflowEdge, ExecutionStatus } from "../types";

export interface ExecutorContext {
  input: any;
  node: WorkflowNode;
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
  getNodeInput: (nodeId: string) => any;
  setNodeInput: (nodeId: string, input: any) => void;
  updateNodeStatus: (nodeId: string, status: Partial<ExecutionStatus>) => void;
  addExecutionLog: (log: {
    nodeId: string;
    message: string;
    type: "info" | "success" | "error";
  }) => void;
  executeNode: (nodeId: string, input: any) => Promise<void>;
  shouldStopExecution: boolean;
  getExecutionStatus: () => Record<string, ExecutionStatus>; 
}
