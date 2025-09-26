"use client";
// ChatMarkdown: Unified Markdown renderer for chat content.
// - Normalizes [ID:n] citations into inline reference dots handled by CitationTooltip.
// - Supports GFM, math (KaTeX), code copy; keeps logic centralized and DRY.


import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import DOMPurify from 'dompurify';
import { message as antdMessage } from 'antd';
import CitationTooltip from './CitationTooltip';
import { ChunkInfo } from '../types/chat.types';
import 'highlight.js/styles/github.css';


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
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={{
        pre: ({ children }: any) => <>{children}</>,
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
        table: ({ children, ...props }) => {
          const tableRef = React.useRef<HTMLTableElement | null>(null);
          const onDownload = () => {
            const table = tableRef.current; if (!table) return; const rows = Array.from(table.rows); const csv: string[] = [];
            for (const row of rows) {
              const cells = Array.from(row.cells).map((c) => { let t = (c.innerText || '').replace(/"/g, '""'); if (t.includes(',') || t.includes('\n')) t = `"${t}` + `"`; return t; });
              csv.push(cells.join(','));
            }
            const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'table-export.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
          };
          const onCopy = async () => {
            const table = tableRef.current; if (!table) return; const rows = Array.from(table.rows); let textOut = '';
            for (const row of rows) { const cells = Array.from(row.cells).map(c => (c.innerText || '').trim()); textOut += cells.join('\t') + '\n'; }
            try { await navigator.clipboard.writeText(textOut); antdMessage.success({ content: '\u8868\u683c\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f', duration: 1.2 }); } catch { antdMessage.error('\u590d\u5236\u5931\u8d25'); }
          };
          return (
            <div className="my-4 w-full flex flex-col space-y-2">
              <div className="flex items-center justify-end gap-1">
                <button onClick={onCopy} title="复制表格" type="button" className="cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground" aria-label="复制表格">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                  </svg>
                </button>
                <button onClick={onDownload} title="下载为CSV" type="button" className="cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground" aria-label="下载为CSV">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 15V3"></path>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <path d="m7 10 5 5 5-5"></path>
                  </svg>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table ref={tableRef} className="w-full border-collapse border border-border" {...props}>{children}</table>
              </div>
            </div>
          );
        },
        thead: (props: any) => <thead className="bg-muted/80 border-b border-border" {...props} />,
        tbody: (props: any) => <tbody className="divide-y divide-border bg-muted/40" {...props} />,
        th: ({ children, ...props }: any) => <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-sm" {...props}>{children}</th>,
        td: ({ children, ...props }: any) => <td className="px-4 py-2 text-sm" {...props}>{children}</td>,

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
          // 如果代码块里其实是 <table> 的 HTML，按“表格组件”渲染（去掉 pre），并提供外置按钮
          const isTableHtml = /<\s*table[\s>]/i.test(text);
          if (isTableHtml) {
            const wrapRef = React.useRef<HTMLDivElement | null>(null);
            const onDownload = () => {
              const el = wrapRef.current; if (!el) return; const table = el.querySelector('table') as HTMLTableElement | null; if (!table) return;
              const rows = Array.from(table.rows); const csv: string[] = [];
              for (const row of rows) {
                const cells = Array.from(row.cells).map((c) => { let t = (c.innerText || '').replace(/\"/g, '\"\"'); if (t.includes(',') || t.includes('\n')) t = `\"${t}` + `\"`; return t; });
                csv.push(cells.join(','));
              }
              const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'table-export.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            };
            const onCopyTable = async () => {
              const el = wrapRef.current; if (!el) return; const table = el.querySelector('table') as HTMLTableElement | null; if (!table) return;
              const rows = Array.from(table.rows); let textOut = '';
              for (const row of rows) { const cells = Array.from(row.cells).map(c => (c.innerText || '').trim()); textOut += cells.join('\t') + '\n'; }
              try { await navigator.clipboard.writeText(textOut); antdMessage.success({ content: '\u8868\u683c\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f', duration: 1.2 }); } catch { antdMessage.error('\u590d\u5236\u5931\u8d25'); }
            };
            return (
              <div className="my-4 w-full flex flex-col space-y-2">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={onCopyTable} title="复制表格" type="button" className="cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground" aria-label="复制表格">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                    </svg>
                  </button>
                  <button onClick={onDownload} title="下载为CSV" type="button" className="cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground" aria-label="下载为CSV">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 15V3"></path>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <path d="m7 10 5 5 5-5"></path>
                    </svg>
                  </button>
                </div>
                <div ref={wrapRef} className="overflow-x-auto">
                  <div className="prose" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text, { ALLOWED_TAGS: ['table','thead','tbody','tfoot','tr','td','th','caption','colgroup','col'], ALLOWED_ATTR: ['colspan','rowspan','style','class','span','width','align','valign'] }) }} />
                </div>
              </div>
            );
          }

          // 常规代码块（无 pre），仅用 code + 滚动容器 + 复制按钮
          const codeRef = React.useRef<HTMLElement | null>(null);
          const onCopy = async () => {
            const raw = codeRef.current?.innerText ?? text;
            try { await navigator.clipboard.writeText(raw); antdMessage.success({ content: '\u4ee3\u7801\u5df2\u590d\u5236', duration: 1.2 }); } catch { antdMessage.error('\u590d\u5236\u5931\u8d25'); }
          };
          return (
            <div className="my-3 w-full overflow-hidden rounded-md border bg-white">
              <div className="flex items-center justify-between border-b bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                <span className="lowercase">{lang}</span>
                <button onClick={onCopy} className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100" title="复制">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7.5 3h7.1c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748C21 6.04 21 7.16 21 9.4v7.1M6.2 21h8.1c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874c.218-.428.218-.988.218-2.108V9.7c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C15.98 6.5 15.42 6.5 14.3 6.5H6.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C3 8.02 3 8.58 3 9.7v8.1c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C4.52 21 5.08 21 6.2 21"/></svg>
                </button>
              </div>
              <div className="rf-code-content max-h-[520px] overflow-auto">
                <code ref={codeRef as any} className={`language-${lang} hljs font-mono text-sm`}>{children}</code>
              </div>
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

