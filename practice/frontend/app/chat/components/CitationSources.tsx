"use client";

import React, { useState, useMemo } from 'react';
import { ChunkInfo } from '../types/chat.types';

interface CitationSourcesProps {
  sources: ChunkInfo[];
}

interface DocumentInfo {
  document_id: string;
  document_name: string;
  chunks: ChunkInfo[];
  similarity: number; // 最高相似度
}

const CitationSources: React.FC<CitationSourcesProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 按文档聚合chunks
  const documentSources = useMemo(() => {
    if (!sources || sources.length === 0) return [];

    const docMap = new Map<string, DocumentInfo>();

    sources.forEach(chunk => {
      const docId = chunk.document_id;
      if (!docMap.has(docId)) {
        docMap.set(docId, {
          document_id: docId,
          document_name: chunk.document_name,
          chunks: [],
          similarity: 0
        });
      }

      const doc = docMap.get(docId)!;
      doc.chunks.push(chunk);
      doc.similarity = Math.max(doc.similarity, chunk.similarity);
    });

    return Array.from(docMap.values()).sort((a, b) => b.similarity - a.similarity);
  }, [sources]);

  if (documentSources.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      {/* 可折叠的标题 */}
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          引用来源 ({documentSources.length})
        </h4>

        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* 展开的文档列表 */}
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {documentSources.map((doc, index) => (
            <div
              key={`doc-${doc.document_id}-${index}`}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
            >
              {/* 文档图标 */}
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>

              {/* 文档信息 */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => {
                    // TODO: 调用文档预览接口
                    console.log('预览文档:', doc.document_id);
                  }}
                >
                  {doc.document_name}
                </div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    最高相似度: {(doc.similarity * 100).toFixed(1)}%
                  </span>
                  <span className="text-gray-400">
                    {doc.chunks.length} 个片段
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  引用编号: {doc.chunks.map(c => c.index).join(', ')}
                </div>
              </div>

              {/* 第一个chunk的缩略图 */}
              {doc.chunks[0]?.image_id && (
                <div className="flex-shrink-0">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat/chunks/image/${doc.chunks[0].image_id}`}
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
      )}
    </div>
  );
};

export default CitationSources;
