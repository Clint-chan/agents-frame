# RAGFlow聊天助手项目

基于RAGFlow构建的智能知识库问答系统，采用现代化的前后端分离架构，支持多轮对话、引用标记、流式响应等功能。

## 项目特性

- 🤖 **智能问答**: 基于RAGFlow的知识库检索和大模型生成
- 💬 **多轮对话**: 支持上下文记忆的连续对话
- 📚 **引用标记**: 自动标记知识来源，支持溯源
- ⚡ **流式响应**: 实时显示生成过程，提升用户体验
- 🖼️ **图片支持**: 支持文档中的图片内容展示
- 🔄 **会话管理**: 完整的会话历史管理功能
- 🎨 **现代化界面**: 基于Next.js和Ant Design的美观界面
- 🏗️ **微服务架构**: 前后端分离，支持独立部署和扩展

## 技术栈

### 后端
- **框架**: FastAPI + Python
- **AI集成**: RAGFlow + OpenAI兼容接口
- **数据处理**: Pydantic + aiohttp
- **会话管理**: 内存存储 (可扩展为Redis/数据库)

### 前端
- **框架**: Next.js 14 + TypeScript
- **UI组件**: Ant Design
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **实时通信**: Server-Sent Events (SSE)

## 项目结构

```
practice/
├── backend/                # 后端服务
│   ├── app/               # 应用主目录
│   │   ├── main.py        # FastAPI应用入口
│   │   ├── core/          # 核心配置
│   │   ├── api/           # API路由
│   │   ├── ai/            # AI模块
│   │   │   ├── agents/    # Agent实现
│   │   │   ├── rag/       # RAGFlow集成
│   │   │   └── llm.py     # 大模型客户端
│   │   └── utils/         # 工具函数
│   └── requirements.txt   # Python依赖
├── frontend/              # 前端应用
│   ├── app/              # Next.js应用
│   │   ├── chat/         # 聊天页面
│   │   ├── components/   # 共享组件
│   │   └── layout.tsx    # 布局组件
│   ├── package.json      # Node.js依赖
│   └── .env.local        # 环境变量
├── start.py             # 项目启动脚本
└── README.md            # 项目文档
```

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd practice

# 检查环境
python start.py check
```

### 2. 安装依赖

```bash
# 安装所有依赖（后端+前端）
python start.py install

# 或者分别安装
pip install -r backend/requirements.txt
cd frontend && npm install
```

### 3. 配置设置

编辑 `backend/app/core/config.py` 文件，配置以下参数：

```python
# RAGFlow配置
RAGFLOW_API_KEY: str = "your-ragflow-api-key"
RAGFLOW_BASE_URL: str = "http://your-ragflow-server"
KB_ID: str = "your-knowledge-base-id"

# LLM配置
LLM_API_KEY: str = "your-llm-api-key"
LLM_BASE_URL: str = "http://your-llm-server/v1"
LLM_MODEL: str = "your-model-name"
```

### 4. 启动服务

#### 方式一：全栈启动（推荐）

```bash
# 启动后端+前端
python start.py fullstack
```

#### 方式二：分别启动

```bash
# 启动后端 (终端1)
python start.py backend

# 启动前端 (终端2)
python start.py frontend
```

### 5. 访问应用

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## 使用指南

### Web界面使用

1. **开始对话**: 访问 http://localhost:3000，选择Agent开始对话
2. **多轮对话**: 系统自动维护对话上下文
3. **查看引用**: 点击回答中的知识片段查看详细信息
4. **会话管理**: 左侧边栏管理多个对话会话
5. **Agent切换**: 顶部可以切换不同的AI Agent

### API接口使用

#### 1. 流式聊天接口

```bash
curl -X POST "http://localhost:8000/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "什么是RAGFlow？",
    "thread_id": "test-session",
    "agent_id": "knowledge-chat",
    "stream_tokens": true
  }'
```

#### 2. 非流式聊天接口

```bash
curl -X POST "http://localhost:8000/chat/invoke" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "RAGFlow有哪些功能？",
    "thread_id": "test-session",
    "agent_id": "knowledge-chat"
  }'
```

## 开发指南

### 添加新Agent

1. 在 `backend/app/ai/agents/` 目录下创建新Agent类
2. 实现 `chat_stream` 和 `chat_invoke` 方法
3. 在 `agents.py` 中注册新Agent
4. 更新前端的Agent选择器

### 自定义前端

1. 修改 `frontend/app/` 下的组件
2. 使用Ant Design组件库
3. 通过API与后端通信

## 配置说明

### 后端配置 (backend/app/core/config.py)

```python
class Settings(BaseSettings):
    # 基础配置
    APP_NAME: str = "RAGFlow聊天助手"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # RAGFlow配置
    RAGFLOW_API_KEY: str = "your-api-key"
    RAGFLOW_BASE_URL: str = "http://demo.ragflow.io"
    KB_ID: str = "your-kb-id"
    
    # LLM配置
    LLM_API_KEY: str = "xinference"
    LLM_BASE_URL: str = "http://demo.ragflow.io:9380/v1"
    LLM_MODEL: str = "qwen2.5-72b-instruct"
```

### 前端配置 (frontend/.env.local)

```bash
# 后端API地址
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# 应用配置
NEXT_PUBLIC_APP_NAME=RAGFlow聊天助手
```

## 故障排除

### 常见问题

1. **后端启动失败**
   - 检查Python版本 (>=3.8)
   - 验证依赖安装
   - 检查端口占用

2. **前端启动失败**
   - 检查Node.js版本 (>=16)
   - 清理缓存并重新安装依赖
   - 检查端口占用

3. **API连接失败**
   - 检查RAGFlow服务状态
   - 验证API密钥和配置
   - 查看后端日志

## 许可证

本项目采用 MIT 许可证。
