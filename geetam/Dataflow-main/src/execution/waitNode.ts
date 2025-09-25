import { ExecutorContext } from "./types";

export async function waitNode(ctx: ExecutorContext): Promise<any> {
  const { input, node } = ctx;
  const duration = node.data.duration || 1;
  await new Promise((res) => setTimeout(res, duration * 1000));
  return input;
}
