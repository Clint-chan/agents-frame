"""
会话管理器
管理用户会话和对话历史
"""
from typing import Dict, List, Optional
import time


class SessionManager:
    """会话管理器"""
    
    def __init__(self):
        self.sessions: Dict[str, Dict] = {}
    
    def create_session(self, thread_id: str) -> Dict:
        """创建新会话"""
        session = {
            "id": thread_id,
            "messages": [],
            "chunks_history": [],
            "created_at": time.time(),
            "updated_at": time.time()
        }
        self.sessions[thread_id] = session
        return session
    
    def get_session(self, thread_id: str) -> Optional[Dict]:
        """获取会话"""
        return self.sessions.get(thread_id)
    
    def add_message(self, thread_id: str, role: str, content: str, chunks: List[Dict] = None):
        """添加消息到会话历史"""
        if thread_id not in self.sessions:
            self.create_session(thread_id)
        
        message = {
            "role": role,
            "content": content,
            "chunks": chunks or [],
            "timestamp": time.time()
        }
        self.sessions[thread_id]["messages"].append(message)
        self.sessions[thread_id]["updated_at"] = time.time()
        
        # 保持历史记录在合理范围内
        max_history = 50  # 保留最近25轮对话
        if len(self.sessions[thread_id]["messages"]) > max_history:
            self.sessions[thread_id]["messages"] = self.sessions[thread_id]["messages"][-max_history:]
    
    def get_chat_history(self, thread_id: str, max_turns: int = 5) -> List[Dict]:
        """获取聊天历史（用于LLM上下文）"""
        if thread_id not in self.sessions:
            return []
        
        messages = self.sessions[thread_id]["messages"]
        # 只返回最近的几轮对话，不包含chunks信息
        recent_messages = messages[-(max_turns * 2):] if messages else []
        return [{"role": msg["role"], "content": msg["content"]} for msg in recent_messages]
    
    def delete_session(self, thread_id: str) -> bool:
        """删除会话"""
        if thread_id in self.sessions:
            del self.sessions[thread_id]
            return True
        return False
    
    def list_sessions(self) -> List[Dict]:
        """列出所有会话"""
        return [
            {
                "thread_id": thread_id,
                "created_at": session["created_at"],
                "updated_at": session["updated_at"],
                "message_count": len(session["messages"])
            }
            for thread_id, session in self.sessions.items()
        ]
    
    def cleanup_old_sessions(self, max_age_hours: int = 24):
        """清理过期会话"""
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        expired_sessions = [
            thread_id for thread_id, session in self.sessions.items()
            if current_time - session["updated_at"] > max_age_seconds
        ]
        
        for thread_id in expired_sessions:
            del self.sessions[thread_id]
        
        return len(expired_sessions)
