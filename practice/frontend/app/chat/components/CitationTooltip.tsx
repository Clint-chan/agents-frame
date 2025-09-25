"use client";

import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChunkInfo } from '../types/chat.types';
import DOMPurify from 'dompurify';

interface CitationTooltipProps {
  chunk: ChunkInfo;
  children: React.ReactNode;
}

const CitationTooltip: React.FC<CitationTooltipProps> = ({ chunk, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, placement: 'top' });
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const adjustPositionWithRealSize = useCallback((anchor: DOMRect, tip: DOMRect) => {
    const margin = 16;
    const w = Math.min(tip.width || 720, window.innerWidth - margin * 2);
    const h = Math.min(tip.height || 280, window.innerHeight - margin * 2);

    const centerX = anchor.left + anchor.width / 2;
    const centerY = anchor.top + anchor.height / 2;

    const spaceAbove = anchor.top;
    const spaceBelow = window.innerHeight - anchor.bottom;
    const spaceLeft = anchor.left;
    const spaceRight = window.innerWidth - anchor.right;

    let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
    if (spaceAbove >= h + margin) placement = 'top';
    else if (spaceBelow >= h + margin) placement = 'bottom';
    else if (spaceRight >= w + margin) placement = 'right';
    else if (spaceLeft >= w + margin) placement = 'left';
    else placement = spaceBelow >= spaceAbove ? 'bottom' : 'top';

    let x = centerX;
    let y = centerY;

    if (placement === 'top') {
      x = centerX;
      y = anchor.top - margin;
      if (x - w / 2 < margin) x = w / 2 + margin;
      if (x + w / 2 > window.innerWidth - margin) x = window.innerWidth - w / 2 - margin;
    } else if (placement === 'bottom') {
      x = centerX;
      y = anchor.bottom + margin;
      if (x - w / 2 < margin) x = w / 2 + margin;
      if (x + w / 2 > window.innerWidth - margin) x = window.innerWidth - w / 2 - margin;
    } else if (placement === 'left') {
      x = anchor.left - margin;
      y = centerY;
      if (y - h / 2 < margin) y = h / 2 + margin;
      if (y + h / 2 > window.innerHeight - margin) y = window.innerHeight - h / 2 - margin;
    } else if (placement === 'right') {
      x = anchor.right + margin;
      y = centerY;
      if (y - h / 2 < margin) y = h / 2 + margin;
      if (y + h / 2 > window.innerHeight - margin) y = window.innerHeight - h / 2 - margin;
    }

    return { x, y, placement };
  }, []);


  const calculatePosition = useCallback((rect: DOMRect) => {
    const tooltipHeight = 280;
    const tooltipWidth = 720;
    const margin = 16;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    // 选择展开方向：优先 top，其次 bottom，再者 right，最后 left
    let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
    if (spaceAbove >= tooltipHeight + margin) placement = 'top';
    else if (spaceBelow >= tooltipHeight + margin) placement = 'bottom';
    else if (spaceRight >= tooltipWidth + margin) placement = 'right';
    else if (spaceLeft >= tooltipWidth + margin) placement = 'left';
    else placement = spaceBelow >= spaceAbove ? 'bottom' : 'top';

    let x = centerX;
    let y = centerY;

    if (placement === 'top') {
      x = centerX;
      y = rect.top - margin;
      // 水平居中并防止越界
      if (x - tooltipWidth / 2 < margin) x = tooltipWidth / 2 + margin;
      if (x + tooltipWidth / 2 > window.innerWidth - margin) x = window.innerWidth - tooltipWidth / 2 - margin;
    } else if (placement === 'bottom') {
      x = centerX;
      y = rect.bottom + margin;
      if (x - tooltipWidth / 2 < margin) x = tooltipWidth / 2 + margin;
      if (x + tooltipWidth / 2 > window.innerWidth - margin) x = window.innerWidth - tooltipWidth / 2 - margin;
    } else if (placement === 'left') {
      x = rect.left - margin;
      y = centerY;
      if (y - tooltipHeight / 2 < margin) y = tooltipHeight / 2 + margin;
      if (y + tooltipHeight / 2 > window.innerHeight - margin) y = window.innerHeight - tooltipHeight / 2 - margin;
    } else if (placement === 'right') {
      x = rect.right + margin;
      y = centerY;
      if (y - tooltipHeight / 2 < margin) y = tooltipHeight / 2 + margin;
      if (y + tooltipHeight / 2 > window.innerHeight - margin) y = window.innerHeight - tooltipHeight / 2 - margin;
    }

    return { x, y, placement };
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    const currentTarget = e.currentTarget;
    const rect = currentTarget.getBoundingClientRect();

    showTimeoutRef.current = setTimeout(() => {
      const pos = calculatePosition(rect);
      setPosition(pos);
      setIsVisible(true);
      // 下一帧基于真实尺寸再校正一次，避免向上弹出时越界
      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const tipRect = tooltipRef.current.getBoundingClientRect();
          const adjusted = adjustPositionWithRealSize(rect, tipRect);
          setPosition(adjusted);
        }
      });
    }, 200);
  }, [calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  }, []);

  // derive page and doc url for jump
  const pageFromArray = Array.isArray((chunk as any).page_num_int) && (chunk as any).page_num_int.length > 0 ? Number((chunk as any).page_num_int[0]) : undefined;
  const posPage = Array.isArray(chunk.positions) && Array.isArray((chunk.positions as any)[0]) ? Number((chunk.positions as any)[0][0]) : undefined;
  const page = pageFromArray || posPage || 1;
  const docBase = process.env.NEXT_PUBLIC_DOC_BASE_URL || 'http://192.168.18.124:8080';
  // 由于后端文档服务不支持 #page= 跳页，这里使用无 hash 的原文链接，避免误导
  const docUrl = `${docBase}/document/${chunk.document_id}?ext=pdf&prefix=document`;


  return (
    <>
      <span
        className="relative inline-block align-super"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          data-placement={position.placement}
          className={`reference-tooltip fixed z-50 p-4 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-auto ${position.placement === 'top' ? 'rf-anim-top' : position.placement === 'bottom' ? 'rf-anim-bottom' : position.placement === 'left' ? 'rf-anim-left' : 'rf-anim-right'}`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: 'min(820px, calc(100vw - 32px))',
            maxHeight: 'min(76vh, calc(100vh - 32px))',
            willChange: 'transform, opacity',
            transform:
              position.placement === 'top'
                ? 'translate(-50%, -100%)'
                : position.placement === 'bottom'
                ? 'translate(-50%, 0)'
                : position.placement === 'left'
                ? 'translate(-100%, -50%)'
                : 'translate(0, -50%)'
          }}
          onMouseEnter={() => hideTimeoutRef.current && clearTimeout(hideTimeoutRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          {/* 头部：文档名 + 页码 + 查看原文 */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-gray-900 truncate max-w-[520px] sm:max-w-[640px]" title={chunk.document_name || '文档'}>
                {chunk.document_name || '未命名文档'}
              </div>
              {page && <div className="text-xs text-gray-500 mt-0.5">第 {page} 页</div>}
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 active:scale-95"
              onClick={(e) => { e.preventDefault(); window.open(docUrl, '_blank', 'noopener'); }}
              title="在新标签页查看原文"
            >
              查看原文
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 7H17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div className="flex gap-4 items-start">
            {/* 左侧图片 */}
            {chunk.image_id && (
              <div className="flex-shrink-0">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat/chunks/image/${chunk.image_id}`}
                  alt="文档图片"
                  className="w-44 h-36 object-contain rounded-lg border bg-white cursor-zoom-in"
                  onClick={() => setShowImagePreview(true)}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* 右侧文字内容 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-700 leading-relaxed">
                <div className="rf-table-wrap">
                  <div
                    // 安全渲染 HTML，支持表格/加粗/链接等（保留合并单元格/列组等）
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(chunk.content, {
                        ALLOWED_TAGS: ['table','thead','tbody','tfoot','tr','td','th','caption','colgroup','col','p','em','strong','a','ul','ol','li','code','pre','br','span','div'],
                        ALLOWED_ATTR: ['colspan','rowspan','href','target','rel','style','class','span','width','align','valign'],
                        ADD_TAGS: ['colgroup','col'],
                        ADD_ATTR: ['span','width','align','valign']
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 智能箭头 */}
          <div className={`reference-tooltip-arrow ${position.placement}`} />
        </div>, document.body)
      }

      {/* 全屏图片预览 */}
      {showImagePreview && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center"
          onClick={() => setShowImagePreview(false)}
        >
          <img
            src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat/chunks/image/${chunk.image_id}`}
            alt="文档大图"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}


      <style jsx global>{`
        /* 行内上标的引用圆点：更小、更靠右上，不换行 */
        .reference-dot {
          display: inline-block;
          vertical-align: super;
          font-size: 10px;
          line-height: 1;
          min-width: 14px;
          height: 14px;
          padding: 0 2px;
          margin-left: 2px;
          border-radius: 9999px;
          color: #4f46e5;           /* indigo-600 */
          background: #eef2ff;      /* indigo-50 */
          text-align: center;
          position: relative;
          top: -0.1em;              /* 轻微上移，贴近右上角视觉 */
          cursor: pointer;
          user-select: none;
        }
        .reference-dot:hover { background: #e0e7ff; }

        /* Tooltip 入场动画（避免 transform 冲突，仅做透明度动画） */
        .rf-anim-top, .rf-anim-bottom, .rf-anim-left, .rf-anim-right { animation: rfFadeIn 140ms ease-out; }
        @keyframes rfFadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* HTML 内容的基础样式（表格/代码块/链接） */
        .reference-tooltip .rf-table-wrap{max-width:100%;overflow:auto}
        .reference-tooltip .rf-table-wrap table{border-collapse:collapse;table-layout:auto;min-width:600px;width:max-content;max-width:100%}
        .reference-tooltip th,.reference-tooltip td{border:1px solid #e5e7eb;padding:6px 8px;font-size:12px;vertical-align:top;word-break:break-word}
        .reference-tooltip thead th{background:#f9fafb;position:sticky;top:0;z-index:1}
        .reference-tooltip caption{caption-side:top;color:#6b7280;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .reference-tooltip pre{background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;padding:8px;overflow:auto}
        .reference-tooltip code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
        .reference-tooltip a{color:#2563eb;word-break:break-all}
        .reference-tooltip img{max-width:100%;height:auto}

        /* 箭头样式（根据方向自动定位） */
        .reference-tooltip { position: fixed; }
        .reference-tooltip-arrow { position: absolute; width: 0; height: 0; }
        .reference-tooltip-arrow.top { bottom: -8px; left: 50%; transform: translateX(-50%); border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #ffffff; filter: drop-shadow(0 -1px 0 rgba(0,0,0,0.06)); }
        .reference-tooltip-arrow.bottom { top: -8px; left: 50%; transform: translateX(-50%); border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #ffffff; filter: drop-shadow(0 1px 0 rgba(0,0,0,0.06)); }
        .reference-tooltip-arrow.left { right: -8px; top: 50%; transform: translateY(-50%); border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-left: 8px solid #ffffff; filter: drop-shadow(-1px 0 0 rgba(0,0,0,0.06)); }
        .reference-tooltip-arrow.right { left: -8px; top: 50%; transform: translateY(-50%); border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-right: 8px solid #ffffff; filter: drop-shadow(1px 0 0 rgba(0,0,0,0.06)); }
      `}</style>

    </>


  );
};

export default CitationTooltip;


