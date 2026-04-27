# 贡献指南

感谢你对 Lumina Backend 项目的关注！我们欢迎所有形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试要求](#测试要求)

---

## 🤝 行为准则

参与本项目即表示你同意遵守我们的行为准则:

- 尊重所有贡献者
- 使用友好和包容的语言
- 接受建设性的批评
- 关注对社区最有利的事情

---

## 💡 如何贡献

### 报告 Bug

如果你发现了 Bug，请创建一个 Issue 并包含:

1. **清晰的标题** - 简洁描述问题
2. **复现步骤** - 详细的步骤说明
3. **期望行为** - 你期望发生什么
4. **实际行为** - 实际发生了什么
5. **环境信息** - Node 版本、操作系统等
6. **相关日志** - 错误日志或截图

**示例**:
```markdown
### Bug 描述
查询员工数据时返回 500 错误

### 复现步骤
1. 启动服务器
2. 配置权限: POST /api/permissions/config
3. 执行查询: GET /api/query/MOD-HR-EMP
4. 返回 500 错误

### 期望行为
返回员工数据列表

### 实际行为
返回 500 Internal Server Error

### 环境
- Node.js: 18.16.0
- OS: Windows 11
- 浏览器: Chrome 120

### 错误日志
```
Error: Cannot read property 'emp_no' of undefined
  at EngineService.executeDynamicQuery
```
```

### 提出新功能

如果你有新功能的想法，请创建一个 Issue 并包含:

1. **功能描述** - 清晰描述新功能
2. **使用场景** - 为什么需要这个功能
3. **实现建议** - 你的实现思路 (可选)
4. **替代方案** - 其他可能的解决方案 (可选)

### 提交代码

1. **Fork 仓库**
2. **创建分支** - `git checkout -b feature/amazing-feature`
3. **编写代码** - 遵循代码规范
4. **添加测试** - 确保测试覆盖率
5. **提交更改** - 遵循提交规范
6. **推送分支** - `git push origin feature/amazing-feature`
7. **创建 PR** - 详细描述你的更改

---

## 🔧 开发流程

### 1. 设置开发环境

```bash
# 克隆你的 fork
git clone https://github.com/YOUR_USERNAME/lumina-server.git
cd lumina-server

# 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/lumina-server.git

# 安装依赖
npm install

# 启动开发服务器
npm run start:dev
```

### 2. 创建功能分支

```bash
# 从 main 分支创建新分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

分支命名规范:
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构
- `test/` - 测试相关
- `chore/` - 构建/工具相关

### 3. 编写代码

遵循以下原则:
- 保持代码简洁清晰
- 添加必要的注释
- 遵循 TypeScript 最佳实践
- 确保类型安全

### 4. 运行测试

```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:cov

# 运行 E2E 测试
npm run test:e2e
```

### 5. 提交更改

```bash
# 添加更改
git add .

# 提交 (遵循提交规范)
git commit -m "feat: add new feature"

# 推送到你的 fork
git push origin feature/your-feature-name
```

### 6. 创建 Pull Request

1. 访问你的 fork 页面
2. 点击 "New Pull Request"
3. 填写 PR 模板
4. 等待代码审查

---

## 📝 代码规范

### TypeScript 规范

```typescript
// ✅ 好的示例
export class PermissionsService {
  private globalPermissions: Set<string> = new Set();

  constructor(@InjectConnection() private readonly knex: Knex) {
    this.loadPermissionsFromDatabase().catch((error) => {
      console.error('[权限服务] 初始化失败:', error);
    });
  }

  async setGlobalPermissions(permissions: Set<string>): Promise<void> {
    // 实现逻辑
  }
}

// ❌ 不好的示例
export class PermissionsService {
  private permissions: any; // 避免使用 any

  constructor(knex) { // 缺少类型注解
    this.loadPermissions(); // 未处理异步错误
  }

  setPermissions(permissions) { // 缺少返回类型
    // 实现逻辑
  }
}
```

### 命名规范

- **类名**: PascalCase - `PermissionsService`
- **方法名**: camelCase - `setGlobalPermissions`
- **常量**: UPPER_SNAKE_CASE - `MAX_QUERY_RESULTS`
- **接口**: PascalCase + I 前缀 - `IPermissionNode`
- **类型**: PascalCase - `PermissionNode`

### 注释规范

```typescript
/**
 * 设置全局权限配置
 * @param permissions 权限节点集合
 * @returns Promise<void>
 * @throws {Error} 数据库操作失败时抛出错误
 */
async setGlobalPermissions(permissions: Set<string>): Promise<void> {
  // 实现逻辑
}
```

### 格式化

```bash
# 格式化所有文件
npm run format

# 检查代码风格
npm run lint

# 自动修复
npm run lint -- --fix
```

---

## 📋 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

### 提交类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式 (不影响代码运行)
- `refactor`: 重构 (既不是新功能也不是 Bug 修复)
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 示例

```bash
# 新功能
git commit -m "feat(permissions): add role-based access control"

# Bug 修复
git commit -m "fix(query): resolve JOIN condition error"

# 文档更新
git commit -m "docs(readme): update API documentation"

# 重构
git commit -m "refactor(engine): simplify query builder logic"

# 性能优化
git commit -m "perf(cache): implement Redis caching layer"
```

### 详细示例

```
feat(permissions): add role-based access control

- Add Role entity and RoleService
- Implement role-permission mapping
- Update PermissionsService to support roles
- Add API endpoints for role management

Closes #123
```

---

## 🧪 测试要求

### 单元测试

每个新功能都应该有对应的单元测试:

```typescript
describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set global permissions', async () => {
    const permissions = new Set(['hr_employee_base.emp_no.SELECT']);
    await service.setGlobalPermissions(permissions);
    
    const result = service.getGlobalPermissions();
    expect(result.size).toBe(1);
    expect(result.has('hr_employee_base.emp_no.SELECT')).toBe(true);
  });
});
```

### 集成测试

对于 API 端点，添加 E2E 测试:

```typescript
describe('PermissionsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/permissions/config (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/permissions/config')
      .send({ permissions: ['hr_employee_base.emp_no.SELECT'] })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.permissionCount).toBe(1);
      });
  });
});
```

### 测试覆盖率

- 目标覆盖率: 80%+
- 关键模块覆盖率: 90%+

```bash
# 生成覆盖率报告
npm run test:cov

# 查看报告
open coverage/lcov-report/index.html
```

---

## 🔍 代码审查

### 审查清单

- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 测试全部通过
- [ ] 文档已更新
- [ ] 提交信息符合规范
- [ ] 没有引入新的警告
- [ ] 性能没有明显下降

### 审查流程

1. **自动检查** - CI/CD 自动运行测试和检查
2. **代码审查** - 至少一位维护者审查代码
3. **讨论修改** - 根据反馈进行修改
4. **合并代码** - 审查通过后合并到主分支

---

## 📚 资源

- [NestJS 文档](https://docs.nestjs.com)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Knex.js 文档](https://knexjs.org)
- [Jest 文档](https://jestjs.io/docs/getting-started)

---

## ❓ 需要帮助?

- 查看 [FAQ](./README.md#常见问题)
- 创建 [Issue](https://github.com/YOUR_REPO/issues)
- 加入 [讨论](https://github.com/YOUR_REPO/discussions)

---

**感谢你的贡献！🎉**
