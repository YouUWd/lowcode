# Lumina Backend Server

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-In--Memory-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Knex.js](https://img.shields.io/badge/Knex.js-3.2.9-orange?style=for-the-badge)

**企业级低代码平台后端服务 - 动态查询引擎 + 列级权限控制**

[功能特性](#功能特性) • [快速开始](#快速开始) • [API 文档](#api-文档) • [架构设计](#架构设计) • [开发指南](#开发指南)

</div>

---

## 📋 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [API 文档](#api-文档)
- [架构设计](#架构设计)
- [数据库设计](#数据库设计)
- [权限系统](#权限系统)
- [开发指南](#开发指南)
- [测试](#测试)
- [部署](#部署)
- [常见问题](#常见问题)

---

## 🎯 项目简介

Lumina Backend 是一个基于 NestJS 的企业级低代码平台后端服务，提供动态查询引擎和细粒度的列级权限控制。系统支持通过 JSON 配置动态生成 SQL 查询，并在 Backend 和 Frontend 两层进行数据转换，实现灵活的数据聚合和展示。

### 核心能力

- 🔍 **动态查询引擎** - 通过 JSON 配置生成复杂 SQL 查询
- 🔒 **列级权限控制** - 细粒度的字段级访问控制 (CLS)
- 🔄 **混合计算架构** - Backend 下推 + Frontend 上拉
- 📊 **预置业务模块** - HR、系统日志等开箱即用模块
- 🚀 **高性能缓存** - 内存缓存 + 数据库持久化
- 🛡️ **类型安全** - 完整的 TypeScript 类型定义

---

## ✨ 功能特性

### 1. 动态查询引擎

```typescript
// 通过模块 ID 自动生成查询
GET /api/query/MOD-HR-EMP

// 自动处理:
// ✓ 多表 JOIN
// ✓ 字段映射
// ✓ 数据转换
// ✓ 权限过滤
```

### 2. 列级权限控制 (CLS)

```typescript
// 权限节点格式: {entity}.{fieldName}.{operationType}
"hr_employee_base.emp_no.SELECT"
"hr_payroll_result.net_amount.SELECT"

// 默认拒绝策略 (Whitelist)
// 只有显式授权的字段才能访问
```

### 3. 数据转换函数

| 函数 | 用途 | 示例 |
|------|------|------|
| `CONCAT` | 字符串拼接 | `CONCAT(first_name, ' ', last_name)` |
| `DICT_MAP` | 字典映射 | `DICT_MAP('EMP_STATUS', status)` |
| `MASK_SENSITIVE` | 敏感数据脱敏 | `MASK_SENSITIVE(id_card, 'ALL')` |
| `ASSEMBLE_FRACTION` | 分数格式化 | `ASSEMBLE_FRACTION(50, 100)` → "50 / 100" |
| `ASSEMBLE_PERF_SUMMARY` | 绩效汇总 | `ASSEMBLE_PERF_SUMMARY(95, 'A')` → "95 (A)" |

### 4. 预置业务模块

- **MOD-SYS-LOG** - 系统操作日志
- **MOD-HR-ORG** - 组织架构管理
- **MOD-HR-EMP** - 员工档案管理
- **MOD-HR-PAY** - 薪酬结算管理

---

## 🛠️ 技术栈

### 核心框架
- **NestJS 11.0.1** - 渐进式 Node.js 框架
- **TypeScript 5.7.3** - 类型安全的 JavaScript 超集
- **Knex.js 3.2.9** - SQL 查询构建器
- **Better-SQLite3 11.10.0** - 高性能 SQLite 驱动

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Jest** - 单元测试框架
- **Supertest** - API 集成测试

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run start:dev
```

服务器将在 `http://localhost:3001` 启动

### 验证安装

```bash
# 获取所有模块列表
curl http://localhost:3001/api/modules

# 查询员工数据
curl http://localhost:3001/api/query/MOD-HR-EMP

# 获取权限配置
curl http://localhost:3001/api/permissions/config
```

---

## 📚 API 文档

### 基础信息

- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`
- **CORS**: 已启用

### 模块管理 API

#### 1. 获取所有模块

```http
GET /api/modules
```

**响应示例**:
```json
[
  {
    "id": "MOD-HR-EMP",
    "name": "员工核心档案",
    "desc": "维护员工基础信息、教育经历及生命周期",
    "entity": "hr_employee_base",
    "count": 8,
    "active": true
  }
]
```

#### 2. 获取模块配置

```http
GET /api/modules/:id
```

**参数**:
- `id` - 模块 ID (例如: `MOD-HR-EMP`)

**响应示例**:
```json
{
  "primaryEntity": {
    "name": "hr_employee_base",
    "desc": "员工基础信息表"
  },
  "entities": [...],
  "mappings": [...]
}
```

#### 3. 执行动态查询

```http
GET /api/query/:moduleId
```

**参数**:
- `moduleId` - 模块 ID

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "empNo": "EMP001",
      "fullNameEng": "John Doe",
      "idNumber": "110***1234",
      "empType": "正式员工",
      "deptName": "技术部",
      "empStatus": "在职"
    }
  ],
  "count": 1
}
```

### 权限管理 API

#### 4. 设置权限配置

```http
POST /api/permissions/config
Content-Type: application/json

{
  "permissions": [
    "hr_employee_base.emp_no.SELECT",
    "hr_employee_base.first_name.SELECT",
    "hr_payroll_result.net_amount.SELECT"
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "成功设置 3 个权限节点",
  "permissionCount": 3
}
```

#### 5. 获取权限配置

```http
GET /api/permissions/config
```

**响应示例**:
```json
{
  "success": true,
  "permissions": [
    "hr_employee_base.emp_no.SELECT",
    "hr_employee_base.first_name.SELECT"
  ],
  "permissionCount": 2,
  "status": "部分字段允许"
}
```

#### 6. 检查单个权限

```http
GET /api/permissions/check?entity=hr_employee_base&fieldName=emp_no&operationType=SELECT
```

**响应示例**:
```json
{
  "success": true,
  "permissionNode": "hr_employee_base.emp_no.SELECT",
  "hasPermission": true
}
```

#### 7. 清空权限配置

```http
POST /api/permissions/clear
```

**响应示例**:
```json
{
  "success": true,
  "message": "已清空权限配置，不允许任何字段"
}
```

---

## 🏗️ 架构设计

### 三层架构

```
┌─────────────────────────────────────────┐
│         REST API Layer                  │
│  (Controllers)                          │
│  - EngineController                     │
│  - PermissionsController                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Business Logic Layer               │
│  (Services)                             │
│  - EngineService                        │
│  - ModulesService                       │
│  - PermissionsService                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Data Access Layer                  │
│  (DatabaseService, Knex.js)             │
│  - SQLite In-Memory Database            │
│  - Query Building                       │
│  - Data Persistence                     │
└─────────────────────────────────────────┘
```

### 查询执行流程

```
用户请求
    ↓
GET /api/query/:moduleId
    ↓
[权限拦截] 检查全局权限配置
    ↓
权限集合为空? → YES → 拒绝查询
    ↓ NO
[字段过滤] 保留有权限的字段
    ↓
过滤后无字段? → YES → 拒绝查询
    ↓ NO
[查询构建] 生成 SQL 查询
    ↓
[Backend 转换] 执行 SQL 层转换
    ↓
[Frontend 转换] 执行 BFF 层转换
    ↓
返回结果
```

### 目录结构

```
lumina-server/
├── src/
│   ├── database/              # 数据库模块
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   ├── engine/                # 查询引擎模块
│   │   ├── engine.controller.ts
│   │   ├── engine.module.ts
│   │   └── engine.service.ts
│   ├── modules/               # 业务模块配置
│   │   └── modules.service.ts
│   ├── permissions/           # 权限管理模块
│   │   ├── permissions.controller.ts
│   │   ├── permissions.module.ts
│   │   └── permissions.service.ts
│   ├── app.module.ts          # 应用主模块
│   └── main.ts                # 应用入口
├── doc/                       # 文档目录
├── test/                      # 测试文件
├── package.json
├── tsconfig.json
└── README.md
```

---

## 💾 数据库设计

### 核心表结构

#### 元数据表
- `_table_comments` - 表注释
- `_column_comments` - 字段注释

#### 系统表
- `sys_operation_log` - 操作日志
- `sys_user` - 系统用户
- `sys_permission_config` - 权限配置

#### HR 业务表
- `hr_organization` - 组织架构
- `hr_employee_base` - 员工基础信息
- `hr_emp_job` - 员工岗位信息
- `hr_emp_personal` - 员工个人信息
- `hr_payroll_result` - 薪酬结算结果
- `hr_salary_structure` - 薪资结构
- 更多...

### 权限配置表

```sql
CREATE TABLE sys_permission_config (
  id INTEGER PRIMARY KEY,
  permission_node VARCHAR UNIQUE,      -- 权限节点
  entity VARCHAR,                      -- 表名
  field_name VARCHAR,                  -- 字段名
  operation_type VARCHAR,              -- 操作类型
  description VARCHAR,                 -- 描述
  enabled BOOLEAN DEFAULT true,        -- 是否启用
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔒 权限系统

### 设计原则

1. **默认拒绝 (Deny by Default)** - 未配置的字段默认不可访问
2. **显式授权 (Explicit Grant)** - 必须显式配置权限节点
3. **细粒度控制 (Fine-Grained)** - 字段级别的访问控制
4. **操作分离 (Operation Separation)** - SELECT/UPDATE/WRITE 独立控制

### 权限节点格式

```
{entity}.{fieldName}.{operationType}

示例:
- hr_employee_base.emp_no.SELECT        # 允许读取员工编号
- hr_payroll_result.net_amount.SELECT   # 允许读取实发工资
- hr_employee_base.first_name.UPDATE    # 允许更新名字
```

### 权限检查流程

```typescript
// 1. 加载权限配置 (应用启动时)
PermissionsService.loadPermissionsFromDatabase()

// 2. 查询时检查权限
if (permissions.size === 0) {
  return error("权限集合为空，无权访问任何字段");
}

// 3. 过滤字段
mappings = mappings.filter(mapping => {
  return mapping.physicalFields.every(field => {
    const node = `${field.entity}.${field.name}.SELECT`;
    return permissions.has(node);
  });
});

// 4. 验证结果
if (mappings.length === 0) {
  return error("无权访问该模块的任何字段");
}
```

### 使用示例

```bash
# 1. 设置权限 - 只允许访问员工编号和姓名
curl -X POST http://localhost:3001/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      "hr_employee_base.emp_no.SELECT",
      "hr_employee_base.first_name.SELECT",
      "hr_employee_base.last_name.SELECT"
    ]
  }'

# 2. 查询员工数据 - 只返回有权限的字段
curl http://localhost:3001/api/query/MOD-HR-EMP

# 3. 清空权限 - 拒绝所有访问
curl -X POST http://localhost:3001/api/permissions/clear
```

---

## 👨‍💻 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器 (热重载)
npm run start:dev

# 启动调试模式
npm run start:debug
```

### 代码规范

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 自动修复
npm run lint -- --fix
```

### 添加新模块

1. 在 `modules.service.ts` 中定义模块配置
2. 配置主表和关联表
3. 定义字段映射和转换函数
4. 在数据库中添加种子数据

```typescript
{
  id: 'MOD-CUSTOM',
  name: '自定义模块',
  desc: '模块描述',
  entity: 'custom_table',
  count: 0,
  active: true,
  primaryEntity: { name: 'custom_table', desc: '主表' },
  entities: [...],
  mappings: [...]
}
```

### 添加转换函数

在 `engine.service.ts` 中添加新的转换函数:

```typescript
private applyBffTransformers(data: any[], mappings: any[]): any[] {
  // 添加新的转换逻辑
  if (transformer === 'MY_CUSTOM_TRANSFORM') {
    // 实现转换逻辑
  }
}
```

---

## 🧪 测试

### 单元测试

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:cov
```

### 集成测试

```bash
# 运行 E2E 测试
npm run test:e2e
```

### 手动测试

```bash
# 测试模块列表
curl http://localhost:3001/api/modules

# 测试查询功能
curl http://localhost:3001/api/query/MOD-HR-EMP

# 测试权限设置
curl -X POST http://localhost:3001/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["hr_employee_base.emp_no.SELECT"]}'

# 测试权限过滤
curl http://localhost:3001/api/query/MOD-HR-EMP
```

---

## 🚢 部署

### 构建生产版本

```bash
# 构建
npm run build

# 启动生产服务器
npm run start:prod
```

### 环境变量

创建 `.env` 文件:

```env
# 服务器配置
PORT=3001
HOST=0.0.0.0

# 数据库配置 (生产环境使用持久化数据库)
DB_CLIENT=better-sqlite3
DB_FILENAME=:memory:

# 日志级别
LOG_LEVEL=log
```

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

```bash
# 构建镜像
docker build -t lumina-backend .

# 运行容器
docker run -p 3001:3001 lumina-backend
```

---

## ❓ 常见问题

### Q: 如何切换到持久化数据库?

A: 修改 `app.module.ts` 中的 Knex 配置:

```typescript
KnexModule.forRoot({
  config: {
    client: 'pg', // 或 'mysql', 'mssql'
    connection: {
      host: 'localhost',
      user: 'your_user',
      password: 'your_password',
      database: 'lumina_db'
    }
  }
})
```

### Q: 如何添加用户认证?

A: 集成 Passport.js 和 JWT:

```bash
npm install @nestjs/passport @nestjs/jwt passport passport-jwt
```

### Q: 权限配置丢失怎么办?

A: 权限存储在 `sys_permission_config` 表中。如果使用内存数据库，重启后会丢失。生产环境请使用持久化数据库。

### Q: 如何优化查询性能?

A: 
1. 添加数据库索引
2. 使用查询缓存
3. 限制返回字段数量
4. 使用分页查询

### Q: 如何调试 SQL 查询?

A: 启用 Knex 调试模式:

```typescript
KnexModule.forRoot({
  config: {
    debug: true, // 打印 SQL 语句
    // ...
  }
})
```

---

## 📖 相关文档

- [完整架构文档](../doc/lumina-server-guide.md)
- [权限系统详解](../PERMISSIONS_SYSTEM_FIXES.md)
- [API 快速参考](../PERMISSIONS_QUICK_REFERENCE.md)
- [NestJS 官方文档](https://docs.nestjs.com)
- [Knex.js 文档](https://knexjs.org)

---

## 📝 更新日志

### v1.1.0 (2026-04-26)
- ✅ 添加列级权限控制系统
- ✅ 修复异步初始化问题
- ✅ 添加数据库持久化支持
- ✅ 优化查询执行流程
- ✅ 完善 API 文档

### v1.0.0 (2026-04-25)
- ✅ 初始版本发布
- ✅ 动态查询引擎
- ✅ 4 个预置业务模块
- ✅ 5 个数据转换函数
- ✅ SQLite 内存数据库

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 联系方式

- 项目主页: [GitHub Repository](#)
- 问题反馈: [Issues](#)
- 技术支持: [Discussions](#)

---

<div align="center">

**Built with ❤️ using NestJS**

⭐ 如果这个项目对你有帮助，请给一个 Star！

</div>
