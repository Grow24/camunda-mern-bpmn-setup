/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeUserCode } from "../utils/executeUserCode";

export async function codeNodeExecutor(ctx: {
  input: any;
  node: { id: string; data: { code?: string } };
  addExecutionLog: (log: {
    nodeId: string;
    message: string;
    type: string;
  }) => void;
  updateNodeStatus: (
    nodeId: string,
    status: { status: string; output?: any }
  ) => void;
}) {
  const { input, node, addExecutionLog, updateNodeStatus } = ctx;

  try {
    addExecutionLog({
      nodeId: node.id,
      message: "Executing Code Node",
      type: "info",
    });

    if (!node.data.code) {
      addExecutionLog({
        nodeId: node.id,
        message: "No code provided in Code Node",
        type: "error",
      });
      updateNodeStatus(node.id, { status: "error" });
      return input;
    }

    // Execute user code with $input and get output
    const output = executeUserCode(node.data.code, input);

    updateNodeStatus(node.id, { status: "success", output });

    return output;
  } catch (error: any) {
    addExecutionLog({
      nodeId: node.id,
      message: `Code Node execution error: ${error.message}`,
      type: "error",
    });
    updateNodeStatus(node.id, { status: "error" });
    throw error;
  }
}
