/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWorkflowStore } from '../store/workflowStore';
import { WorkflowNode, WorkflowEdge } from '../types';

class ExecutionEngine {
  private store = useWorkflowStore;

  async executeWorkflow() {
    const { nodes, edges, setIsExecuting, setExecutionStatus, addExecutionLog, clearExecutionLogs } = this.store.getState();
    
    // Clear previous logs and status
    clearExecutionLogs();
    setExecutionStatus({});
    setIsExecuting(true);

    try {
      // Find trigger nodes (starting points)
      const triggerNodes = nodes.filter(node => 
        node.data.category === 'trigger' || node.type.includes('trigger')
      );

      if (triggerNodes.length === 0) {
        addExecutionLog({
          nodeId: 'system',
          message: 'No trigger nodes found. Add a trigger node to start execution.',
          type: 'error'
        });
        return;
      }

      // Execute from each trigger node
      for (const triggerNode of triggerNodes) {
        await this.executeFromNode(triggerNode, nodes, edges);
      }

      addExecutionLog({
        nodeId: 'system',
        message: 'Workflow execution completed successfully',
        type: 'success'
      });

    } catch (error) {
      addExecutionLog({
        nodeId: 'system',
        message: `Workflow execution failed: ${error}`,
        type: 'error'
      });
    } finally {
      setIsExecuting(false);
    }
  }

  private async executeFromNode(
    startNode: WorkflowNode, 
    allNodes: WorkflowNode[], 
    allEdges: WorkflowEdge[]
  ) {
    const { updateNodeStatus, addExecutionLog } = this.store.getState();
    const visited = new Set<string>();
    const executionQueue = [startNode];

    while (executionQueue.length > 0) {
      const currentNode = executionQueue.shift()!;
      
      if (visited.has(currentNode.id)) continue;
      visited.add(currentNode.id);

      // Set node as running
      updateNodeStatus(currentNode.id, { 
        nodeId: currentNode.id, 
        status: 'running' 
      });

      addExecutionLog({
        nodeId: currentNode.id,
        message: `Executing ${currentNode.data.label}`,
        type: 'info'
      });

      try {
        // Simulate execution based on node type
        const result = await this.simulateNodeExecution(currentNode);
        
        // Update node status with success
        updateNodeStatus(currentNode.id, {
          nodeId: currentNode.id,
          status: 'success',
          output: result
        });

        addExecutionLog({
          nodeId: currentNode.id,
          message: `Completed successfully: ${JSON.stringify(result).substring(0, 100)}`,
          type: 'success'
        });

        // Find and queue next nodes
        const nextNodes = this.findNextNodes(currentNode.id, allNodes, allEdges);
        
        // Handle conditional routing (IF nodes, Switch nodes)
        if (currentNode.type === 'ifNode') {
          const condition = currentNode.data.condition;
          const conditionResult = this.evaluateCondition(condition, result);
          
          // Filter next nodes based on condition result
          const filteredNextNodes = nextNodes.filter(({ edge }) => {
            if (edge.sourceHandle === 'true' && conditionResult) return true;
            if (edge.sourceHandle === 'false' && !conditionResult) return true;
            return !edge.sourceHandle; // Default path
          });
          
          filteredNextNodes.forEach(({ node }) => executionQueue.push(node));
        } else {
          // Regular sequential execution
          nextNodes.forEach(({ node }) => executionQueue.push(node));
        }

      } catch (error) {
        // Update node status with error
        updateNodeStatus(currentNode.id, {
          nodeId: currentNode.id,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });

        addExecutionLog({
          nodeId: currentNode.id,
          message: `Execution failed: ${error}`,
          type: 'error'
        });

        // Stop execution on error (could be made configurable)
        break;
      }

      // Add delay between executions for visual effect
      await this.delay(500 + Math.random() * 500);
    }
  }

  private findNextNodes(nodeId: string, allNodes: WorkflowNode[], allEdges: WorkflowEdge[]) {
    const outgoingEdges = allEdges.filter(edge => edge.source === nodeId);
    return outgoingEdges
      .map(edge => ({
        edge,
        node: allNodes.find(node => node.id === edge.target)
      }))
      .filter((item): item is { edge: WorkflowEdge; node: WorkflowNode } => 
        item.node !== undefined
      );
  }

  private async simulateNodeExecution(node: WorkflowNode): Promise<any> {
    const { type, data } = node;
    
    // Simulate different node types
    switch (type) {
      case 'webhookTrigger':
        return {
          method: data.method || 'POST',
          url: data.url,
          headers: { 'content-type': 'application/json' },
          body: { triggered: true, timestamp: new Date().toISOString() }
        };
        
      case 'httpTrigger':
        return {
          method: data.method || 'GET',
          status: 200,
          response: { success: true, data: 'Mock response data' }
        };
        
      case 'commandTrigger':
        return {
          command: data.command,
          exitCode: 0,
          stdout: `Mock output for: ${data.command}`,
          stderr: ''
        };
        
      case 'formTrigger':
        return {
          formId: data.formId,
          submission: {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Test form submission'
          },
          timestamp: new Date().toISOString()
        };
        
      case 'chatTrigger':
        return {
          channel: data.channel,
          message: 'Hello, this is a test message',
          user: 'testuser',
          timestamp: new Date().toISOString()
        };
        
      case 'manualTrigger':
        return {
          triggered: 'manual',
          timestamp: new Date().toISOString(),
          user: 'current_user'
        };
        
      case 'waitNode':
        const duration = parseInt(data.duration) || 1;
        await this.delay(duration * 1000);
        return { waited: duration, unit: 'seconds' };
        
      case 'editNode':
        try {
          const operations = JSON.parse(data.operations || '{}');
          return {
            operation: 'edit',
            applied: operations,
            result: 'Data successfully modified'
          };
        } catch {
          throw new Error('Invalid operations JSON');
        }
        
      case 'formulaNode':
        return {
          formula: data.formula,
          input: 'mock_data',
          result: Math.random() * 100, // Mock calculation result
          outputField: data.outputField
        };
        
      case 'transformNode':
        try {
          const mapping = JSON.parse(data.mapping || '{}');
          return {
            operation: 'transform',
            mapping,
            result: 'Data successfully transformed'
          };
        } catch {
          throw new Error('Invalid mapping JSON');
        }
        
      case 'summarizeNode':
        return {
          operation: data.operation,
          field: data.field,
          result: Math.random() * 1000, // Mock summary result
          count: Math.floor(Math.random() * 100)
        };
        
      case 'mergeNode':
        return {
          operation: 'merge',
          strategy: data.strategy,
          inputs: 2,
          result: 'Data successfully merged'
        };
        
      case 'joinNode':
        return {
          operation: 'join',
          keyField: data.keyField,
          joinType: data.joinType,
          matched: Math.floor(Math.random() * 50),
          result: 'Data successfully joined'
        };
        
      case 'aggregateNode':
        return {
          operation: 'aggregate',
          groupBy: data.groupBy,
          result: {
            groups: Math.floor(Math.random() * 10),
            totalRecords: Math.floor(Math.random() * 1000)
          }
        };
        
      case 'dataOut':
        return {
          operation: 'output',
          message: 'Workflow completed successfully',
          timestamp: new Date().toISOString()
        };
      
      case 'serialNode':
        try {
          // For now, mock the result (since you don’t have backend yet)
          return {
            port: data.port || 'COM3',
            baudRate: data.baudRate || 9600,
            command: data.command || '',
            result: `Mock response from Arduino on ${data.port || 'COM3'}`,
            timestamp: new Date().toISOString()
          };
        } catch (err) {
          throw new Error(`Serial execution failed: ${err}`);
        }

        
      default:
        return {
          nodeType: type,
          processed: true,
          timestamp: new Date().toISOString()
        };
    }
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple condition evaluation - in a real app, you'd want a proper expression parser
      // This is a simplified version for demo purposes
      // if (condition.includes('===')) {
      //   const [left, right] = condition.split('===').map(s => s.trim());
      //   return String(data).includes(right.replace(/['"]/g, ''));
      // }
      // if (condition.includes('>')) {
      //   const [left, right] = condition.split('>').map(s => s.trim());
      //   return parseFloat(String(data)) > parseFloat(right);
      // }
      // if (condition.includes('<')) {
      //   const [left, right] = condition.split('<').map(s => s.trim());
      //   return parseFloat(String(data)) < parseFloat(right);
      // }

      if (!condition) return true; // No condition means always true
      if( condition === 'true') return true; // Explicitly true condition
      if( condition === 'false') return false; // Explicitly false condition
      
      // Default to true for demo purposes
      return Math.random() > 0.5;
    } catch {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const executionEngine = new ExecutionEngine();

export const executeWorkflow = () => executionEngine.executeWorkflow();