"""
RAGFlow API客户端封装
基于官方RESTful API文档实现
"""
import aiohttp
from typing import Dict, List, Any
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
        # 建立 doc_id -> doc_name 的映射，兜底文档名
        doc_name_map = {d.get("doc_id"): d.get("doc_name") for d in (doc_aggs or [])}

        formatted_knowledge = ""
        chunks_metadata = []

        for i, chunk in enumerate(chunks, 1):
            # 为LLM格式化的知识库内容，使用RAGFlow标准格式
            formatted_knowledge += f"[ID:{i}] {chunk.get('content', '')}\n\n"

            # 字段兼容：不同接口字段名不一致
            doc_id = chunk.get("document_id") or chunk.get("doc_id") or ""
            # 优先级：document_name > document_keyword > docnm_kwd > doc_aggs 映射 > doc_name > ""
            doc_name = (
                chunk.get("document_name")
                or chunk.get("document_keyword")
                or chunk.get("docnm_kwd")
                or doc_name_map.get(doc_id)
                or chunk.get("doc_name")
                or ""
            )

            positions = chunk.get("positions", [])
            page_num_list = chunk.get("page_num_int")
            page_num = None
            if isinstance(page_num_list, list) and page_num_list:
                # REST/Web可能返回 page_num_int: [6,6,...]
                try:
                    page_num = int(page_num_list[0])
                except Exception:
                    page_num = None
            # 从 positions 兜底推断页码：[[page,x1,x2,y1,y2], ...]
            if page_num is None and isinstance(positions, list) and positions and isinstance(positions[0], (list, tuple)):
                try:
                    page_num = int(positions[0][0])
                except Exception:
                    page_num = None

            chunk_meta = {
                "index": i,
                "chunk_id": chunk.get("id", ""),
                "content": chunk.get("content", ""),
                "document_id": doc_id,
                "document_name": doc_name,
                "image_id": chunk.get("image_id", ""),
                "positions": positions,
                "similarity": chunk.get("similarity", 0.0),
            }
            if page_num is not None:
                # 兼容前端 Tooltip 取第一个值
                chunk_meta["page_num_int"] = [page_num]

            chunks_metadata.append(chunk_meta)

        return formatted_knowledge.strip(), chunks_metadata, doc_aggs
