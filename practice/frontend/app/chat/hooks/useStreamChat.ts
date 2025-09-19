import { message } from "antd";
import { Message } from "../types/chat.types";

interface UseStreamChatProps {
  currentThreadId: string;
  agentId: string;
  setMessages: (messages: Message[]) => void;
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;
}


export const useStreamChat = ({
  currentThreadId,
  agentId,
  setMessages,
  isStreaming,
  setIsStreaming,
}: UseStreamChatProps) => {
  const handleStream = async (input: string) => {
    if (!input.trim() || isStreaming) return;
    setIsStreaming(true);

    const newUserMessage: Message = {
      id: `user_${Date.now()}`,
      type: "user",
      content: input,
    };
    const newAiMessage: Message = {
      id: `ai_${Date.now()}`,
      type: "ai",
      content: "",
    };
    setMessages((prev: Message[]) => [...prev, newUserMessage, newAiMessage]);

    try {
      const requestMsg = {
        message: input,
        thread_id: currentThreadId,
        agent_id: agentId,
        stream_tokens: true,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestMsg),
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const dataChunk = decoder.decode(value, { stream: true });

        dataChunk.split("\n").forEach((line) => {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              switch (data.type) {
                case "status":
                  // 处理状态信息（可选显示）
                  break;
                case "chunks":
                  // 处理知识片段信息
                  break;
                case "token":
                  handleTokenData(data.content);
                  break;
                case "message":
                  handleMessageData(data.content);
                  break;
                case "error":
                  console.error("Stream error:", data.content);
                  message.error(data.content);
                  setIsStreaming(false);
                  break;
                case "end":
                  setIsStreaming(false);
                  reader.cancel();
                  break;
              }
            } catch (e) {
              console.error("Failed to parse stream data:", line);
            }
          }
        });
      }
    } catch (error) {
      console.error(" Request Failed:", error);
      message.error(" Request Failed, Please try again later.");
      setIsStreaming(false);
    }
  };

  const handleMessageData = (content: any) => {
    // 处理RAGFlow聊天助手的消息格式
    if (content.type === "ai" && content.content) {
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? {
                ...msg,
                content: content.content,
                chunks: content.chunks || [],
                agent_id: content.agent_id,
                run_id: content.run_id
              }
            : msg
        )
      );
    }
  };

  const handleTokenData = (token: string) => {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === prev.length - 1 ? { ...msg, content: msg.content + token } : msg
      )
    );
  };


  return { handleStream };
};
