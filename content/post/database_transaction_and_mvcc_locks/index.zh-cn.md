---
title: "等等，连 SELECT 也会开启事务？——一次关于数据库锁、MVCC 和 SQLAlchemy“魔法”会话的好奇之旅"
description: "一步步带你从“我完全不知道事务到底做了什么”到“我能像专家一样理解行级锁和自动开启事务”，用简单代码、生活类比和满满的顿悟时刻。"
slug: wait-even-select-starts-a-transaction
date: 2025-04-21 00:00:00+0000
image: cover.webp
categories:
    - 数据库
    - Python
    - FastAPI
tags:
    - SQLAlchemy
    - 事务
    - MVCC
    - 并发
    - Postgres
---

## “等等，连读取操作也会开启事务？”

我一直以为事务只是用来写数据的。直到我写了这样一行代码：

```python
await db.execute(text("SELECT 1"))  # 看似无害的读取
print(db.in_transaction())          # True？等等，怎么回事？
```

原来 SQLAlchemy 的 `autocommit=False`（默认设置）会为任何数据库操作开启事务。哪怕只是查一下数据库，也会打开事务的大门。

为什么？因为像 PostgreSQL 这样的数据库希望你看到的是一个一致的“快照”——就像你在看照片时，这张照片不会变化。

## 图书馆类比：MVCC 解释

想象一个神奇的图书馆：

- 每个人都有自己的复印机
- 写作者会实际修改书本
- 读者总是拿到最新的复印件

当你读取（SELECT）时，你拿到的是复印件——永远不会阻塞别人。
当你写入（UPDATE/INSERT/DELETE）时，你必须拿到真正的书本，修改后再放回去。其他写同一本书的人必须排队等你。

这就是 MVCC（多版本并发控制）。PostgreSQL 会保留多份数据版本，这样读者永远不用等写者。

## “那锁到底什么时候才会出现？”

下面这个时间线终于让我明白了：

```python
user = await db.get(User, 1)      # 👀 读取：没有锁
user.name = "Neo"                 # 📝 ORM 标记了变化：还是没有锁！
await db.commit()                 # 🔒 现在才加锁 → 写入 → 解锁
```

只有当你的 UPDATE 真正落到数据库时，锁才会出现。如果你在修改数据后、提交前 sleep：

```python
user.points += 10
await asyncio.sleep(10)  # 这行数据被锁了 10 秒！😱
await db.commit()
```

此时，其他人如果也想更新这个用户，就得等你这 10 秒。太痛苦了。

## “我的事务会不会阻塞 500 万用户？”

只有当他们都在修改同一条数据时才会。想象一下办公隔间：

- 500 万人各自编辑自己的资料？没有排队。大家都在不同的隔间。
- 500 万人都在更新同一个计数器？那就得排长队了。

行级锁只影响操作同一行的人。不会影响整个数据库。

## 事务陷阱：只读代码也有坑

有个细节曾经坑了我：

```python
@router.get("/users")
async def get_users(db: SessionDep):
    users = await db.scalars(select(User))  # 事务已开启！
    await asyncio.sleep(5)  # 事务还在持续...
    return users.all()
```

虽然只是读取，事务却会持续 5 秒。对于小应用问题不大，但在大规模下可能会：

- 延迟数据库清理（vacuum）
- 不必要地占用资源

解决方法？让会话尽量短，或者读取后显式 rollback。

## 什么时候用 `begin()`，什么时候只用 `commit()`

我经常遇到这个报错：

```console
InvalidRequestError: A transaction is already begun on this Session
```

原来 `async with db.begin():` 会尝试开启一个新的事务。如果已经有自动开启的事务了，就会报错。

除非你 100% 确定当前没有事务，否则只用 `await db.commit()` 就够了。

## 终极事务速查表

| 时机 | 发生了什么 | 是否加锁 |
|------|-------------|--------|
| `SessionLocal()` | 创建会话 | 无 |
| 第一次数据库查询 | 开启事务 | 只读无锁 |
| `UPDATE/DELETE` | 行级锁 | 直到提交 |
| `await db.commit()` | 写入磁盘，结束事务 | 全部释放 |
| 会话关闭 | 未提交自动回滚 | 全部释放 |

## 现场演示：亲眼看看锁的效果

可以在自己的数据库上试试：

```python
async def lock_demo():
    # 创建测试表
    await db.execute(text("CREATE TABLE counter(id int, n int)"))
    await db.execute(text("INSERT INTO counter VALUES (1, 0)"))
    await db.commit()
    
    # 锁定一行
    await db.execute(text("UPDATE counter SET n = n + 1 WHERE id = 1"))
    print("行已加锁！打开另一个终端试着更新这行数据……")
    await asyncio.sleep(10)
    await db.commit()
    print("锁已释放！")
```

运行时，打开 `psql`，执行：`UPDATE counter SET n = n + 1 WHERE id = 1;`
你会发现它正好等了 10 秒。这就是锁的效果。

## 思维转变

之前：“事务是神秘的数据库魔法。”
现在：“事务只是用来保证数据一致性的时间边界，锁则保护共享资源。”

重点总结：

1. 读取操作也会开启事务（autocommit=False 时）
2. 写操作会对特定行加锁
3. 锁会持续到 commit/rollback
4. 保持事务简短，数据库才会开心

现在遇到查询卡住，我不会慌了——我会先查是谁在持有锁。这感觉真不错。