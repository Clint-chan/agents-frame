"use client";

import { useState, useEffect, useCallback } from 'react';

interface ThumbnailData {
  [docId: string]: string;
}

export const useDocumentThumbnails = () => {
  const [thumbnails, setThumbnails] = useState<ThumbnailData>({});
  const [loading, setLoading] = useState(false);

  const fetchThumbnails = useCallback(async (docIds: string[]) => {
    if (!docIds || docIds.length === 0) return;

    setLoading(true);
    try {
      // 过滤掉已经获取过的文档ID
      const newDocIds = docIds.filter(id => !thumbnails[id]);
      if (newDocIds.length === 0) {
        setLoading(false);
        return;
      }

      const ragflowBaseUrl = 'http://192.168.18.124:8080';
      const response = await fetch(
        `${ragflowBaseUrl}/v1/document/thumbnails?doc_ids=${newDocIds.join(',')}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ragflow-E0ZmYwNWE2OGZiZTExZjA4MzUyMmU0ZT',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          // 转换为完整URL
          const newThumbnails: ThumbnailData = {};
          Object.entries(result.data).forEach(([docId, path]) => {
            newThumbnails[docId] = `${ragflowBaseUrl}${path}`;
          });
          
          setThumbnails(prev => ({ ...prev, ...newThumbnails }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch document thumbnails:', error);
    } finally {
      setLoading(false);
    }
  }, [thumbnails]);

  const getThumbnail = useCallback((docId: string): string | null => {
    return thumbnails[docId] || null;
  }, [thumbnails]);

  return {
    thumbnails,
    loading,
    fetchThumbnails,
    getThumbnail,
  };
};
