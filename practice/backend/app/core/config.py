"""
应用配置模块
统一管理所有配置项
"""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用设置"""
    
    # 基础配置
    APP_NAME: str = "RAGFlow聊天助手"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS配置
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]
    
    # RAGFlow配置
    RAGFLOW_API_KEY: str = "ragflow-E0ZmYwNWE2OGZiZTExZjA4MzUyMmU0ZT"
    RAGFLOW_BASE_URL: str = "http://192.168.18.124:8080"
    
    # 检索配置
    RERANK_ID: str = "bce-reranker-base_v1@Xinference"
    SIMILARITY_THRESHOLD: float = 0.2
    RETRIEVAL_SIZE: int = 10
    TOP_K: int = 1024
    USE_KG: bool = False
    VECTOR_SIMILARITY_WEIGHT: float = 0.3
    
    # LLM配置
    LLM_API_KEY: str = "xinference"
    LLM_BASE_URL: str = "http://117.89.29.184:20005/v1"
    LLM_MODEL: str = "Qwen2.5-72B-Instruct"
    DEFAULT_TEMPERATURE: float = 0.1
    
    # 系统提示词
    SYSTEM_PROMPT: str = """你是一个专业的AI助手，基于提供的知识库内容回答用户问题。

知识库内容：
{knowledge}

请遵循以下规则：
1. 必须基于知识库内容回答，不能编造信息
2. 如果知识库中没有相关信息，请明确说明
3. 在回答中使用【1】【2】等标记引用对应的知识片段
4. 回答要准确、简洁、有条理
5. 如果问题不清楚，请要求用户澄清

请根据知识库内容回答用户的问题。"""
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # 忽略额外的环境变量


# 创建全局设置实例
settings = Settings()

# 检索配置字典
RETRIEVAL_CONFIG = {
    "rerank_id": settings.RERANK_ID,
    "similarity_threshold": settings.SIMILARITY_THRESHOLD,
    "size": settings.RETRIEVAL_SIZE,
    "top_k": settings.TOP_K,
    "use_kg": settings.USE_KG,
    "vector_similarity_weight": settings.VECTOR_SIMILARITY_WEIGHT
}

# LLM配置字典
LLM_CONFIG = {
    "api_key": settings.LLM_API_KEY,
    "base_url": settings.LLM_BASE_URL,
    "model": settings.LLM_MODEL
}
