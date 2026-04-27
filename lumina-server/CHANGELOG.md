# 更新日志

所有重要的项目变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.1.0] - 2026-04-26

### 新增 ✨

- **列级权限控制系统 (CLS)**
  - 实现细粒度的字段级访问控制
  - 支持 SELECT/UPDATE/WRITE 操作类型
  - 默认拒绝策略 (Whitelist/Deny-by-Default)
  - 权限节点格式: `{entity}.{fieldName}.{operationType}`

- **权限管理 API**
  - `POST /api/permissions/config` - 设置权限配置
  - `GET /api/permissions/config` - 获取权限配置
  - `GET /api/permissions/check` - 检查单个权限
  - `POST /api/permissions/clear` - 清空权限配置

- **数据库持久化**
  - 新增 `sys_permission_config` 表
  - 权限配置持久化存储
  - 应用启动时自动加载权限

- **查询权限过滤**
  - 查询执行前自动检查权限
  - 过滤无权限的字段
  - 权限集合为空时拒绝查询

- **完整文档**
  - 新增完整的 README.md
  - 新增快速上手指南 (QUICK_START.md)
  - 新增贡献指南 (CONTRIBUTING.md)
  - 新增 API 测试集合 (api-collection.json)

### 修复 🐛

- **异步初始化问题**
  - 修复 PermissionsService 构造函数中未 await 异步方法的问题
  - 添加错误处理，防止初始化失败导致应用崩溃
  - 权限加载失败时默认为空集合 (拒绝所有访问)

- **Controller 异步调用**
  - PermissionsController 的 `setPermissions()` 方法添加 `async` 关键字
  - PermissionsController 的 `clearPermissions()` 方法添加 `async` 关键字
  - 确保数据库操作完成后再返回响应

### 优化 ⚡

- **服务器启动**
  - 优化 main.ts，添加详细的启动日志
  - 添加全局 API 前缀 `/api`
  - 改进 CORS 配置
  - 添加错误处理和优雅退出

- **API 路由**
  - 统一 API 路由结构
  - EngineController 路由从 `/api` 移至根路径
  - PermissionsController 路由从 `/api/permissions` 移至 `/permissions`
  - 通过全局前缀统一管理

- **日志输出**
  - 添加中文日志输出
  - 权限检查过程详细日志
  - 查询执行流程日志
  - 错误日志包含上下文信息

### 文档 📚

- 完整的 README.md (中文)
- 快速上手指南 (QUICK_START.md)
- 贡献指南 (CONTRIBUTING.md)
- API 测试集合 (api-collection.json)
- 环境变量示例 (.env.example)
- Docker 配置 (Dockerfile, docker-compose.yml)
- 更新日志 (CHANGELOG.md)

---

## [1.0.0] - 2026-04-25

### 新增 ✨

- **动态查询引擎**
  - 基于 JSON 配置生成 SQL 查询
  - 支持多表 JOIN
  - 支持字段映射和转换
  - Backend 下推 + Frontend 上拉混合计算

- **预置业务模块**
  - MOD-SYS-LOG - 系统操作日志
  - MOD-HR-ORG - 组织架构管理
  - MOD-HR-EMP - 员工档案管理
  - MOD-HR-PAY - 薪酬结算管理

- **数据转换函数**
  - CONCAT - 字符串拼接
  - DICT_MAP - 字典映射
  - MASK_SENSITIVE - 敏感数据脱敏
  - ASSEMBLE_FRACTION - 分数格式化
  - ASSEMBLE_PERF_SUMMARY - 绩效汇总

- **数据库设计**
  - 20+ 业务表
  - 完整的种子数据
  - 表和字段注释
  - SQLite 内存数据库

- **REST API**
  - `GET /api/modules` - 获取所有模块
  - `GET /api/modules/:id` - 获取模块配置
  - `GET /api/query/:moduleId` - 执行动态查询

### 技术栈 🛠️

- NestJS 11.0.1
- TypeScript 5.7.3
- Knex.js 3.2.9
- Better-SQLite3 11.10.0
- Jest 30.0.0

### 架构 🏗️

- 三层架构 (Controller - Service - Database)
- 依赖注入
- 模块化设计
- 类型安全

---

## [未发布]

### 计划中 🚧

- **用户认证系统**
  - JWT 认证
  - 用户登录/注册
  - 密码加密

- **角色权限系统**
  - 角色管理
  - 角色-权限映射
  - 权限继承

- **查询优化**
  - Redis 缓存
  - 查询结果缓存
  - 分页查询

- **监控和日志**
  - 性能监控
  - 错误追踪
  - 审计日志

- **数据库迁移**
  - 支持 PostgreSQL
  - 支持 MySQL
  - 数据库迁移工具

---

## 版本说明

### 版本号格式

`主版本号.次版本号.修订号`

- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 变更类型

- `新增` - 新功能
- `修复` - Bug 修复
- `优化` - 性能优化或代码改进
- `文档` - 文档更新
- `废弃` - 即将移除的功能
- `移除` - 已移除的功能
- `安全` - 安全相关修复

---

## 链接

- [项目主页](https://github.com/YOUR_REPO)
- [问题追踪](https://github.com/YOUR_REPO/issues)
- [发布页面](https://github.com/YOUR_REPO/releases)

---

**格式说明**: 本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范
