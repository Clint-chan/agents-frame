"""
聊天工具函数
处理聊天相关的数据转换和格式化
"""
import json
from typing import Dict, Any


def format_sse_data(event: Dict[str, Any]) -> str:
    """
    格式化Server-Sent Events数据
    
    Args:
        event: 事件数据字典
        
    Returns:
        str: 格式化的SSE数据
    """
    try:
        data = json.dumps(event, ensure_ascii=False)
        return f"data: {data}\n\n"
    except Exception as e:
        # 如果序列化失败，返回错误事件
        error_data = json.dumps({
            "type": "error",
            "content": f"数据序列化错误: {str(e)}"
        }, ensure_ascii=False)
        return f"data: {error_data}\n\n"


def extract_citations(text: str) -> list:
    """
    从文本中提取引用标记
    
    Args:
        text: 包含引用标记的文本
        
    Returns:
        list: 引用标记列表
    """
    import re
    # 匹配【数字】格式的引用
    citations = re.findall(r'【(\d+)】', text)
    return [int(c) for c in citations]


def format_message_with_citations(content: str, chunks: list) -> Dict[str, Any]:
    """
    格式化包含引用的消息
    
    Args:
        content: 消息内容
        chunks: 知识片段列表
        
    Returns:
        Dict: 格式化的消息数据
    """
    citations = extract_citations(content)
    
    # 构建引用信息
    citation_info = []
    for citation_num in citations:
        if 1 <= citation_num <= len(chunks):
            chunk = chunks[citation_num - 1]
            citation_info.append({
                "index": citation_num,
                "document_name": chunk.get("document_name", ""),
                "content_preview": chunk.get("content", "")[:100] + "...",
                "similarity": chunk.get("similarity", 0.0),
                "image_id": chunk.get("image_id")
            })
    
    return {
        "content": content,
        "citations": citation_info,
        "chunks": chunks
    }


def convert_message_content_to_string(content: Any) -> str:
    """
    将消息内容转换为字符串
    
    Args:
        content: 消息内容（可能是字符串、列表或其他类型）
        
    Returns:
        str: 字符串格式的内容
    """
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        # 如果是列表，尝试提取文本内容
        text_parts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                text_parts.append(item["text"])
            elif isinstance(item, str):
                text_parts.append(item)
        return "".join(text_parts)
    elif isinstance(content, dict):
        # 如果是字典，尝试提取text字段
        return content.get("text", str(content))
    else:
        return str(content)


def remove_tool_calls(content: Any) -> str:
    """
    移除内容中的工具调用信息
    
    Args:
        content: 原始内容
        
    Returns:
        str: 清理后的内容
    """
    content_str = convert_message_content_to_string(content)
    
    # 这里可以添加更多的清理逻辑
    # 例如移除特定的工具调用标记
    
    return content_str


def validate_thread_id(thread_id: str) -> bool:
    """
    验证会话ID格式
    
    Args:
        thread_id: 会话ID
        
    Returns:
        bool: 是否有效
    """
    if not thread_id or not isinstance(thread_id, str):
        return False
    
    # 简单的长度和字符检查
    if len(thread_id) < 8 or len(thread_id) > 100:
        return False
    
    # 检查是否包含有效字符（字母、数字、连字符、下划线）
    import re
    if not re.match(r'^[a-zA-Z0-9\-_]+$', thread_id):
        return False
    
    return True


def sanitize_message_content(content: str) -> str:
    """
    清理消息内容，移除潜在的危险字符
    
    Args:
        content: 原始消息内容
        
    Returns:
        str: 清理后的内容
    """
    if not isinstance(content, str):
        content = str(content)
    
    # 移除控制字符
    import re
    content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
    
    # 限制长度
    max_length = 10000
    if len(content) > max_length:
        content = content[:max_length] + "..."
    
    return content.strip()
