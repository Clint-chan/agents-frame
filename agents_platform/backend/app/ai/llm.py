"""
大模型客户端封装
基于OpenAI兼容接口实现流式对话
"""
import asyncio
import traceback
from typing import AsyncGenerator, List, Dict
from openai import AsyncOpenAI
from core.config import settings, LLM_CONFIG


class LLMClient:
    """大模型客户端"""
    
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=LLM_CONFIG["api_key"],
            base_url=LLM_CONFIG["base_url"]
        )
        self.model = LLM_CONFIG["model"]
    
    async def chat_stream(
        self, 
        message: str, 
        knowledge: str, 
        chat_history: List[Dict] = None,
        temperature: float = settings.DEFAULT_TEMPERATURE
    ) -> AsyncGenerator[str, None]:
        """
        流式聊天接口
        
        Args:
            message: 用户消息
            knowledge: 格式化的知识库内容
            chat_history: 聊天历史
            temperature: 温度参数
            
        Yields:
            str: 流式返回的文本片段
        """
        try:
            # 构建系统提示词
            system_content = settings.SYSTEM_PROMPT.format(knowledge=knowledge)
            
            # 构建消息列表
            messages = [{"role": "system", "content": system_content}]
            
            # 添加历史对话
            if chat_history:
                messages.extend(chat_history)
            
            # 添加当前问题
            messages.append({"role": "user", "content": message})
            
            # 调用大模型
            chat_completion = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                stream=True
            )
            
            # 流式返回结果
            async for chunk in chat_completion:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            error_msg = f"大模型调用错误: {e}"
            print(error_msg)
            print(traceback.format_exc())
            yield error_msg
    
    async def chat_complete(
        self, 
        message: str, 
        knowledge: str, 
        chat_history: List[Dict] = None,
        temperature: float = settings.DEFAULT_TEMPERATURE
    ) -> str:
        """
        非流式聊天接口
        
        Args:
            message: 用户消息
            knowledge: 格式化的知识库内容
            chat_history: 聊天历史
            temperature: 温度参数
            
        Returns:
            str: 完整的回答
        """
        try:
            # 构建系统提示词
            system_content = settings.SYSTEM_PROMPT.format(knowledge=knowledge)
            
            # 构建消息列表
            messages = [{"role": "system", "content": system_content}]
            
            # 添加历史对话
            if chat_history:
                messages.extend(chat_history)
            
            # 添加当前问题
            messages.append({"role": "user", "content": message})
            
            # 调用大模型
            chat_completion = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                stream=False
            )
            
            return chat_completion.choices[0].message.content
            
        except Exception as e:
            error_msg = f"大模型调用错误: {e}"
            print(error_msg)
            print(traceback.format_exc())
            return error_msg
