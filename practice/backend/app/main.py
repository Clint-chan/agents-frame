"""
RAGFlow聊天助手后端主应用
基于FastAPI构建的多Agent聊天系统
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.chat_routes import chat_router
from core.config import settings

# 创建FastAPI应用
app = FastAPI(
    title="RAGFlow聊天助手API",
    description="基于RAGFlow的智能知识库问答系统",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(chat_router)

# 根路径
@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "RAGFlow聊天助手API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "service": "RAGFlow聊天助手API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
