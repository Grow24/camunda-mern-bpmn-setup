/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutorContext } from "./types";

export async function loopNode(ctx: ExecutorContext): Promise<any> {
  const {
    input,
    node,
    edges,
    nodes,
    executeNode,
    getNodeInput,
    setNodeInput,
    updateNodeStatus,
    addExecutionLog,
    shouldStopExecution,
    getExecutionStatus,
  } = ctx;

  if (!Array.isArray(input)) {
    return input;
  }

  const collectedEmails: any[] = [];
  const nextEdge = edges.find((e) => e.source === node.id);
  if (!nextEdge) {
    addExecutionLog({
      nodeId: node.id,
      message: "Loop node has no connected next node",
      type: "error",
    });
    return input;
  }

  setNodeInput(node.id, input);

  for (const item of input) {
    if (shouldStopExecution) {
      addExecutionLog({
        nodeId: "",
        message: "Workflow execution stopped by user",
        type: "info",
      });
      throw new Error("Execution stopped");
    }

    await executeNode(nextEdge.target, item);

    const scrapeEmailNode = nodes.find((n) => n.id === nextEdge.target);
    if (!scrapeEmailNode) continue;

    const waitEdge = edges.find((e) => e.source === scrapeEmailNode.id);
    if (waitEdge) {
      await executeNode(waitEdge.target, getNodeInput(waitEdge.target));
    }

    const executionStatus = getExecutionStatus(); // <--- use this
    const emailOutput = executionStatus?.[scrapeEmailNode.id]?.output;
    if (emailOutput && emailOutput.email) {
      collectedEmails.push(emailOutput);
    }
  }

  updateNodeStatus(node.id, { status: "success", output: collectedEmails });

  const nextEdges = edges.filter((e) => e.source === node.id);
  for (const edge of nextEdges) {
    await executeNode(edge.target, collectedEmails);
  }

  return collectedEmails;
}
