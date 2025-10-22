"""
知识库聊天Agent
基于RAGFlow的知识库问答Agent
"""
import uuid
from typing import AsyncGenerator, Dict, List, Any, Optional
from ai.rag.ragflow_client import RAGFlowClient
from ai.llm import LLMClient
from utils.session_manager import SessionManager
from core.config import settings


class KnowledgeChatAgent:
    """知识库聊天Agent"""

    # 知识库ID - 特定于此Agent
    KB_ID = "1d46e4ec8a0311f084281ed3160bf8aa"

    def __init__(self, kb_id: str = None):
        self.agent_id = "knowledge-chat"
        self.agent_name = "知识库问答助手"
        self.kb_id = kb_id or self.KB_ID
        self.ragflow_client = RAGFlowClient()
        self.llm_client = LLMClient()
        self.session_manager = SessionManager()
    
    async def chat_stream(
        self, 
        message: str, 
        thread_id: str = None,
        agent_config: Dict = None,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        流式RAG聊天接口
        
        Args:
            message: 用户消息
            thread_id: 会话ID，如果为None则创建新会话
            agent_config: Agent配置
            **kwargs: 其他参数
            
        Yields:
            Dict: 包含流式内容和元数据的字典
        """
        # 创建或获取会话
        if not thread_id:
            thread_id = str(uuid.uuid4())
        
        if not self.session_manager.get_session(thread_id):
            self.session_manager.create_session(thread_id)
        
        try:
            # 1. 从RAGFlow检索相关chunks
            yield {
                "type": "status",
                "content": "正在检索知识库...",
                "thread_id": thread_id
            }
            
            chunks_data = await self.ragflow_client.retrieve_chunks(message, self.kb_id)
            knowledge, chunks_metadata, doc_aggs = self.ragflow_client.format_chunks_for_llm(chunks_data)

            yield {
                "type": "chunks",
                "content": "",
                "chunks": chunks_metadata,
                "doc_aggs": doc_aggs,
                "thread_id": thread_id
            }

            # 2. 获取聊天历史
            chat_history = self.session_manager.get_chat_history(thread_id, max_turns=5)
            
            # 3. 调用大模型生成回答
            yield {
                "type": "status", 
                "content": "正在生成回答...",
                "thread_id": thread_id
            }
            
            full_response = ""
            async for chunk in self.llm_client.chat_stream(
                message=message,
                knowledge=knowledge,
                chat_history=chat_history,
                temperature=agent_config.get("temperature", settings.DEFAULT_TEMPERATURE) if agent_config else settings.DEFAULT_TEMPERATURE
            ):
                full_response += chunk
                yield {
                    "type": "token",
                    "content": chunk,
                    "full_content": full_response,
                    "thread_id": thread_id
                }
            
            # 4. 获取文档缩略图和构建完整的doc_aggs
            enhanced_doc_aggs = []
            if doc_aggs:
                # 提取所有文档ID
                doc_ids = [doc["doc_id"] for doc in doc_aggs]

                # 获取缩略图
                thumbnails = await self.ragflow_client.get_document_thumbnails(doc_ids)

                # 构建增强的doc_aggs
                for doc in doc_aggs:
                    doc_id = doc["doc_id"]
                    doc_name = doc["doc_name"]

                    # 获取文件扩展名
                    file_extension = doc_name.split('.')[-1].lower() if '.' in doc_name else 'pdf'

                    enhanced_doc = {
                        "doc_id": doc_id,
                        "doc_name": doc_name,
                        "count": doc["count"],
                        "thumbnail_url": thumbnails.get(doc_id, ""),
                        "document_url": f"{self.ragflow_client.base_url}/document/{doc_id}?ext={file_extension}&prefix=document"
                    }
                    enhanced_doc_aggs.append(enhanced_doc)

            # 5. 保存对话历史
            self.session_manager.add_message(thread_id, "user", message)
            self.session_manager.add_message(thread_id, "assistant", full_response, chunks_metadata)

            # 6. 发送完成信号
            yield {
                "type": "message",
                "content": {
                    "id": str(uuid.uuid4()),
                    "type": "ai",
                    "content": full_response,
                    "chunks": chunks_metadata,
                    "doc_aggs": enhanced_doc_aggs,
                    "thread_id": thread_id,
                    "agent_id": self.agent_id
                }
            }
            
        except Exception as e:
            error_msg = f"知识库聊天Agent错误: {e}"
            yield {
                "type": "error",
                "content": error_msg,
                "thread_id": thread_id
            }
    
    async def chat_invoke(
        self, 
        message: str, 
        thread_id: str = None,
        agent_config: Dict = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        非流式RAG聊天接口
        
        Args:
            message: 用户消息
            thread_id: 会话ID
            agent_config: Agent配置
            **kwargs: 其他参数
            
        Returns:
            Dict: 包含回答和元数据的字典
        """
        # 创建或获取会话
        if not thread_id:
            thread_id = str(uuid.uuid4())
        
        if not self.session_manager.get_session(thread_id):
            self.session_manager.create_session(thread_id)
        
        try:
            # 1. 从RAGFlow检索相关chunks
            chunks_data = await self.ragflow_client.retrieve_chunks(message, self.kb_id)
            knowledge, chunks_metadata = self.ragflow_client.format_chunks_for_llm(chunks_data)

            # 2. 获取聊天历史
            chat_history = self.session_manager.get_chat_history(thread_id, max_turns=5)
            
            # 3. 调用大模型生成回答
            response = await self.llm_client.chat_complete(
                message=message,
                knowledge=knowledge,
                chat_history=chat_history,
                temperature=agent_config.get("temperature", settings.DEFAULT_TEMPERATURE) if agent_config else settings.DEFAULT_TEMPERATURE
            )
            
            # 4. 保存对话历史
            self.session_manager.add_message(thread_id, "user", message)
            self.session_manager.add_message(thread_id, "assistant", response, chunks_metadata)
            
            return {
                "id": str(uuid.uuid4()),
                "type": "ai",
                "content": response,
                "chunks": chunks_metadata,
                "thread_id": thread_id,
                "agent_id": self.agent_id,
                "run_id": str(uuid.uuid4())
            }
            
        except Exception as e:
            return {
                "id": str(uuid.uuid4()),
                "type": "ai",
                "content": f"知识库聊天Agent错误: {e}",
                "chunks": [],
                "thread_id": thread_id,
                "agent_id": self.agent_id,
                "run_id": str(uuid.uuid4())
            }
    
    def get_session_history(self, thread_id: str) -> List[Dict]:
        """获取会话历史"""
        session = self.session_manager.get_session(thread_id)
        if not session:
            return []
        return session.get("messages", [])
    
    async def get_chunk_image(self, image_id: str) -> bytes:
        """获取chunk对应的图片"""
        return await self.ragflow_client.get_document_image(image_id)
