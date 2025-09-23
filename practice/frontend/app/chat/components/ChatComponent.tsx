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
  const pendingNavigateThreadRef = useRef<string | null>(null);
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
    if (!currentThreadId || currentThreadId === "") {
      handleNewChat();
      return;
    }
    const storedMessages = localStorage.getItem(
      "chatMessages-" + currentThreadId
    );
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      // 关键修复：新建会话首条提问时，正在流式渲染（isStreaming=true），
      // 不要把刚插入的占位 AI 消息清空，否则后续 token 无处追加，导致首条回复空白。
      if (!isStreaming) {
        setMessages([]);
      }
    }
  }, [currentThreadId, isStreaming]);
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
      // 关键修复：先记录待导航的线程ID，等流式结束后再 push，避免打断
      pendingNavigateThreadRef.current = newId;
      setIsStreaming(true);
      await handleStream(text, newId);
      return;
    }

    setIsStreaming(true);
    await handleStream(text);
  };

	  const handleEditMessage = async (messageId: string, text: string) => {
	    // 改为“基于编辑内容再发一条新消息并触发大模型回复”，不修改原消息
	    await handleStream(text);
	  };


  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-col bg-white text-[15px]">
      {/* 主聊天区顶部工具栏（可扩展，元素自动垂直居中） */}
      <header className="sticky top-0 z-10 flex h-12 items-center gap-2 bg-white px-2">
        <button
          data-testid="sidebar-toggle-button"
          onClick={() => { try { window.dispatchEvent(new Event('toggle-sider')); } catch {} }}
          className="inline-flex h-8 px-2 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        {/* 预留更多按钮位 */}
      </header>

      {/* 聊天记录区域：内部滚动，固定高度 */}
      <div
        className="rf-scroll flex-1 overflow-y-auto"
        ref={containerRef}
        style={{
          overflowAnchor: 'none',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f9fafb'
        }}
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
              <MessageBubble key={msg.id} message={msg} isStreaming={isStreaming} onEdit={handleEditMessage} />
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
          <div className="mx-auto w-[838px] max-w-full px-0 py-3">
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

      <div className="sticky bottom-0 z-10 bg-white -mb-8">
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
