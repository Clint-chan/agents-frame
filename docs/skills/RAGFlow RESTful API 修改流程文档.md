# RAGFlow RESTful API 修改流程文档
基于添加 `doc_type_kwd` 字段的实际案例，总结完整的修改流程和注意事项。

## 1. 理解RAGFlow API架构

### API路由结构

```
RAGFlow API 架构:
├── /api/v1/ (外部RESTful API)
│   └── 位置: api/apps/sdk/*.py
│   └── 用途: 对外提供标准RESTful API
│
└── /v1/ (内部Web API)  
    └── 位置: api/apps/*.py
    └── 用途: Web界面内部调用
```

### 路由注册机制

```python
def register_page(page_path):
    sdk_path = "\\sdk\\" if sys.platform.startswith("win") else "/sdk/"
    url_prefix = (
        f"/api/{API_VERSION}" if sdk_path in path else f"/{API_VERSION}/{page_name}"
    )
    app.register_blueprint(page.manager, url_prefix=url_prefix)
```

**关键点**: SDK目录下的文件自动使用 `/api/v1/` 前缀

## 2. 修改流程

### 步骤1: 定位目标API文件

- **外部API**: 查找 `api/apps/sdk/` 目录下的相关文件
- **内部API**: 查找 `api/apps/` 目录下的相关文件
- **本例**: `api/apps/sdk/doc.py` 中的 `list_chunks` 函数

### 步骤2: 分析现有实现

```python
@manager.route("/datasets/<dataset_id>/documents/<document_id>/chunks", methods=["GET"])
@token_required
def list_chunks(tenant_id, dataset_id, document_id):
    # 需要修改两个地方：
    # 1. 单个chunk查询的返回结果
    # 2. 批量chunk查询的返回结果
```

### 步骤3: 参考内部API实现

- 查看内部API如何处理相同数据
- 确保字段名称和数据格式一致
- **本例**: 内部API直接返回chunk的所有字段，外部API需要手动添加

### 步骤4: 修改代码

**单个chunk查询修改**:

```python
final_chunk = {
    "id": chunk.get("id", chunk.get("chunk_id")),
    "content": chunk["content_with_weight"],
    # ... 其他字段
    "doc_type_kwd": chunk.get("doc_type_kwd", ""),  # 新增字段
}
```

**批量chunk查询修改**:

```python
d = {
    "id": id,
    "content": (rmSpace(sres.highlight[id]) if question and id in sres.highlight else sres.field[id].get("content_with_weight", "")),
    # ... 其他字段
    "doc_type_kwd": sres.field[id].get("doc_type_kwd", ""),  # 新增字段
}
```

### 步骤5: 更新API文档

在函数的docstring中添加字段描述：

```yaml
doc_type_kwd:
  type: string
  description: Document type keyword (e.g., "image" for image chunks).
```

## 3. Docker部署配置

### 问题识别

使用预构建镜像时，本地代码修改不会生效：

```yaml
services:
  ragflow:
    image: ${RAGFLOW_IMAGE}  # 使用预构建镜像
```

### 解决方案

挂载本地代码到容器：

```yaml
volumes:
  - ./ragflow-logs:/ragflow/logs
  - ./nginx/ragflow.conf:/etc/nginx/conf.d/ragflow.conf
  # ... 其他挂载
  - ../api:/ragflow/api  # 挂载本地API代码
```

### 重启服务

```bash
# 停止服务
docker compose -f docker/docker-compose.yml down

# 启动服务
docker compose -f docker/docker-compose.yml up -d
```

## 4. 测试验证

### 测试命令

```bash
curl -s -H "Authorization: Bearer <YOUR_API_KEY>" \
  "http://<HOST>:<PORT>/api/v1/datasets/<DATASET_ID>/documents/<DOC_ID>/chunks?id=<CHUNK_ID>&page=1&page_size=1"
```

### 验证要点

1. **字段存在性**: 确认新字段出现在响应中
2. **数据正确性**: 验证字段值符合预期
3. **兼容性**: 确保不影响现有功能

## 5. 注意事项

### 🔴 关键注意事项

#### 5.1 Docker挂载路径

- **错误**: 挂载整个项目根目录可能导致权限问题
- **正确**: 只挂载需要修改的特定目录 (`../api:/ragflow/api`)

#### 5.2 代码修改位置

- **外部API**: 必须修改 `api/apps/sdk/` 下的文件
- **内部API**: 修改 `api/apps/` 下的文件
- **混淆风险**: 修改错误位置导致修改不生效

#### 5.3 数据一致性

- 确保新字段在所有相关查询路径中都有处理
- **本例**: 需要同时处理单个查询和批量查询两种情况

#### 5.4 默认值处理

```python
# 推荐: 使用.get()方法提供默认值
"doc_type_kwd": chunk.get("doc_type_kwd", "")

# 避免: 直接访问可能不存在的键
"doc_type_kwd": chunk["doc_type_kwd"]  # 可能抛出KeyError
```

#### 5.5 API文档同步

- 修改代码的同时必须更新API文档
- 确保Swagger文档中包含新字段描述

### ⚠️ 常见陷阱

1. **容器缓存**: 修改后需要重启Docker服务
2. **路径错误**: 确认挂载路径正确对应
3. **权限问题**: 确保挂载目录有正确的读写权限
4. **版本不一致**: 确保本地代码版本与镜像版本兼容

### 📋 检查清单

- [ ] 确认修改的是正确的API文件 (`api/apps/sdk/`)
- [ ] 处理了所有相关的查询路径
- [ ] 提供了合适的默认值
- [ ] 更新了API文档
- [ ] 正确配置了Docker挂载
- [ ] 重启了Docker服务
- [ ] 进行了完整的功能测试
- [ ] 验证了字段的数据正确性

## 6. 最佳实践

### 6.1 开发流程

1. **先理解**: 分析现有API结构和数据流
2. **再参考**: 查看内部API的实现方式
3. **小步修改**: 逐步添加字段，避免大范围修改
4. **及时测试**: 每次修改后立即验证

### 6.2 代码质量

- 保持与现有代码风格一致
- 添加适当的注释说明
- 使用防御性编程（如 `.get()` 方法）

### 6.3 部署策略

- 开发环境使用代码挂载
- 生产环境考虑重新构建镜像
- 保持配置文件的版本控制

通过遵循这个流程和注意事项，可以安全、高效地修改RAGFlow的RESTful API接口。