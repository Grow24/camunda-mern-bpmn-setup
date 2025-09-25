import axios from "axios";
import { ExecutorContext } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function httpTriggerNode(ctx: ExecutorContext): Promise<any> {
  const { node } = ctx;
  const nodeData = node.data;
  const FETCH_API = import.meta.env.VITE_FETCH_API;
  const { data } = await axios.post(`${FETCH_API}/fetch`, {
    url: nodeData.url,
    method: nodeData.method,
  });
  const response = data.data;
  return response;
}
