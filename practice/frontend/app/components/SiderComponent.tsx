import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { apiBase } from '../config/clientConfig';
import { PlusOutlined, UpOutlined } from '@ant-design/icons';

import { useLayoutContext } from '../layout-context'


interface SiderComponentProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  sessions: Array<{ threadId: string; name: string; lastUpdated: number; pinned?: boolean }>;
  handleDeleteSession: (threadId: string) => void;
  handlePinSession: (threadId: string) => void;
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
  handlePinSession,
  handlerNewChat,
  items,
  onSelectSession
}) => {
  const { currentThreadId, agentId, setAgentId } = useLayoutContext()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [agentOptions, setAgentOptions] = useState<Array<{ id: string; name: string }>>([])
  const [query, setQuery] = useState('')
  const [guestOpen, setGuestOpen] = useState(false)
  const q = query.trim().toLowerCase()
  const filteredAgents = q ? agentOptions.filter(a => a.name.toLowerCase().includes(q)) : agentOptions
  const filteredPinned = q ? sessions.filter((s:any)=> s.pinned && (s.name||'').toLowerCase().includes(q)) : sessions.filter((s:any)=> s.pinned)
  const filteredUnpinned = q ? sessions.filter((s:any)=> !s.pinned && (s.name||'').toLowerCase().includes(q)) : sessions.filter((s:any)=> !s.pinned)


  // 分组规则：今天/昨天/过去7天/过去30天/更早（按 lastUpdated 划分）
  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - msDay;
  const startOf7 = startOfToday - 7 * msDay;
  const startOf30 = startOfToday - 30 * msDay;

  const groups = { today: [] as any[], yesterday: [] as any[], last7: [] as any[], last30: [] as any[], older: [] as any[] };
  [...filteredUnpinned].sort((a:any,b:any)=> (b.lastUpdated||0) - (a.lastUpdated||0)).forEach((s:any)=>{
    const t = s.lastUpdated || 0;
    if (t >= startOfToday) groups.today.push(s);
    else if (t >= startOfYesterday) groups.yesterday.push(s);
    else if (t >= startOf7) groups.last7.push(s);
    else if (t >= startOf30) groups.last30.push(s);
    else groups.older.push(s);
  });

  const sectionList = [
    { key: 'today', title: '今天', items: groups.today },
    { key: 'yesterday', title: '昨天', items: groups.yesterday },
    { key: 'last7', title: '过去7天', items: groups.last7 },
    { key: 'last30', title: '过去30天', items: groups.last30 },
    { key: 'older', title: '更早', items: groups.older },
  ];

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const resp = await fetch(`${apiBase}/chat/agents`)
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
      trigger={null}
      collapsed={collapsed}
      onCollapse={onCollapse}
      theme="light"
      width={260}
      collapsedWidth={0}
      style={{ background: '#fafafa', borderRight: collapsed ? 'none' : '1px solid #e5e7eb' }}
    >
      <div className="group relative flex h-screen flex-col">

      {!collapsed && (
        <div className="flex h-12 items-center justify-between px-3">
          <a href="/" className="flex flex-row items-center gap-3">
            <span className="cursor-pointer rounded-md px-2 text-lg font-semibold text-gray-900 hover:bg-gray-100">Chatbot</span>
          </a>
          <button
            onClick={handlerNewChat}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            title="New chat"
            aria-label="New chat"
          >
            <PlusOutlined className="text-base" />
          </button>
        </div>
      )}



      {/* 滚动容器：内部滚动，固定高度 */}
      <div className="rf-scroll rf-hover-scroll flex-1 overflow-y-auto min-h-0">
        {/* 搜索框：过滤 agents 和 对话 */}
        <div className="px-3 pb-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="搜索 agent 或对话"
              className="w-full h-8 rounded-md border border-gray-200 bg-white pl-8 pr-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-gray-300"
              aria-label="搜索"
            />
            <span className="pointer-events-none absolute left-2 top-1.5 text-gray-400" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
        </div>


        {/* Agents list */}
        <div className="px-3 py-2">
          <div className="text-xs text-gray-400 mb-1">Agents</div>
          <div className="flex flex-col gap-1">
            {filteredAgents.map((a) => (
              <button
                key={a.id}
                onClick={() => { setAgentId(a.id); handlerNewChat(); }}
                className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-gray-50 ${agentId===a.id ? 'bg-gray-100 font-medium' : ''}`}
              >
                <span className="text-base">🤖</span>
                <span className="truncate">{a.name}</span>
              </button>
            ))}
          </div>
        </div>
      {!collapsed && (
        <>
          {/* Pinned Section */}
          {filteredPinned.length > 0 && (
            <>
              <div className="px-3 py-2"><div className="text-xs text-gray-400">置顶</div></div>
              <div className="px-2">
                {filteredPinned.map((s) => (
                  <div
                    key={s.threadId}
                    onClick={() => { setOpenMenuId(null); onSelectSession(s.threadId); }}
                    className={`relative group flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-white hover:shadow-sm transition-shadow ${currentThreadId===s.threadId ? 'bg-white ring-1 ring-gray-200 shadow-sm' : ''}`}
                  >
                    <span className={`truncate ${currentThreadId===s.threadId ? 'text-gray-900 font-medium' : 'text-gray-800'}`}>{s.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === s.threadId ? null : s.threadId); }}

                      className={`${currentThreadId===s.threadId ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600`}
                      title="更多"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === s.threadId}
                    >
                      ⋯
                    </button>
                    {openMenuId === s.threadId && (
                      <div role="menu" className="absolute right-1 top-9 z-10 w-36 rounded-md bg-white p-1 shadow-lg ring-1 ring-gray-200">
                        <div
                          role="menuitem"
                          tabIndex={-1}
                          onClick={(e) => { e.stopPropagation(); handlePinSession(s.threadId); setOpenMenuId(null); }}
                          className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-gray-700"
                        >
                          <svg height="16" width="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                          <span>{s.pinned ? '取消置顶' : '置顶'}</span>
                        </div>
                        <div
                          role="menuitem"
                          tabIndex={-1}
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.threadId); setOpenMenuId(null); }}
                          className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors cursor-pointer hover:bg-red-50 focus:bg-red-50"
                          style={{ color: 'var(--color-destructive, #ef4444)' }}
                        >
                          <svg height="16" width="16" viewBox="0 0 16 16"><path clipRule="evenodd" fillRule="evenodd" d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z"/></svg>
                          <span>删除</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-3 py-2"><div className="h-px bg-gray-200" /></div>
            </>
          )}

          {/* 分组展示：今天/昨天/过去7天/过去30天/更早（只显示有数据的分组） */}
          {sectionList.filter(sec => sec.items.length > 0).map((sec) => (
            <div key={sec.key} className="px-3 pb-2">
              <div className="text-xs text-gray-400 py-2">{sec.title}</div>
              <div className="px-2 pb-3">
                {sec.items.map((s:any) => (
                  <div
                    key={s.threadId}
                    onClick={() => { setOpenMenuId(null); onSelectSession(s.threadId); }}
                    className={`relative group flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-white hover:shadow-sm transition-shadow ${currentThreadId===s.threadId ? 'bg-white ring-1 ring-gray-200 shadow-sm' : ''}`}
                  >
                    <span className={`truncate ${currentThreadId===s.threadId ? 'text-gray-900 font-medium' : 'text-gray-800'}`}>{s.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === s.threadId ? null : s.threadId); }}
                      className={`${currentThreadId===s.threadId ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600`}
                      title="更多"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === s.threadId}
                    >
                      ⋯
                    </button>

                    {openMenuId === s.threadId && (
                      <div role="menu" className="absolute right-1 top-9 z-10 w-36 rounded-md bg-white p-1 shadow-lg ring-1 ring-gray-200">
                        <div
                          role="menuitem"
                          tabIndex={-1}
                          onClick={(e) => { e.stopPropagation(); handlePinSession(s.threadId); setOpenMenuId(null); }}
                          className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-gray-700"
                        >
                          <svg height="16" width="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                          <span>{s.pinned ? '取消置顶' : '置顶'}</span>
                        </div>
                        <div
                          role="menuitem"
                          tabIndex={-1}
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.threadId); setOpenMenuId(null); }}
                          className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors cursor-pointer hover:bg-red-50 focus:bg-red-50"
                          style={{ color: 'var(--color-destructive, #ef4444)' }}
                        >
                          <svg height="16" width="16" viewBox="0 0 16 16"><path clipRule="evenodd" fillRule="evenodd" d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z"/></svg>
                          <span>删除</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="px-1 py-3 text-xs text-gray-400">You have reached the end of your chat history.</div>
        </>
      )}
      </div>

      {!collapsed && (
        <div className="mt-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex flex-col gap-2 p-2" data-sidebar="footer">
            <ul className="flex w-full min-w-0 flex-col gap-1" data-sidebar="menu">
              <li className="relative" data-sidebar="menu-item">
                <button
                  type="button"
                  data-sidebar="menu-button"
                  onClick={() => setGuestOpen((v)=>!v)}
                  className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm h-10 hover:bg-gray-100"
                >
                  <img alt="guest" width="24" height="24" className="rounded-full" src="https://avatar.vercel.sh/guest" />
                  <span className="truncate">Guest</span>
                  <span className="ml-auto text-gray-500" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6"></path>
                    </svg>
                  </span>
                </button>
                {guestOpen && (
                  <div className="absolute bottom-12 right-2 z-10 w-40 rounded-md border border-gray-200 bg-white p-1 shadow-md">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setGuestOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>
                      <span>Dark Mode</span>
                    </button>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}

      </div>

      <style jsx global>{`
        .rf-hover-scroll { scrollbar-width: none !important; -ms-overflow-style: none; }
        .rf-hover-scroll:hover { scrollbar-width: thin !important; }
        .rf-hover-scroll::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
        .rf-hover-scroll:hover::-webkit-scrollbar { width: 6px !important; height: 6px !important; }
        .rf-hover-scroll::-webkit-scrollbar-track { background: transparent; }
        .rf-hover-scroll:hover::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 8px; }
      `}</style>

    </Sider>
  );
};

export default SiderComponent;