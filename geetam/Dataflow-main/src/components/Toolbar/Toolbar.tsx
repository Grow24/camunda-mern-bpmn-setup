import React, { useRef } from "react";
import {
  Save,
  FolderOpen,
  RefreshCw,
  Play,
  Pause,
  Sun,
  Moon,
  Trash2,
  Copy,
  Scissors,
} from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore";
import { useThemeStore } from "../../store/themeStore";

export const Toolbar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    nodes,
    edges,
    resetWorkflow,
    loadWorkflow,
    isExecuting,
    executionLogs,
    clearExecutionLogs,
    selectedNode,
    selectedEdges,
    deleteSelectedItems,
    duplicateNode,
    executeMockWorkflow,
    stopWorkflow,
  } = useWorkflowStore();

  const { isDark, toggleTheme } = useThemeStore();

  const handleSaveWorkflow = () => {
    const workflow = { nodes, edges };
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `workflow-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        if (workflow.nodes && workflow.edges) {
          loadWorkflow(workflow);
        } else {
          alert("Invalid workflow file format");
        }
      } catch (error) {
        console.log(error);
        alert("Error loading workflow file");
      }
    };
    reader.readAsText(file);

    event.target.value = "";
  };

  const handleExecuteOrStop = async () => {
    if (isExecuting) {
      stopWorkflow();
    } else {
      await executeMockWorkflow();
    }
  };

  const handleDuplicateSelected = () => {
    if (selectedNode) {
      duplicateNode(selectedNode);
    }
  };

  const hasSelection = selectedNode || selectedEdges.length > 0;

  const toolbarButtons = [
    {
      icon: Save,
      label: "Save Workflow",
      onClick: handleSaveWorkflow,
      disabled: nodes.length === 0,
    },
    {
      icon: FolderOpen,
      label: "Load Workflow",
      onClick: () => fileInputRef.current?.click(),
      disabled: false,
    },
    {
      icon: RefreshCw,
      label: "Reset Workflow",
      onClick: resetWorkflow,
      disabled: nodes.length === 0,
    },
    {
      icon: isExecuting ? Pause : Play,
      label: isExecuting ? "Stop Execution" : "Execute Workflow",
      onClick: handleExecuteOrStop,
      disabled:
        nodes.length === 0 ||
        !nodes.some(
          (node) =>
            node.data.category === "trigger" || node.type.includes("trigger")
        ),
      primary: true,
    },
  ];

  const editButtons = [
    {
      icon: Copy,
      label: "Duplicate",
      onClick: handleDuplicateSelected,
      disabled: !selectedNode,
    },
    {
      icon: Scissors,
      label: "Delete Selected",
      onClick: deleteSelectedItems,
      disabled: !hasSelection,
    },
    {
      icon: Trash2,
      label: "Clear Logs",
      onClick: clearExecutionLogs,
      disabled: executionLogs.length === 0,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              disabled={button.disabled}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                transition-colors duration-150
                ${
                  button.primary
                    ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300 dark:disabled:bg-blue-800"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                }
                disabled:cursor-not-allowed disabled:opacity-50
              `}
              title={button.label}
            >
              <button.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{button.label}</span>
            </button>
          ))}

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          {editButtons.map((button, index) => (
            <button
              key={`edit-${index}`}
              onClick={button.onClick}
              disabled={button.disabled}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                transition-colors duration-150
                bg-gray-100 hover:bg-gray-200 text-gray-700 
                dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300
                disabled:cursor-not-allowed disabled:opacity-50
              `}
              title={button.label}
            >
              <button.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{button.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {hasSelection && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedNode && `Node selected`}
              {selectedEdges.length > 0 &&
                `${selectedEdges.length} edge${
                  selectedEdges.length !== 1 ? "s" : ""
                } selected`}
            </div>
          )}

          {isExecuting && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Executing workflow...
            </div>
          )}

          {executionLogs.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {executionLogs.length} log{executionLogs.length !== 1 ? "s" : ""}
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-150"
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleLoadWorkflow}
        className="hidden"
      />
    </div>
  );
};