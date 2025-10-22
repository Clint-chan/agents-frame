import React, { useEffect, useRef, useState } from "react";
import { Button, Input, Spin } from "antd";
import { UpOutlined, PaperClipOutlined } from "@ant-design/icons";


interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isStreaming: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ input, setInput, handleSend, isStreaming }) => {
  const [panelHeight, setPanelHeight] = useState(120);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHRef = useRef(120);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const dy = e.clientY - startYRef.current;
      // 向上拖动（dy < 0）应当变高；向下拖动（dy > 0）应当变矮
      const next = startHRef.current - dy;
      setPanelHeight(Math.min(300, Math.max(80, next)));
    };
    const onUp = () => { draggingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="bg-white">
      <div className="mx-auto w-[838px] max-w-full">
        {/* 输入面板：文本区(最小80，向上扩展到300，内部滚动) + 底部工具栏(32px) */}
        <div className="rf-input-panel relative rounded-3xl bg-white ring-1 ring-gray-200 focus-within:ring-gray-400 shadow-md transition-all duration-200" style={{ width: 838 }}>
          {/* 文本输入区（顶部拖拽句柄可自定义高度） */}
          <div className="relative px-3 py-2" style={{ height: panelHeight }}>
            {/* 扩展拖拽热区：向上扩展 6px，易于命中 */}
            <div
              className="absolute left-0 -top-[6px] h-2 w-full cursor-ns-resize"
              onMouseDown={(e)=>{ draggingRef.current = true; startYRef.current = e.clientY; startHRef.current = panelHeight; }}
            />
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isStreaming}
              autoSize={false}
              style={{
                height: '100%',
                overflowY: 'auto',
                lineHeight: '20px',
                paddingRight: 12,
                resize: 'none'
              }}
              className="rf-scroll w-full resize-none border-0 bg-transparent p-2 pr-3 text-sm leading-5 outline-none ring-0"
            />

          </div>

          {/* 底部工具栏：固定32px，左侧操作 + 右侧发送（水平对齐） */}
          <div className="flex h-[32px] items-center justify-between px-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <button type="button" className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-50" aria-label="Attachment">
                <PaperClipOutlined style={{ fontSize: 16 }} />
              </button>
              <button type="button" className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-50" aria-label="Model selector">
                {/* Brain/Chip icon (16x16) */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="7" y="7" width="10" height="10" rx="2"/>
                  <path d="M11 7V4M13 7V4M11 17v3M13 17v3M7 11H4M7 13H4M17 11h3M17 13h3M10 10h4M10 14h4"/>
                </svg>
                <span className="hidden sm:block text-xs font-medium text-gray-700">Grok Reasoning</span>
                {/* Small chevron-down (16x16) */}
                <svg height="16" width="16" viewBox="0 0 16 16" aria-hidden style={{ color: 'currentColor' }}>
                  <path clipRule="evenodd" fillRule="evenodd" d="M12.0607 6.74999L11.5303 7.28032L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L5.53032 6.21966L7.99999 8.68933L10.4697 6.21966L11 5.68933L12.0607 6.74999Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <Button
              type="default"
              shape="circle"
              className="inline-flex size-8 items-center justify-center rounded-full bg-black text-white transition-colors duration-200 hover:bg-black/90 disabled:bg-gray-200 disabled:text-gray-400 mb-3"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              aria-label="Send"
            >
              {isStreaming ? <Spin size="small" /> : (
                <svg width="22.5" height="22.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </Button>
          </div>
        </div>
      {/* 全局滚动条样式与输入区聚焦样式 */}
      <style jsx global>{`
        /* Scrollbars: thin, light gray, rounded */
        .rf-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .rf-scroll::-webkit-scrollbar-track { background: transparent; }
        .rf-scroll::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 8px; }
        .rf-scroll::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }
        /* Firefox */
        .rf-scroll { scrollbar-width: thin; scrollbar-color: #e4e4e7 transparent; }
        /* Remove focus outlines/borders in input panel */
        .rf-input-panel textarea,
        .rf-input-panel .ant-input { outline: none !important; box-shadow: none !important; }
        .rf-input-panel textarea:focus,
        .rf-input-panel .ant-input:focus { outline: none !important; box-shadow: none !important; border-color: transparent !important; }
      `}</style>
      </div>
    </div>
  );
};

export default MessageInput;