import { message } from "antd";
import { Message } from "../types/chat.types";
import type { Dispatch, SetStateAction } from "react";

interface UseStreamChatProps {
  currentThreadId: string;
  agentId: string;
  setMessages: Dispatch<SetStateAction<Message[]>>;
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
  const handleStream = async (input: string, threadIdOverride?: string) => {
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
        thread_id: threadIdOverride || currentThreadId,
        agent_id: agentId,
        stream_tokens: true,
      };

      const response = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestMsg),
      });

      // 优先处理流式返回，其次兜底处理非流（一次性JSON）
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const dataChunk = decoder.decode(value, { stream: true });

            dataChunk.split("\n").forEach((line) => {
              const trimmed = line.trim();
              if (!trimmed) return;
              // 兼容既有的 "data: {..}" 也兼容直接 JSON 行
              const payload = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
              try {
                const data = JSON.parse(payload);
                switch (data.type) {
                  case "status":
                    break;
                  case "chunks":
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
                    break;
                }
              } catch (e) {
                console.error("Failed to parse stream data:", trimmed);
              }
            });
          }
        } finally {
          setIsStreaming(false);
          try { await reader.cancel(); } catch {}
        }
      } else {
        // 非流式：一次性 JSON 响应
        const data = await response.json().catch(() => null);
        if (data) {
          if (data.type === 'message') {
            handleMessageData(data.content);
          } else if (typeof data.content === 'string') {
            // 直接文本
            setMessages((prev) => prev.map((m,i)=> i===prev.length-1 ? { ...m, content: data.content } : m));
          }
        }
        setIsStreaming(false);
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
                doc_aggs: content.doc_aggs || [],
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
