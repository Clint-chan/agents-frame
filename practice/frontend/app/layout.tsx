"use client";

import React from "react";

import "@ant-design/v5-patch-for-react-19";

import { Layout, Menu, Button, Select } from "antd";
import { useState, useEffect, useRef } from "react";
import { BarsOutlined, PlusOutlined } from "@ant-design/icons";
import "./globals.css";
import 'katex/dist/katex.min.css';
import { v4 as uuidv4 } from "uuid";
import { LayoutContext } from "./layout-context";
import SessionListItem from './components/SessionListItem';
import AgentSelector from './components/AgentSelector';
import SiderComponent from './components/SiderComponent';
import { useRouter } from 'next/navigation';

const { Header, Content } = Layout;

  // Since ReactNode may not be imported correctly, use the more generic type 'any' instead
export default function RootLayout({ children }: { children: any }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("chatSessions") || "[]");
      setSessions(Array.isArray(saved) ? saved : []);
    } catch (e) {
      setSessions([]);
    }
    setMounted(true);

    const onToggle = () => setCollapsed((prev) => !prev);
    window.addEventListener('toggle-sider', onToggle as EventListener);
    return () => {
      window.removeEventListener('toggle-sider', onToggle as EventListener);
    };
  }, []);

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  const [agentId, setAgentId] = useState("knowledge-chat");


  //listen new-chat event
  useEffect(() => {
    const addSession = (event: CustomEvent) => {
      const { threadId, msg } = event.detail;
      handleAddSession(threadId, msg);
    };
    window.addEventListener("add-session", addSession);
    return () => {
      window.removeEventListener("add-session", addSession);
    };
  }, []);

  const handleAddSession = (newThreadId: string, startMsg: string) => {
    const id = newThreadId || uuidv4();
    const title = (startMsg || `greet ${new Date().toLocaleString()}`).substring(0, 30);
    const newSession = {
      threadId: id,
      name: title,
      lastUpdated: Date.now(),
    };
    setSessions((prev) => {
      const next = [...prev, newSession];
      localStorage.setItem("chatSessions", JSON.stringify(next));
      return next;
    });
    setCurrentThreadId(id);
    // 延后导航：由 ChatComponent 首条消息流式结束后再 push，避免打断首条渲染
    // router.push(`/chat/${id}`);
  };

  // delete session
  const handleDeleteSession = (delThreadId: string) => {
    const newSessions = sessions.filter((session) => session.threadId !== delThreadId);
    setSessions(newSessions);
    localStorage.setItem("chatSessions", JSON.stringify(newSessions));
    localStorage.removeItem("chatMessages-" + delThreadId);
    if (newSessions.length > 0) {
      const nextId = [...newSessions].reverse()[0]?.threadId || "";
      setCurrentThreadId(nextId);
      router.push(`/chat/${nextId}`);
    } else {
      setCurrentThreadId(null);
      router.push("/chat");
    }
  };

  // pin toggle: 置顶 / 取消置顶
  const handlePinSession = (pinThreadId: string) => {
    setSessions((prev) => {
      const next = prev.map((s) =>
        s.threadId === pinThreadId ? { ...s, pinned: !s.pinned, lastUpdated: Date.now() } : s
      );
      localStorage.setItem("chatSessions", JSON.stringify(next));
      return next;
    });
  };

  const handlerNewChat = () => {
    setCurrentThreadId(null);
    router.push("/chat");
  };

  const selectAgent = (value: string) => {
    console.log("selectAgent", value);
    setAgentId(value);
    handlerNewChat();
  };

  const [items, setItems] = useState([]);
  useEffect(() => {
    const reversedSessions = [...sessions].reverse();
    setItems(() => {
      return reversedSessions.map((session) => ({
        key: session.threadId,
        label: <SessionListItem session={session} onDelete={handleDeleteSession} />,
      }));
    });
  }, [sessions]);

  const visibleSessions = mounted ? sessions : [];

  return (
    <LayoutContext.Provider value={{ agentId, setAgentId, currentThreadId, setCurrentThreadId }}>
      <html>
        <body className="min-h-screen bg-white text-gray-900">
          <Layout style={{ minHeight: "100vh" }}>
            <SiderComponent
              collapsed={collapsed}
              onCollapse={setCollapsed}
              sessions={visibleSessions}
              handleDeleteSession={handleDeleteSession}
              handlePinSession={handlePinSession}
              handlerNewChat={handlerNewChat}
              items={items}
              onSelectSession={(key) => {
                setCurrentThreadId(key);
                router.push(`/chat/${key}`);
              }}
            />
            <Layout>
              <Header className="bg-transparent p-0" style={{ height: 0, lineHeight: 0, padding: 0, borderBottom: 'none' }} />
              <Content className="m-0 p-0 bg-white">
                  {children}
              </Content>
            </Layout>
          </Layout>
        </body>
      </html>
    </LayoutContext.Provider>

  );
}
