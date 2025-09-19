"use client";

import React, { useState } from 'react';
import { ChunkInfo } from '../types/chat.types';

interface CitationTooltipProps {
  chunk: ChunkInfo;
  children: React.ReactNode;
}

const CitationTooltip: React.FC<CitationTooltipProps> = ({ chunk, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <span
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      
      {isVisible && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex gap-3">
            {/* 左侧图片 */}
            {chunk.image_id && (
              <div className="flex-shrink-0">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat/chunks/image/${chunk.image_id}`}
                  alt="文档图片"
                  className="w-20 h-20 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* 右侧文字内容 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {chunk.document_name}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                相似度: {(chunk.similarity * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {chunk.content}
              </div>
            </div>
          </div>
          
          {/* 小箭头 */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"
          />
        </div>
      )}
    </>
  );
};

export default CitationTooltip;
