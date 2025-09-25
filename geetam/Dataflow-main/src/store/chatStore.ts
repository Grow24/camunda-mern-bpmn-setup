import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { useWorkflowStore } from "./workflowStore";

export type ChatSender = "user" | "agent" | "llm";

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  timestamp: number;
}

export interface Conversation {
  agentNodeId: string;
  llmNodeId: string;
  messages: ChatMessage[];
  status: "idle" | "running" | "error" | "success";
  error?: string;
}

interface ChatState {
  conversations: Record<string, Conversation>;

  sendMessage: (agentNodeId: string, message: string) => Promise<void>;

  stopStreaming: () => void;

  receiveResponse: (agentNodeId: string, response: string) => void;

  setConversationStatus: (
    agentNodeId: string,
    status: Conversation["status"],
    error?: string
  ) => void;

  setConversationMapping: (agentNodeId: string, llmNodeId: string) => void;

  clearConversation: (agentNodeId: string) => void;
}

let abortController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},

  setConversationMapping: (agentNodeId, llmNodeId) => {
    set((state) => {
      const existing = state.conversations[agentNodeId];
      return {
        conversations: {
          ...state.conversations,
          [agentNodeId]: {
            agentNodeId,
            llmNodeId,
            messages: existing?.messages || [],
            status: existing?.status || "idle",
            error: existing?.error,
          },
        },
      };
    });
  },

  sendMessage: async (agentNodeId, message) => {
    if (abortController) {
      abortController.abort(); // Abort any ongoing request before starting new
    }
    abortController = new AbortController();

    const { conversations, setConversationStatus } = get();
    const conversation = conversations[agentNodeId];
    if (!conversation) {
      throw new Error(
        `No conversation mapping found for AgentNode ${agentNodeId}`
      );
    }

    // Get linked LLM node data from workflow store
    const nodes = useWorkflowStore.getState().nodes;
    const llmNode = nodes.find((n) => n.id === conversation.llmNodeId);
    if (!llmNode) {
      throw new Error(`Linked LLM node ${conversation.llmNodeId} not found`);
    }

    const apiKey = llmNode.data.apiKey;
    const model = llmNode.data.model || "google/gemma-3-27b-it:free";

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      sender: "user",
      text: message,
      timestamp: Date.now(),
    };

    set((state) => ({
      conversations: {
        ...state.conversations,
        [agentNodeId]: {
          ...state.conversations[agentNodeId],
          messages: [...state.conversations[agentNodeId].messages, userMessage],
          status: "running",
          error: undefined,
        },
      },
    }));

    setConversationStatus(agentNodeId, "running");

    // Add an empty LLM message to append streaming text
    const llmMessageId = uuidv4();
    set((state) => {
      const conv = state.conversations[agentNodeId];
      if (!conv) return state;
      return {
        conversations: {
          ...state.conversations,
          [agentNodeId]: {
            ...conv,
            messages: [
              ...conv.messages,
              {
                id: llmMessageId,
                sender: "llm",
                text: "",
                timestamp: Date.now(),
              },
            ],
          },
        },
      };
    });

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: message }],
            stream: true,
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          // Split by newlines and process each line starting with "data: "
          const lines = chunkStr
            .split("\n")
            .filter((line) => line.trim().startsWith("data:"));
          for (const line of lines) {
            const jsonStr = line.replace(/^data:\s*/, "").trim();
            if (jsonStr === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                accumulatedText += delta.content;
                // Update the LLM message text incrementally
                set((state) => {
                  const conv = state.conversations[agentNodeId];
                  if (!conv) return state;
                  const updatedMessages = conv.messages.map((msg) =>
                    msg.id === llmMessageId
                      ? { ...msg, text: accumulatedText }
                      : msg
                  );
                  return {
                    conversations: {
                      ...state.conversations,
                      [agentNodeId]: {
                        ...conv,
                        messages: updatedMessages,
                      },
                    },
                  };
                });
              }
            } catch (e) {
              console.warn("Failed to parse chunk JSON", e);
            }
          }
        }
      }

      setConversationStatus(agentNodeId, "success");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.name === "AbortError") {
        // Streaming was aborted by user
        setConversationStatus(agentNodeId, "idle");
      } else {
        setConversationStatus(agentNodeId, "error", error.message);
        set((state) => {
          const conv = state.conversations[agentNodeId];
          if (!conv) return state;
          return {
            conversations: {
              ...state.conversations,
              [agentNodeId]: {
                ...conv,
                messages: [
                  ...conv.messages,
                  {
                    id: uuidv4(),
                    sender: "llm",
                    text: `Error: ${error.message}`,
                    timestamp: Date.now(),
                  },
                ],
              },
            },
          };
        });
      }
    } finally {
      abortController = null;
    }
  },

  stopStreaming: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  },

  receiveResponse: (agentNodeId, response) => {
    set((state) => {
      const conversation = state.conversations[agentNodeId];
      if (!conversation) return state;

      const llmMessage: ChatMessage = {
        id: uuidv4(),
        sender: "llm",
        text: response,
        timestamp: Date.now(),
      };

      return {
        conversations: {
          ...state.conversations,
          [agentNodeId]: {
            ...conversation,
            messages: [...conversation.messages, llmMessage],
          },
        },
      };
    });
  },

  setConversationStatus: (agentNodeId, status, error) => {
    set((state) => {
      const conversation = state.conversations[agentNodeId];
      if (!conversation) return state;

      return {
        conversations: {
          ...state.conversations,
          [agentNodeId]: {
            ...conversation,
            status,
            error,
          },
        },
      };
    });
  },

  clearConversation: (agentNodeId) => {
    set((state) => {
      const conversation = state.conversations[agentNodeId];
      if (!conversation) return state;

      return {
        conversations: {
          ...state.conversations,
          [agentNodeId]: {
            ...conversation,
            messages: [],
            status: "idle",
            error: undefined,
          },
        },
      };
    });
  },
}));
