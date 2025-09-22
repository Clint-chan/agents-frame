"use client";

import React, { useState } from 'react';
import { DocAgg } from '../types/chat.types';

interface DocumentReferencesProps {
  docAggs: DocAgg[];
}

const DocumentReferences: React.FC<DocumentReferencesProps> = ({ docAggs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!docAggs || docAggs.length === 0) {
    return null;
  }

  const handleDocumentClick = (doc: DocAgg) => {
    // 使用后端提供的完整URL
    if (doc.document_url) {
      window.open(doc.document_url, '_blank');
    }
  };

  return (
    <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
      {/* 秘塔风格标题 */}
      <div
        className="flex items-center justify-between cursor-pointer p-3 rounded-lg transition-all duration-200"
        style={{
          background: isExpanded ? 'var(--color-bg-secondary)' : 'transparent',
          color: 'var(--color-text-secondary)'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="text-sm font-medium flex items-center">
          <svg
            className="w-4 h-4 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          引用来源 ({docAggs.length})
        </h4>

        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* 秘塔风格文档列表 */}
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {docAggs.map((doc, index) => (
            <div
              key={`doc-${doc.doc_id}-${index}`}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100 cursor-pointer"
              onClick={() => handleDocumentClick(doc)}
            >
              {/* 文档缩略图或图标（支持悬停放大预览） */}
              <div className="relative group flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                {doc.thumbnail_url ? (
                  <>
                    <img
                      src={doc.thumbnail_url}
                      alt={doc.doc_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class=\"w-full h-full flex items-center justify-center bg-blue-50\">\n  <svg class=\"w-6 h-6 text-blue-500\" fill=\"currentColor\" viewBox=\"0 0 20 20\">\n    <path fill-rule=\"evenodd\" d=\"M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z\" clip-rule=\"evenodd\" />\n  </svg>\n</div>`;
                        }
                      }}
                    />
                    {/* 悬停放大预览 */}
                    <div className="hidden group-hover:block absolute z-40 -top-2 -left-2">
                      <div className="p-2 bg-white rounded-xl shadow-2xl border">
                        <img
                          src={doc.thumbnail_url}
                          alt={doc.doc_name}
                          className="w-56 h-44 object-contain"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 文档信息 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                  {doc.doc_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {doc.count} 处引用
                </div>
              </div>

              {/* 外部链接图标 */}
              <div className="flex-shrink-0 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentReferences;
