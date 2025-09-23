"use client";

import React, { useState } from 'react';
import { message } from 'antd';

interface MessageActionsProps {
  content: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  onRetry,
  showRetry = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      message.success('内容已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      message.error('复制失败');
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className="mt-2 pt-2 border-t border-gray-100 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center justify-end gap-1.5">
        {/* 复制按钮 - 幽灵圆形按钮 */}
        <button
          onClick={handleCopy}
          className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          title={copied ? "已复制" : "复制内容"}
        >
        {copied ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" className="w-4 h-4">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.5 3h7.1c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748C21 6.04 21 7.16 21 9.4v7.1M6.2 21h8.1c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874c.218-.428.218-.988.218-2.108V9.7c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C15.98 6.5 15.42 6.5 14.3 6.5H6.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C3 8.02 3 8.58 3 9.7v8.1c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C4.52 21 5.08 21 6.2 21"></path>
          </svg>
        )}
      </button>

      </div>

      {/* 重试按钮 - 幽灵圆形按钮 */}
      {showRetry && (
        <button
          onClick={handleRetry}
          className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          title="重新生成"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" className="w-4 h-4">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.333" d="M11.477 4.778A5 5 0 0 0 6.997 2C5.033 2 3.373 3.131 2.555 4.778M2.555 2.556v2.222M4.438 4.778H2.555M2.555 9.222A5 5 0 0 0 7.035 12c1.963 0 3.624-1.132 4.442-2.778M11.477 11.444V9.222M9.594 9.222h1.883"></path>
          </svg>
        </button>
      )}
    </div>
  );
};

export default MessageActions;
