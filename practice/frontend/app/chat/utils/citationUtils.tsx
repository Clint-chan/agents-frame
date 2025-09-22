import React from 'react';
import { ChunkInfo } from '../types/chat.types';
import CitationTooltip from '../components/CitationTooltip';

/**
 * 处理文本中的脚注引用，将 [1] [2] 等转换为可悬停的链接
 */
export const processCitations = (content: string, chunks: ChunkInfo[]) => {
  if (!chunks || chunks.length === 0) {
    return content;
  }

  // 创建脚注索引映射
  const chunkMap = new Map<number, ChunkInfo>();
  chunks.forEach(chunk => {
    chunkMap.set(chunk.index, chunk);
  });

  // 正则匹配 [ID:数字] 格式的脚注（RAGFlow标准格式）
  const citationRegex = /\[ID:(\d+)\]/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(content)) !== null) {
    const fullMatch = match[0]; // [ID:1]
    const citationNumber = parseInt(match[1]); // 1
    const matchStart = match.index;
    const matchEnd = match.index + fullMatch.length;

    // 添加脚注前的文本
    if (matchStart > lastIndex) {
      parts.push(content.substring(lastIndex, matchStart));
    }

    // 查找对应的chunk
    const chunk = chunkMap.get(citationNumber);
    if (chunk) {
      // 创建可悬停的脚注圆点
      parts.push(
        <CitationTooltip key={`citation-${citationNumber}-${matchStart}`} chunk={chunk}>
          <span
            className="reference-dot"
            data-number={citationNumber}
            data-node-id={chunk.chunk_id}
            onClick={(e) => e.preventDefault()}
          >
            {citationNumber}
          </span>
        </CitationTooltip>
      );
    } else {
      // 如果找不到对应的chunk，保持原样
      parts.push(fullMatch);
    }

    lastIndex = matchEnd;
  }

  // 添加剩余的文本
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts;
};

/**
 * 提取文本中的所有引用来源
 */
export const extractCitationSources = (content: string, chunks: ChunkInfo[]) => {
  if (!chunks || chunks.length === 0) {
    return [];
  }

  const citationRegex = /\[ID:(\d+)\]/g;
  const citedNumbers = new Set<number>();
  let match;

  while ((match = citationRegex.exec(content)) !== null) {
    const citationNumber = parseInt(match[1]);
    citedNumbers.add(citationNumber);
  }

  // 返回被引用的chunks
  return chunks.filter(chunk => citedNumbers.has(chunk.index));
};
