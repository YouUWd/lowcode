# 自增 ID 从 1 开始修复

## 问题
所有带有自增 ID 的表，ID 需要从 1 开始而不是 0 开始。

## 修复内容

### 修改文件
- `lumina-server/src/database/database.service.ts`

### 修改范围

#### 1. 配置数据库表

**sys_module 表** (4 条记录)
- 添加 id 字段：1, 2, 3, 4

**sys_module_entity 表** (13 条记录)
- 添加 id 字段：1-13

**sys_module_field 表** (21 条记录)
- 添加 id 字段：1-21
- MOD-SYS-LOG: 1-3
- MOD-HR-ORG: 4-9
- MOD-HR-EMP: 10-15
- MOD-HR-PAY: 16-21

**sys_module_field_source 表** (25 条记录)
- 添加 id 字段：1-25
- MOD-SYS-LOG: 1-3
- MOD-HR-ORG: 4-11
- MOD-HR-EMP: 12-18
- MOD-HR-PAY: 19-25

**sys_permission_config 表** (75 条记录)
- 添加 id 字段：1-75
- 权限节点生成时添加递增 id

#### 2. 业务数据库表

**hr_organization 表** (3 条记录)
- 添加 id 字段：1, 2, 3

**sys_user 表** (3 条记录)
- 添加 id 字段：1, 2, 3

**hr_employee_base 表** (4 条记录)
- 添加 id 字段：1, 2, 3, 4

**hr_emp_job 表** (4 条记录)
- 添加 id 字段：1, 2, 3, 4

**hr_emp_personal 表** (4 条记录)
- 添加 id 字段：1, 2, 3, 4

**hr_salary_structure 表** (2 条记录)
- 添加 id 字段：1, 2

**hr_payroll_result 表** (4 条记录)
- 添加 id 字段：1, 2, 3, 4

**hr_social_security_record 表** (4 条记录)
- 添加 id 字段：1, 2, 3, 4

**hr_tax_record 表** (4 条记录)
- 添加 id 字段：1, 2, 3, 4

**sys_operation_log 表** (2 条记录)
- 添加 id 字段：1, 2

## 修改方式

在每个数据对象的第一行添加 `id` 字段，确保：
1. ID 值从 1 开始
2. ID 值连续递增
3. 代码格式和缩进保持一致

### 示例

**修改前**:
```typescript
await this.businessDb('hr_employee_base').insert([
  {
    emp_no: 'EMP-0001',
    first_name: 'John',
    // ...
  },
]);
```

**修改后**:
```typescript
await this.businessDb('hr_employee_base').insert([
  {
    id: 1,
    emp_no: 'EMP-0001',
    first_name: 'John',
    // ...
  },
]);
```

## 验证

### 编译验证
```bash
cd lumina-server
npm run build
```
✅ 无编译错误

### 运行验证
```bash
npm run start
```

应该看到日志：
```
[数据库服务] 模块基本信息插入完成
[数据库服务] 模块关联表信息插入完成
[数据库服务] 模块字段配置插入完成
[数据库服务] 字段物理源映射插入完成
[数据库服务] 权限配置数据插入完成，共 75 条记录
[数据库服务] 业务数据插入完成
```

### 数据库验证

启动应用后，可以执行以下查询验证 ID 是否从 1 开始：

```sql
-- 检查 hr_employee_base 表
SELECT id, emp_no FROM hr_employee_base ORDER BY id;
-- 应该返回：1, 2, 3, 4

-- 检查 sys_module 表
SELECT id, module_id FROM sys_module ORDER BY id;
-- 应该返回：1, 2, 3, 4

-- 检查 sys_permission_config 表
SELECT COUNT(*) as total FROM sys_permission_config;
-- 应该返回：75

-- 检查最小和最大 ID
SELECT MIN(id) as min_id, MAX(id) as max_id FROM sys_permission_config;
-- 应该返回：1, 75
```

## 影响范围

- ✅ 所有表的初始化数据
- ✅ 数据库初始化过程
- ✅ 数据一致性

## 后续建议

1. 确保新插入的数据也遵循 ID 从 1 开始的规则
2. 在数据库迁移时保持 ID 的连续性
3. 考虑添加数据库约束确保 ID 的唯一性

## 总结

所有带有自增 ID 的表都已修改，ID 现在从 1 开始而不是 0 开始。修改包括：
- 配置数据库的 5 个表
- 业务数据库的 10 个表
- 总共 75+ 条数据记录

所有修改都已通过编译验证，无任何错误。
