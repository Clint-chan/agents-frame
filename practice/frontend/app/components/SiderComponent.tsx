import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import NewChatButton from './NewChatButton';
import { useLayoutContext } from '../layout-context'


interface SiderComponentProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  sessions: Array<{ threadId: string; name: string; lastUpdated: number }>;
  handleDeleteSession: (threadId: string) => void;
  handlerNewChat: () => void;
  items: Array<{ key: string; label: React.ReactNode }>;
  onSelectSession: (key: string) => void;
}

const { Sider } = Layout;

const SiderComponent: React.FC<SiderComponentProps> = ({
  collapsed,
  onCollapse,
  sessions,
  handleDeleteSession,
  handlerNewChat,
  items,
  onSelectSession
}) => {
  const { currentThreadId, setCurrentThreadId, agentId, setAgentId } = useLayoutContext()
  const [agentOptions, setAgentOptions] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat/agents`)
        const data = await resp.json()
        const list = (data?.data?.agents || []).map((a: any) => ({ id: a.id || a.agent_id, name: a.name || a.title || a.id }))
        setAgentOptions(list)
      } catch (e) {
        // ignore
      }
    }
    loadAgents()
  }, [])


  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={200}
    >
      {!collapsed && (
        <div className="logo flex items-center justify-center h-16 text-white text-lg">
          AI-CHATKIT
        </div>
      )}
      <NewChatButton collapsed={collapsed} onClick={handlerNewChat} />
      {/* 顶部：Agent 选择区 + 分隔线 + 标题 */
      }
      {!collapsed && (
        <div className="px-3 py-2 text-[13px] text-gray-100">
          <div className="text-xs text-gray-100/90 mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/15 text-white">新对话</span>
          </div>
          <div className="space-y-1">
            {agentOptions.map((a) => (
              <div key={a.id}
                   className={`flex items-center justify-between px-2 py-2 rounded cursor-pointer hover:bg-white/15 ${agentId===a.id ? 'bg-white/20' : ''}`}
                   onClick={() => setAgentId(a.id)}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🤖</span>
                  <span className="truncate text-gray-50">{a.name}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 h-px bg-white/20" />
          <div className="mt-3 text-xs text-gray-100/90">最近对话</div>
        </div>
      )}

      {!collapsed && (
        <Menu
          theme="dark"
          className="max-h-[calc(100vh-180px)] overflow-y-auto"
          defaultSelectedKeys={[currentThreadId]}
          selectedKeys={[currentThreadId]}
          mode="inline"
          items={items}
          onSelect={({ key }) => {
            onSelectSession(key);
          }}
        />
      )}
    </Sider>
  );
};

export default SiderComponent;