"""
RAGFlow API客户端封装
基于官方RESTful API文档实现
"""
import aiohttp
import asyncio
from typing import Dict, List, Any, Optional
from core.config import settings, RETRIEVAL_CONFIG


class RAGFlowClient:
    """RAGFlow RESTful API客户端"""
    
    def __init__(self, api_key: str = settings.RAGFLOW_API_KEY, base_url: str = settings.RAGFLOW_BASE_URL):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def retrieve_chunks(self, question: str, kb_id: str, **kwargs) -> Dict[str, Any]:
        """
        检索知识库chunks
        基于官方文档 POST /api/v1/retrieval
        """
        url = f"{self.base_url}/api/v1/retrieval"
        
        # 合并默认配置和自定义参数
        payload = {
            "question": question,
            "dataset_ids": [kb_id],  # 使用dataset_ids参数
            **RETRIEVAL_CONFIG,
            **kwargs
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.headers, json=payload, timeout=30) as response:
                    response.raise_for_status()
                    return await response.json()
        except aiohttp.ClientError as e:
            raise Exception(f"RAGFlow检索请求失败: {e}")
    
    async def get_document_image(self, image_id: str) -> bytes:
        """
        获取文档图片
        基于官方文档 GET /v1/document/image/{image_id}
        """
        url = f"{self.base_url}/v1/document/image/{image_id}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers, timeout=30) as response:
                    response.raise_for_status()
                    return await response.read()
        except aiohttp.ClientError as e:
            raise Exception(f"获取图片失败: {e}")
    
    async def get_document_thumbnails(self, doc_ids: List[str]) -> Dict[str, str]:
        """获取文档缩略图"""
        if not doc_ids:
            return {}

        url = f"{self.base_url}/v1/document/thumbnails"
        params = {"doc_ids": ",".join(doc_ids)}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers, params=params, timeout=30) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get("code") == 0 and result.get("data"):
                            # 转换为完整URL
                            thumbnails: Dict[str, str] = {}
                            for doc_id, path in result["data"].items():
                                thumbnails[doc_id] = f"{self.base_url}{path}"
                            return thumbnails
        except Exception as e:
            print(f"获取缩略图失败: {e}")

        return {}

    def format_chunks_for_llm(self, chunks_data: Dict[str, Any]) -> tuple[str, List[Dict], List[Dict]]:
        """
        格式化chunks数据供LLM使用
        返回: (格式化的知识库文本, chunks元数据列表, doc_aggs列表)
        """
        if not chunks_data.get("data", {}).get("chunks"):
            return "暂无相关知识库内容。", [], []

        chunks = chunks_data["data"]["chunks"]
        doc_aggs = chunks_data["data"].get("doc_aggs", [])
        formatted_knowledge = ""
        chunks_metadata = []

        for i, chunk in enumerate(chunks, 1):
            # 为LLM格式化的知识库内容，使用RAGFlow标准格式
            formatted_knowledge += f"[ID:{i}] {chunk.get('content', '')}\n\n"

            # 保存chunks元数据供前端使用
            chunk_meta = {
                "index": i,
                "chunk_id": chunk.get("id", ""),
                "content": chunk.get("content", ""),
                "document_id": chunk.get("document_id", ""),
                "document_name": chunk.get("document_name", "") or chunk.get("docnm_kwd", ""),
                "image_id": chunk.get("image_id", ""),
                "positions": chunk.get("positions", []),
                "similarity": chunk.get("similarity", 0.0)
            }
            chunks_metadata.append(chunk_meta)

        return formatted_knowledge.strip(), chunks_metadata, doc_aggs
