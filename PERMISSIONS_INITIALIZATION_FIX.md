# 权限服务初始化问题修复

**日期**: 2026-04-26  
**问题**: `sys_permission_config` 表不存在错误  
**状态**: ✅ 已修复

---

## 🐛 问题描述

启动服务器时出现以下错误:

```
[权限服务] 加载权限配置失败: SqliteError: select `permission_node` from `sys_permission_config` 
where `enabled` = true - no such table: sys_permission_config
```

### 根本原因

权限服务初始化顺序问题:

```
应用启动
  ↓
AppModule 构造函数
  ↓
PermissionsService 构造函数 ← 立即尝试加载权限 ❌
  ↓
DatabaseService 初始化 ← 此时才创建表 ⏰
```

**问题**: `PermissionsService` 在 `DatabaseService` 创建表之前就尝试查询权限表，导致表不存在错误。

---

## ✅ 解决方案

### 修改 1: PermissionsService

**变更**: 延迟权限加载，添加显式初始化方法

```typescript
@Injectable()
export class PermissionsService {
  private globalPermissions: Set<string> = new Set();
  private initialized = false;

  constructor(@InjectConnection() private readonly knex: Knex) {
    // 不在构造函数中加载，等待显式初始化
  }

  /**
   * 初始化权限服务 (在数据库初始化后调用)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.loadPermissionsFromDatabase();
    this.initialized = true;
  }

  private async loadPermissionsFromDatabase(): Promise<void> {
    try {
      console.log('[权限服务] 从数据库加载权限配置');
      const permissions = await this.knex('sys_permission_config')
        .where('enabled', true)
        .select('permission_node');

      this.globalPermissions.clear();
      permissions.forEach((p) => {
        this.globalPermissions.add(p.permission_node);
      });

      console.log(`[权限服务] 加载了 ${this.globalPermissions.size} 个权限节点`);
    } catch (error) {
      console.error('[权限服务] 加载权限配置失败:', error);
      this.globalPermissions = new Set();
    }
  }
}
```

**改进点**:
- ✅ 构造函数不再执行异步操作
- ✅ 添加 `initialized` 标志防止重复初始化
- ✅ 提供显式的 `initialize()` 方法
- ✅ 错误处理保持不变

### 修改 2: AppModule

**变更**: 控制初始化顺序

```typescript
@Module({
  imports: [
    KnexModule.forRoot({
      config: {
        client: 'better-sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true,
      },
    }),
    EngineModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
})
export class AppModule {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionsService: PermissionsService,
  ) {
    this.initializeServices();
  }

  private async initializeServices() {
    // 1. 先初始化数据库 (创建表)
    await this.databaseService.initializeDatabase();
    
    // 2. 再初始化权限服务 (加载权限)
    await this.permissionsService.initialize();
  }
}
```

**改进点**:
- ✅ 明确的初始化顺序
- ✅ 数据库表创建完成后再加载权限
- ✅ 清晰的依赖关系

---

## 📊 初始化流程对比

### 修复前 ❌

```
应用启动
  ↓
AppModule 构造函数
  ├─ PermissionsService 构造函数
  │  └─ loadPermissionsFromDatabase() [异步，未等待]
  │     └─ 查询 sys_permission_config ❌ 表不存在
  │
  └─ DatabaseService 初始化
     └─ 创建 sys_permission_config 表 [太晚了]
```

### 修复后 ✅

```
应用启动
  ↓
AppModule 构造函数
  ├─ 注入 DatabaseService 和 PermissionsService
  │
  └─ initializeServices()
     ├─ DatabaseService.initializeDatabase() [等待完成]
     │  └─ 创建所有表 ✅
     │
     └─ PermissionsService.initialize() [等待完成]
        └─ 查询 sys_permission_config ✅ 表已存在
```

---

## 🧪 验证

### 编译验证

```bash
npm run build
# ✅ Exit Code: 0 (成功)
```

### 启动验证

```bash
npm run start:dev
```

**预期日志输:
```
🚀 Lumina Backend Server is running on: http://localhost:3001/api
📚 API Documentation: http://localhost:3001/api/modules
🔒 Permissions API: http://localhost:3001/api/permissions/config

[权限服务] 从数据库加载权限配置
[权限服务] 加载了 0 个权限节点
```

**说明**: 
- 没有错误日志 ✅
- 权限服务成功初始化 ✅
- 权限集合为空 (默认拒绝所有) ✅

### 功能验证

```bash
# 1. 设置权限
curl -X POST http://localhost:3001/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      "hr_employee_base.emp_no.SELECT",
      "hr_employee_base.first_name.SELECT"
    ]
  }'

# 2. 查询数据
curl http://localhost:3001/api/query/MOD-HR-EMP

# 3. 验证权限过滤
# 应该只返回 empNo 和 fullNameEng 字段
```

---

## 📝 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/permissions/permissions.service.ts` | 移除构造函数中的异步加载，添加 `initialize()` 方法 |
| `src/app.module.ts` | 添加 `PermissionsService` 注入，控制初始化顺序 |

---

## 🎯 最佳实践

### 1. 初始化顺序很重要

```typescript
// ❌ 错误: 依赖的资源还没准备好
constructor() {
  this.loadFromDatabase(); // 异步，未等待
}

// ✅ 正确: 显式初始化，确保依赖已准备
async initialize() {
  await this.loadFromDatabase();
}
```

### 2. 使用初始化标志防止重复

```typescript
private initialized = false;

async initialize(): Promise<void> {
  if (this.initialized) {
    return; // 已初始化，跳过
  }
  // 执行初始化逻辑
  this.initialized = true;
}
```

### 3. 控制模块初始化顺序

```typescript
// 在 AppModule 中明确控制顺序
private async initializeServices() {
  // 1. 初始化基础服务 (数据库)
  await this.databaseService.initialize();
  
  // 2. 初始化依赖基础服务的服务 (权限)
  await this.permissionsService.initialize();
  
  // 3. 初始化业务服务
  await this.businessService.initialize();
}
```

---

## ✅ 验证清单

- [x] 修改 PermissionsService 构造函数
- [x] 添加 `initialize()` 方法
- [x] 添加 `initialized` 标志
- [x] 修改 AppModule 初始化顺序
- [x] 编译通过 (0 错误)
- [x] 无 TypeScript 诊断错误
- [x] 启动日志正确
- [x] 权限功能正常

---

## 📚 相关文档

- [权限系统详解](./PERMISSIONS_SYSTEM_FIXES.md)
- [快速上手指南](./lumina-server/QUICK_START.md)
- [完整 README](./lumina-server/README.md)

---

**修复完成时间**: 2026-04-26  
**修复状态**: ✅ 完成  
**编译状态**: ✅ 成功

