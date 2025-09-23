import React from "react";
import { Button, Input, Spin } from "antd";
import { UpOutlined, PaperClipOutlined, SettingOutlined, DownOutlined } from "@ant-design/icons";


interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isStreaming: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ input, setInput, handleSend, isStreaming }) => {
  return (
    <div className="bg-white pb-4">
      <div className="mx-auto w-[838px] max-w-full">
        {/* 固定 838×80 的输入面板：上文本区 + 下工具栏(32px) */}
        <div className="rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:border-gray-200 focus-within:border-gray-300 focus-within:shadow" style={{ width: 838, height: 80 }}>
          <div className="flex h-[48px] items-center gap-2 px-3">
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
              rows={2}
              autoSize={false}
              style={{ height: 48, lineHeight: '20px' }}
              className="flex-1 resize-none border-0 bg-transparent p-2 text-sm leading-5 outline-none ring-0"
            />
          </div>
          {/* 底部工具栏 838×32：左(附件/模型) 右(发送) */}
          <div className="flex h-[32px] items-center justify-between px-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700" aria-label="Attachment">
                <PaperClipOutlined />
              </button>
              <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-gray-50" aria-label="Model selector">
                <SettingOutlined className="text-gray-500" />
                <span className="text-gray-700">Grok Reasoning</span>
                <DownOutlined className="text-gray-500" />
              </button>
            </div>
            <Button
              type="default"
              shape="circle"
              className="inline-flex items-center justify-center size-8 rounded-full bg-[#006cff] text-white transition-colors duration-200 hover:bg-[#006cff]/90 disabled:bg-gray-200 disabled:text-gray-400"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              aria-label="Send"
            >
              {isStreaming ? <Spin size="small" /> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;