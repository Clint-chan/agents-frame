"""
Agent管理模块
统一管理所有可用的Agent
"""
from typing import Dict, Any
from ai.agents.knowledge_chat_agent import KnowledgeChatAgent

# 默认Agent ID
DEFAULT_AGENT = "knowledge-chat"

# Agent实例缓存
_agent_instances: Dict[str, Any] = {}

# Agent配置
AGENT_CONFIGS = {
    "knowledge-chat": {
        "name": "知识库聊天助手",
        "description": "基于RAGFlow的智能知识库问答Agent",
        "class": KnowledgeChatAgent,
        "features": ["流式响应", "多轮对话", "引用标记", "图片预览"],
        "endpoints": ["/chat/stream", "/chat/invoke"]
    }
}


def get_agent(agent_id: str = None) -> Any:
    """
    获取Agent实例
    
    Args:
        agent_id: Agent ID，如果为None则使用默认Agent
        
    Returns:
        Agent实例
    """
    if not agent_id:
        agent_id = DEFAULT_AGENT
    
    # 检查Agent是否存在
    if agent_id not in AGENT_CONFIGS:
        raise ValueError(f"未知的Agent ID: {agent_id}")
    
    # 从缓存中获取或创建新实例
    if agent_id not in _agent_instances:
        agent_class = AGENT_CONFIGS[agent_id]["class"]
        _agent_instances[agent_id] = agent_class()
    
    return _agent_instances[agent_id]


def list_agents() -> Dict[str, Dict]:
    """
    获取所有可用的Agent列表
    
    Returns:
        Dict: Agent配置字典
    """
    return {
        agent_id: {
            "id": agent_id,
            "name": config["name"],
            "description": config["description"],
            "features": config["features"],
            "endpoints": config["endpoints"]
        }
        for agent_id, config in AGENT_CONFIGS.items()
    }


def get_agent_info(agent_id: str) -> Dict[str, Any]:
    """
    获取特定Agent的信息
    
    Args:
        agent_id: Agent ID
        
    Returns:
        Dict: Agent信息
    """
    if agent_id not in AGENT_CONFIGS:
        raise ValueError(f"未知的Agent ID: {agent_id}")
    
    config = AGENT_CONFIGS[agent_id]
    return {
        "id": agent_id,
        "name": config["name"],
        "description": config["description"],
        "features": config["features"],
        "endpoints": config["endpoints"]
    }


def register_agent(agent_id: str, agent_class: Any, config: Dict[str, Any]):
    """
    注册新的Agent
    
    Args:
        agent_id: Agent ID
        agent_class: Agent类
        config: Agent配置
    """
    AGENT_CONFIGS[agent_id] = {
        "class": agent_class,
        **config
    }
    
    # 清除缓存，强制重新创建实例
    if agent_id in _agent_instances:
        del _agent_instances[agent_id]
