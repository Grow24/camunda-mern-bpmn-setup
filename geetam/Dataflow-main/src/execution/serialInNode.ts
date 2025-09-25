/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutorContext } from "./types";

export async function serialInNode(ctx: ExecutorContext): Promise<any> {
  const { node, updateNodeStatus, addExecutionLog } = ctx;

  try {
    addExecutionLog({
      nodeId: node.id,
      message: "Requesting access to serial device...",
      type: "info",
    });

    // Ask user to choose Arduino's serial port
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: node.data.baudRate || 9600 });

    const reader = port.readable?.getReader();
    if (!reader) throw new Error("Failed to open serial reader");

    addExecutionLog({
      nodeId: node.id,
      message: `Serial port opened at ${node.data.baudRate || 9600} baud`,
      type: "success",
    });

    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += new TextDecoder().decode(value);

      // Assume Arduino sends data line-by-line
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const clean = line.trim();
        if (clean) {
          updateNodeStatus(node.id, { status: "success", output: clean });
          addExecutionLog({
            nodeId: node.id,
            message: `Received: ${clean}`,
            type: "info",
          });
        }
      }
    }

    reader.releaseLock();
    await port.close();

    return null;
  } catch (err: any) {
    addExecutionLog({
      nodeId: node.id,
      message: `Serial error: ${err.message}`,
      type: "error",
    });
    updateNodeStatus(node.id, { status: "error" });
    throw err;
  }
}
