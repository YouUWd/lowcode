# sys_permission_config 表初始化修复

## 问题描述

`sys_permission_config` 表中初始化的数据，部分权限节点的 `logical_field` 字段值缺失。

## 根本原因

在原始的权限配置初始化逻辑中：

1. 权限节点是从 `sys_module_field_source` 表生成的
2. 每个物理字段映射会生成 3 个权限节点（READ、CREATE、UPDATE）
3. 但由于没有去重机制，同一个权限节点可能被多次插入
4. 某些权限节点的 `logical_field` 字段可能为空或不一致

## 修复方案

### 修改文件
- `lumina-server/src/database/database.service.ts` - `seedConfigData()` 方法中的权限配置生成逻辑

### 修复内容

1. **添加去重机制**
   - 使用 `Map<string, any>` 来存储权限节点
   - 以 `permission_node` 作为 key，确保每个权限节点只被插入一次

2. **完整填充 logical_field**
   - 从 `sys_module_field_source` 查询时，直接获取 `logical_field` 值
   - 确保每个权限节点都有对应的逻辑字段值

3. **添加 description 字段**
   - 为每个权限节点添加描述信息
   - 格式：`{entity}.{field} - {operation} 操作权限`

### 代码变更

```typescript
// 生成权限节点：每个物理字段 × 3种操作类型 (READ, CREATE, UPDATE)
const operationTypes = ['READ', 'CREATE', 'UPDATE'];
const uniquePermissions = new Map<string, any>();

fieldSources.forEach((source) => {
  operationTypes.forEach((opType) => {
    const permissionNode = `${source.source_entity}.${source.source_field}.${opType}`;
    
    // 使用Map去重，确保每个权限节点只插入一次
    if (!uniquePermissions.has(permissionNode)) {
      uniquePermissions.set(permissionNode, {
        permission_node: permissionNode,
        entity: source.source_entity,
        field_name: source.source_field,
        operation_type: opType,
        enabled: true,
        module_id: source.module_id,
        logical_field: source.logical_field,  // 完整填充逻辑字段
        description: `${source.source_entity}.${source.source_field} - ${opType} 操作权限`,
      });
    }
  });
});

const permissionData = Array.from(uniquePermissions.values());
```

## 验证方法

1. 启动应用后，检查数据库中 `sys_permission_config` 表
2. 验证所有权限节点的 `logical_field` 字段都有值
3. 检查权限节点是否有重复

```sql
-- 查看权限配置统计
SELECT COUNT(*) as total_permissions FROM sys_permission_config;

-- 查看是否有重复的权限节点
SELECT permission_node, COUNT(*) as count 
FROM sys_permission_config 
GROUP BY permission_node 
HAVING count > 1;

-- 查看logical_field为空的权限节点
SELECT * FROM sys_permission_config 
WHERE logical_field IS NULL OR logical_field = '';

-- 按模块查看权限分布
SELECT module_id, COUNT(*) as permission_count 
FROM sys_permission_config 
GROUP BY module_id;
```

## 影响范围

- 权限配置初始化过程
- 权限节点的完整性和一致性
- 权限过滤和转换功能的准确性

## 后续建议

1. 定期验证权限配置的完整性
2. 在权限配置表上添加唯一索引，防止重复
3. 考虑添加权限配置的版本管理机制
