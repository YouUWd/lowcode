# Lumina 企业级低代码平台 - 前端页面适配规划方案

本方案旨在指导前端（`lumina-vue`）适配最新实现的通用数据查询与级联更新 API，实现数据配置面板、动态列表、表单详情以及列级权限防御在 Vue 3 端的完整落地。

---

## 1. 核心 API 客户端适配 (`lumina-vue/src/api`)

建议在 `src/api/` 下引入一套通用的数据操作引擎客户端，例如新建 `src/api/dataEngine.js`，与后端的四个新端点完全对齐：

```javascript
import client from './client';

export const dataEngineApi = {
  /**
   * 1. 查询模块的结构元数据 (包含主表、从表、关联表及多对多定义)
   * GET /api/module/:moduleId/meta
   */
  getModuleMeta(moduleId) {
    return client.get(`/module/${moduleId}/meta`);
  },

  /**
   * 2. 通用数据查询 (支持列表分页与单条详情聚合)
   * POST /api/module/:moduleId/query
   * @param {string} moduleId 模块ID
   * @param {Object} payload { id, page, size, filters, sorts, with }
   * @param {string} roleCode 传入的 X-Role 头部用于 CLS 鉴权
   */
  query(moduleId, payload, roleCode) {
    return client.post(`/module/${moduleId}/query`, payload, {
      headers: { 'X-Role': roleCode }
    });
  },

  /**
   * 3. 动态级联保存/更新
   * POST /api/module/:moduleId/save
   * @param {string} moduleId 模块ID
   * @param {Object} data 包含主表及嵌套子表数组 (如 { id, name, order_items: [...] })
   * @param {string} roleCode 传入的 X-Role 头部进行写入/修改权限校验
   */
  save(moduleId, data, roleCode) {
    return client.post(`/module/${moduleId}/save`, { data }, {
      headers: { 'X-Role': roleCode }
    });
  },

  /**
   * 4. 级联物理删除
   * DELETE /api/module/:moduleId/:id
   */
  delete(moduleId, id) {
    return client.delete(`/module/${moduleId}/${id}`);
  }
};
```

---

## 2. 前端页面与组件适配规划

### 2.1 模块关联表与字段配置展示页 (`Config.vue` & `AggregationSetup.vue`)
- **适配点**：将此前分散加载的 `module.entities` 与 `module.mappings` 统一替换为从 `getModuleMeta(moduleId)` 中读取。
- **页面展现逻辑**：
  1. **主表栏 (MAIN)**：渲染 `mainTable.tableName` 下的所有字段（`fields`），作为页面数据的核心框架。
  2. **从表栏 (SUB)**：列表展示 `subTables`（如 `order_items`），提示用户这是一对多关系，外键字段为 `foreignKey`。
  3. **关联表栏 (JOIN)**：列表展示 `joinTables`，展示其 `joinOn` 关联条件，允许用户在界面上将其配置为只读属性列。
  4. **关系栏 (RELATION)**：展示 `relations` 多对多关系（如 `tags`），在画布上支持配置穿梭框或多选框绑定。

---

### 2.2 列表展示页 (List Page / 列表模式)
- **请求配置**：调用 `dataEngineApi.query(moduleId, { page, size, filters, sorts, with: [...] }, role)`。
- **列头与渲染绑定 (重要)**：
  - 由于后端在列表查询中返回的行属性均被扁平化并加上了表名前缀，格式为 `tableName_columnName` (例如 `orders_order_no`, `customer_profiles_level`)。
  - 前端在表格组件 (`el-table` 或自定义表格) 绑定字段时，其 `prop` 或 key 应设为 `tableName_columnName`。
  - 对于一对多从表和多对多关系数据（如 `order_items`, `tags`），数据作为嵌套的 DTO 数组返回，例如：
    ```json
    {
      "orders_id": 1,
      "orders_order_no": "ORD-001",
      "order_items": [
        { "product_name": "键盘", "qty": 1 }
      ]
    }
    ```
    表格内可通过扩展列 (Expand Column) 或气泡卡片，循环展示 `row.order_items` 及 `row.tags` 等嵌套从表数据。

---

### 2.3 详情展示与修改表单页 (Form & Detail Page)
- **请求配置**：当进入编辑/查看详情状态，调用 `dataEngineApi.query(moduleId, { id: recordId, with: [...] }, role)`。
- **数据回显**：
  - 后端返回的是标准的 flat 树状结构：主表字段直接回显（如 `data.order_no`），JOIN 表字段加了表名前缀（如 `data.customer_profiles_level`）。
  - 子表列表直接作为表单的表格数据源回显（如 `form.order_items = data.order_items`）。
- **防御性 UI 设计 (Defensive UX)**：
  根据角色持有的列权限值（`perm_value`），前端在表单渲染时应进行置灰或只读处理：
  
  ```javascript
  // 判断字段是否在特定场景下可写
  function isFieldWritable(permValue, isEditMode) {
    if (permValue === undefined) return false; // 默认不可写
    const mask = isEditMode ? 1 : 2; // 1代表修改权，2代表新增写入权
    return (permValue & mask) !== 0;
  }
  ```
  - **新增场景**：对于 `perm_value & 2 === 0` 的字段，表单输入框强制设为 `disabled`。
  - **编辑修改场景**：对于 `perm_value & 1 === 0` 的字段，表单输入框强制设为 `readonly` 或 `disabled`。
  - **敏感列展示**：对于无读权限（没有 `perm_value & 4`）的敏感列，由于后端返回的数据已经被自动处理为 `'***'`，前端直接展示脱敏字符，并禁用这些输入框。

---

### 2.4 级联提交与更新流程 ( cascading Save)
- **数据结构封装**：
  当用户点击保存时，将表单数据及嵌套子表格（如 `order_items`）和多对多关联（如选中的标签对象数组 `tags: [{ id: 1 }, { id: 3 }]`）打包至一个统一的 JSON 对象中：
  ```javascript
  const payload = {
    id: form.id, // 如果是更新则携带，新增则不带
    order_no: form.order_no,
    customer_id: form.customer_id,
    order_items: form.order_items.map(item => ({
      id: item.id, // 若为新插入的行则为 undefined，若为修改的行则有 id
      product_name: item.product_name,
      qty: item.qty,
      price: item.price
    })),
    tags: form.selectedTags.map(tagId => ({ id: tagId }))
  };
  ```
- **提交请求**：调用 `dataEngineApi.save(moduleId, payload, role)`。
- **异常捕获机制**：
  - 若用户越权尝试写入或修改受限字段，后端会抛出 `HTTP 400 Bad Request` 并附带 `"表 [orders] 字段 [remark] 不允许修改"` 的错误提示。
  - 前端 Axios 拦截器应当友好拦截 400 异常，并通过 Notification/Message 气泡弹出后端给出的错误提示，引导用户恢复不可修改的字段。

---

## 3. 前端适配排期与实施路径

| 阶段 | 核心任务 | 适配组件 | 预期输出 |
| :--- | :--- | :--- | :--- |
| **P1** | 接口服务重构 | `src/api/dataEngine.js` | 替换原有的 mock 接口和旧 api 接口，统一包体拦截。 |
| **P2** | 配置与元数据适配 | `Config.vue`, `AggregationSetup.vue` | 动态加载 `subTables` 和 `relations` 设计器数据，提供多对多画布。 |
| **P3** | 列表渲染前缀适配 | `views/modules/index.vue` (及动态列表组件) | 数据字段名适配为 `tableName_columnName` 前缀结构。 |
| **P4** | 表单防御式权限拦截 | 动态表单组件 (Form Controls) | 根据二进制 `perm_value` 实现 Input 框的 `disabled`/`readonly` 动态属性绑定。 |
