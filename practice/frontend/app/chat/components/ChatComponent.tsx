"use client";

import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageInput from "../components/MessageInput";
import { useLayoutContext } from '../../layout-context';
import { Message, ChatComponentProps } from '../types/chat.types';
import { useStreamChat } from '../hooks/useStreamChat';
import MessageBubble from '../components/MessageBubble';
import useChatActions from '../hooks/useChatActions';
import { DownOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const ChatComponent: React.FC<ChatComponentProps> = ({
  threadId,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [animating, setAnimating] = useState(false);
  const { agentId, setAgentId, currentThreadId, setCurrentThreadId } = useLayoutContext()
  const router = useRouter();

  useEffect(() => {
    if (threadId) {
      setCurrentThreadId(threadId);
    }
  }, [threadId]);

  console.log("chat agentId", agentId)
  console.log("chat threadId", currentThreadId)

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => scrollToBottom('auto'), [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 24; // px
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      setIsAtBottom(atBottom);
    };
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if(messages.length > 0){
      localStorage.setItem(
        "chatMessages-" + currentThreadId,
        JSON.stringify(messages)
      );
    }
  }, [messages]);


  const { handleNewChat } = useChatActions({ setMessages, setInput, isStreaming, setIsStreaming });

  useEffect(() => {
    console.log("currentThreadId", currentThreadId);
    if(!currentThreadId || currentThreadId === "") {
      handleNewChat();
      return;
    }
    const storedMessages = localStorage.getItem(
      "chatMessages-" + currentThreadId
    );
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([]);
    }
  }, [currentThreadId]);
  // 切换会话时触发淡入上移动画
  useEffect(() => {
    if (!currentThreadId) return;
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), 450);
    return () => clearTimeout(t);
  }, [currentThreadId]);


  const { handleStream } = useStreamChat({ currentThreadId, agentId, setMessages, isStreaming, setIsStreaming });

  //
  useEffect(() => {
    if (!currentThreadId) return;
    const key = `pendingMessage-${currentThreadId}`;
    const pending = typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
    if (pending) {
      setIsStreaming(true);
      handleStream(pending);
      try { sessionStorage.removeItem(key); } catch {}
    }
  }, [currentThreadId, handleStream]);

  const handleSend = async () => {
    const text = input;
    setInput("");

    if (!currentThreadId) {
      const newId = uuidv4();
      setCurrentThreadId(newId);
      window.dispatchEvent(new CustomEvent("add-session", { detail: { threadId: newId, msg: text } }));
      setIsStreaming(true);
      await handleStream(text, newId);
      // 流式完成后再更新URL，避免刷新打断首条渲染
      router.push(`/chat/${newId}`);
      return;
    }

    setIsStreaming(true);
    await handleStream(text);
  };

  return (
    <div className="overscroll-behavior-contain relative flex h-[calc(100vh-64px)] flex-col bg-white text-[15px]">
      {/* 消息容器：对齐 Chat SDK 结构 */}
      <div
        className="-webkit-overflow-scrolling-touch flex-1 touch-pan-y overflow-y-auto"
        ref={containerRef}
        style={{ overflowAnchor: 'none' }}
      >
        <div className={`chat-content-container ${animating ? 'is-loading-new-chat' : ''} mx-auto flex min-w-0 max-w-4xl flex-col gap-3 md:gap-4`}>
          <div className="flex flex-col gap-3 px-3 py-2 md:gap-4 md:px-4 md:py-3">
            {messages.length === 0 && (
              <>
                {/* Greeting 区域（轻量版，无 framer-motion 依赖） */}
                <div className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-10 md:px-8">
                  <div className="font-semibold text-xl md:text-2xl fade-in-up">Hello there!</div>
                  <div className="text-xl text-zinc-500 md:text-2xl fade-in-up delay-1">How can I help you today?</div>
                </div>

              </>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isStreaming={isStreaming} />
            ))}
            <div className="min-h-2 min-w-2 shrink-0" ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 回到底部 */}
      {!isAtBottom && (
        <button
          aria-label="Scroll to bottom"
          className="-translate-x-1/2 absolute bottom-24 left-1/2 z-10 rounded-full border border-gray-200 bg-white/90 p-2 shadow-md transition-colors hover:bg-white"
          onClick={() => scrollToBottom('smooth')}
          type="button"
        >
          <DownOutlined />
        </button>
      )}

      {/* 吸底输入区 */}
      {messages.length === 0 && (
        <div className="bg-white">
          <div className="mx-auto max-w-4xl px-3 py-3 md:px-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                'Summarize this document',
                'Find related topics about RAGFlow',
                'Explain this concept in simple terms',
                'How to use RAGFlow API?'
              ].map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 z-10 bg-white">
        <MessageInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};

export default ChatComponent;
