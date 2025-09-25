import { ExecutorContext } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function appendNode(ctx: ExecutorContext): Promise<any> {
  const { input, node, getNodeInput, setNodeInput } = ctx;

  const currentInputArray = Array.isArray(getNodeInput(node.id))
    ? getNodeInput(node.id)
    : [];

  const output = [...currentInputArray, input];

  setNodeInput(node.id, output);

  return output;
}
