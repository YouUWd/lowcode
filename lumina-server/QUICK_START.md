# Lumina Backend - 快速上手指南

## 🎯 5 分钟快速开始

### 1. 安装并启动 (2 分钟)

```bash
# 克隆项目
cd lumina-server

# 安装依赖
npm install

# 启动开发服务器
npm run start:dev
```

看到以下输出表示启动成功:
```
🚀 Lumina Backend Server is running on: http://localhost:3001/api
📚 API Documentation: http://localhost:3001/api/modules
🔒 Permissions API: http://localhost:3001/api/permissions/config
```

### 2. 测试 API (3 分钟)

#### 步骤 1: 查看所有模块

```bash
curl http://localhost:3001/api/modules
```

你会看到 4 个预置模块:
- MOD-SYS-LOG (系统日志)
- MOD-HR-ORG (组织架构)
- MOD-HR-EMP (员工档案)
- MOD-HR-PAY (薪酬管理)

#### 步骤 2: 尝试查询 (会失败)

```bash
curl http://localhost:3001/api/query/MOD-HR-EMP
```

返回错误:
```json
{
  "success": false,
  "error": "权限集合为空，无权访问任何字段"
}
```

**原因**: 默认没有任何权限，需要先配置！

#### 步骤 3: 配置权限

```bash
curl -X POST http://localhost:3001/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      "hr_employee_base.emp_no.SELECT",
      "hr_employee_base.first_name.SELECT",
      "hr_employee_base.last_name.SELECT",
      "hr_emp_job.emp_type.SELECT",
      "hr_organization.org_name.SELECT",
      "hr_employee_base.status.SELECT"
    ]
  }'
```

返回成功:
```json
{
  "success": true,
  "message": "成功设置 6 个权限节点",
  "permissionCount": 6
}
```

#### 步骤 4: 再次查询 (成功)

```bash
curl http://localhost:3001/api/query/MOD-HR-EMP
```

返回员工数据:
```json
{
  "success": true,
  "data": [
    {
      "empNo": "EMP001",
      "fullNameEng": "John Doe",
      "empType": "正式员工",
      "deptName": "技术部",
      "empStatus": "在职"
    }
  ],
  "count": 1
}
```

---

## 🎓 核心概念

### 1. 模块 (Module)

模块是预定义的查询配置，包含:
- 主表 (Primary Entity)
- 关联表 (Related Entities)
- 字段映射 (Field Mappings)
- 转换函数 (Transformers)

### 2. 权限节点 (Permission Node)

格式: `{表名}.{字段名}.{操作类型}`

示例:
```
hr_employee_base.emp_no.SELECT        # 允许读取员工编号
hr_payroll_result.net_amount.SELECT   # 允许读取实发工资
hr_employee_base.first_name.UPDATE    # 允许更新名字
```

### 3. 查询流程

```
请求 → 权限检查 → 字段过滤 → SQL 生成 → 执行查询 → 数据转换 → 返回结果
```

---

## 🔧 常用操作

### 查看权限配置

```bash
curl http://localhost:3001/api/permissions/config
```

### 检查单个权限

```bash
curl "http://localhost:3001/api/permissions/check?entity=hr_employee_base&fieldName=emp_no&operationType=SELECT"
```

### 清空所有权限

```bash
curl -X POST http://localhost:3001/api/permissions/clear
```

### 查询薪酬数据

```bash
# 1. 先配置薪酬字段权限
curl -X POST http://localhost:3001/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      "hr_payroll_result.payroll_year.SELECT",
      "hr_payroll_result.payroll_month.SELECT",
      "hr_payroll_result.gross_amount.SELECT",
      "hr_social_security_record.total_personal_deduct.SELECT",
      "hr_tax_record.tax_amount.SELECT",
      "hr_payroll_result.net_amount.SELECT",
      "hr_payroll_result.payment_status.SELECT"
    ]
  }'

# 2. 查询薪酬数据
curl http://localhost:3001/api/query/MOD-HR-PAY
```

---

## 📊 测试不同权限场景

### 场景 1: 只允许查看员工编号

```bash
curl -X POST http://localhost:3001/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["hr_employee_base.emp_no.SELECT"]}'

curl http://localhost:3001/api/query/MOD-HR-EMP
# 只返回 empNo 字段
```

### 场景 2: 允许所有员工字段

```bash
curl -X POST http://localhost:3001/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      "hr_employee_base.emp_no.SELECT",
      "hr_employee_base.first_name.SELECT",
      "hr_employee_base.last_name.SELECT",
      "hr_emp_personal.id_card_no.SELECT",
      "hr_emp_job.emp_type.SELECT",
      "hr_organization.org_name.SELECT",
      "hr_employee_base.status.SELECT"
    ]
  }'

curl http://localhost:3001/api/query/MOD-HR-EMP
# 返回所有字段
```

### 场景 3: 拒绝所有访问

```bash
curl -X POST http://localhost:3001/api/permissions/clear

curl http://localhost:3001/api/query/MOD-HR-EMP
# 返回错误: "权限集合为空，无权访问任何字段"
```

---

## 🐛 调试技巧

### 1. 查看服务器日志

启动服务器后，所有操作都会在控制台输出详细日志:

```
[权限服务] 从数据库加载权限配置
[权限服务] 加载了 6 个权限节点

========== 权限拦截开始 ==========
[权限拦截] 模块ID: MOD-HR-EMP
[权限拦截] 全局权限节点数: 6
原始映射字段数: 6
  ✓ 有权限: empNo
  ✓ 有权限: fullNameEng
过滤后映射字段数: 6
========== 权限拦截结束 ==========
```

### 2. 使用 Postman 或 Insomnia

导入以下集合进行测试:

```json
{
  "name": "Lumina Backend API",
  "requests": [
    {
      "name": "Get Modules",
      "method": "GET",
      "url": "http://localhost:3001/api/modules"
    },
    {
      "name": "Set Permissions",
      "method": "POST",
      "url": "http://localhost:3001/api/permissions/config",
      "body": {
        "permissions": ["hr_employee_base.emp_no.SELECT"]
      }
    },
    {
      "name": "Query Employees",
      "method": "GET",
      "url": "http://localhost:3001/api/query/MOD-HR-EMP"
    }
  ]
}
```

### 3. 启用 SQL 调试

修改 `app.module.ts`:

```typescript
KnexModule.forRoot({
  config: {
    client: 'better-sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true,
    debug: true, // 添加这一行
  },
})
```

---

## 📚 下一步

- 📖 阅读 [完整 README](./README.md)
- 🏗️ 查看 [架构文档](../doc/lumina-server-guide.md)
- 🔒 深入了解 [权限系统](../PERMISSIONS_SYSTEM_FIXES.md)
- 🎨 集成 [Vue 前端](../lumina-vue/README.md)

---

## ❓ 遇到问题?

### 端口被占用

```bash
# 修改端口
export PORT=3002
npm run start:dev
```

### 依赖安装失败

```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 权限配置丢失

内存数据库重启后会丢失数据。生产环境请使用持久化数据库。

---

**🎉 恭喜！你已经掌握了 Lumina Backend 的基本使用！**
