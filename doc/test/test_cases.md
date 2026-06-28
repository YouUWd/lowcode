# 低代码引擎接口测试用例文档

本文件定义了低代码引擎通用 CRUD（查询、保存、删除、缓存刷新）接口的完整测试用例，覆盖了基于元数据驱动的查询、过滤、批量嵌套拉取（N+1 优化）、多对多关联维护等业务场景。

---

## 1. 测试基础信息

* **模块 ID (`moduleId`)**：`order` （对应 `orders` 订单表）
* **接口基地址**：`http://localhost:8080/api/module`
* **Content-Type**：`application/json`

---

## 2. 查询接口测试 (`POST /{moduleId}/query`)

### 用例 2.1: 默认分页列表查询 + 物理 JOIN 关联表
* **目的**：测试最基础的分页查询，并通过 `with` 携带拉取 JOIN 类型的物理扩展表。
* **请求地址**：`POST /api/module/order/query`
* **请求体 (Request)**：
  ```json
  {
    "page": 1,
    "size": 10,
    "with": [
        {
          "tableName": "customer_profiles"
        }
    ]
  }
  ```
* **期望响应 (Response)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "orders": {
        "rows": [
          {
            "orders": {
              "id": 3,
              "order_no": "ORD-20240102-003",
              "customer": "王五",
              "amount": 800.00,
              "status": "PENDING",
              "remark": null,
              "created_at": "2026-06-28T15:23:21",
              "updated_at": "2026-06-28T15:23:21"
            },
            "customer_profiles": {
              "id": 3,
              "name": "王五",
              "level": "REGULAR",
              "contact_phone": "13700137000"
            }
          }
        ],
        "total": 3,
        "page": 1,
        "size": 10
      }
    }
  }
  ```

### 用例 2.2: 列表查询 + 批量拉取从表 (N+1 优化)
* **目的**：测试 `with` 参数拉取 1:N 从表（明细表）时，是否能批量合并查询回填。
* **请求体 (Request)**：
  ```json
  {
    "page": 1,
    "size": 10,
    "with": [
      {
        "tableName": "order_items"
      }
    ]
  }
  ```
* **期望响应 (Response)**：
  每个订单行中成功嵌套 `order_items` 数组：
  ```json
  {
    "code": 200,
    "data": {
      "rows": [
        {
          "orders": { "id": 1, "order_no": "ORD-20240101-001", "customer": "张三", "amount": 1500.00, "status": "PAID" },
          "order_items": [
            { "id": 1, "order_id": 1, "product_name": "鼠标", "qty": 1, "price": 500.00 },
            { "id": 2, "order_id": 1, "product_name": "键盘", "qty": 1, "price": 1000.00 }
          ]
        }
      ],
      "total": 3,
      "page": 1,
      "size": 10
    }
  }
  ```

### 用例 2.3: 列表查询 + 批量拉取多对多关联 (`tags`)
* **目的**：测试通过中间表批量加载 N:M 关联（右表）数据。
* **请求体 (Request)**：
  ```json
  {
    "page": 1,
    "size": 10,
    "with": [
      {
        "tableName": "tags"
      }
    ]
  }
  ```
* **期望响应 (Response)**：
  订单行中成功嵌套 `tags` 数组（使用 `relation_meta` 的 `name` 作为 key）：
  ```json
  {
    "code": 200,
    "data": {
      "rows": [
        {
          "orders": { "id": 1, "order_no": "ORD-20240101-001", "customer": "张三" },
          "tags": [
            { "id": 1, "name": "VIP" },
            { "id": 4, "name": "加急" }
          ]
        }
      ],
      "total": 3,
      "page": 1,
      "size": 10
    }
  }
  ```

### 用例 2.4: 列表条件过滤 (LIKE / IN / BETWEEN 等)
* **目的**：测试严谨的条件过滤逻辑。所有的过滤操作默认为 `AND` 组合。
* **请求体 (Request)**：
  ```json
  {
    "filters": [
      {
        "tableName": "orders",
        "field": "customer",
        "op": "LIKE",
        "value": "张"
      },
      {
        "tableName": "orders",
        "field": "amount",
        "op": "GTE",
        "value": 1000
      }
    ]
  }
  ```
* **期望响应 (Response)**：
  仅返回客户名包含“张”且金额 >= 1000 的订单记录。

### 用例 2.5: 详情查询 (不传 with 默认拉取全部关联)
* **目的**：当指定 `id` 进行单条查询且未指定 `with` 时，引擎应自动查出所有关联的从表和 N:M 关系。
* **请求体 (Request)**：
  ```json
  {
    "id": 1
  }
  ```
* **期望响应 (Response)**：
  外层直接平铺 `orders` 主表、`order_items` 从表与 `tags` 关联：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "orders": {
        "id": 1,
        "order_no": "ORD-20240101-001",
        "customer": "张三",
        "amount": 1500.00,
        "status": "PAID"
      },
      "order_items": [
        { "id": 1, "product_name": "鼠标", "qty": 1, "price": 500.00 },
        { "id": 2, "product_name": "键盘", "qty": 1, "price": 1000.00 }
      ],
      "tags": [
        { "id": 1, "name": "VIP" },
        { "id": 4, "name": "加急" }
      ]
    }
  }
  ```

### 用例 2.6: 详情查询 + 按需投影字段
* **目的**：当详情查询传入 `with` 时，仅拉取指定的表和特定的字段。
* **请求体 (Request)**：
  ```json
  {
    "id": 1,
    "with": [
      {
        "tableName": "order_items",
        "fields": ["product_name", "price"]
      }
    ]
  }
  ```
* **期望响应 (Response)**：
  仅拉取订单明细的 `product_name` 和 `price`，不返回 `tags`。
  ```json
  {
    "code": 200,
    "data": {
      "orders": { "id": 1, "order_no": "ORD-20240101-001" },
      "order_items": [
        { "product_name": "鼠标", "price": 500.00 },
        { "product_name": "键盘", "price": 1000.00 }
      ]
    }
  }
  ```

### 用例 2.7: 异常测试 — 不存在的 table 校验
* **目的**：测试强校验机制，避免前端乱传表名绕过检查。
* **请求体 (Request)**：
  ```json
  {
    "with": [
      {
        "tableName": "order_items_corrupted"
      }
    ]
  }
  ```
* **期望响应 (Response)**：
  ```json
  {
    "code": 400,
    "message": "Unknown table or relation in 'with': order_items_corrupted",
    "data": null
  }
  ```

### 用例 2.8: 异常测试 — 表内不存在的 field 校验
* **目的**：测试对选择的字段进行白名单匹配。
* **请求体 (Request)**：
  ```json
  {
    "with": [
      {
        "tableName": "order_items",
        "fields": ["non_existent_column"]
      }
    ]
  }
  ```
* **期望响应 (Response)**：
  ```json
  {
    "code": 400,
    "message": "Unknown field in 'with': non_existent_column for table: order_items",
    "data": null
  }
  ```

---

## 3. 保存接口测试 (`POST /{moduleId}/save`)

### 用例 3.1: 新增主从记录 + 多对多关联绑定
* **目的**：测试一键整体插入新订单、多条订单明细，并绑定多对多标签。
* **请求地址**：`POST /api/module/order/save`
* **请求体 (Request)**：
  ```json
  {
    "data": {
      "orders": {
        "order_no": "ORD-20260628-999",
        "customer": "赵六",
        "amount": 250.00,
        "status": "PENDING"
      },
      "order_items": [
        {
          "product_name": "测试商品A",
          "qty": 2,
          "price": 100.00
        },
        {
          "product_name": "测试商品B",
          "qty": 1,
          "price": 50.00
        }
      ],
      "tags": [
        { "id": 2 },
        { "id": 5 }
      ]
    }
  }
  ```
* **期望响应 (Response)**：
  返回成功创建的订单主键 ID。
  ```json
  {
    "code": 200,
    "message": "success",
    "data": 4
  }
  ```

### 用例 3.2: 整体更新订单 (修改、删除、追加明细)
* **目的**：测试级联更新机制。如果明细列表中某个旧明细 ID 没有传过来，引擎应当在数据库中将其删除（物理删除）；如果明细没有 `id` 则是追加；带有 `id` 则是更新。
* **请求体 (Request)**：
  假设我们要更新 `id=4` 的订单：
  ```json
  {
    "data": {
      "orders": {
        "id": 4,
        "customer": "赵六 (已修改)"
      },
      "order_items": [
        {
          "id": 6, // 保留并修改原有明细（假设刚才新增的商品A主键是8）
          "product_name": "测试商品A (已修改名称)",
          "qty": 3
        },
        {
          "product_name": "新追加的明细商品C", // 缺 id：执行追加插入
          "qty": 1,
          "price": 12.50
        }
        // 原本的 7 号明细（商品B）在此列表中被省略：引擎应当自动在库中 delete 它！
      ],
      "tags": [
        { "id": 1 } // 修改多对多关联：改绑为仅剩标签1 (VIP)
      ]
    }
  }
  ```
* **期望响应 (Response)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": 4
  }
  ```

---

## 4. 删除接口测试 (`DELETE /{moduleId}/{id}`)

### 用例 4.1: 级联物理删除
* **目的**：测试删除订单主表记录时，对应的从表记录、中间表关联记录是否被事务安全地清理干净。
* **请求地址**：`DELETE /api/module/order/4`
* **期望响应 (Response)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```
* **验证步骤**：
  在数据库中执行以下查询，确认无残留：
  ```sql
  SELECT * FROM orders WHERE id = 4;        -- 应返回空
  SELECT * FROM order_items WHERE order_id = 4;  -- 应返回空
  SELECT * FROM order_tags WHERE order_id = 4;   -- 应返回空
  ```

---

## 5. 缓存刷新测试 (`POST /refresh-cache`)

### 用例 5.1: 手动失效并更新元数据缓存
* **目的**：当表定义或字段标签更改后，通知引擎清空本地缓存以重新加载最新的元数据。
* **请求地址**：`POST /api/module/refresh-cache`
* **期望响应 (Response)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

---

## 6. 自动化内存测试配置 (JUnit + H2 Database)

为了防止单元测试修改本地/生产数据库，测试套件运行在内存数据库 H2 中，以下是其独立环境配置：

### 6.1 测试数据源配置 (`src/test/resources/application.yml`)
使用 H2 数据库模拟 MySQL 环境：
```yaml
spring:
  datasource:
    # 模拟 MySQL、忽略大小写，并在建立连接时初始化 low_code 库并设置默认工作 Schema
    url: "jdbc:h2:mem:low_code;MODE=MySQL;DATABASE_TO_UPPER=FALSE;INIT=CREATE SCHEMA IF NOT EXISTS low_code\\;SET SCHEMA low_code"
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jooq:
    sql-dialect: MYSQL
```

### 6.2 测试生命周期控制 (`ModuleControllerTest.java`)
使用 JUnit Jupiter 编排测试类生命周期：
```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional // 在每个测试方法结束后自动回滚事务，确保零污染
@Sql(scripts = "file:sql/init.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS) // 在测试类启动前仅执行一次 SQL 结构加载
public class ModuleControllerTest {
    // 包含以上所有 API 用例的 MockMvc 调用与自动断言实现
}
```
