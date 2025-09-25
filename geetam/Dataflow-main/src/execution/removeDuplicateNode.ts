import { ExecutorContext } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function removeDuplicateNode(ctx: ExecutorContext): Promise<any> {
  const { input } = ctx;
  if (Array.isArray(input)) {
    const res = Array.from(new Set(input));
    return res;
  } else {
    return input;
  }
}
