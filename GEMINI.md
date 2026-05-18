# GEMINI.md - Lumina 项目上下文

## 项目概述
**Lumina** 是一个企业级低代码平台，具有动态查询引擎和细粒度的列级安全 (CLS) 控制。项目目前处于多栈状态，正在从 NestJS/TypeScript 架构迁移到 Spring Boot 3/Java，同时维护 Vue 3 前端并与基于 Laravel 的 HR API 集成。

### 核心组件
1.  **`lumina-server/` (NestJS 后端)**:
    -   **用途**: 提供动态 SQL 生成和数据转换的核心后端服务。
    -   **技术栈**: NestJS 11, TypeScript, Knex.js, Better-SQLite3。
    -   **关键特性**: 列级权限控制、混合计算（SQL 下推 + BFF 上拉）以及预置的 HR/系统模块。
2.  **`lumina-vue/` (Vue 前端)**:
    -   **用途**: Lumina 平台的管理和配置界面。
    -   **技术栈**: Vue 3, Vite, TailwindCSS, Lucide Vue。
    -   **关键特性**: 模块配置、权限矩阵管理和数据聚合设置。
3.  **`php/jiuding-hr-manage-api/` (Laravel API)**:
    -   **用途**: 并行/遗留的 HR 管理 API。
    -   **技术栈**: PHP 8.1, Laravel 10, GatewayWorker (WebSocket)。
4.  **`doc/` & `TRANSFER.md`**:
    -   包含架构设计以及从 NestJS/Knex 迁移到 **Spring Boot 3 + JDK 21 + jOOQ** 的现行迁移计划。

---

## 🚀 构建与运行

### lumina-server (NestJS)
```bash
cd lumina-server
npm install
npm run start:dev  # 启动于 http://localhost:3001
npm run build      # 验证 TypeScript 合规性
npm run test       # 运行 Jest 单元测试
```

### lumina-vue (Vite)
```bash
cd lumina-vue
npm install
npm run dev        # 启动开发服务器
npm run build      # 生产环境构建
```

### php/jiuding-hr-manage-api (Laravel)
```bash
cd php/jiuding-hr-manage-api
composer install
php artisan serve
```

---

## 🏗️ 架构与规范

### Lumina Server (NestJS)
-   **架构**: 三层设计：
    -   **API 层**: `EngineController`, `PermissionsController`, `ModulesController`。
    -   **业务逻辑层**: `EngineService` (查询生成), `ModulesService` (元数据), `PermissionsService` (列级安全)。
    -   **数据访问层**: `DatabaseService` (Knex/SQLite)。
-   **权限控制 (CLS)**:
    -   节点格式: `{entity}.{fieldName}.{operationType}` (例如: `hr_employee_base.emp_no.SELECT`)。
    -   策略: 默认拒绝 (白名单机制)。
-   **转换函数**: 支持 `CONCAT`, `DICT_MAP`, `MASK_SENSITIVE`, `ASSEMBLE_FRACTION`, `ASSEMBLE_PERF_SUMMARY`。

### Java 迁移计划 (`TRANSFER.md`)
-   **目标技术栈**: Spring Boot 3.2+, JDK 21, jOOQ, SQLite。
-   **核心策略**: 将 Knex 查询构建器逻辑直接移植到 jOOQ 类型安全的 SQL 构建器中。

### 前端
-   **样式**: Vanilla CSS 与 TailwindCSS 结合使用。
-   **状态管理**: 为原型设计和集成使用了 Mock/集中式 store。

---

## 📂 关键文件与目录
-   `TRANSFER.md`: NestJS 到 Spring Boot 迁移的关键指南。
-   `doc/java-migration/`: 新 Java 后端的详细需求和设计。
-   `lumina-server/src/engine/engine.service.ts`: 动态查询生成的业务核心逻辑。
-   `lumina-server/src/permissions/permissions.service.ts`: 列级安全 (CLS) 的实现。
-   `lumina-vue/src/components/`: 可复用的低代码配置组件。

---

## 🛠️ 开发指南
1.  **严格类型**: 始终使用 TypeScript 严格模式。对于 `transformerEnv`，请使用 `as const` 断言。
2.  **Async/Await**: 确保所有数据库操作和权限加载都已正确使用 await。
3.  **权限先行**: 在添加新模块或字段时，确保已定义相应的权限节点。
4.  **微创修改**: 修改 `lumina-server` 时，除非是在执行 Java 迁移，否则请保持与现有 NestJS 模式的一致性。
