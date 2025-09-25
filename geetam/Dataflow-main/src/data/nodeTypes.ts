import { NodeType, NodeFormField } from "../types";

export const nodeTypes: NodeType[] = [
  // Triggers
  {
    id: "webhookTrigger",
    label: "Webhook Trigger",
    category: "trigger",
    icon: "Webhook",
    color: "#10b981",
    description: "Trigger workflow via HTTP webhook",
  },
  {
    id: "httpTrigger",
    label: "HTTP Request Trigger",
    category: "trigger",
    icon: "Globe",
    color: "#10b981",
    description: "Trigger on HTTP request with method and headers",
  },
  {
    id: "imageClassifierNode",
    label: "Image Classifier",
    category: "transform",
    icon: "Cpu",
    color: "#8b5cf6",
    description: "Upload an image and classify it using ml5.js",
  },
  {
    id: "kMeansNode",
    label: "K-Means Clustering",
    category: "transform",
    icon: "Cpu",
    color: "#8b5cf6",
    description: "Cluster data points into K clusters using K-means algorithm",
  },
  {
    id: "commandTrigger",
    label: "Execute Command",
    category: "trigger",
    icon: "Terminal",
    color: "#10b981",
    description: "Execute shell command and capture output",
  },
  {
    id: "formTrigger",
    label: "Form Submission",
    category: "trigger",
    icon: "FileText",
    color: "#10b981",
    description: "Trigger when form is submitted",
  },
  {
    id: "chatTrigger",
    label: "Chat Message",
    category: "trigger",
    icon: "MessageCircle",
    color: "#10b981",
    description: "Trigger on chat message received",
  },
  {
    id: "manualTrigger",
    label: "Manual Trigger",
    category: "trigger",
    icon: "Play",
    color: "#10b981",
    description: "Manually trigger workflow execution",
  },
  {
    id: "agentNode",
    label: "Agent Node",
    category: "trigger",
    description:
      "Controller node to manage and delegate tasks to connected LLM nodes",
    icon: "Cpu",
    color: "#10b981",
  },
  {
    id: "llmNode",
    label: "LLM Node",
    category: "trigger",
    icon: "Cpu",
    color: "#10b981",
    description: "Large Language Model instance node",
  },
  {
    id: "linearRegressionNode",
    label: "Linear Regression",
    category: "transform",
    icon: "Calculator",
    color: "#8b5cf6",
    description:
      "Perform linear regression on JSON data with multiple features",
  },
  {
    id: "logisticRegressionNode",
    label: "Logistic Regression",
    category: "transform",
    icon: "Calculator",
    color: "#8b5cf6",
    description:
      "Perform logistic regression on JSON data with multiple features",
  },
  // Data Input/Output
  {
    id: "dataIn",
    label: "Data IN",
    category: "data",
    icon: "ArrowRight",
    color: "#3b82f6",
    description: "Entry point for data flows",
  },
  {
    id: "dataOut",
    label: "Data OUT",
    category: "data",
    icon: "ArrowLeft",
    color: "#3b82f6",
    description: "Terminal output node",
  },

  // Control Nodes
  {
    id: "ifNode",
    label: "IF Condition",
    category: "control",
    icon: "GitBranch",
    color: "#f59e0b",
    description: "Conditional branching with true/false paths",
  },
  {
    id: "switchNode",
    label: "Switch",
    category: "control",
    icon: "List",
    color: "#f59e0b",
    description: "Multi-case conditional routing",
  },
  {
    id: "loopNode",
    label: "Loop",
    category: "control",
    icon: "RotateCcw",
    color: "#f59e0b",
    description: "Iterate over array input",
  },
  {
    id: "waitNode",
    label: "Wait",
    category: "control",
    icon: "Clock",
    color: "#f59e0b",
    description: "Delay execution for specified duration",
  },
  {
    id: "optionsNode",
    label: "Options",
    category: "control",
    icon: "List",
    color: "#f59e0b",
    description: "Show dropdown or multiple choice router",
  },

  // Data Transformation
  {
    id: "editNode",
    label: "Edit Data",
    category: "transform",
    icon: "Edit3",
    color: "#8b5cf6",
    description: "Modify, add, or remove data fields",
  },
  {
    id: "codeNode",
    label: "Code Node",
    category: "transform",
    icon: "CodeSquareIcon",
    color: "#8b5cf6",
    description: "Write and execute custom JavaScript code",
  },
  {
    id: "filterNode",
    label: "Filter",
    category: "transform",
    icon: "Filter",
    color: "#8b5cf6",
    description: "Filter input data based on multiple conditions",
  },
  {
    id: "formulaNode",
    label: "Formula",
    category: "transform",
    icon: "Calculator",
    color: "#8b5cf6",
    description: "Apply mathematical or string expressions",
  },
  {
    id: "transformNode",
    label: "Transform",
    category: "transform",
    icon: "Shuffle",
    color: "#8b5cf6",
    description: "Rename, map, and reshape data fields",
  },
  {
    id: "csvToJsonNode",
    label: "CSV to JSON",
    category: "transform",
    icon: "FileText",
    color: "#8b5cf6",
    description: "Convert CSV file content to JSON array",
  },
  {
    id: "summarizeNode",
    label: "Summarize",
    category: "transform",
    icon: "BarChart3",
    color: "#8b5cf6",
    description: "Aggregate numerical data (sum, avg, count)",
  },
  {
    id: "removeDuplicateNode",
    label: "Remove Duplicates",
    category: "transform",
    icon: "Shuffle",
    color: "#8b5cf6",
    description: "Remove duplicate entries from array",
  },

  // Merge & Combine
  {
    id: "mergeNode",
    label: "Merge",
    category: "merge",
    icon: "Merge",
    color: "#ef4444",
    description: "Combine multiple data branches",
  },
  {
    id: "joinNode",
    label: "Join",
    category: "merge",
    icon: "Link",
    color: "#ef4444",
    description: "Match and join data based on key field",
  },
  {
    id: "aggregateNode",
    label: "Aggregate",
    category: "merge",
    icon: "Archive",
    color: "#ef4444",
    description: "Collect and reduce values from multiple sources",
  },
  {
    id: "stickyNote",
    label: "Sticky Note",
    category: "note",
    icon: "StickyNote",
    color: "#fbbf24",
    description: "Add documentation and comments",
  },
  {
    id: "serialInNode",
    label: "Serial In",
    category: "data",
    icon: "Activity", // pick any from lucide-react (like Usb, Plug, Radio, etc.)
    color: "#3b82f6",
    description: "Read data from Arduino or other serial devices",
  }
];

export const nodeFormFields: Record<string, NodeFormField[]> = {
  agentNode: [
    {
      name: "agentName",
      label: "Agent Name",
      type: "text",
      required: true,
      placeholder: "Agent",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Describe the purpose of this agent",
    },
  ],
  imageClassifierNode: [
    {
      name: "imageData",
      label: "Upload Image",
      type: "imageUpload",
      required: true,
    },
  ],
  csvToJsonNode: [
    {
      name: "csvText",
      label: "Upload CSV File",
      type: "fileUpload",
      required: true,
      validation: (value) => {
        if (!value) return "CSV file is required";
        if (
          typeof value !== "string" ||
          !value.includes(",") ||
          !value.includes("\n")
        ) {
          return "Invalid CSV file content";
        }
        return null;
      },
    },
  ],
  linearRegressionNode: [
    {
      name: "dependentFeature",
      label: "Dependent Feature (Y)",
      type: "select",
      required: true,
      options: [],
    },
    {
      name: "independentFeatures",
      label: "Independent Features (X)",
      type: "featureSelector",
      required: true,
    },
    {
      name: "jsonData",
      label: "Upload JSON Data",
      type: "fileUpload",
      required: false,
      validation: (value) => {
        if (!value) return "JSON file is required";
        try {
          JSON.parse(value);
          return null;
        } catch {
          return "Invalid JSON file content";
        }
      },
    },
  ],
  logisticRegressionNode: [
    {
      name: "dependentFeature",
      label: "Dependent Feature (Binary Target)",
      type: "select",
      required: true,
      options: [], 
    },
    {
      name: "independentFeatures",
      label: "Independent Features",
      type: "featureSelector",
      required: true,
    },
    {
      name: "jsonData",
      label: "Upload JSON Data",
      type: "fileUpload",
      required: false,
      validation: (value) => {
        if (!value) return "JSON file is required";
        try {
          JSON.parse(value);
          return null;
        } catch {
          return "Invalid JSON file content";
        }
      },
    },
  ],
  kMeansNode: [
    {
      name: "k",
      label: "Number of Clusters (k)",
      type: "number",
      required: true,
      placeholder: "3",
      validation: (value) => (value <= 0 ? "k must be greater than 0" : null),
    },
    {
      name: "selectedFeatures",
      label: "Select Features for Clustering",
      type: "featureSelector",
      required: true,
    },
    {
      name: "jsonData",
      label: "Upload JSON Data",
      type: "fileUpload",
      required: false,
      validation: (value) => {
        if (!value) return "JSON file is required";
        try {
          JSON.parse(value);
          return null;
        } catch {
          return "Invalid JSON file content";
        }
      },
    },
  ],
  llmNode: [
    {
      name: "provider",
      label: "Provider",
      type: "select",
      required: true,
      options: [{ value: "OpenRouter", label: "OpenRouter" }],
    },
    {
      name: "apiKey",
      label: "API Key",
      type: "confidential",
      required: true,
    },
    {
      name: "model",
      label: "Model",
      type: "select",
      required: true,
      options: [
        { value: "google/gemma-3-27b-it:free", label: "Gemma 3 27b IT" },
        { value: "meta-llama/llama-3.3-8b-instruct:free", label: "Meta LLAMA" },
        { value: "deepseek/deepseek-r1-0528:free", label: "Deepseek R1 0528" },
        { value: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5" },
        { value: "sarvamai/sarvam-m:free", label: "Sarvam AI" },
      ],
    },
  ],
  webhookTrigger: [
    {
      name: "url",
      label: "Webhook URL",
      type: "url",
      required: true,
      placeholder: "https://example.com/webhook",
    },
    {
      name: "method",
      label: "HTTP Method",
      type: "select",
      options: [
        { value: "POST", label: "POST" },
        { value: "GET", label: "GET" },
        { value: "PUT", label: "PUT" },
        { value: "DELETE", label: "DELETE" },
      ],
    },
  ],
  httpTrigger: [
    {
      name: "url",
      label: "URL",
      type: "url",
      required: true,
      placeholder: "https://example.com",
    },
    {
      name: "label",
      label: "Node Label",
      type: "text",
      required: true,
      placeholder: "Enter node label",
    },
    {
      name: "method",
      label: "HTTP Method",
      type: "select",
      required: true,
      options: [
        { value: "GET", label: "GET" },
        { value: "POST", label: "POST" },
        { value: "PUT", label: "PUT" },
        { value: "DELETE", label: "DELETE" },
      ],
    },
    {
      name: "headers",
      label: "Headers",
      type: "textarea",
      placeholder:
        "Content-Type: application/json\nAuthorization: Bearer token",
    },
  ],
  commandTrigger: [
    {
      name: "command",
      label: "Shell Command",
      type: "text",
      required: true,
      placeholder: "ls -la",
    },
    {
      name: "workingDir",
      label: "Working Directory",
      type: "text",
      placeholder: "/home/user",
    },
  ],
  filterNode: [
    {
      name: "filters",
      label: "Filters",
      type: "filtersArray",
      required: true,
    },
  ],
  formTrigger: [
    {
      name: "formId",
      label: "Form ID",
      type: "text",
      required: true,
      placeholder: "contact-form",
    },
    {
      name: "fields",
      label: "Expected Fields",
      type: "textarea",
      placeholder: "name, email, message",
    },
  ],
  chatTrigger: [
    {
      name: "channel",
      label: "Chat Channel",
      type: "text",
      required: true,
      placeholder: "#general",
    },
    {
      name: "keywords",
      label: "Trigger Keywords",
      type: "text",
      placeholder: "help, support, urgent",
    },
  ],
  manualTrigger: [
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Describe when this workflow should be triggered manually",
    },
  ],
  ifNode: [
    {
      name: "condition",
      label: "Condition",
      type: "text",
      required: true,
      placeholder: 'data.status === "active"',
    },
  ],
  switchNode: [
    {
      name: "field",
      label: "Switch Field",
      type: "text",
      required: true,
      placeholder: "data.type",
    },
    {
      name: "cases",
      label: "Cases (one per line)",
      type: "textarea",
      placeholder: "urgent\nnormal\nlow",
    },
  ],
  loopNode: [
    {
      name: "arrayField",
      label: "Array Field",
      type: "text",
      required: true,
      placeholder: "data.items",
    },
    {
      name: "itemVariable",
      label: "Item Variable Name",
      type: "text",
      placeholder: "item",
    },
  ],
  waitNode: [
    {
      name: "duration",
      label: "Duration (seconds)",
      type: "number",
      required: true,
      placeholder: "5",
    },
  ],
  optionsNode: [
    {
      name: "title",
      label: "Options Title",
      type: "text",
      required: true,
      placeholder: "Choose an option",
    },
    {
      name: "options",
      label: "Options (one per line)",
      type: "textarea",
      required: true,
      placeholder: "Option 1\nOption 2\nOption 3",
    },
  ],
  editNode: [
    {
      name: "operations",
      label: "Operations (JSON)",
      type: "textarea",
      required: true,
      placeholder:
        '{\n  "add": {"newField": "value"},\n  "remove": ["oldField"]\n}',
    },
  ],
  formulaNode: [
    {
      name: "formula",
      label: "Formula Expression",
      type: "text",
      required: true,
      placeholder: "data.price * 1.2",
    },
    {
      name: "outputField",
      label: "Output Field Name",
      type: "text",
      required: true,
      placeholder: "totalPrice",
    },
  ],
  transformNode: [
    {
      name: "mapping",
      label: "Field Mapping (JSON)",
      type: "textarea",
      required: true,
      placeholder:
        '{\n  "firstName": "first_name",\n  "lastName": "last_name"\n}',
    },
  ],
  codeNode: [
    {
      name: "code",
      label: "JavaScript Code",
      type: "codeButton",
      required: true,
    },
  ],
  summarizeNode: [
    {
      name: "operation",
      label: "Operation",
      type: "select",
      required: true,
      options: [
        { value: "sum", label: "Sum" },
        { value: "avg", label: "Average" },
        { value: "count", label: "Count" },
        { value: "min", label: "Minimum" },
        { value: "max", label: "Maximum" },
      ],
    },
    {
      name: "field",
      label: "Field to Summarize",
      type: "text",
      required: true,
      placeholder: "data.amount",
    },
  ],
  mergeNode: [
    {
      name: "strategy",
      label: "Merge Strategy",
      type: "select",
      options: [
        { value: "combine", label: "Combine All" },
        { value: "overwrite", label: "Overwrite Duplicates" },
        { value: "append", label: "Append Arrays" },
      ],
    },
  ],
  joinNode: [
    {
      name: "keyField",
      label: "Join Key Field",
      type: "text",
      required: true,
      placeholder: "id",
    },
    {
      name: "joinType",
      label: "Join Type",
      type: "select",
      options: [
        { value: "inner", label: "Inner Join" },
        { value: "left", label: "Left Join" },
        { value: "right", label: "Right Join" },
      ],
    },
  ],
  aggregateNode: [
    {
      name: "groupBy",
      label: "Group By Field",
      type: "text",
      placeholder: "category",
    },
    {
      name: "operations",
      label: "Aggregation Operations",
      type: "textarea",
      placeholder: "sum: amount\ncount: *\navg: score",
    },
  ],
  stickyNote: [
    {
      name: "content",
      label: "Note Content",
      type: "textarea",
      required: true,
      placeholder: "Add your notes here...",
    },
    {
      name: "color",
      label: "Note Color",
      type: "select",
      options: [
        { value: "yellow", label: "Yellow" },
        { value: "blue", label: "Blue" },
        { value: "green", label: "Green" },
        { value: "pink", label: "Pink" },
        { value: "purple", label: "Purple" },
      ],
    },
  ],
  serialInNode: [
    {
      name: "baudRate",
      label: "Baud Rate",
      type: "number",
      required: true,
      placeholder: "9600",
    },
    {
      name: "delimiter",
      label: "Line Delimiter",
      type: "text",
      placeholder: "\\n",
    },
  ],
};

export const categoryColors = {
  trigger: "#10b981",
  data: "#3b82f6",
  control: "#f59e0b",
  transform: "#8b5cf6",
  merge: "#ef4444",
  note: "#fbbf24",
};

export const categoryLabels = {
  trigger: "🔹 Triggers",
  data: "🟢 Data Input/Output",
  control: "🔁 Control Nodes",
  transform: "🔧 Data Transformation",
  merge: "🔗 Merge & Combine",
  note: "📝 Sticky Notes",
};
