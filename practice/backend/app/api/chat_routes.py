"""
聊天API路由
处理所有聊天相关的API请求
"""
import logging
import json
from typing import AsyncGenerator
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse, Response
from asyncio import CancelledError

from api.schemas import UserInput, StreamInput, ChatMessage, APIResponse
from ai.agents.agents import get_agent, list_agents, get_agent_info, DEFAULT_AGENT
from utils.chat_utils import format_sse_data

logger = logging.getLogger(__name__)

# 创建路由器
chat_router = APIRouter(prefix="/chat", tags=["chat"])


@chat_router.post("/invoke", response_model=ChatMessage)
async def invoke(user_input: UserInput) -> ChatMessage:
    """
    非流式聊天接口
    
    如果没有提供agent_id，将使用默认Agent。
    使用thread_id来持久化和继续多轮对话。
    """
    try:
        agent = get_agent(user_input.agent_id)
        
        # 处理输入参数
        thread_id = user_input.thread_id or str(uuid4())
        
        # 调用Agent
        response = await agent.chat_invoke(
            message=user_input.message,
            thread_id=thread_id,
            agent_config=user_input.agent_config
        )
        
        return ChatMessage(**response)
        
    except Exception as e:
        logger.error(f"聊天调用错误: {e}")
        raise HTTPException(status_code=500, detail=f"聊天服务错误: {str(e)}")


@chat_router.post("/stream", response_class=StreamingResponse)
async def stream(user_input: StreamInput) -> StreamingResponse:
    """
    流式聊天接口
    
    返回Server-Sent Events格式的流式响应
    """
    return StreamingResponse(
        message_generator(user_input),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


async def message_generator(user_input: StreamInput) -> AsyncGenerator[str, None]:
    """
    异步消息生成器，用于流式Agent响应
    """
    try:
        agent = get_agent(user_input.agent_id)
        
        # 处理输入参数
        thread_id = user_input.thread_id or str(uuid4())
        
        # 流式调用Agent
        async for event in agent.chat_stream(
            message=user_input.message,
            thread_id=thread_id,
            agent_config=user_input.agent_config
        ):
            yield format_sse_data(event)
            
    except GeneratorExit:
        logger.info("流式响应被客户端关闭")
        return
    except CancelledError:
        logger.info("流式响应被取消")
        return
    except Exception as e:
        logger.error(f"流式消息生成错误: {e}")
        error_event = {
            "type": "error",
            "content": f"处理请求时发生错误: {str(e)}"
        }
        yield format_sse_data(error_event)
    finally:
        # 发送结束信号
        end_event = {"type": "end", "content": ""}
        yield format_sse_data(end_event)


@chat_router.get("/agents", response_model=APIResponse)
async def get_agents():
    """获取所有可用的Agent列表"""
    try:
        agents = list_agents()
        return APIResponse(
            code=200,
            message="success",
            data={"agents": list(agents.values())}
        )
    except Exception as e:
        logger.error(f"获取Agent列表错误: {e}")
        raise HTTPException(status_code=500, detail=f"获取Agent列表失败: {str(e)}")


@chat_router.get("/agents/{agent_id}", response_model=APIResponse)
async def get_agent_detail(agent_id: str):
    """获取特定Agent的详细信息"""
    try:
        agent_info = get_agent_info(agent_id)
        return APIResponse(
            code=200,
            message="success",
            data=agent_info
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"获取Agent信息错误: {e}")
        raise HTTPException(status_code=500, detail=f"获取Agent信息失败: {str(e)}")


@chat_router.get("/sessions/{thread_id}/history", response_model=APIResponse)
async def get_session_history(thread_id: str):
    """获取会话历史"""
    try:
        # 使用默认Agent获取会话历史
        agent = get_agent(DEFAULT_AGENT)
        history = agent.get_session_history(thread_id)
        
        return APIResponse(
            code=200,
            message="success",
            data={
                "thread_id": thread_id,
                "messages": history,
                "total_count": len(history)
            }
        )
    except Exception as e:
        logger.error(f"获取会话历史错误: {e}")
        raise HTTPException(status_code=500, detail=f"获取会话历史失败: {str(e)}")


@chat_router.get("/chunks/image/{image_id}")
async def get_chunk_image(image_id: str):
    """获取知识片段对应的图片"""
    try:
        # 使用默认Agent获取图片
        agent = get_agent(DEFAULT_AGENT)
        image_data = await agent.get_chunk_image(image_id)
        
        return Response(content=image_data, media_type="image/jpeg")
        
    except Exception as e:
        logger.error(f"获取图片错误: {e}")
        raise HTTPException(status_code=404, detail=f"图片不存在: {str(e)}")


@chat_router.get("/health", response_model=APIResponse)
async def health_check():
    """聊天服务健康检查"""
    return APIResponse(
        code=200,
        message="success",
        data={
            "status": "healthy",
            "service": "RAGFlow聊天服务",
            "available_agents": len(list_agents())
        }
    )
