# 低代码平台通用引擎与权限管理 API 交互规范文档

本篇文档是低代码平台前后端联调的**唯一权威交互规范**。文档包含了低代码平台的**元数据建模设计 API**、**通用核心引擎数据操作 API**、以及**字段级权限配置 API**。

---

## 🧭 通用响应报文格式 (Result Wrapper)

平台所有的 API 接口均使用统一的数据包体进行包装返回：

```json
{
  "code": 200,          // 业务状态码，200 为成功，400 为客户端校验/授权失败，500 为服务异常
  "message": "success",  // 友好提示消息，异常时为具体错误原因
  "data": null          // 具体的业务报文负载，泛型支持，无返回时为 null
}
```

---

## 🏗️ 一、低代码元数据建模设计 API (Module Design APIs)

本组 API 供平台**低代码建模设计器（画布）**使用，用来读取当前模块的物理模型骨架，或者在配置完成后将主表、从表、关联表及多对多关系的配置推送给后端。

### 🔄 重新梳理后的 `query_type` 体系

本低代码平台采用纯粹的物理表映射模型，三种查询类型（`query_type`）能够 100% 覆盖关系型数据库中所有基础物理表之间的核心关联场景：

| 查询类型 (`query_type`) | 物理基础表角色 | 关联关系 | 典型样本表 | 引擎核心职责 |
| :--- | :--- | :--- | :--- | :--- |
| **`MAIN`** | **主实体表** | 根节点 | `orders` (订单主表) | 奠定主查询的分页、排序和事务写入基调（主表物理 ID 写入的起点）。 |
| **`SUB`** | **一对多从表/子表** | **`1:N`** | `order_items` (订单明细表) | 数据生命周期完全依附于主表，在写入时执行**级联物理覆盖**。 |
| **`JOIN`** | **一对一/多对一关联实体表** | **`1:1` 或 `N:1`** | `customer_profiles` (客户档案表) | 它是**纯粹的物理基础表**。在查询时通过 `LEFT JOIN` 为主表补充属性（如客户级别、电话）；在写入时**仅做引用，绝不级联破坏**该表数据。

---

### 1. 查询模块设计结构 (GET)

* **接口路径**：`GET /api/module/{moduleId}/meta`
* **Content-Type**：`application/json`
* **成功响应报文示例 (HTTP 200)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": "order",
      "name": "订单模块",
      "description": "订单低代码核心模块",
      
      // MAIN 类型：主实体表元数据
      "mainTable": {
        "id": 1,
        "tableName": "orders",
        "queryType": "MAIN",
        "joinType": null,
        "joinOn": null,
        "foreignKey": null,
        "fields": [
          {
            "id": 1,
            "columnName": "id",
            "label": "编号",
            "dataType": "BIGINT",            "queryOp": "EQ"
          },
          {
            "id": 2,
            "columnName": "order_no",
            "label": "订单号",
            "dataType": "VARCHAR",            "queryOp": "LIKE"
          },
          {
            "id": 3,
            "columnName": "customer",
            "label": "客户名",
            "dataType": "VARCHAR",            "queryOp": "LIKE"
          },
          {
            "id": 4,
            "columnName": "amount",
            "label": "金额",
            "dataType": "DECIMAL",            "queryOp": "GT"
          },
          {
            "id": 5,
            "columnName": "status",
            "label": "状态",
            "dataType": "VARCHAR",            "queryOp": "EQ"
          },
          {
            "id": 6,
            "columnName": "remark",
            "label": "备注",
            "dataType": "VARCHAR",            "queryOp": null
          },
          {
            "id": 7,
            "columnName": "created_at",
            "label": "创建时间",
            "dataType": "DATETIME",            "queryOp": null
          },
          {
            "id": 8,
            "columnName": "updated_at",
            "label": "更新时间",
            "dataType": "DATETIME",            "queryOp": null
          }
        ]
      },
      
      // SUB 类型：一对多从表列表
      "subTables": [
        {
          "id": 2,
          "tableName": "order_items",
          "queryType": "SUB",
          "joinType": null,
          "joinOn": null,
          "foreignKey": "order_id",
          "fields": [
            {
              "id": 9,
              "columnName": "id",
              "label": "编号",
              "dataType": "BIGINT",              "queryOp": null
            },
            {
              "id": 10,
              "columnName": "order_id",
              "label": "订单ID",
              "dataType": "BIGINT",              "queryOp": "EQ"
            },
            {
              "id": 11,
              "columnName": "product_name",
              "label": "商品名称",
              "dataType": "VARCHAR",              "queryOp": "LIKE"
            },
            {
              "id": 12,
              "columnName": "qty",
              "label": "数量",
              "dataType": "INTEGER",              "queryOp": null
            },
            {
              "id": 13,
              "columnName": "price",
              "label": "单价",
              "dataType": "DECIMAL",              "queryOp": null
            },
            {
              "id": 14,
              "columnName": "created_at",
              "label": "创建时间",
              "dataType": "DATETIME",              "queryOp": null
            }
          ]
        }
      ],

      // JOIN 类型：多对一关联实体表（为主表拉取补充列）
      "joinTables": [
        {
          "id": 3,
          "tableName": "customer_profiles",
          "queryType": "JOIN",
          "joinType": "LEFT",
          "joinOn": "orders.customer = customer_profiles.name",
          "foreignKey": null,
          "fields": [
            {
              "id": 15,
              "columnName": "id",
              "label": "档案编号",
              "dataType": "BIGINT",              "queryOp": null
            },
            {
              "id": 16,
              "columnName": "level",
              "label": "客户级别",
              "dataType": "VARCHAR",              "queryOp": "EQ"
            },
            {
              "id": 17,
              "columnName": "contact_phone",
              "label": "联系电话",
              "dataType": "VARCHAR",              "queryOp": null
            }
          ]
        }
      ],

      // RELATION 类型：N:M 关联定义
      "relations": [
        {
          "id": 1,
          "name": "tags",
          "leftTable": "orders",
          "rightTable": "tags",
          "junctionTable": "order_tag_relation",
          "leftFk": "order_id",
          "rightFk": "tag_id",
          "leftJoinColumn": "id",
          "rightJoinColumn": "id"
        }
      ]
    }
  }
  ```

---

### 2. 保存/更新模块设计结构 (POST)

当用户在设计器画布上新增或调整了字段、修改了表单 Label、或建立了新的表关联时，向后端保存最新的模块模型定义。

* **接口路径**：`POST /api/module/design`
* **Content-Type**：`application/json`
* **请求体 (Request Body) 完整示例**：
  ```json
  {
    "id": "order",
    "name": "订单模块",
    "description": "调整了金额类型与标签的一对多设计",
    "mainTable": {
      "id": 1,
      "tableName": "orders",
      "queryType": "MAIN",
      "joinType": null,
      "joinOn": null,
      "foreignKey": null,
      "fields": [
        {
          "id": 1,
          "columnName": "id",
          "label": "主键ID",
          "dataType": "BIGINT",          "queryOp": "EQ"
        },
        {
          "id": 2,
          "columnName": "order_no",
          "label": "订单单号",
          "dataType": "VARCHAR",          "queryOp": "LIKE"
        },
        {
          "id": 3,
          "columnName": "customer",
          "label": "客户姓名",
          "dataType": "VARCHAR",          "queryOp": "LIKE"
        },
        {
          "id": 4,
          "columnName": "amount",
          "label": "金额",
          "dataType": "DECIMAL",          "queryOp": "GT"
        },
        {
          "id": 5,
          "columnName": "status",
          "label": "订单状态",
          "dataType": "VARCHAR",          "queryOp": "EQ"
        },
        {
          "id": 6,
          "columnName": "remark",
          "label": "订单说明",
          "dataType": "VARCHAR",          "queryOp": null
        },
        {
          "id": 7,
          "columnName": "created_at",
          "label": "创建时间",
          "dataType": "DATETIME",          "queryOp": null
        },
        {
          "id": 8,
          "columnName": "updated_at",
          "label": "更新时间",
          "dataType": "DATETIME",          "queryOp": null
        }
      ]
    },
    "subTables": [
      {
        "id": 2,
        "tableName": "order_items",
        "queryType": "SUB",
        "joinType": null,
        "joinOn": null,
        "foreignKey": "order_id",
        "fields": [
          {
            "id": 9,
            "columnName": "id",
            "label": "编号",
            "dataType": "BIGINT",            "queryOp": null
          },
          {
            "id": 10,
            "columnName": "order_id",
            "label": "外键订单ID",
            "dataType": "BIGINT",            "queryOp": "EQ"
          },
          {
            "id": 11,
            "columnName": "product_name",
            "label": "商品名称",
            "dataType": "VARCHAR",            "queryOp": "LIKE"
          },
          {
            "id": 12,
            "columnName": "qty",
            "label": "购买数量",
            "dataType": "INTEGER",            "queryOp": null
          },
          {
            "id": 13,
            "columnName": "price",
            "label": "商品价格",
            "dataType": "DECIMAL",            "queryOp": null
          },
          {
            "id": 14,
            "columnName": "created_at",
            "label": "创建时间",
            "dataType": "DATETIME",            "queryOp": null
          }
        ]
      }
    ],
    "joinTables": [
      {
        "id": 3,
        "tableName": "customer_profiles",
        "queryType": "JOIN",
        "joinType": "LEFT",
        "joinOn": "orders.customer = customer_profiles.name",
        "foreignKey": null,
        "fields": [
          {
            "id": 15,
            "columnName": "id",
            "label": "档案编号",
            "dataType": "BIGINT",            "queryOp": null
          },
          {
            "id": 16,
            "columnName": "level",
            "label": "客户级别",
            "dataType": "VARCHAR",            "queryOp": "EQ"
          },
          {
            "id": 17,
            "columnName": "contact_phone",
            "label": "联系电话",
            "dataType": "VARCHAR",            "queryOp": null
          }
        ]
      }
    ],
    "relations": [
      {
        "id": 1,
        "name": "tags",
        "leftTable": "orders",
        "rightTable": "tags",
        "junctionTable": "order_tag_relation",
        "leftFk": "order_id",
        "rightFk": "tag_id",
        "leftJoinColumn": "id",
        "rightJoinColumn": "id"
      }
    ]
  }
  ```
* **成功响应 (HTTP 200)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

---

## 🌐 二、通用引擎数据操作 API (Data Engine APIs)

本组 API 供前台生成业务**列表页**、**详情页**以及**数据增删改表单**时调用。

### 1. 通用数据查询 (POST)
模块统一数据查询端点。根据入参中是否携带 `id` 区分列表展示与详情拉取。接口会依据登录用户携带的 `X-Role` 头部，**自动从结果中抹除无读权限（即没有包含掩码值 4）的所有列**。

* **接口路径**：`POST /api/module/{moduleId}/query`
* **Content-Type**：`application/json`
* **Headers 约束**：`X-Role: 传入角色Code` (如 `viewer` 或 `editor`)

#### 📥 列表模式请求示例 (不带 `id`)
用于分页加载数据，支持多重条件过滤和多列排序：
```json
{
  "page": 1,
  "size": 10,
  "filters": [
    {
      "tableName": "orders",
      "field": "customer",
      "op": "like",
      "value": "张"
    },
    {
      "tableName": "orders",
      "field": "amount",
      "op": ">",
      "value": 1000
    }
  ],
  "sorts": [
    {
      "field": "orders_id",
      "dir": "DESC"
    }
  ],
  "with": [
    {
      "tableName": "order_items",
      "fields": ["product_name", "qty", "price"]
    }
  ]
}
```
* **响应报文 (HTTP 200)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "rows": [
        {
          "orders_id": 2,
          "orders_order_no": "ORD-20240101-002",
          "orders_customer": "张学友",
          "orders_amount": 3200.50,
          "orders_status": "SHIPPED",
          "orders_created_at": "2026-07-01 18:00:00"
          // 注：由于当前角色对 orders.remark 无可读权限（没有 perm = 4），remark被底层直接隐藏过滤，行中无对应 key
        }
      ],
      "total": 1,
      "page": 1,
      "size": 10
    }
  }
  ```

#### 📥 详情模式请求示例 (携带 `id`)
用于加载某一条主表记录的全部属性，并通过 `with` 级联按需加载附属的从表、JOIN表以及多对多关联：
```json
{
  "id": 2,
  "page": 1,
  "size": 1,
  "filters": [],
  "sorts": [],
  "with": [
    {
      "tableName": "order_items",
      "fields": ["id", "order_id", "product_name", "qty", "price", "created_at"]
    }
  ]
}
```
* **响应报文 (HTTP 200)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 2,
      "order_no": "ORD-20240101-002",
      "customer": "张学友",
      "amount": 3200.50,
      "status": "SHIPPED",
      "remark": "加急发货",
      "created_at": "2026-07-01 18:00:00",
      "updated_at": "2026-07-01 18:30:00",
      "order_items": [
        {
          "id": 18,
          "order_id": 2,
          "product_name": "智能降噪耳机",
          "qty": 2,
          "price": 1600.25,
          "created_at": "2026-07-01 18:00:00"
        }
      ]
    }
  }
  ```

---

### 2. 模块整体保存 (POST)

支持主表、从表、关联的多维嵌套 Map 提交，在数据库底层事务中执行，实现高度聚合的**一键级联保存（Upsert & Delete）**。

* **接口路径**：`POST /api/module/{moduleId}/save`
* **Content-Type**：`application/json`
* **X-Role (Header)**：当前登录角色的 Code。
  * **平台严格安全校验机制**：保存时会对每个提交的字段进行引擎级别的鉴权拦截：
    * 新增记录场景（`id` 为空）：验证字段是否满足掩码值 `2`（新增写权限）。若不符合，后端拒绝物理入库。
    * 修改记录场景（`id` 不为空）：验证字段是否满足掩码值 `1`（更新权）。若不符合，拒绝保存。

#### 📥 提交参数示例：
```json
{
  "data": {
    "id": 2,
    "order_no": "ORD-20240101-002",
    "customer": "张学友(尊享会员)",
    "amount": 3200.50,
    "status": "SHIPPED",
    "remark": "加急发货并且赠送赠品",
    "created_at": "2026-07-01 18:00:00",
    "updated_at": "2026-07-01 18:30:00",
    "order_items": [
      {
        "id": 18,
        "order_id": 2,
        "product_name": "降噪耳机(升级版)",
        "qty": 2,
        "price": 1600.25,
        "created_at": "2026-07-01 18:00:00"
      },
      {
        "order_id": 2,
        "product_name": "多功能挂件",
        "qty": 1,
        "price": 50.00,
        "created_at": "2026-07-01 21:00:00"
      }
    ]
  }
}
```
* **响应报文 (HTTP 200)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": 2
  }
  ```

---

### 3. 主记录删除 (DELETE)

物理级联清除该主表 ID 及其关联从表的所有数据。

* **接口路径**：`DELETE /api/module/{moduleId}/{id}`
* **成功响应 (HTTP 200)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

---

## 🔐 三、字段权限管理配置 API (Admin Config APIs)

本组 API 供平台**系统管理员后台（权限/角色配置界面）**使用。

### 1. 查询角色在模块的所有字段权限 (GET)

获取指定角色在当前模块下分配的物理表及影子表结构树，并提供当前配置的 `perm` 整型掩码。

* **接口路径**：`GET /api/admin/permission/{moduleId}/{roleCode}`
* **成功响应 (HTTP 200)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "tableMetaId": 1,
        "tableName": "orders",
        "fields": [
          {
            "fieldMetaId": 1,
            "columnName": "id",
            "label": "编号",
            "perm": 4
          },
          {
            "fieldMetaId": 2,
            "columnName": "order_no",
            "label": "订单号",
            "perm": 7
          },
          {
            "fieldMetaId": 3,
            "columnName": "customer",
            "label": "客户名",
            "perm": 7
          },
          {
            "fieldMetaId": 4,
            "columnName": "amount",
            "label": "金额",
            "perm": 7
          },
          {
            "fieldMetaId": 5,
            "columnName": "status",
            "label": "状态",
            "perm": 7
          },
          {
            "fieldMetaId": 6,
            "columnName": "remark",
            "label": "备注",
            "perm": 0
          },
          {
            "fieldMetaId": 7,
            "columnName": "created_at",
            "label": "创建时间",
            "perm": 4
          },
          {
            "fieldMetaId": 8,
            "columnName": "updated_at",
            "label": "更新时间",
            "perm": 4
          }
        ]
      },
      {
        "tableMetaId": 2,
        "tableName": "order_items",
        "fields": [
          {
            "fieldMetaId": 9,
            "columnName": "id",
            "label": "明细ID",
            "perm": 4
          },
          {
            "fieldMetaId": 10,
            "columnName": "order_id",
            "label": "订单ID",
            "perm": 4
          },
          {
            "fieldMetaId": 11,
            "columnName": "product_name",
            "label": "商品名称",
            "perm": 7
          },
          {
            "fieldMetaId": 12,
            "columnName": "qty",
            "label": "数量",
            "perm": 7
          },
          {
            "fieldMetaId": 13,
            "columnName": "price",
            "label": "单价",
            "perm": 7
          },
          {
            "fieldMetaId": 14,
            "columnName": "created_at",
            "label": "创建时间",
            "perm": 4
          }
        ]
      }
    ]
  }
  ```

---

### 2. 批量配置字段权限值 (POST)

批量推送某个角色的字段权限变更配置到后端，完成后使缓存强制刷新生效。

* **接口路径**：`POST /api/admin/permission/field/batch`
* **Content-Type**：`application/json`
* **请求体 (Request Body) 示例**：
  ```json
  {
    "roleCode": "viewer",
    "moduleId": "order",
    "tables": [
      {
        "tableMetaId": 1,
        "fields": [
          {
            "fieldMetaId": 1,
            "perm": 4
          },
          {
            "fieldMetaId": 2,
            "perm": 4
          },
          {
            "fieldMetaId": 3,
            "perm": 4
          },
          {
            "fieldMetaId": 4,
            "perm": 4
          },
          {
            "fieldMetaId": 5,
            "perm": 4
          },
          {
            "fieldMetaId": 6,
            "perm": 0
          },
          {
            "fieldMetaId": 7,
            "perm": 4
          },
          {
            "fieldMetaId": 8,
            "perm": 4
          }
        ]
      },
      {
        "tableMetaId": 2,
        "fields": [
          {
            "fieldMetaId": 9,
            "perm": 4
          },
          {
            "fieldMetaId": 10,
            "perm": 4
          },
          {
            "fieldMetaId": 11,
            "perm": 4
          },
          {
            "fieldMetaId": 12,
            "perm": 4
          },
          {
            "fieldMetaId": 13,
            "perm": 4
          },
          {
            "fieldMetaId": 14,
            "perm": 4
          }
        ]
      }
    ]
  }
  ```
* **成功响应 (HTTP 200)**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": true
  }
  ```

---

## 🚨 四、前端边界情况拦截与防御交互指引

当前后端发生不符合低代码引擎安全的异常或鉴权越权操作时，后端均统一拦截，并以 `HTTP 400 Bad Request` 返回错误报文。

### 1. 常见 400 业务报错对照表

| 后端报错消息 (`message`) | 触发场景 | 前端交互建议 |
| :--- | :--- | :--- |
| **`模块不存在: nonexistent_module`** | 访问获取 Meta 或操作不存在的模块。 | 前端跳转至“404 模块未找到”或气泡提示，并阻断后续引擎请求。 |
| **`表 [orders] 无任何可读字段`** | 目标角色在 `orders` 主表内，没有任何字段配置了 `perm >= 4`。白名单驱动系统将此角色视作对该模块**完全无权**。 | 通用 `/query` 接口会直接抛出此异常。前端应捕获 400 并将页面切换为 **“暂无该模块数据访问权限”** 占位图。 |
| **`表 [orders] 字段 [remark] 不允许写入`** | 新建数据保存时（`id` 为空），传入了 `remark` 属性的值，但当前角色对该字段在数据库中未包含写权限（即 `perm & 2 === 0`）。 | 前端在绘制动态保存表单时，若发现字段 `perm & 2 === 0`，应直接将该表单项设为**禁用 (Disabled)** 或不展示，从源头避免被引擎拒绝。 |
| **`表 [orders] 字段 [remark] 不允许修改`** | 更新数据保存时（`id` 不为空），修改了 `remark` 的值并推送保存，但当前角色该字段没有修改权限（即 `perm & 1 === 0`）。 | 前端在渲染编辑表单时，若字段 `perm & 1 === 0`，应将对应输入框设为**只读 (Readonly)**。 |

---

### 2. 前端复选框的位运算逻辑实现
为了使管理员操作前端页面的三个 Checkbox（可读、新增、修改）与后端交互时的 `perm` 整型做完美的双向换算，前端建议编写如下工具函数：

```javascript
/**
 * 1. 后端整型 perm 转换为前台三个 Checkbox 布尔状态值
 */
function getCheckboxStates(perm) {
  return {
    canRead:   (perm & 4) === 4,  // 二进制 100
    canWrite:  (perm & 2) === 2,  // 二进制 010
    canUpdate: (perm & 1) === 1   // 二进制 001
  };
}

/**
 * 2. 前台三个 Checkbox 状态值组合为整型 perm 传给后端
 */
function getPermValue(canRead, canWrite, canUpdate) {
  let perm = 0;
  if (canRead)   perm |= 4;
  if (canWrite)  perm |= 2;
  if (canUpdate) perm |= 1;
  return perm;
}

/**
 * 3. 页面配置交互级联建议 (白名单约束逻辑)
 * - 当 "可读 (Read)" 未被勾选时，"新增 (Write)" 和 "修改 (Update)" 也必须置为 false 并禁用。
 * - 因为对用户隐藏的字段，用户不应该能够在页面上完成写和更新动作。
 */
function onReadCheckboxChange(row) {
  if (!row.canRead) {
    row.canWrite = false;
    row.canUpdate = false;
  }
}
```