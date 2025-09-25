import { EventEmitter } from 'events';

export class NodeRedEngine extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
  }

  async init() {
    // Initialize Node-RED runtime
    console.log('🔧 Node-RED engine initialized');
    this.isInitialized = true;
  }

  async executeFlow(flow) {
    const execution = new FlowExecution(flow);
    
    // Simulate flow execution
    setTimeout(() => execution.start(), 100);
    
    return execution;
  }
}

class FlowExecution extends EventEmitter {
  constructor(flow) {
    super();
    this.flow = flow;
    this.nodeStates = new Map();
  }

  start() {
    const nodes = this.flow.nodes || [];
    const edges = this.flow.edges || [];
    
    // Find trigger nodes (nodes with no incoming edges)
    const triggerNodes = nodes.filter(node => 
      !edges.some(edge => edge.target === node.id)
    );

    // Start execution from trigger nodes
    triggerNodes.forEach(node => {
      this.executeNode(node);
    });
  }

  async executeNode(node) {
    this.emit('node_start', node.id);
    
    try {
      // Simulate node processing time
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Generate mock output based on node type
      const output = this.generateMockOutput(node);
      
      this.emit('node_complete', node.id, output);
      
      // Find and execute next nodes
      const edges = this.flow.edges || [];
      const nextEdges = edges.filter(edge => edge.source === node.id);
      
      for (const edge of nextEdges) {
        this.emit('edge_active', edge.source, edge.target);
        
        const nextNode = this.flow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          // Delay between nodes
          setTimeout(() => this.executeNode(nextNode), 200);
        }
      }
      
    } catch (error) {
      this.emit('node_error', node.id, error);
    }
  }

  generateMockOutput(node) {
    switch (node.type) {
      case 'serial-input':
        return { value: Math.floor(Math.random() * 1024), timestamp: Date.now() };
      case 'gpio-input':
        return { state: Math.random() > 0.5 ? 'HIGH' : 'LOW', pin: node.data?.pin || 2 };
      case 'mqtt-input':
        return { topic: node.data?.topic || 'sensor/data', payload: Math.random() * 100 };
      case 'math':
        return { result: Math.floor(Math.random() * 100) };
      case 'if-condition':
        return { condition: Math.random() > 0.5, branch: Math.random() > 0.5 ? 'true' : 'false' };
      default:
        return { processed: true, timestamp: Date.now() };
    }
  }
}