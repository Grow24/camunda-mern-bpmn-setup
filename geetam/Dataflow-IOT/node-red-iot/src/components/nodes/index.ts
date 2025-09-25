import { SerialInputNode } from './SerialInputNode';
import { MqttInputNode } from './MqttInputNode';
import { GpioInputNode } from './GpioInputNode';
import { IfConditionNode } from './IfConditionNode';
import { MathNode } from './MathNode';
import { DebugNode } from './DebugNode';

export const nodeTypes = {
  'serial-input': SerialInputNode,
  'mqtt-input': MqttInputNode,
  'gpio-input': GpioInputNode,
  'if-condition': IfConditionNode,
  'math': MathNode,
  'debug': DebugNode,
  // Add more node types as needed
  'webhook': SerialInputNode, // Placeholder
  'manual-trigger': SerialInputNode, // Placeholder
  'switch': IfConditionNode, // Placeholder
  'loop': IfConditionNode, // Placeholder
  'delay': IfConditionNode, // Placeholder
  'convert': MathNode, // Placeholder
  'filter': MathNode, // Placeholder
  'map': MathNode, // Placeholder
  'mqtt-output': SerialInputNode, // Placeholder
  'serial-output': SerialInputNode, // Placeholder
  'gpio-output': GpioInputNode, // Placeholder
  'lcd-display': SerialInputNode, // Placeholder
  'chart': DebugNode, // Placeholder
  'gauge': DebugNode, // Placeholder
  'log': DebugNode, // Placeholder
};