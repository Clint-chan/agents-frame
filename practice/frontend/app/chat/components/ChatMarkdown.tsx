"use client";

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { message as antdMessage } from 'antd';
import CitationTooltip from './CitationTooltip';
import { ChunkInfo } from '../types/chat.types';

interface ChatMarkdownProps {
  content: string;
  chunks?: ChunkInfo[];
}

const ChatMarkdown: React.FC<ChatMarkdownProps> = ({ content, chunks }) => {
  // 行内脚注引用：[ID:n] → 转为带 data-citation 的链接，交给 a 渲染器变引用圆点
  const citationRemark = useMemo(() => {
    return function citationPlugin() {
      return (tree: any) => {
        const walk = (node: any) => {
          if (!node) return;
          if (Array.isArray(node.children)) {
            const nextChildren: any[] = [];
            for (const child of node.children) {
              if (child && child.type === 'text' && typeof child.value === 'string') {
                const value: string = child.value;
                const re = /\[(?:ID|Id|id)\s*[:：]\s*(\d+)\]/g;
                let last = 0; let m: RegExpExecArray | null;
                while ((m = re.exec(value)) !== null) {
                  if (m.index > last) nextChildren.push({ type: 'text', value: value.slice(last, m.index) });
                  const n = m[1];
                  nextChildren.push({ type: 'link', url: '#', data: { hProperties: { 'data-citation': n } }, children: [{ type: 'text', value: n }] });
                  last = m.index + m[0].length;
                }
                if (last < value.length) nextChildren.push({ type: 'text', value: value.slice(last) });
              } else {
                walk(child);
                nextChildren.push(child);
              }
            }
            node.children = nextChildren;
          }
        };
        walk(tree);
      };
    };
  }, [chunks]);

  return (
    <ReactMarkdown
      remarkPlugins={[citationRemark, remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        a: ({ node, href, children, ...props }) => {
          const citationAttr = (props as any)['data-citation'];
          if (citationAttr !== undefined) {
            const n = parseInt(String(citationAttr), 10);
            const chunk = (chunks || []).find(c => Number(c.index) === n);
            if (chunk) {
              return (
                <CitationTooltip chunk={chunk}>
                  <span className="reference-dot" data-number={n} data-node-id={chunk.chunk_id} onClick={(e)=>e.preventDefault()}>{n}</span>
                </CitationTooltip>
              );
            }
            return <sup>[{n}]</sup>;
          }
          return <a href={href} {...props}>{children}</a>;
        },
        code: (props: any) => {
          const { inline, className, children } = props as any;
          const match = /language-(\w+)/.exec(className || '');
          const lang = (match?.[1] || 'text').toLowerCase();
          const text = String(children).replace(/\n$/, '');
          if (inline) {
            return <code className="font-mono text-[85%] bg-gray-100 px-1 py-0.5 rounded" {...props}>{children}</code>;
          }
          if (lang === 'markdown' || lang === 'md' || lang === 'mdx') {
            return (
              <div className="my-3">
                <ChatMarkdown content={text} chunks={chunks} />
              </div>
            );
          }
          const onCopy = async () => {
            try { await navigator.clipboard.writeText(text); antdMessage.success({ content: '代码已复制', duration: 1.2 }); } catch { antdMessage.error('复制失败'); }
          };
          return (
            <div className="my-3 rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-600 bg-gray-50 border-b border-gray-200">
                <span className="uppercase tracking-wide">{lang}</span>
                <button onClick={onCopy} className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100" title="复制">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7.5 3h7.1c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748C21 6.04 21 7.16 21 9.4v7.1M6.2 21h8.1c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874c.218-.428.218-.988.218-2.108V9.7c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C15.98 6.5 15.42 6.5 14.3 6.5H6.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C3 8.02 3 8.58 3 9.7v8.1c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C4.52 21 5.08 21 6.2 21"/></svg>
                </button>
              </div>
              <pre className="m-0 max-h-[520px] overflow-auto bg-gray-50">
                <code className={`language-${lang}`}>{children}</code>
              </pre>
            </div>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default ChatMarkdown;

