/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutorContext } from "./types";

function extractFeatures(data: any[], selectedFeatures: string[]): number[][] {
  return data.map(row =>
    selectedFeatures.map(f => {
      const num = Number(row[f]);
      return isNaN(num) ? 0 : num;
    })
  );
}

function extractNumeric(data: any[]): number[][] {
  const keys = Object.keys(data[0]).filter(k => {
    const v = data[0][k];
    return typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "");
  });
  return data.map(row => keys.map(k => Number(row[k]) || 0));
}

export async function kMeansNode(ctx: ExecutorContext): Promise<string> {
  const { node, updateNodeStatus, addExecutionLog, input } = ctx;
  const k = node.data.k || 3;
  const features = node.data.selectedFeatures || [];
  const ML = (window as any).ML;
  let dataJson: any[] = [];
  if (node.data.jsonData) {
    try { dataJson = JSON.parse(node.data.jsonData); }
    catch { throw new Error("Invalid JSON data file"); }
  } else if (input) {
    dataJson = typeof input === "string" ? JSON.parse(input) : input;
  }

  if (!Array.isArray(dataJson) || dataJson.length === 0) {
    throw new Error("JSON array required");
  }

  const dataPoints = features.length
    ? extractFeatures(dataJson, features)
    : extractNumeric(dataJson);

  if (dataPoints.length === 0) {
    throw new Error("No numeric data for clustering");
  }

  updateNodeStatus(node.id, { status: "running" });
  addExecutionLog({
    nodeId: node.id,
    message: `Clustering ${dataPoints.length} points into ${k} clusters`,
    type: "info",
  });

  // Run K-means using ml package
  const result = ML.KMeans(dataPoints, k);
  const clusters = result.clusters; // array of labels
  const centroids = result.centroids; // centroid coordinate arrays

  // Draw the clusters on canvas (reuse your logic)
  const width = 400, height = 400;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx2d = canvas.getContext("2d")!;
  ctx2d.fillStyle = "#fff";
  ctx2d.fillRect(0, 0, width, height);

  const colors = ["#e6194b","#3cb44b","#ffe119","#4363d8","#f58231"];
  const d = dataPoints[0].length;
  if (d >= 2) {
    const xs = dataPoints.map(p => p[0]), ys = dataPoints.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    const scaleX = (x: number) => ((x - minX)/(maxX-minX))*(width-40)+20;
    const scaleY = (y: number) => height - (((y - minY)/(maxY-minY))*(height-40)+20);

    dataPoints.forEach((p,i) => {
      ctx2d.fillStyle = colors[clusters[i] % colors.length];
      ctx2d.beginPath();
      ctx2d.arc(scaleX(p[0]), scaleY(p[1]), 5, 0, 2*Math.PI);
      ctx2d.fill();
    });

    centroids.forEach((c:any,i:any) => {
      ctx2d.fillStyle = "#000";
      ctx2d.beginPath();
      ctx2d.arc(scaleX(c[0]), scaleY(c[1]), 8, 0, 2*Math.PI);
      ctx2d.stroke();
      ctx2d.fillText(`Cluster ${i+1}`, scaleX(c[0]), scaleY(c[1])-15);
    });
  } else if (d === 1) {
    const xs = dataPoints.map(p => p[0]), minX = Math.min(...xs), maxX = Math.max(...xs);
    const y = height / 2;
    const scaleX = (x: number) => ((x-minX)/(maxX-minX))*(width-40)+20;
    dataPoints.forEach((p,i) => {
      ctx2d.fillStyle = colors[clusters[i] % colors.length];
      ctx2d.beginPath();
      ctx2d.arc(scaleX(p[0]), y, 5, 0, 2*Math.PI);
      ctx2d.fill();
    });
    centroids.forEach((c:any,i:any) => {
      ctx2d.fillStyle = "#000";
      ctx2d.beginPath();
      ctx2d.arc(scaleX(c[0]), y, 8, 0, 2*Math.PI);
      ctx2d.stroke();
      ctx2d.fillText(`C${i+1}`, scaleX(c[0]), y-15);
    });
  } else {
    throw new Error("Cannot visualize >2 dimensions");
  }

  const imageBase64 = canvas.toDataURL();
  updateNodeStatus(node.id, { status: "success", output: imageBase64 });
  addExecutionLog({ nodeId: node.id, message: "Clustering done", type: "success" });

  return imageBase64;
}
