/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutorContext } from "./types";

export async function imageClassifierNode(ctx: ExecutorContext): Promise<{ label: string; confidence: number }[]> {
  const { node, updateNodeStatus } = ctx;
  const imageData: string | undefined = node.data?.imageData;

  if (!imageData) {
    const error = "No image data provided to imageClassifierNode";
    updateNodeStatus(node.id, { status: "error" });
    throw new Error(error);
  }

  const classifyImage = (): Promise<{ label: string; confidence: number }[]> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imageData;

      img.onload = () => {
        const ml5 = (window as any).ml5;
        if (!ml5) {
          reject("ml5 not loaded");
          return;
        }

        const classifier = ml5.imageClassifier("MobileNet", () => {
          classifier.classify(img, (results: any, err: any) => {
            if (err) {
              reject(err);
              return;
            }
            if (results && results.length > 0) {
              const parsedResults = results.map((r: any) => ({
                label: r.label,
                confidence: r.confidence,
              }));
              resolve(parsedResults);
            } else {
              resolve([]);
            }
          });
        });
      };

      img.onerror = () => {
        reject("Failed to load image in imageClassifierNode");
      };
    });
  };

  try {
    const output = await classifyImage();
    updateNodeStatus(node.id, { status: "success", output });
    return output;
  } catch (error) {
    console.error("imageClassifierNode error:", error);
    updateNodeStatus(node.id, { status: "error", error: String(error) });
    throw error;
  }
}