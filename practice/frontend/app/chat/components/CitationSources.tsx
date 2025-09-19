"use client";

import React from 'react';
import { ChunkInfo } from '../types/chat.types';

interface CitationSourcesProps {
  sources: ChunkInfo[];
}

const CitationSources: React.FC<CitationSourcesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        参考文献
      </h4>
      
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div 
            key={`source-${source.chunk_id}-${index}`}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* 脚注编号 */}
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
              {source.index}
            </div>
            
            {/* 文档信息 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {source.document_name}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                相似度: {(source.similarity * 100).toFixed(1)}% | 
                文档ID: {source.document_id.substring(0, 8)}...
              </div>
              <div className="text-sm text-gray-600 line-clamp-2">
                {source.content.length > 120 
                  ? source.content.substring(0, 120) + "..." 
                  : source.content}
              </div>
            </div>
            
            {/* 缩略图 */}
            {source.image_id && (
              <div className="flex-shrink-0">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat/chunks/image/${source.image_id}`}
                  alt="文档缩略图"
                  className="w-12 h-12 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitationSources;
