"""
API数据模型定义
定义请求和响应的数据结构
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from uuid import UUID


class UserInput(BaseModel):
    """用户输入模型"""
    message: str = Field(..., description="用户消息")
    thread_id: Optional[str] = Field(None, description="会话ID")
    agent_id: Optional[str] = Field("knowledge-chat", description="Agent ID")
    agent_config: Optional[Dict[str, Any]] = Field(None, description="Agent配置")


class StreamInput(UserInput):
    """流式输入模型"""
    stream_tokens: Optional[bool] = Field(True, description="是否流式返回token")


class ChatMessage(BaseModel):
    """聊天消息模型"""
    id: str = Field(..., description="消息ID")
    type: str = Field(..., description="消息类型: human/ai")
    content: str = Field(..., description="消息内容")
    chunks: Optional[List[Dict]] = Field([], description="引用的知识片段")
    thread_id: Optional[str] = Field(None, description="会话ID")
    agent_id: Optional[str] = Field(None, description="Agent ID")
    run_id: Optional[str] = Field(None, description="运行ID")


class ChunkInfo(BaseModel):
    """知识片段信息模型"""
    index: int = Field(..., description="片段索引")
    chunk_id: str = Field(..., description="片段ID")
    content: str = Field(..., description="片段内容")
    document_id: str = Field(..., description="文档ID")
    document_name: str = Field(..., description="文档名称")
    image_id: Optional[str] = Field(None, description="图片ID")
    positions: List[Dict] = Field([], description="位置信息")
    similarity: float = Field(..., description="相似度")


class AgentInfo(BaseModel):
    """Agent信息模型"""
    id: str = Field(..., description="Agent ID")
    name: str = Field(..., description="Agent名称")
    description: str = Field(..., description="Agent描述")
    features: List[str] = Field(..., description="功能特性")
    endpoints: List[str] = Field(..., description="可用端点")


class SessionHistory(BaseModel):
    """会话历史模型"""
    thread_id: str = Field(..., description="会话ID")
    messages: List[Dict] = Field(..., description="消息列表")
    total_count: int = Field(..., description="消息总数")


class APIResponse(BaseModel):
    """API响应模型"""
    code: int = Field(200, description="状态码")
    message: str = Field("success", description="响应消息")
    data: Optional[Any] = Field(None, description="响应数据")


class StreamEvent(BaseModel):
    """流式事件模型"""
    type: str = Field(..., description="事件类型: status/chunks/token/message/error/end")
    content: Any = Field(..., description="事件内容")
    thread_id: Optional[str] = Field(None, description="会话ID")
    agent_id: Optional[str] = Field(None, description="Agent ID")
