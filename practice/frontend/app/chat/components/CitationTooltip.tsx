"use client";

import React, { useState, useRef, useCallback } from 'react';
import { ChunkInfo } from '../types/chat.types';

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
    }, 200);
  }, [calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  }, []);

  return (
    <>
      <span
        className="relative inline-block align-super"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>

      {isVisible && (
        <div
          className="reference-tooltip fixed z-50 p-4 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-[720px] w-[720px] max-h-[70vh] overflow-auto"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
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
          <div className="flex gap-4 items-center">
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
              <div className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                {chunk.document_name}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {chunk.content}
              </div>
            </div>
          </div>

          {/* 智能箭头 */}
          <div className={`reference-tooltip-arrow ${position.placement} left-1/2 transform -translate-x-1/2`} />
        </div>
      )}

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
      `}</style>

    </>


  );
};

export default CitationTooltip;


