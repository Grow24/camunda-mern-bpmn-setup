import { ExecutorContext } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function dataOutNode(ctx: ExecutorContext): Promise<any> {
  const { input, node, getNodeInput, setNodeInput, addExecutionLog } = ctx;

  const prevOutput = getNodeInput(node.id) || [];

  // If input is an array, spread its elements; else add input as single element
  const newOutput = Array.isArray(prevOutput)
    ? Array.isArray(input)
      ? [...prevOutput, ...input]
      : [...prevOutput, input]
    : Array.isArray(input)
    ? [...input]
    : [input];

  setNodeInput(node.id, newOutput);

  addExecutionLog({
    nodeId: node.id,
    message: `Final output: ${JSON.stringify(newOutput)}`,
    type: "success",
  });

  return newOutput;
}