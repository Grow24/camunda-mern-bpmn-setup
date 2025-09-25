import { manualTriggerNode } from "./manualTriggerNode";
import { httpTriggerNode } from "./httpTriggerNode";
import { removeDuplicateNode } from "./removeDuplicateNode";
import { appendNode } from "./appendNode";
import { loopNode } from "./loopNode";
import { waitNode } from "./waitNode";
import { dataOutNode } from "./dataOutNode";
import { codeNodeExecutor } from "./CodeNode";
import { filterNode } from "./filterNode";
import { imageClassifierNode } from "./imageClassifierNode";
import { kMeansNode } from "./kMeansNode";
import { csvToJsonNode } from "./csvToJsonNode";
import { linearRegressionNode } from "./linearRegressionNode";
import { logisticRegressionNode } from "./logisticRegressionNode";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeExecutors: Record<string, (ctx: any) => Promise<any>> = {
  manualTrigger: manualTriggerNode,
  httpTrigger: httpTriggerNode,
  removeDuplicateNode: removeDuplicateNode,
  appendNode: appendNode,
  loopNode: loopNode,
  waitNode: waitNode,
  dataOut: dataOutNode,
  codeNode: codeNodeExecutor,
  filterNode: filterNode,
  imageClassifierNode: imageClassifierNode,
  kMeansNode: kMeansNode,
  csvToJsonNode: csvToJsonNode,
  linearRegressionNode: linearRegressionNode,
  logisticRegressionNode: logisticRegressionNode
};
