"use client";
// MessageBubble: Container for each chat message (user/ai).
// Delegates rich text rendering to ChatMarkdown; keeps actions (edit/copy/feedback) lightweight.


import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Collapse, Spin, message as antdMessage } from 'antd';
import { Message } from '../types/chat.types';
import ChatMarkdown from './ChatMarkdown';



interface MessageBubbleProps {
  message: Message;
  isStreaming: boolean;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string, text: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming, onRetry, onEdit }) => {
  const { type, content, toolCall, chunks, doc_aggs } = message;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const editRef = useRef<HTMLTextAreaElement | null>(null);
  const adjustEditHeight = () => {
    const el = editRef.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
  };
  useEffect(()=>{ if (editing) setTimeout(adjustEditHeight, 0); }, [editing]);



  // 将单换行转换为硬换行，保留 \n 行内换行；保留 \n\n 段落
  const contentWithBreaks = useMemo(() => {
    const text = (content || '').replace(/\r\n/g, '\n');
    return text.replace(/([^\n])\n(?!\n)/g, '$1  \n');
  }, [content]);




  return (
    <div className={type === 'user' ? 'mb-4 flex justify-end' : 'mb-4 flex'}>
      <div className={`flex ${type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-4xl`}>
        {type === 'ai' ? (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
            <svg height="14" width="14" viewBox="0 0 16 16" style={{ color: 'currentColor' }}>
              <path d="M2.5 0.5V0H3.5V0.5C3.5 1.60457 4.39543 2.5 5.5 2.5H6V3V3.5H5.5C4.39543 3.5 3.5 4.39543 3.5 5.5V6H3H2.5V5.5C2.5 4.39543 1.60457 3.5 0.5 3.5H0V3V2.5H0.5C1.60457 2.5 2.5 1.60457 2.5 0.5Z" fill="currentColor"></path>
              <path d="M14.5 4.5V5H13.5V4.5C13.5 3.94772 13.0523 3.5 12.5 3.5H12V3V2.5H12.5C13.0523 2.5 13.5 2.05228 13.5 1.5V1H14H14.5V1.5C14.5 2.05228 14.9477 2.5 15.5 2.5H16V3V3.5H15.5C14.9477 3.5 14.5 3.94772 14.5 4.5Z" fill="currentColor"></path>
              <path d="M8.40706 4.92939L8.5 4H9.5L9.59294 4.92939C9.82973 7.29734 11.7027 9.17027 14.0706 9.40706L15 9.5V10.5L14.0706 10.5929C11.7027 10.8297 9.82973 12.7027 9.59294 15.0706L9.5 16H8.5L8.40706 15.0706C8.17027 12.7027 6.29734 10.8297 3.92939 10.5929L3 10.5V9.5L3.92939 9.40706C6.29734 9.17027 8.17027 7.29734 8.40706 4.92939Z" fill="currentColor"></path>
            </svg>
          </div>
        ) : (
          <div className="w-8 shrink-0" />
        )}

        <div className={`flex max-w-[85%] flex-col ${type === 'user' ? 'items-end' : 'items-start'}`}>
          {!editing ? (
            <div className={`group ${type === 'user' ? 'w-fit rounded-2xl px-3 py-2 bg-[#006cff] text-white shadow-sm text-left' : 'rounded-lg px-0 py-0 bg-transparent text-gray-900'}`}>
              {type === 'ai' && isStreaming && content === '' ? (
                toolCall ? <div><Spin size="small" /> invoking tool...</div> : <Spin size="small" />
              ) : (
                <>
                  <div className="prose max-w-none prose-p:my-3 overflow-x-auto text-left">
                    <ChatMarkdown content={contentWithBreaks} chunks={chunks} />
                  </div>


                </>
              )}
            </div>
          ) : (
            <div className="mx-auto w-[838px] max-w-full rounded-xl border border-gray-300 bg-white p-3 focus-within:ring-2 focus-within:ring-gray-200 rf-expand">
              <textarea
                ref={editRef}
                className="w-full resize-none bg-transparent text-[15px] leading-6 text-gray-900 outline-none py-1.5"
                rows={1}
                style={{ minHeight: 40, maxHeight: 300, overflow: 'hidden' }}
                value={editText}
                onChange={(e) => { setEditText(e.target.value); adjustEditHeight(); }}
                onInput={adjustEditHeight}
                onFocus={adjustEditHeight}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50" onClick={() => { setEditing(false); setEditText(content); }}>Cancel</button>
                <button className="rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-black/90" onClick={() => { onEdit?.(message.id, editText); setEditing(false); antdMessage.success({ content: 'Sent', duration: 1.2 }); }}>Send</button>
              </div>
            </div>
          )}

          <div className={`mt-2 -mb-1 flex ${type === 'user' ? 'justify-end' : 'justify-start'} items-center gap-1`}>
            {type === 'user' && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-gray-500 transition active:scale-95 hover:bg-gray-100"
                title="编辑"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              </button>
            )}

            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(content);
                  setCopied(true);
                  setTimeout(()=>setCopied(false), 700);
                  antdMessage.success({ content: 'Copied to clipboard!', duration: 1.2 });
                } catch {
                  antdMessage.error({ content: 'Copy failed', duration: 1.2 });
                }
              }}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95 hover:bg-gray-100 ${copied ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-transparent text-gray-500'}`}
              title="复制"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7.5 3h7.1c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748C21 6.04 21 7.16 21 9.4v7.1M6.2 21h8.1c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874c.218-.428.218-.988.218-2.108V9.7c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C15.98 6.5 15.42 6.5 14.3 6.5H6.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C3 8.02 3 8.58 3 9.7v8.1c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C4.52 21 5.08 21 6.2 21"/></svg>
            </button>

            {type === 'ai' && (
              <>
                <button
                  onClick={() => { setLiked((v)=>!v); setDisliked(false); antdMessage.success({ content: 'Thanks for your feedback!', duration: 1.5 }); }}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95 hover:bg-gray-100 ${liked ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-500 bg-transparent'}`}
                  title="点赞"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M6.89531 2.23972C6.72984 2.12153 6.5 2.23981 6.5 2.44315V5.25001C6.5 6.21651 5.7165 7.00001 4.75 7.00001H2.5V13.5H12.1884C12.762 13.5 13.262 13.1096 13.4011 12.5532L14.4011 8.55318C14.5984 7.76425 14.0017 7.00001 13.1884 7.00001H9.25H8.5V6.25001V3.51458C8.5 3.43384 8.46101 3.35807 8.39531 3.31114L6.89531 2.23972ZM5 2.44315C5 1.01975 6.6089 0.191779 7.76717 1.01912L9.26717 2.09054C9.72706 2.41904 10 2.94941 10 3.51458V5.50001H13.1884C14.9775 5.50001 16.2903 7.18133 15.8563 8.91698L14.8563 12.917C14.5503 14.1412 13.4503 15 12.1884 15H1.75H1V14.25V6.25001V5.50001H1.75H4.75C4.88807 5.50001 5 5.38808 5 5.25001V2.44315Z" fillRule="evenodd"/></svg>
                </button>
                <button
                  onClick={() => { setDisliked((v)=>!v); setLiked(false); antdMessage.success({ content: 'Thanks for your feedback!', duration: 1.5 }); }}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95 hover:bg-gray-100 ${disliked ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-500 bg-transparent'}`}
                  title="点踩"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M6.89531 13.7603C6.72984 13.8785 6.5 13.7602 6.5 13.5569V10.75C6.5 9.7835 5.7165 9 4.75 9H2.5V2.5H12.1884C12.762 2.5 13.262 2.89037 13.4011 3.44683L14.4011 7.44683C14.5984 8.23576 14.0017 9 13.1884 9H9.25H8.5V9.75V12.4854C8.5 12.5662 8.46101 12.6419 8.39531 12.6889L6.89531 13.7603ZM5 13.5569C5 14.9803 6.6089 15.8082 7.76717 14.9809L9.26717 13.9095C9.72706 13.581 10 13.0506 10 12.4854V10.5H13.1884C14.9775 10.5 16.2903 8.81868 15.8563 7.08303L14.8563 3.08303C14.5503 1.85882 13.4503 1 12.1884 1H1.75H1V1.75V9.75V10.5H1.75H4.75C4.88807 10.5 5 10.6119 5 10.75V13.5569Z" fillRule="evenodd"/></svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

/* Minimal expand animation for edit box */
<style jsx global>{`
  .rf-expand { animation: rfScaleIn 160ms ease-out; transform-origin: top; }
  @keyframes rfScaleIn { from { opacity: 0; transform: scaleY(0.98); } to { opacity: 1; transform: scaleY(1); } }
`}</style>