import pg from 'pg';
const { Client } = pg;

// For demo purposes, we'll use a simple in-memory store
// In production, this would connect to PostgreSQL
let flows = [];
let logs = [];
let nextId = 1;

export async function initDatabase() {
  // Initialize database connection and tables
  console.log('📊 Database initialized (using in-memory store for demo)');
}

export async function saveFlow(name, data) {
  const flow = {
    id: nextId++,
    name,
    data,
    created_at: new Date(),
    updated_at: new Date()
  };
  flows.push(flow);
  return flow.id;
}

export async function getFlows() {
  return flows;
}

export async function saveLog(flowId, nodeId, level, message, data = null) {
  const log = {
    id: nextId++,
    flow_id: flowId,
    node_id: nodeId,
    level,
    message,
    data,
    timestamp: new Date()
  };
  logs.push(log);
  return log.id;
}

export async function getLogs(flowId = null) {
  if (flowId) {
    return logs.filter(log => log.flow_id === flowId);
  }
  return logs;
}