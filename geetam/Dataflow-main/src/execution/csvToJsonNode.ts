import { ExecutorContext } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const data = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] ?? "";
    });
    return obj;
  });

  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function csvToJsonNode(ctx: ExecutorContext): Promise<any[]> {
  const { node, updateNodeStatus, addExecutionLog } = ctx;
  const csvText: string | undefined = node.data?.csvText;

  if (!csvText) {
    updateNodeStatus(node.id, { status: "error", error: "CSV file content is required" });
    throw new Error("CSV file content is required");
  }

  updateNodeStatus(node.id, { status: "running" });
  addExecutionLog({ nodeId: node.id, message: "Parsing CSV to JSON", type: "info" });

  try {
    const jsonData = parseCSV(csvText);
    updateNodeStatus(node.id, { status: "success", output: jsonData });
    addExecutionLog({ nodeId: node.id, message: "CSV parsed successfully", type: "success" });
    return jsonData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    updateNodeStatus(node.id, { status: "error", error: error.message });
    addExecutionLog({ nodeId: node.id, message: `Error parsing CSV: ${error.message}`, type: "error" });
    throw error;
  }
}