import React, { useMemo } from 'react';
import { Avatar, Collapse, Spin } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types/chat.types';
import { processCitations, extractCitationSources } from '../utils/citationUtils';
import CitationSources from './CitationSources';
import DocumentReferences from './DocumentReferences';
import MessageActions from './MessageActions';


interface MessageBubbleProps {
  message: Message;
  isStreaming: boolean;
  onRetry?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming, onRetry }) => {
  const { type, content, toolCall, chunks, doc_aggs } = message;

  // 处理AI回答中的脚注引用
  const processedContent = type === 'ai' && chunks
    ? processCitations(content, chunks)
    : content;

  // 将单换行转换为硬换行，避免渲染时丢失回车（无需引入remark-breaks）
  const contentWithBreaks = useMemo(() => {
    if (typeof processedContent !== 'string') return '';
    const text = processedContent.replace(/\r\n/g, '\n');
    // 仅将“单个换行”转换为硬换行（两个空格+换行），保留段落换行
    return text.replace(/([^\s])\n(?!\n)/g, '$1  \n');
  }, [processedContent]);


  // 提取引用来源
  const citationSources = type === 'ai' && chunks
    ? extractCitationSources(content, chunks)
    : [];

  return (
    <div className={`mb-4 ${type === 'user' ? 'text-right flex justify-end' : 'text-left'}`}>
      <div className={`flex ${type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-4xl`}>
        <Avatar
          size={40}
          className={`${type === 'user' ? 'bg-blue-500' : 'bg-gray-500'} text-white flex-shrink-0`}
        >
          {type === 'user' ? <UserOutlined /> : <RobotOutlined />}
        </Avatar>
        <div className={`p-4 rounded-lg ${type === 'user' ? 'bg-blue-50' : 'bg-white'} flex-1 shadow-sm border border-gray-200`}>
          {type === 'ai' && isStreaming && content === '' ? (
            toolCall ? <div><Spin size="small" /> invoking tool...</div> : <Spin size="small" />
          ) : (
            <>
              {toolCall?.calls && (
                <Collapse defaultActiveKey={['0']} className="mt-2">
                  {toolCall.calls.map((call: any, index: number) => (
                    <Collapse.Panel header={`Tool ${index + 1}: ${call.name}`} key={index}>
                      <p className="mb-2">input：{JSON.stringify(call.args)}</p>
                      {call.result && <p>result：{call.result}</p>}
                    </Collapse.Panel>
                  ))}
                </Collapse>
              )}
              {type === 'ai' && Array.isArray(processedContent) ? (
                <div className="prose prose-sm max-w-none">
                  {processedContent.map((part, index) => {
                    if (typeof part === 'string') {
                      const text = part.replace(/\r\n/g, '\n').replace(/([^\s])\n(?!\n)/g, '$1  \n');
                      return <ReactMarkdown key={index}>{text}</ReactMarkdown>;
                    }
                    return <React.Fragment key={index}>{part}</React.Fragment>;
                  })}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{contentWithBreaks}</ReactMarkdown>
                </div>
              )}
              {/* 引用来源展示 - 使用doc_aggs数据 */}
              {doc_aggs && doc_aggs.length > 0 ? (
                <DocumentReferences docAggs={doc_aggs} />
              ) : (
                <CitationSources sources={citationSources} />
              )}

              {/* 消息操作按钮（仅AI消息显示） */}
              {type === 'ai' && (
                <MessageActions
                  content={content}
                  onRetry={() => onRetry?.(message.id)}
                  showRetry={!isStreaming}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;