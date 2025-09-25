/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error: No type declarations available for ml-logistic-regression
import LogisticRegressionModule from 'ml-logistic-regression';
import { Matrix } from 'ml-matrix';
import { ExecutorContext } from './types';

const LogisticRegression = LogisticRegressionModule.LogisticRegression || LogisticRegressionModule;

function extractSelectedFeatures(data: any[], selectedFeatures: string[]): number[][] {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((item) =>
    selectedFeatures.map((key) => {
      const val = item[key];
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    })
  );
}

export async function logisticRegressionNode(ctx: ExecutorContext): Promise<string> {
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
        status: 'error',
        error: 'Invalid JSON data in uploaded file',
      });
      throw new Error('Invalid JSON data in uploaded file');
    }
  } else if (input) {
    if (Array.isArray(input)) {
      inputData = input;
    } else if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          inputData = parsed;
        }
      } catch(e) {
        console.error(e);
        
      }
    }
  }

  if (!inputData || inputData.length === 0) {
    updateNodeStatus(node.id, {
      status: 'error',
      error: 'JSON data is required',
    });
    throw new Error('JSON data is required');
  }

  const allNumericFeatures = Object.keys(inputData[0]).filter((key) => {
    const val = inputData![0][key];
    return (
      typeof val === 'number' ||
      (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '')
    );
  });

  const depFeature = userDependentFeature || allNumericFeatures[0];
  const indepFeatures =
    userIndependentFeatures.length > 0
      ? userIndependentFeatures
      : allNumericFeatures.filter((f) => f !== depFeature);

  if (!depFeature || indepFeatures.length === 0) {
    updateNodeStatus(node.id, {
      status: 'error',
      error: 'Dependent and independent features are required',
    });
    throw new Error('Invalid input for logistic regression');
  }

  const X_raw = extractSelectedFeatures(inputData, indepFeatures);
  const y_raw = inputData.map((item) => {
    const val = item[depFeature];
    if (val === 1 || val === 0) return val;
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      if (lower === 'true' || lower === 'yes') return 1;
      if (lower === 'false' || lower === 'no') return 0;
    }
    return 0;
  });

  if (X_raw.length === 0 || y_raw.length === 0) {
    updateNodeStatus(node.id, {
      status: 'error',
      error: 'No valid numeric data found for selected features',
    });
    throw new Error('No valid data');
  }

  updateNodeStatus(node.id, { status: 'running' });
  addExecutionLog({
    nodeId: node.id,
    message: `Running Logistic Regression with dependent feature "${depFeature}"`,
    type: 'info',
  });

  // Convert to Matrix format
  const XMatrix = new Matrix(X_raw);
  const yMatrix = Matrix.columnVector(y_raw);

  const logreg = new LogisticRegression({ numSteps: 2000, learningRate: 0.1 });
  logreg.train(XMatrix, yMatrix);

  const probs = logreg.predict(XMatrix);
  const y_pred = probs.map((p: number) => (p >= 0.5 ? 1 : 0));

  const correct = y_pred.filter((val: number, i: number) => val === y_raw[i]).length;
  const accuracy = (correct / y_raw.length) * 100;

  addExecutionLog({
    nodeId: node.id,
    message: `Model Accuracy: ${accuracy.toFixed(2)}%`,
    type: 'info',
  });

  // Visualization code (same as your original, adapted slightly)
  const width = 400;
  const height = 400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx2d = canvas.getContext('2d')!;

  ctx2d.fillStyle = '#fff';
  ctx2d.fillRect(0, 0, width, height);

  ctx2d.strokeStyle = '#000';
  ctx2d.lineWidth = 1;
  ctx2d.font = '12px Arial';
  ctx2d.fillStyle = '#000';

  // Draw axes
  ctx2d.beginPath();
  ctx2d.moveTo(40, 20);
  ctx2d.lineTo(40, height - 40);
  ctx2d.lineTo(width - 20, height - 40);
  ctx2d.stroke();

  // Calculate dynamic Y-axis range with padding
  const allYValues = [...y_raw, ...probs];
  const dataMin = Math.min(...allYValues);
  const dataMax = Math.max(...allYValues);
  let dataRange = dataMax - dataMin;

  const minVerticalRange = 0.06;
  let minY: number;
  let maxY: number;

  if (dataRange < minVerticalRange) {
    const center = (dataMax + dataMin) / 2;
    dataRange = minVerticalRange;
    minY = Math.max(0, center - dataRange / 2);
    maxY = Math.min(1, center + dataRange / 2);
  } else {
    const paddingFactor = 0.3;
    minY = Math.max(0, dataMin - dataRange * paddingFactor);
    maxY = Math.min(1, dataMax + dataRange * paddingFactor);
  }

  // Draw horizontal grid lines and labels dynamically
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const val = minY + ((maxY - minY) * i) / numGridLines;
    const y = height - ((val - minY) / (maxY - minY)) * (height - 80) - 40;
    ctx2d.strokeStyle = '#ddd';
    ctx2d.beginPath();
    ctx2d.moveTo(40, y);
    ctx2d.lineTo(width - 20, y);
    ctx2d.stroke();
    ctx2d.fillStyle = '#000';
    ctx2d.fillText(val.toFixed(2), 10, y + 4);
  }

  ctx2d.fillText('Sample Index', width / 2 - 30, height - 10);

  const nSamples = y_raw.length;
  const scaleX = (i: number) => (i / (nSamples - 1)) * (width - 60) + 40;
  const scaleY = (y: number) =>
    height - ((y - minY) / (maxY - minY)) * (height - 80) - 40;

  function jitter(value: number, range = 0.02) {
    return Math.min(maxY, Math.max(minY, value + (Math.random() * 2 - 1) * range));
  }

  // Draw actual points (blue circles)
  ctx2d.fillStyle = '#1f77b4';
  ctx2d.strokeStyle = '#000';
  for (let i = 0; i < nSamples; i++) {
    const x = scaleX(i);
    const y = scaleY(jitter(y_raw[i]));
    ctx2d.beginPath();
    ctx2d.arc(x, y, 5, 0, 2 * Math.PI);
    ctx2d.fill();
    ctx2d.stroke();
  }

  // Draw predicted probabilities (orange smaller circles)
  ctx2d.fillStyle = 'rgba(255, 127, 14, 0.7)';
  ctx2d.strokeStyle = '#000';
  for (let i = 0; i < nSamples; i++) {
    const x = scaleX(i);
    const y = scaleY(jitter(probs[i]));
    ctx2d.beginPath();
    ctx2d.arc(x, y, 3, 0, 2 * Math.PI);
    ctx2d.fill();
    ctx2d.stroke();
  }

  // Draw decision boundary line at y=0.5 if within range
  if (minY <= 0.5 && maxY >= 0.5) {
    ctx2d.strokeStyle = '#555';
    ctx2d.setLineDash([5, 5]);
    const yDecision = scaleY(0.5);
    ctx2d.beginPath();
    ctx2d.moveTo(40, yDecision);
    ctx2d.lineTo(width - 20, yDecision);
    ctx2d.stroke();
    ctx2d.setLineDash([]);
  }

  // Legend
  ctx2d.fillStyle = '#000';
  ctx2d.fillText('Actual (0 or 1)', 60, 30);
  ctx2d.fillStyle = '#1f77b4';
  ctx2d.fillRect(10, 20, 30, 10);

  ctx2d.fillStyle = '#000';
  ctx2d.fillText('Predicted Probability', 60, 50);
  ctx2d.fillStyle = 'rgba(255, 127, 14, 0.7)';
  ctx2d.fillRect(10, 40, 30, 10);

  ctx2d.fillStyle = '#000';
  ctx2d.fillText('Decision Boundary (0.5)', 60, 70);
  ctx2d.strokeStyle = '#555';
  ctx2d.setLineDash([5, 5]);
  ctx2d.beginPath();
  ctx2d.moveTo(10, 65);
  ctx2d.lineTo(40, 65);
  ctx2d.stroke();
  ctx2d.setLineDash([]);

  const imageBase64 = canvas.toDataURL();

  updateNodeStatus(node.id, {
    status: 'success',
    output: imageBase64,
  });

  addExecutionLog({
    nodeId: node.id,
    message: 'Logistic regression completed',
    type: 'success',
  });

  return imageBase64;
}