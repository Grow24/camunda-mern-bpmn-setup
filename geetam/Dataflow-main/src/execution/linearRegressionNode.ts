/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutorContext } from "./types";

export async function linearRegressionNode(
  ctx: ExecutorContext
): Promise<string> {
  const { node, updateNodeStatus, addExecutionLog, input } = ctx;
  const jsonDataStr = node.data.jsonData;
  const userIndependentFeatures: string[] = node.data.independentFeatures || [];
  const userDependentFeature: string = node.data.dependentFeature;

  let inputData: any[] | null = null;

  if (jsonDataStr) {
    try {
      inputData = JSON.parse(jsonDataStr);
    } catch {
      updateNodeStatus(node.id, {
        status: "error",
        error: "Invalid JSON data in uploaded file",
      });
      throw new Error("Invalid JSON data in uploaded file");
    }
  } else if (input) {
    if (Array.isArray(input)) {
      inputData = input;
    } else if (typeof input === "string") {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          inputData = parsed;
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  if (!inputData || inputData.length === 0) {
    updateNodeStatus(node.id, {
      status: "error",
      error: "JSON data is required",
    });
    throw new Error("JSON data is required");
  }

  const allNumericFeatures = (() => {
    const firstItem = inputData[0];
    return Object.keys(firstItem).filter((key) => {
      const val = firstItem[key];
      return (
        typeof val === "number" ||
        (typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "")
      );
    });
  })();
  const ml5 = (window as any).ml5;
  if (!ml5) {
    console.error("ml5 not loaded");
  }
  const depFeature = userDependentFeature || allNumericFeatures[0];
  const indepFeatures =
    userIndependentFeatures.length > 0
      ? userIndependentFeatures
      : allNumericFeatures.filter((f) => f !== depFeature);

  if (!depFeature || indepFeatures.length === 0) {
    updateNodeStatus(node.id, {
      status: "error",
      error:
        "JSON data, dependent feature, and at least one independent feature are required",
    });
    throw new Error(
      "JSON data, dependent feature, and at least one independent feature are required"
    );
  }

  updateNodeStatus(node.id, { status: "running" });
  addExecutionLog({
    nodeId: node.id,
    message: `Running Linear Regression with dependent feature ${depFeature}`,
    type: "info",
  });

  const nn = ml5.neuralNetwork({ task: "regression", debug: false });

  for (let i = 0; i < inputData.length; i++) {
    const xObj: Record<string, number> = {};
    indepFeatures.forEach((f) => {
      xObj[f] = Number(inputData[i][f]) || 0;
    });
    const yVal = Number(inputData[i][depFeature]) || 0;
    nn.addData(xObj, { [depFeature]: yVal });
  }

  nn.normalizeData();
  await new Promise<void>((resolve) =>
    nn.train({ epochs: 50 }, () => resolve())
  );

  const xVals: number[] = [];
  const yVals: number[] = [];
  const yPredVals: number[] = [];

  for (let i = 0; i < inputData.length; i++) {
    const xObj: Record<string, number> = {};
    indepFeatures.forEach((f) => {
      xObj[f] = Number(inputData[i][f]) || 0;
    });

    xVals.push(xObj[indepFeatures[0]]);
    yVals.push(Number(inputData[i][depFeature]) || 0);

    await new Promise<void>((resolve) => {
      nn.predict(xObj, (err, result) => {
        if (err || !result || !result[0]) {
          yPredVals.push(0);
        } else {
          yPredVals.push(result[0].value);
        }
        resolve();
      });
    });
  }

  // Visualization
  const width = 400;
  const height = 400;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx2d = canvas.getContext("2d")!;

  ctx2d.fillStyle = "#fff";
  ctx2d.fillRect(0, 0, width, height);

  const minX = Math.min(...xVals);
  const maxX = Math.max(...xVals);
  const minY = Math.min(...yVals.concat(yPredVals));
  const maxY = Math.max(...yVals.concat(yPredVals));

  function scaleX(x: number) {
    return ((x - minX) / (maxX - minX)) * (width - 60) + 40;
  }
  function scaleY(y: number) {
    return height - (((y - minY) / (maxY - minY)) * (height - 60) + 40);
  }

  ctx2d.beginPath();
  ctx2d.moveTo(40, 20);
  ctx2d.lineTo(40, height - 40);
  ctx2d.lineTo(width - 20, height - 40);
  ctx2d.stroke();

  // Draw actual points (blue)
  ctx2d.fillStyle = "#1f77b4";
  for (let i = 0; i < xVals.length; i++) {
    ctx2d.beginPath();
    ctx2d.arc(scaleX(xVals[i]), scaleY(yVals[i]), 4, 0, 2 * Math.PI);
    ctx2d.fill();
  }

  // Draw predicted points (orange)
  ctx2d.fillStyle = "#ff7f0e";
  for (let i = 0; i < xVals.length; i++) {
    ctx2d.beginPath();
    ctx2d.arc(scaleX(xVals[i]), scaleY(yPredVals[i]), 4, 0, 2 * Math.PI);
    ctx2d.fill();
  }

  // Legend and labels
  ctx2d.fillStyle = "#000";
  ctx2d.fillText("Actual", 50, 30);
  ctx2d.fillStyle = "#1f77b4";
  ctx2d.fillRect(10, 20, 20, 10);
  ctx2d.fillStyle = "#000";
  ctx2d.fillText("Predicted", 50, 50);
  ctx2d.fillStyle = "#ff7f0e";
  ctx2d.fillRect(10, 40, 20, 10);
  ctx2d.fillStyle = "#000";
  ctx2d.fillText(depFeature, 10, 20);
  ctx2d.fillText(indepFeatures[0], width - 60, height - 10);

  const imageBase64 = canvas.toDataURL();

  updateNodeStatus(node.id, {
    status: "success",
    output: imageBase64,
  });

  addExecutionLog({
    nodeId: node.id,
    message: "Linear regression completed",
    type: "success",
  });

  return imageBase64;
}