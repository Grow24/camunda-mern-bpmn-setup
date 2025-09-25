import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, saveFlow, getFlows, saveLog } from './database.js';
import { NodeRedEngine } from './node-red-engine.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Initialize database
await initDatabase();

// Initialize Node-RED engine
const nodeRedEngine = new NodeRedEngine();
await nodeRedEngine.init();

// WebSocket connections
const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'execute_flow') {
        // Execute flow and stream results
        const execution = await nodeRedEngine.executeFlow(data.flow);
        
        // Stream execution updates
        execution.on('node_start', (nodeId) => {
          broadcast({
            type: 'node_status',
            nodeId,
            status: 'running'
          });
        });
        
        execution.on('node_complete', (nodeId, output) => {
          broadcast({
            type: 'node_status',
            nodeId,
            status: 'complete',
            output
          });
        });
        
        execution.on('node_error', (nodeId, error) => {
          broadcast({
            type: 'node_status',
            nodeId,
            status: 'error',
            error: error.message
          });
        });
        
        execution.on('edge_active', (source, target) => {
          broadcast({
            type: 'edge_active',
            source,
            target
          });
        });
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

// REST API endpoints
app.get('/api/flows', async (req, res) => {
  try {
    const flows = await getFlows();
    res.json(flows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/flows', async (req, res) => {
  try {
    const { name, data } = req.body;
    const flowId = await saveFlow(name, data);
    res.json({ id: flowId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/node-types', (req, res) => {
  res.json({
    triggers: [
      { type: 'serial-input', label: 'Serial Input', category: 'triggers' },
      { type: 'mqtt-input', label: 'MQTT Input', category: 'triggers' },
      { type: 'gpio-input', label: 'GPIO Input', category: 'triggers' },
      { type: 'webhook', label: 'Webhook', category: 'triggers' },
      { type: 'manual-trigger', label: 'Manual Trigger', category: 'triggers' }
    ],
    logic: [
      { type: 'if-condition', label: 'If Condition', category: 'logic' },
      { type: 'switch', label: 'Switch', category: 'logic' },
      { type: 'loop', label: 'Loop', category: 'logic' },
      { type: 'delay', label: 'Delay', category: 'logic' },
      { type: 'wait', label: 'Wait', category: 'logic' }
    ],
    transforms: [
      { type: 'math', label: 'Math Operation', category: 'transforms' },
      { type: 'convert', label: 'Data Convert', category: 'transforms' },
      { type: 'filter', label: 'Filter', category: 'transforms' },
      { type: 'map', label: 'Map Values', category: 'transforms' }
    ],
    outputs: [
      { type: 'mqtt-output', label: 'MQTT Output', category: 'outputs' },
      { type: 'serial-output', label: 'Serial Output', category: 'outputs' },
      { type: 'gpio-output', label: 'GPIO Output', category: 'outputs' },
      { type: 'lcd-display', label: 'LCD Display', category: 'outputs' },
      { type: 'buzzer', label: 'Buzzer', category: 'outputs' }
    ],
    monitoring: [
      { type: 'chart', label: 'Chart', category: 'monitoring' },
      { type: 'debug', label: 'Debug', category: 'monitoring' },
      { type: 'gauge', label: 'Gauge', category: 'monitoring' },
      { type: 'log', label: 'Log', category: 'monitoring' }
    ]
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 IoT Workflow Builder server running on port ${PORT}`);
});