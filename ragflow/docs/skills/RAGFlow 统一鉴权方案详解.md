# 1.RAGFlow 统一鉴权方案详解
## 1. 背景问题

### 1.1 原有鉴权架构

RAGFlow 原本存在两套独立的鉴权体系：

#### RESTful API 鉴权 (`/api/v1/*`)

- **装饰器**: `@token_required`
- **Token格式**: `Authorization: Bearer <api_token>`
- **Token类型**: 永久有效的API密钥
- **存储位置**: `api_token` 数据表
- **使用场景**: 外部系统集成，程序化调用

```python
# 示例：RESTful API
@manager.route("/datasets/<dataset_id>/documents", methods=["GET"])
@token_required
def list_documents(tenant_id, dataset_id):
    # tenant_id 由装饰器自动注入
    pass
```

#### Web API 鉴权 (`/v1/*`)

- **装饰器**: `@login_required` (Flask-Login)
- **Token格式**: `Authorization: <jwt_session_token>`
- **Token类型**: 会话token，会过期失效
- **存储位置**: 用户表的 `access_token` 字段
- **使用场景**: Web界面内部调用

```python
# 示例：Web API
@manager.route('/get', methods=['GET'])
@login_required
def get():
    # 通过 current_user.id 获取用户信息
    tenants = UserTenantService.query(user_id=current_user.id)
    pass
```

### 1.2 存在的问题

1. **双重维护**: 两套鉴权逻辑需要分别维护
2. **功能割裂**: Web API功能丰富但需要会话token，RESTful API功能有限
3. **集成困难**: 外部系统无法直接使用Web API的丰富功能
4. **Token管理**: 会话token会过期，不适合长期集成

## 2. 解决方案设计

### 2.1 设计目标

- **统一鉴权**: 让Web API同时支持两种token格式
- **最小修改**: 不破坏现有代码结构
- **完全兼容**: 保持原有功能不变
- **自动适配**: 所有Web API接口自动获得双重鉴权能力

### 2.2 技术方案

通过增强Flask-Login的 `request_loader` 机制，实现统一的鉴权入口。

## 3. 实现详解

### 3.1 核心原理

Flask-Login 的 `request_loader` 是一个钩子函数，每次请求时都会调用来加载用户信息。我们在这里实现双重鉴权逻辑。

### 3.2 原有实现

```python
@login_manager.request_loader
def load_user(web_request):
    jwt = Serializer(secret_key=settings.SECRET_KEY)
    authorization = web_request.headers.get("Authorization")
    if authorization:
        try:
            # 只支持JWT Session Token
            access_token = str(jwt.loads(authorization))
            user = UserService.query(access_token=access_token, status=StatusEnum.VALID.value)
            if user:
                return user[0]
        except Exception as e:
            logging.warning(f"load_user got exception {e}")
    return None
```

### 3.3 增强后的实现

```python
@login_manager.request_loader
def load_user(web_request):
    authorization = web_request.headers.get("Authorization")
    if not authorization:
        return None
    
    # 方式1: RESTful API Token鉴权 (Bearer格式)
    if authorization.startswith("Bearer "):
        try:
            from api.db.db_models import APIToken
            
            authorization_list = authorization.split()
            if len(authorization_list) >= 2:
                token = authorization_list[1]
                objs = APIToken.query(token=token)
                if objs:
                    # 创建虚拟用户对象
                    class APITokenUser:
                        def __init__(self, tenant_id):
                            self.id = tenant_id  # 直接使用tenant_id作为user.id
                            self.tenant_id = tenant_id
                            self.is_authenticated = True
                            self.is_active = True
                            self.is_anonymous = False
                        
                        def get_id(self):
                            return self.tenant_id
                    
                    return APITokenUser(objs[0].tenant_id)
        except Exception as e:
            logging.warning(f"API token authentication failed: {e}")
    
    # 方式2: Web Session Token鉴权 (JWT格式) - 保持原有逻辑
    try:
        jwt = Serializer(secret_key=settings.SECRET_KEY)
        access_token = str(jwt.loads(authorization))
        # ... 原有JWT验证逻辑
    except Exception as e:
        logging.warning(f"Session token authentication failed: {e}")
        return None
```

### 3.4 关键技术点

#### 3.4.1 Token格式识别

通过 `Bearer ` 前缀区分两种token：

- `Authorization: Bearer <api_token>` → RESTful API Token
- `Authorization: <jwt_session_token>` → Web Session Token

#### 3.4.2 虚拟用户对象

为API Token创建虚拟用户对象，包含必要的属性：

- `id`: 使用tenant_id，让现有代码能正常工作
- `is_authenticated`: 标记为已认证
- `get_id()`: Flask-Login要求的方法

#### 3.4.3 Service层适配

现有Web API通过 `UserTenantService.query(user_id=current_user.id)` 获取tenant信息。为了让API Token用户也能正常工作，我们添加了monkey patch：

```python
# Monkey patch UserTenantService to support API Token users
_original_user_tenant_query = UserTenantService.query

def patched_user_tenant_query(user_id=None, **kwargs):
    # 如果user_id看起来像tenant_id（32位字符），直接返回模拟的tenant对象
    if user_id and len(str(user_id)) == 32 and not kwargs:
        class MockTenant:
            def __init__(self, tenant_id):
                self.tenant_id = tenant_id
                self.user_id = tenant_id
        return [MockTenant(user_id)]
    
    # 否则使用原始查询方法
    return _original_user_tenant_query(user_id=user_id, **kwargs)

UserTenantService.query = patched_user_tenant_query
```

## 4. 使用效果

### 4.1 统一的接口调用

现在同一个Web API接口可以用两种方式调用：

```bash
# 方式1: 使用RESTful API Token (永久有效)
curl --location --request GET 'http://localhost:8080/v1/chunk/get?chunk_id=xxx' \
--header 'Authorization: Bearer ragflow-ViYWE4MzM4OGEwNDExZjA5N2UyMjJiY2'

# 方式2: 使用Web Session Token (会过期)
curl --location --request GET 'http://localhost:8080/v1/chunk/get?chunk_id=xxx' \
--header 'Authorization: IjU3MzQzNWEwOGY5YTExZjA5N2UyMjJiY2.aMOxNQ.-Xa_reh84q9G_IOwWegVG31rv8M'
```

### 4.2 自动支持的接口

所有使用 `@login_required` 装饰器的Web API接口都自动获得双重鉴权能力：

- `/v1/chunk/get` - 获取chunk详情
- `/v1/chunk/list` - 列出chunks
- `/v1/search/detail` - 获取搜索详情
- `/v1/search/list` - 列出搜索应用
- 以及其他所有Web API接口

## 5. 方案优势

### 5.1 代码层面

- **最小修改**: 只修改了一个文件 `api/apps/__init__.py`
- **零破坏**: 完全兼容现有功能和接口
- **集中管理**: 鉴权逻辑集中在一个地方
- **易于维护**: 后续修改只需要改一个地方

### 5.2 功能层面

- **功能统一**: Web API的丰富功能现在可以用API Token访问
- **长期集成**: API Token永久有效，适合系统集成
- **灵活选择**: 根据场景选择合适的token类型
- **平滑迁移**: 现有集成无需修改

### 5.3 架构层面

- **架构简化**: 从双重鉴权体系简化为统一鉴权
- **扩展性好**: 未来可以轻松添加新的鉴权方式
- **标准兼容**: 支持标准的Bearer Token格式

## 6. 总结

通过巧妙地增强Flask-Login的 `request_loader` 机制，我们用最少的代码实现了RAGFlow鉴权体系的统一。这个方案不仅解决了原有的问题，还为未来的扩展奠定了良好的基础。

**核心思想**: 在鉴权的入口处做统一处理，让后续的业务逻辑无需感知token类型的差异，从而实现了"一次修改，全局生效"的效果。