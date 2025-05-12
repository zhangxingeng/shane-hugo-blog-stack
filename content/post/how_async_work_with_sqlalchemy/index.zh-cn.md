---
title: "Async SQLAlchemy之旅：从困惑到明朗"
description: "探索从同步到异步SQLAlchemy与FastAPI迁移中的陷阱与启示"
slug: async-sqlalchemy-journey
date: 2025-04-12 00:00:00+0000
image: cover.webp
categories:
    - Python
    - FastAPI
    - SQLAlchemy
tags:
    - async
    - python
    - sqlalchemy
    - fastapi
    - database
---

当我第一次听说要在FastAPI中使用异步SQLAlchemy时，我的第一反应是：“又一个流行词，能有多复杂？”结果发现，这可不是简单地加个`async`就能搞定的。以下就是我在困惑、误区和最终豁然开朗之间跌跌撞撞的心路历程。

## 初印象：Async、Await与SQLAlchemy

我一直写同步代码，对async总觉得像是给代码撒了点魔法粉，让它“更好”。而且我用TypeScript的async模式很熟，觉得Python的async应该也差不多。很简单，对吧？

错了。

我最初的想法是：只要在FastAPI路由上加个`async def`，对SQLAlchemy查询加点`await`，API就能飞快了。

**剧透：** 根本不是这么回事。

## 心智模型的问题

我一开始把async当成简单的性能增强器——就像给汽车加了氮气加速。但这个心智模型是错的。Python里的async更像是把单车道公路换成了多车道高速公路，还配有智能交通管理。

在TypeScript/JavaScript里，事件循环是语言底层自带的。而在Python里，async是一种架构选择，不同场景有不同模式。

## 深入异步SQLAlchemy：第一道困惑

最初，我常用的同步SQLAlchemy查询是这样的：

```python
def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
```

很直观。但当我试图加上`async def`，并随意加点`await`：

```python
async def get_user(db: Session, email: str):
    return await db.query(User).filter(User.email == email).first()  # 这是错的！
```

我很快发现哪里不对劲。Python立刻报错：

```console
AttributeError: 'Query' object has no attribute '__await__'
```

啊，经典错误。原来我犯了第一个致命错误：

> **错误假设：** SQLAlchemy经典的`session.query()`模式会自动支持async。

并不会。这就像试图把普通电器插到USB口——系统根本不兼容！

## “阻塞”带来的顿悟

这让我更深入地理解了“阻塞”到底是什么意思。想象一下，餐厅里只有一个服务员（事件循环）。当服务员去厨房（数据库）取餐时，其他客人只能等着。

同步系统里，服务员进了厨房就出不来，直到餐做好。异步系统里，服务员可以一边让厨房做菜，一边继续接新单。

问题在于，我的SQLAlchemy session就是那个死守厨房、拒绝多任务的服务员：

```python
@app.get("/users/{user_id}")
async def read_user(user_id: int, db: Session = Depends(get_db)):
    # 即使在async def函数里，这依然是阻塞调用！
    user = db.query(User).filter(User.id == user_id).first()
    return user
```

这段代码是最糟糕的混合体——用了async语法，但数据库调用还是阻塞的！

## 神秘的`.execute()`和`select()`登场

疯狂翻阅Stack Overflow后（大家都懂的），我发现异步SQLAlchemy用的是完全不同的语法：

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def get_user(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()
```

“等等，”我盯着`.scalars().first()`发呆，“查一条记录怎么突然变成两步了？”

感觉太复杂了。老的`.query().first()`多好啊！

## 数据库依赖：被遗忘的一环

我后来意识到，FastAPI的依赖也要变。同步的session依赖：

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

要变成：

```python
async def get_async_db():
    async with async_session() as session:
        yield session
```

这不仅是语法变化，更是session管理方式的根本转变！

## 拆解我的误区：`.scalars()`到底是什么？

我一开始以为`.scalars()`是个异步收集器，等流结束后自动吐出对象。后来才发现，`.execute()`返回的是一个`Result`对象，本质上是个表结构，就算你只查一列也是如此。

让我用一个比喻来解释，终于让我恍然大悟：

把SQLAlchemy查询比作点餐：

**同步SQLAlchemy（老方式）：**

```python
pizza = restaurant.order(Pizza).with_topping('pepperoni').make()
```

很简单，直接拿到披萨。

**异步SQLAlchemy（新方式）：**

```python
order_slip = await restaurant.execute(order(Pizza).with_topping('pepperoni'))
pizza = order_slip.items().first()
```

为啥多了几步？想象服务员给你端来一个托盘（Result），上面有多个盒子（Row），每个盒子里装着你点的东西（如User对象）。哪怕你只点了一份披萨，也会被装在托盘的盒子里：

- `execute()` = 服务员端来托盘
- `.scalars()` = 打开所有盒子，把食物直接放到托盘上
- `.first()` = 从托盘上拿第一个食物

也就是：

```python
# execute() 得到: [Row(User(id=1),), Row(User(id=2),)]
result = await db.execute(select(User).where(...))

# scalars() 得到: [User(id=1), User(id=2)]
users = result.scalars()

# first() 得到: User(id=1)
first_user = users.first()
```

## CRUD语法对照表

理解了这个模式后，我需要把常用的CRUD操作翻译成新语法：

| 旧同步语法 | 新异步语法 |
|------------|------------|
| `db.query(User).first()` | `(await db.execute(select(User))).scalars().first()` |
| `db.query(User).all()` | `(await db.execute(select(User))).scalars().all()` |
| `db.query(User).filter(User.name == name).one()` | `(await db.execute(select(User).where(User.name == name))).scalars().one()` |
| `db.add(user); db.commit()` | `db.add(user); await db.commit()` |
| `db.query(User).filter(User.id == id).update({User.name: new_name})` | `await db.execute(update(User).where(User.id == id).values(name=new_name))` |

这张表成了我迁移代码的“罗塞塔石碑”。

## 性能焦虑：我真的需要异步吗？

下一个问题：折腾这么多，真的有用吗？

我做了个简单基准测试，用典型API接口做数据库调用。1000个并发请求下结果如下：

- **同步FastAPI + 同步SQLAlchemy**：约600请求/秒
- **异步FastAPI + 同步SQLAlchemy**：约550请求/秒（反而更慢！）
- **异步FastAPI + 异步SQLAlchemy**：约1400请求/秒

中间那个最差，因为有async的开销却没有async的好处！就像雇了个多任务服务员，却只让他一次只服务一桌。

如果你要做高并发API（每秒上千请求），async的优势才明显。同步DB调用会阻塞整个API，异步则能让Python在等数据库时处理更多请求。

## Python 3.13的剧情反转

后来我又听说Python 3.13要解锁GIL（全局解释器锁），实现真正多线程。那是不是可以用线程代替async？我一开始也这么想——但又错了。

我以为Python 3.13的GIL改进能让多线程通吃一切，但其实我混淆了两类问题：

- **CPU密集型任务**：解锁GIL后多线程才有用
- **I/O密集型任务**（如数据库查询）：无论GIL如何，async依然更优

解锁GIL对CPU密集型有帮助，但对于网络I/O密集型，async依然是王道——这正是大多数API的场景。所以，即使多线程更强，async依然很重要。

## 混合方案：务实的过渡

我的项目有几百个路由，没法一次性全部重写。我找到了一个渐进迁移的办法：

```python
from fastapi.concurrency import run_in_threadpool

@app.get("/legacy-but-important")
async def read_complex_report(db: Session = Depends(get_db)):
    # 把阻塞代码放到线程池，避免阻塞事件循环
    result = await run_in_threadpool(
        lambda: db.query(ComplexReport).all()
    )
    return result
```

这样可以先迁移最常用的接口，逐步推进。

## 特殊数据库扩展，比如pgvector怎么办？

我最后的顾虑是：像`pgvector`这样的特殊扩展能用async吗？查了下资料，async和`pgvector`配合得很好。用`asyncpg`作为PostgreSQL驱动，异步集成这些扩展毫无障碍。

下面是用pgvector异步查询的例子：

```python
stmt = select(Document).order_by(
    l2_distance(Document.embedding, query_vector)
).limit(5)

result = await db.execute(stmt)
docs = result.scalars().all()
```

我很欣慰地发现，未来要加向量检索也不会被async迁移卡住。

## 辅助函数：让生活更简单

迁移了几个路由后，我发现新语法太啰嗦了，于是写了辅助函数：

```python
async def db_get(db: AsyncSession, model, **kwargs):
    stmt = select(model).filter_by(**kwargs)
    result = await db.execute(stmt)
    return result.scalars().first()

# 用法
user = await db_get(db, User, email="user@example.com")
```

这些辅助函数让新语法恢复了同步时代的简洁，同时保留了async的优势。

## 总结我的Async之旅

从一开始觉得async只是个噱头，到被语法折磨、误解`.scalars()`，再到最终欣然接受它的优点——这一路既痛苦又收获满满。异步SQLAlchemy其实没那么可怕，但确实需要转变思维和拥抱新模式。

如果你要从我的经历里记住三点：

1. **心智模型很重要**：async关注的是并发，不是并行
2. **要么全异步，要么全同步**：async路由配同步DB调用是最差组合
3. **抽象很有用**：写辅助函数简化冗长语法

所以，如果你正盯着`db.query()`发愁要不要迁移到异步SQLAlchemy——别怕！刚开始确实有点懵，但坚持下去，明朗和高性能就在前方。