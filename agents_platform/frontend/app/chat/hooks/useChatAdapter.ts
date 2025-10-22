import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useStreamChat } from "./useStreamChat";
import type { Message } from "../types/chat.types";

export type ChatStatus = "ready" | "streaming" | "submitted";

interface UseChatAdapterParams {
  currentThreadId: string;
  agentId: string;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
}

// 适配器：对齐 @ai-sdk/react useChat 的核心能力，但保持当前后端协议不变
// - status: 仅在我们体系下区分 ready / streaming（submitted 可选）
// - sendMessage: 接收文本，复用现有 SSE handleStream
// - regenerate: 重发最近一条用户消息
// - stop: 暂不实现（SSE 不支持中断），提供空函数以兼容
export function useChatAdapter({
  currentThreadId,
  agentId,
  messages,
  setMessages,
  isStreaming,
  setIsStreaming,
}: UseChatAdapterParams) {
  const { handleStream } = useStreamChat({
    currentThreadId,
    agentId,
    setMessages,
    isStreaming,
    setIsStreaming,
  });

  const status: ChatStatus = isStreaming ? "streaming" : "ready";

  const sendMessage = async (text: string) => {
    if (!text || !text.trim()) return;
    // 直接复用现有的流式发送
    await handleStream(text);
  };

  const regenerate = async () => {
    // 找到最近一条用户消息
    const lastUser = [...messages].reverse().find((m) => m.type === "user");
    if (lastUser?.content) {
      await handleStream(lastUser.content);
    }
  };

  const stop = () => {
    // 目前后端 SSE 不支持主动取消；预留接口以兼容 useChat 的 stop 行为
    // 可选：将来可在后端支持中断或前端 reader.cancel() 的方式实现
  };

  return useMemo(
    () => ({ status, messages, setMessages, sendMessage, regenerate, stop }),
    [status, messages, setMessages]
  );
}

