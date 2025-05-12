---
title: "深入理解 FastAPI 参数：完整指南"
description: "一份友好且全面的 FastAPI 参数类型、依赖注入及特殊用法指南，配有清晰示例，助你构建更优质的 API"
slug: understanding-fastapi-parameters
date: 2025-04-07 00:00:00+0000
image: cover.webp
categories:
    - Python
    - Web开发
    - API开发
tags:
    - FastAPI
    - 依赖注入
    - Python
    - 后端
    - Web框架
---

你是否曾盯着 FastAPI 的代码发呆，疑惑它是如何“魔法般”地处理所有函数参数的？你并不孤单！FastAPI 的参数处理系统非常强大，但刚开始时它的工作方式可能让人觉得像是在解读外星科技。

泡上一杯咖啡 ☕️，让我们彻底揭开 FastAPI 参数的神秘面纱。

## 路径参数：来自 URL 的值

让我们从最简单的情况开始。路径参数直接来自 URL：

```python
@app.get("/users/{user_id}")
def read_user(user_id: int):
    return {"user_id": user_id}
```

当有人访问 `/users/42` 时，FastAPI 会从 URL 中提取 `42`，并作为 `user_id` 传递给你的函数。类型注解（`int`）会让 FastAPI 自动将 URL 中的字符串转换为整数。

## 查询参数：来自 ?key=value

查询参数来自 URL 的查询字符串（`?` 后面）：

```python
@app.get("/search/")
def search(q: str, page: int = 1, limit: int = 10):
    return {"query": q, "page": page, "limit": limit}
```

请求 `/search/?q=fastapi&limit=5` 时，你会得到 `{"query": "fastapi", "page": 1, "limit": 5}`。带有默认值的参数（如 `page` 和 `limit`）是可选的。

## 请求体：JSON 数据

对于 POST、PUT 等需要发送数据的方法，你通常会使用 Pydantic 模型来处理 JSON：

```python
from pydantic import BaseModel

class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = False

@app.post("/items/")
def create_item(item: Item):
    return {"item_name": item.name, "price_with_tax": item.price * 1.1}
```

当你的 API 收到如 `{"name": "Coffee Mug", "price": 12.99}` 的 JSON 时，FastAPI 会根据你的模型进行校验，并创建一个合适的 Python 对象。

## 表单数据与文件上传

用于处理表单提交和文件上传：

```python
from fastapi import File, Form, UploadFile

@app.post("/upload/")
async def upload_file(
    name: str = Form(...),
    file: UploadFile = File(...)
):
    return {
        "filename": file.filename,
        "name": name
    }
```

`Form(...)` 和 `File(...)` 告诉 FastAPI 这些值应从表单数据中获取，而不是 JSON。

## 依赖注入的魔法

这正是 FastAPI 闪耀之处。通过 `Depends()` 函数，你可以注入数据库连接、认证等：

```python
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

def get_db():
    db = SessionLocal()
    try:
        yield db  # yield 很重要！
    finally:
        db.close()  # 这会在你的端点函数执行后运行

@app.get("/items/{item_id}")
def read_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

当 FastAPI 看到 `Depends(get_db)` 时，它会：

1. 调用 `get_db()` 函数
2. 获取 yield 出来的对象（数据库会话）
3. 将其传递给你的端点函数
4. 在你的函数完成后，继续执行 `get_db()` 以运行清理代码

这种模式非常适合资源管理——如连接、文件等。

## 依赖注入实现认证

依赖注入的一个常见用途是认证：

```python
def get_current_user(token: str = Header(...)):
    if token != "secret-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"username": "john_doe"}

@app.get("/users/me")
def read_user_me(current_user: dict = Depends(get_current_user)):
    return current_user
```

这里，`get_current_user` 会检查 token，然后：

- 返回一个用户对象，传递给你的函数
- 或抛出异常，阻止你的函数运行

## FastAPI 的特殊参数（无需 Depends）

FastAPI 能自动识别某些类型并自动注入，无需 `Depends()`：

```python
from fastapi import Request, Response, BackgroundTasks

@app.get("/special")
async def special_parameters(
    request: Request,           # 原始 HTTP 请求
    response: Response,         # 可修改的 HTTP 响应
    background_tasks: BackgroundTasks,  # 用于响应后处理
):
    response.set_cookie("visited", "true")
    background_tasks.add_task(log_visit, request.client.host)
    return {"message": "Check your cookies!"}
```

当 FastAPI 看到参数类型为 `Request`、`Response` 或 `BackgroundTasks` 时，会自动提供相应对象。这就是为什么在你的示例中，`background_tasks: BackgroundTasks` 不需要 `Depends()`——它是特殊的！

## 理解 BackgroundTasks

`BackgroundTasks` 值得特别关注，因为它非常实用：

```python
def process_item(item_id: int):
    # 这在响应发送后运行
    print(f"Processing item {item_id}")
    # 可以进行数据库操作、发送邮件等

@app.post("/items/{item_id}/process")
async def process_item_endpoint(
    item_id: int,
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(process_item, item_id)
    return {"message": "Processing started"}
```

任务会在响应发送后运行，让 API 响应更快，而耗时操作在后台进行。

## 依赖链：依赖的依赖

依赖可以有自己的依赖，形成依赖链：

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_repository(db: Session = Depends(get_db)):
    return Repository(db)

@app.get("/items/")
def read_items(repo: Repository = Depends(get_repository)):
    return repo.get_all_items()
```

FastAPI 会自动解析整个依赖链：

1. 调用 `get_db()` 获取数据库会话
2. 将其传递给 `get_repository()` 获取仓库对象
3. 再将仓库对象传递给你的端点

## 依赖缓存：共享依赖只调用一次

如果你在同一个请求中多次使用同一个依赖，FastAPI 足够智能，只会调用一次：

```python
def get_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == user_id).first()

@app.get("/items/{item_id}")
def read_item(
    item_id: int,
    user: User = Depends(get_user),
    db: Session = Depends(get_db)  # 和 get_user 里用的是同一个 db 会话！
):
    item = db.query(Item).filter(Item.id == item_id).first()
    return {"item": item, "owner": user}
```

即使 `get_db` 被直接和间接（在 `get_user` 里）调用，FastAPI 也只会调用一次。

## 测试中的依赖覆盖

依赖注入最强大的功能之一，就是让测试变得非常简单：

```python
# 在你的测试文件中
from fastapi.testclient import TestClient
from app.main import app, get_db

def get_test_db():
    test_db = TestingSessionLocal()
    try:
        yield test_db
    finally:
        test_db.close()

app.dependency_overrides[get_db] = get_test_db

client = TestClient(app)

def test_read_item():
    response = client.get("/items/1")
    assert response.status_code == 200
```

通过用 `get_test_db` 替换 `get_db`，你的所有端点都会使用测试数据库。

## Annotated 优雅参数类型（FastAPI 0.95.0+）

为了让代码更简洁，FastAPI 现在支持 `typing` 模块中的 `Annotated`：

```python
from typing import Annotated
from fastapi import Depends, FastAPI

app = FastAPI()

def get_user_agent(user_agent: str = Header(None)):
    return user_agent

@app.get("/ua")
async def read_user_agent(
    user_agent: Annotated[str, Depends(get_user_agent)]
):
    return {"user_agent": user_agent}
```

这样可以将类型信息和依赖信息分离，让代码更易读。

## 综合示例：多种参数类型的结合

下面是一个结合多种参数类型的完整示例：

```python
import uuid
from fastapi import BackgroundTasks, Depends, FastAPI, File, UploadFile
from sqlalchemy.orm import Session

app = FastAPI()

@app.post("/{case_id}/documents/upload", status_code=202)
async def upload_documents(
    case_id: uuid.UUID,                          # 来自 URL 路径
    background_tasks: BackgroundTasks,           # FastAPI 自动注入（服务端）
    file: UploadFile = File(...),                # 来自客户端（multipart/form-data）
    db: Session = Depends(get_db),               # FastAPI 自动注入（服务端）
    current_user: User = Depends(get_current_active_user),  # FastAPI 自动注入（服务端）
):
    # 将文件信息存储到数据库
    document = Document(
        case_id=case_id,
        filename=file.filename,
        uploaded_by=current_user.id
    )
    db.add(document)
    db.commit()
    
    # 在后台处理文件
    background_tasks.add_task(
        process_document,
        document_id=document.id,
        file=file,
        user_id=current_user.id
    )
    
    return {"message": "Document upload accepted for processing"}
```

这个端点优雅地处理了：

- 路径参数（`case_id`）
- 文件上传（`file`）
- 数据库连接（`db`）
- 认证（`current_user`）
- 后台处理（`background_tasks`）

## 何时使用哪种参数类型

总结一下各参数类型的使用场景：

- **路径参数**：用于 URL 中必须的值
- **查询参数**：用于可选的过滤、排序、分页
- **请求体**：用于 POST/PUT 请求中的复杂数据
- **表单数据**：用于传统 HTML 表单
- **文件上传**：用于文件处理
- **依赖**：用于共享资源、认证和业务逻辑
- **特殊类型**：用于直接访问请求/响应对象和后台任务

## 总结

FastAPI 的参数系统一开始可能看起来很复杂，但理解之后你会发现它极大简化了 API 开发。它自动处理从 URL 提取到依赖注入的一切，让你专注于业务逻辑，而不是样板代码。

记住基本规则：

- 路径和查询参数来自 URL
- 请求体来自请求数据
- 依赖和特殊类型由 FastAPI 提供

掌握这些概念后，你很快就能构建出简洁、可维护的 API。祝你编码愉快！🚀