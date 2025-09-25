/* eslint-disable @typescript-eslint/no-explicit-any */
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface NodeData {
  label: string;
  description?: string;
  config: Record<string, any>;
  status?: "idle" | "running" | "success" | "error";
  error?: string;
  outputs?: Record<string, any>;
  inputs?: Record<string, any>;
}

export interface NodeType {
  id: string;
  label: string;
  category: "trigger" | "data" | "control" | "transform" | "merge" | "note";
  icon: string;
  color: string;
  description: string;
  type?: string;
}

export interface ExecutionStatus {
  nodeId: string;
  status: "idle" | "running" | "success" | "error";
  output?: any;
  error?: string;
}

export interface NodeFormField {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "select"
    | "textarea"
    | "url"
    | "boolean"
    | "confidential"
    | "codeButton"
    | "filtersArray"
    | "imageUpload"
    | "fileUpload"
    | "featureSelector";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  validation?: (value: any) => string | null;
}
