import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { clsx } from 'clsx';
import { NodeData } from '../../types';
import { useThemeStore } from '../../store/themeStore';
import { useChatStore, ChatMessage } from '../../store/chatStore';
import { useWorkflowStore } from '../../store/workflowStore';  // Import workflow store
import { nodeFormFields } from '../../data/nodeTypes'; 

interface AgentNodeProps extends NodeProps {
  data: NodeData & {
    openModal?: boolean;
    linkedLLMNodeId?: string;
  };
}

export interface AgentNodeHandle {
  execute: (input: string) => Promise<void>;
}

const categoryColors = {
  logic: {
    light: 'border-secondary-500 bg-secondary-50',
    dark: 'border-secondary-400 bg-secondary-900/20',
  },
};

export const AgentNode = forwardRef<AgentNodeHandle, AgentNodeProps>(({ data, selected, id }, ref) => {
  const { isDark } = useThemeStore();
  const [modalOpen, setModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get conversation state and actions from chat store
  const conversation = useChatStore(state => state.conversations[id]);
  const sendMessage = useChatStore(state => state.sendMessage);
  const setConversationMapping = useChatStore(state => state.setConversationMapping);

  // Get node input from workflow store
  const nodeInput = useWorkflowStore(state => state.getNodeInput(id));
  const updateNodeStatus = useWorkflowStore(state => state.updateNodeStatus);

  // Initialize conversation mapping when linked LLM node changes
  useEffect(() => {
    if (data.linkedLLMNodeId) {
      setConversationMapping(id, data.linkedLLMNodeId);
    }
  }, [data.linkedLLMNodeId, id, setConversationMapping]);

  // Open modal on drop if flagged
  useEffect(() => {
    if (data.openModal) {
      setModalOpen(true);
      data.openModal = false;
    }
  }, [data]);

  // Scroll chat to bottom on new messages or modal open
  useEffect(() => {
    if (modalOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages, modalOpen]);

  // Imperative handle to allow external calls to execute input and get response
  useImperativeHandle(ref, () => ({
    execute: async (inputText: string) => {
      if (!conversation) {
        throw new Error('Conversation not initialized');
      }
      await sendMessage(id, inputText);
    },
  }));

  // Local input state for chat input box
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || !conversation) return;
    await sendMessage(id, input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const IconComponent = Icons.Cpu;

  const categoryColorClass = isDark
    ? categoryColors.logic.dark
    : categoryColors.logic.light;

  // Get form fields for agentNode
  const formFields = nodeFormFields['agentNode'] || [];

  // Optionally, update execution status/output in workflow store when conversation status or messages change
  useEffect(() => {
    if (conversation) {
      updateNodeStatus(id, {
        status: conversation.status === 'idle' ? 'idle' : conversation.status,
        output: conversation.messages.map(msg => ({ sender: msg.sender, text: msg.text })),
        error: conversation.status === 'error' ? 'Error in conversation' : undefined,
      });
    }
  }, [conversation, id, updateNodeStatus]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = data as Record<string, any> || {};

  return (
    <>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        className={clsx(
          'relative rounded-lg border-2 shadow-lg transition-all duration-200',
          categoryColorClass,
          isDark ? 'bg-gray-800' : 'bg-white',
          selected && 'ring-2 ring-primary-400 ring-offset-2',
          'min-w-[200px] max-w-[300px]'
        )}
        style={{ minHeight: 140 }}
      >
        {/* Status indicator */}
        <div
          aria-label={`Status: ${conversation?.status || 'idle'}`}
          className={clsx(
            'absolute top-2 right-2 rounded-full border-2 border-white shadow',
            {
              'bg-green-500': conversation?.status === 'success',
              'bg-yellow-400 animate-pulse': conversation?.status === 'running',
              'bg-red-500': conversation?.status === 'error',
              'bg-gray-400': !conversation?.status || conversation?.status === 'idle',
            }
          )}
          style={{ width: 14, height: 14, zIndex: 10 }}
        />

        {/* Header */}
        <div
          className={clsx(
            'flex items-center gap-3 p-4 border-b',
            isDark ? 'border-gray-700' : 'border-gray-200'
          )}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white"
            style={{ backgroundColor: '#8B5CF6' }}
          >
            <IconComponent size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={clsx(
                'font-semibold truncate',
                isDark ? 'text-gray-100' : 'text-gray-900'
              )}
            >
              {data.label || 'Agent Node'}
            </h3>
            {data.description && (
              <p
                className={clsx(
                  'text-sm truncate',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                {data.description}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {data.error && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
              {data.error}
            </div>
          )}

          {/* Display input data from previous node */}
          {nodeInput !== undefined && (
            <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono overflow-x-auto max-h-20">
              <strong>Input:</strong> {JSON.stringify(nodeInput).substring(0, 100)}{JSON.stringify(nodeInput).length > 100 ? '...' : ''}
            </div>
          )}

          {formFields.length > 0 && (
            <div className="space-y-2">
              {formFields.map(field => {
                const value = config[field.name];
                if (value === undefined || value === null || value === '') return null;
                return (
                  <div key={field.name} className="flex items-center gap-2 text-sm">
                    <span
                      className={clsx(
                        'font-medium capitalize',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}
                    >
                      {field.label}:
                    </span>
                    <span
                      className={clsx(
                        'truncate',
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      )}
                    >
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Handles */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            top: 60,
            left: -10,
            backgroundColor: '#8B5CF6',
            border: `2px solid ${isDark ? '#1f2937' : 'white'}`,
            width: 15,
            height: 15,
          }}
          className="!bg-purple-400"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{
            top: 60,
            right: -10,
            backgroundColor: '#8B5CF6',
            border: `2px solid ${isDark ? '#1f2937' : 'white'}`,
            width: 15,
            height: 15,
          }}
          className="!bg-purple-400"
        />
      </motion.div>

      {/* Chat Modal */}
      {/* {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-96 max-w-full flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Chat with Agent
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                title="Close"
              >
                <Icons.X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-2 px-2">
              {conversation?.messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={clsx(
                    'p-2 rounded max-w-[80%]',
                    msg.sender === 'user'
                      ? 'bg-purple-100 text-purple-900 self-end'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 self-start'
                  )}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
              {conversation?.status === 'running' && (
                <div className="italic text-gray-500 dark:text-gray-400 px-2">
                  Agent is thinking...
                </div>
              )}
            </div>
            <textarea
              className="w-full p-2 border rounded resize-none dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={conversation?.status === 'running'}
            />
            <button
              onClick={handleSend}
              disabled={conversation?.status === 'running' || !input.trim()}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )} */}
    </>
  );
});