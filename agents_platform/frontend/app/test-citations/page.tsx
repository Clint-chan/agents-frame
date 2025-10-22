"use client";

import React from 'react';
import { processCitations, extractCitationSources } from '../chat/utils/citationUtils';
import CitationSources from '../chat/components/CitationSources';
import DocumentReferences from '../chat/components/DocumentReferences';
import { ChunkInfo, DocAgg } from '../chat/types/chat.types';

const TestCitationsPage = () => {
  // 模拟测试数据
  const testContent = "2025年6月份的投资策略，建议关注钾肥、磷化工和农药行业[ID:1]。具体来看：钾肥具有较强的资源属性[ID:2]，磷化工未来磷矿石的资源稀缺性有望提升[ID:3]。";
  
  // 模拟doc_aggs数据
  const testDocAggs: DocAgg[] = [
    {
      count: 2,
      doc_id: "doc1",
      doc_name: "2025年投资策略报告.pdf"
    },
    {
      count: 1,
      doc_id: "doc2",
      doc_name: "化工行业分析.docx"
    }
  ];

  const testChunks: ChunkInfo[] = [
    {
      index: 1,
      chunk_id: "chunk1",
      content: "2025年投资策略建议关注钾肥、磷化工和农药行业。钾肥板块供需呈现收紧态势，推动钾肥价格复苏。",
      document_id: "doc1",
      document_name: "2025年投资策略报告.pdf",
      image_id: "img1",
      positions: [],
      similarity: 0.95
    },
    {
      index: 2,
      chunk_id: "chunk2", 
      content: "钾肥具有较强的资源属性，全球钾肥资源分布不均，行业供应格局高度集中。我国钾肥资源相对稀缺，进口依赖度较大。",
      document_id: "doc1",
      document_name: "2025年投资策略报告.pdf",
      image_id: "img2",
      positions: [],
      similarity: 0.88
    },
    {
      index: 3,
      chunk_id: "chunk3",
      content: "未来磷矿石的资源稀缺性有望提升，在环保等因素约束下，磷矿石行业供给总体呈收缩态势。下游需求将保持较快增长。",
      document_id: "doc2", 
      document_name: "化工行业分析.docx",
      image_id: "",
      positions: [],
      similarity: 0.82
    }
  ];

  const processedContent = processCitations(testContent, testChunks);
  const citationSources = extractCitationSources(testContent, testChunks);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">引用功能测试页面</h1>
        
        {/* 原始内容 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">原始内容</h2>
          <p className="text-gray-700">{testContent}</p>
        </div>

        {/* 处理后的内容 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">处理后的内容（带引用圆点）</h2>
          <div className="text-gray-700 leading-relaxed">
            {Array.isArray(processedContent) ? (
              processedContent.map((part, index) => (
                <React.Fragment key={index}>{part}</React.Fragment>
              ))
            ) : (
              processedContent
            )}
          </div>
          
          {/* 引用来源 - 新版本使用doc_aggs */}
          <DocumentReferences docAggs={testDocAggs} />

          {/* 旧版本引用来源（用于对比） */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-600 mb-2">旧版本引用来源（用于对比）:</h3>
            <CitationSources sources={citationSources} />
          </div>
        </div>

        {/* 测试数据 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">测试数据</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Chunks数据:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(testChunks, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">提取的引用来源:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(citationSources, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCitationsPage;
