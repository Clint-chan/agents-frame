import React from 'react';
import { Avatar, Collapse, Spin } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types/chat.types';
import { processCitations, extractCitationSources } from '../utils/citationUtils';
import CitationSources from './CitationSources';


interface MessageBubbleProps {
  message: Message;
  isStreaming: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  const { type, content, toolCall, chunks } = message;

  // 处理AI回答中的脚注引用
  const processedContent = type === 'ai' && chunks
    ? processCitations(content, chunks)
    : content;

  // 提取引用来源
  const citationSources = type === 'ai' && chunks
    ? extractCitationSources(content, chunks)
    : [];

  return (
    <div className={`mb-4 ${type === 'user' ? 'text-right flex justify-end' : 'text-left'}`}>
      <div className={`flex ${type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-2xl`}>
        <Avatar
          size={40}
          className={`${type === 'user' ? 'bg-blue-500' : 'bg-gray-500'} text-white`}
        >
          {type === 'user' ? <UserOutlined /> : <RobotOutlined />}
        </Avatar>
        <div className={`p-3 rounded-lg ${type === 'user' ? 'bg-blue-50' : 'bg-gray-50'} flex-1`}>
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
                  {processedContent.map((part, index) => (
                    <React.Fragment key={index}>{part}</React.Fragment>
                  ))}
                </div>
              ) : (
                <ReactMarkdown>{content}</ReactMarkdown>
              )}
              {/* 引用来源展示 */}
              <CitationSources sources={citationSources} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;