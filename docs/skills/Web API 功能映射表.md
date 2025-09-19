# Web API 功能映射表
## 通过统一鉴权方案，现在可以用API Token访问的Web API功能

### 1. 文档管理增强功能

| 功能 | Web API接口 | 用法示例                 | RAG价值        |
| ------ | ------------- | -------------------------- | ---------------- |
| **网页爬取**     | `POST /v1/document/web_crawl`            | 自动爬取网页并解析为文档 | 自动化内容获取 |
| **解析器切换**     | `POST /v1/document/change_parser`            | 为特定文档切换最优解析器 | 提升解析质量   |
| **文档预览**     | `GET /v1/document/get/<doc_id>`            | 获取文档原始内容进行验证 | 质量控制       |
| **图片提取**     | `GET /v1/document/image/<image_id>`            | 提取文档中的图片资源     | 多模态处理     |
| **元数据管理**     | `POST /v1/document/set_meta`            | 设置文档的业务元数据     | 增强检索       |
| **批量状态控制**     | `POST /v1/document/change_status`            | 批量启用/禁用文档        | 流程管理       |

#### 使用示例

```bash
# 网页爬取
curl -X POST 'http://localhost:8080/v1/document/web_crawl' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2' \
  -F 'kb_id=your_kb_id' \
  -F 'name=网页标题' \
  -F 'url=https://example.com'

# 切换解析器
curl -X POST 'http://localhost:8080/v1/document/change_parser' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2' \
  -H 'Content-Type: application/json' \
  -d '{"doc_id": "doc_id", "parser_id": "paper"}'
```

### 2. 分块处理高级功能

| 功能 | Web API接口 | 用法示例                   | RAG价值  |
| ------ | ------------- | ---------------------------- | ---------- |
| **检索测试**     | `POST /v1/chunk/retrieval_test`            | 测试分块检索效果和参数调优 | 质量验证 |
| **知识图谱**     | `GET /v1/chunk/knowledge_graph`            | 生成文档的知识图谱         | 关系挖掘 |
| **分块编辑**     | `POST /v1/chunk/set`            | 手动优化分块内容           | 质量提升 |
| **分块创建**     | `POST /v1/chunk/create`            | 手动添加重要内容分块       | 内容补充 |
| **状态管理**     | `POST /v1/chunk/switch`            | 精确控制分块的启用状态     | 精准控制 |
| **高级搜索**     | `POST /v1/chunk/list`            | 支持关键词的分块搜索       | 内容管理 |

#### 使用示例

```bash
# 检索测试
curl -X POST 'http://localhost:8080/v1/chunk/retrieval_test' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2' \
  -H 'Content-Type: application/json' \
  -d '{
    "kb_id": "your_kb_id",
    "question": "测试问题",
    "topk": 10,
    "similarity_threshold": 0.1,
    "vector_similarity_weight": 0.3,
    "keywords_similarity_weight": 0.7
  }'

# 获取知识图谱
curl -X GET 'http://localhost:8080/v1/chunk/knowledge_graph?doc_id=your_doc_id' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2'
```

### 3. 知识库管理增强

| 功能 | Web API接口 | 用法示例           | RAG价值      |
| ------ | ------------- | -------------------- | -------------- |
| **嵌入模型切换**     | `POST /v1/kb/switch_embd`            | 动态切换嵌入模型   | 优化检索效果 |
| **详细统计**     | `GET /v1/kb/detail`            | 获取知识库详细统计 | 运营分析     |
| **权限管理**     | `POST /v1/kb/update`            | 设置知识库访问权限 | 协作管理     |
| **解析配置**     | `POST /v1/kb/update`            | 配置知识库解析参数 | 质量优化     |

#### 使用示例

```bash
# 切换嵌入模型
curl -X POST 'http://localhost:8080/v1/kb/switch_embd' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2' \
  -H 'Content-Type: application/json' \
  -d '{"kb_id": "your_kb_id", "embd_id": "new_embedding_model"}'

# 获取知识库详情
curl -X GET 'http://localhost:8080/v1/kb/detail?kb_id=your_kb_id' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2'
```

### 4. 搜索应用管理

| 功能 | Web API接口 | 用法示例           | RAG价值  |
| ------ | ------------- | -------------------- | ---------- |
| **搜索应用创建**     | `POST /v1/search/create`            | 创建专门的搜索应用 | 场景定制 |
| **搜索应用配置**     | `POST /v1/search/update`            | 配置搜索参数和策略 | 效果优化 |
| **搜索应用详情**     | `GET /v1/search/detail`            | 获取搜索应用配置   | 配置管理 |
| **搜索应用列表**     | `POST /v1/search/list`            | 管理多个搜索应用   | 批量管理 |

#### 使用示例

```bash
# 创建搜索应用
curl -X POST 'http://localhost:8080/v1/search/create' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2' \
  -H 'Content-Type: application/json' \
  -d '{"name": "客服搜索", "description": "客服专用搜索应用"}'

# 获取搜索应用详情
curl -X GET 'http://localhost:8080/v1/search/detail?search_id=your_search_id' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2'
```

### 5. 对话管理高级功能

| 功能 | Web API接口 | 用法示例             | RAG价值  |
| ------ | ------------- | ---------------------- | ---------- |
| **对话配置**     | `POST /v1/dialog/set`            | 配置检索策略和提示词 | 效果调优 |
| **对话详情**     | `GET /v1/dialog/get`            | 获取对话配置信息     | 配置管理 |
| **对话列表**     | `GET /v1/dialog/list`            | 管理多个对话配置     | 批量管理 |

#### 使用示例

```bash
# 配置对话参数
curl -X POST 'http://localhost:8080/v1/dialog/set' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2' \
  -H 'Content-Type: application/json' \
  -d '{
    "dialog_id": "your_dialog_id",
    "prompt_config": {
      "system": "你是一个专业的AI助手",
      "retrieval_number_of_documents": 6,
      "retrieval_similarity_threshold": 0.2,
      "temperature": 0.1
    }
  }'
```

### 6. 系统管理功能

| 功能 | Web API接口 | 用法示例          | RAG价值  |
| ------ | ------------- | ------------------- | ---------- |
| **系统状态**     | `GET /v1/system/status`            | 监控系统健康状态  | 运维监控 |
| **Token管理**     | `POST /v1/system/new_token`            | 创建新的API Token | 权限管理 |
| **Token列表**     | `GET /v1/system/token_list`            | 管理现有Token     | 安全管理 |
| **系统配置**     | `GET /v1/system/config`            | 获取系统配置信息  | 配置管理 |

#### 使用示例

```bash
# 获取系统状态
curl -X GET 'http://localhost:8080/v1/system/status' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2'

# 创建新Token
curl -X POST 'http://localhost:8080/v1/system/new_token' \
  -H 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2' \
  -H 'Content-Type: application/json' \
  -d '{"dialog_id": "dialog_id", "source": "agent"}'
```

## 7. 工作流画布功能 (高级)

| 功能类别 | Web API接口 | 描述                 |
| ---------- | ------------- | ---------------------- |
| **模板管理**         | `GET /v1/canvas/templates`            | 获取预定义工作流模板 |
| **工作流执行**         | `POST /v1/canvas/completion`            | 执行复杂的RAG工作流  |
| **调试功能**         | `POST /v1/canvas/debug`            | 调试工作流节点       |
| **版本管理**         | `GET /v1/canvas/getlistversion/<id>`            | 工作流版本控制       |

## 8. 使用建议

### 8.1 渐进式迁移策略

1. **第一阶段**：继续使用RESTful API进行基础操作
2. **第二阶段**：逐步使用Web API的高级功能进行优化
3. **第三阶段**：全面利用Web API的丰富功能

### 8.2 最佳实践

1. **质量优化**：使用检索测试功能验证和调优检索效果
2. **内容管理**：利用知识图谱和高级搜索功能管理内容
3. **系统监控**：使用系统状态接口进行健康监控
4. **权限控制**：通过Token管理实现精细化权限控制

### 8.3 注意事项

1. **兼容性**：Web API接口可能会有更频繁的更新
2. **复杂性**：Web API功能更复杂，需要更多的参数配置
3. **性能**：某些高级功能可能需要更多的计算资源