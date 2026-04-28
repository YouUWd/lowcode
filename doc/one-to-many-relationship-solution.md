# 1:N 关系处理方案

## 问题描述

在当前的查询引擎中，当主表和关联表存在 1:N 关系时，会遇到以下问题：

1. **数据重复**：使用 LEFT JOIN 会导致主表数据重复（笛卡尔积）
2. **权限控制**：如何对关联表的字段进行细粒度的权限控制
3. **数据结构**：如何组织返回的数据（平铺 vs 嵌套）
4. **查询性能**：如何避免 N+1 查询问题

## 示例场景

### 场景 1：员工与薪酬记录 (1:N)
```
hr_employee_base (1) ←→ (N) hr_payroll_result
一个员工有多条薪酬记录（每月一条）
```

### 场景 2：组织与员工 (1:N)
```
hr_organization (1) ←→ (N) hr_employee_base
一个部门有多个员工
```

## 解决方案

### 方案 1：嵌套结构（推荐）

#### 优点
- 数据结构清晰，符合业务逻辑
- 避免数据重复
- 易于前端处理
- 支持细粒度权限控制

#### 缺点
- 需要多次查询或复杂的数据处理
- 后端处理逻辑较复杂

#### 数据结构示例
```json
{
  "success": true,
  "data": [
    {
      "empNo": "EMP-0001",
      "fullName": "John Doe",
      "deptName": "技术部",
      "payrollRecords": [
        {
          "period": "2024-01",
          "grossPay": 17000,
          "netPay": 14500,
          "status": "已发放"
        },
        {
          "period": "2024-02",
          "grossPay": 17000,
          "netPay": 14500,
          "status": "已发放"
        }
      ]
    }
  ]
}
```

#### 实现方式

**步骤 1：识别关系类型**

在模块配置中添加关系类型标识：

```typescript
// sys_module_entity 表添加字段
export interface EntityRelation {
  id: string;
  name: string;
  desc: string;
  status: string;
  relationType: '1:1' | '1:N' | 'N:1';  // 新增
  joinCondition: {
    left: string;
    right: string;
  };
}
```

**步骤 2：分离查询**

```typescript
async executeDynamicQueryWithRelations(config: any) {
  const { primaryEntity, entities, mappings } = config;
  
  // 1. 分离 1:1 和 1:N 关系
  const oneToOneEntities = entities.filter(e => e.relationType === '1:1' || e.relationType === 'N:1');
  const oneToManyEntities = entities.filter(e => e.relationType === '1:N');
  
  // 2. 主查询：只 JOIN 1:1 关系
  const mainQuery = this.buildMainQuery(primaryEntity, oneToOneEntities, mappings);
  const mainData = await mainQuery;
  
  // 3. 子查询：分别查询 1:N 关系
  for (const entity of oneToManyEntities) {
    const childData = await this.queryChildRecords(entity, mainData);
    this.attachChildRecords(mainData, childData, entity);
  }
  
  return mainData;
}
```

**步骤 3：权限过滤**

```typescript
// 为子记录应用权限过滤
async queryChildRecords(entity: EntityRelation, parentData: any[]) {
  // 获取父记录的 ID 列表
  const parentIds = parentData.map(row => row[entity.joinCondition.right]);
  
  // 查询子记录
  const childQuery = this.knex(entity.name)
    .whereIn(entity.joinCondition.left, parentIds);
  
  // 应用权限过滤
  const childMappings = this.getChildMappings(entity.name);
  const filteredMappings = await this.permissionsService.filterMappingsByPermissions(
    childMappings,
    entity.moduleId
  );
  
  // 只选择有权限的字段
  filteredMappings.forEach(mapping => {
    mapping.physicalFields.forEach(pf => {
      childQuery.select(`${pf.entity}.${pf.name}`);
    });
  });
  
  return await childQuery;
}
```

### 方案 2：平铺结构 + 分页

#### 优点
- 实现简单
- 适合表格展示
- 易于分页

#### 缺点
- 数据重复
- 不适合复杂的嵌套关系
- 前端需要额外处理

#### 数据结构示例
```json
{
  "success": true,
  "data": [
    {
      "empNo": "EMP-0001",
      "fullName": "John Doe",
      "period": "2024-01",
      "grossPay": 17000,
      "netPay": 14500
    },
    {
      "empNo": "EMP-0001",
      "fullName": "John Doe",
      "period": "2024-02",
      "grossPay": 17000,
      "netPay": 14500
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

#### 实现方式

```typescript
async executeFlatQuery(config: any, options: { page: number, pageSize: number }) {
  const { primaryEntity, entities, mappings } = config;
  
  // 构建查询（包含所有 JOIN）
  const query = this.knex(primaryEntity.name);
  
  // 应用所有 JOIN（包括 1:N）
  entities.forEach(entity => {
    query.leftJoin(
      entity.name,
      `${entity.name}.${entity.joinCondition.left}`,
      `${primaryEntity.name}.${entity.joinCondition.right}`
    );
  });
  
  // 应用权限过滤
  const filteredMappings = await this.permissionsService.filterMappingsByPermissions(
    mappings,
    config.id
  );
  
  // 构建 SELECT
  filteredMappings.forEach(mapping => {
    // ... 添加字段
  });
  
  // 应用分页
  const offset = (options.page - 1) * options.pageSize;
  query.limit(options.pageSize).offset(offset);
  
  return await query;
}
```

### 方案 3：混合方案（推荐用于复杂场景）

#### 策略
- 主表 + 1:1 关系：使用 JOIN，返回平铺结构
- 1:N 关系：使用嵌套结构，单独查询

#### 数据结构示例
```json
{
  "success": true,
  "data": [
    {
      // 主表 + 1:1 关系（平铺）
      "empNo": "EMP-0001",
      "fullName": "John Doe",
      "deptName": "技术部",
      "idNumber": "110***1234",
      
      // 1:N 关系（嵌套）
      "_relations": {
        "payrollRecords": [
          { "period": "2024-01", "grossPay": 17000 },
          { "period": "2024-02", "grossPay": 17000 }
        ],
        "educationRecords": [
          { "degree": "本科", "school": "清华大学" }
        ]
      }
    }
  ]
}
```

## 实现步骤

### 1. 扩展数据库表结构

```sql
-- 在 sys_module_entity 表添加关系类型字段
ALTER TABLE sys_module_entity ADD COLUMN relation_type VARCHAR(10) DEFAULT '1:1';

-- 更新现有数据
UPDATE sys_module_entity SET relation_type = '1:N' 
WHERE entity_name IN ('hr_payroll_result', 'hr_emp_education', 'hr_emp_contract');
```

### 2. 更新模块服务

```typescript
// modules.service.ts
export interface EntityRelation {
  id: string;
  name: string;
  desc: string;
  status: string;
  relationType: '1:1' | '1:N' | 'N:1';
  joinCondition: {
    left: string;
    right: string;
  };
}

async getModuleConfig(id: string): Promise<ModuleConfig | null> {
  // ... 现有代码
  
  const entities = await this.knex('sys_module_entity')
    .where('module_id', dbModule.module_id)
    .orderBy('sort_order');
  
  // 构建实体配置（包含关系类型）
  const entityConfigs: EntityRelation[] = entities.map(e => ({
    id: e.entity_id,
    name: e.entity_name,
    desc: e.entity_desc,
    status: e.entity_status,
    relationType: e.relation_type || '1:1',
    joinCondition: {
      left: e.join_left_field,
      right: e.join_right_field,
    },
  }));
  
  return {
    // ... 其他字段
    entities: entityConfigs,
  };
}
```

### 3. 更新引擎服务

```typescript
// engine.service.ts
async executeDynamicQuery(config: any, options?: QueryOptions) {
  const { primaryEntity, entities, mappings } = config;
  
  // 分离关系类型
  const oneToOneEntities = entities.filter(
    e => e.relationType === '1:1' || e.relationType === 'N:1'
  );
  const oneToManyEntities = entities.filter(
    e => e.relationType === '1:N'
  );
  
  // 主查询（只包含 1:1 关系）
  const mainData = await this.executeMainQuery(
    primaryEntity,
    oneToOneEntities,
    mappings
  );
  
  // 如果有 1:N 关系，附加子记录
  if (oneToManyEntities.length > 0 && options?.includeRelations) {
    await this.attachOneToManyRelations(
      mainData,
      oneToManyEntities,
      config.id
    );
  }
  
  return mainData;
}

private async attachOneToManyRelations(
  mainData: any[],
  entities: EntityRelation[],
  moduleId: string
) {
  if (mainData.length === 0) return;
  
  for (const entity of entities) {
    // 获取父记录的关联字段值
    const parentKeys = mainData.map(
      row => row[entity.joinCondition.right]
    ).filter(Boolean);
    
    if (parentKeys.length === 0) continue;
    
    // 查询子记录
    const childRecords = await this.queryChildRecords(
      entity,
      parentKeys,
      moduleId
    );
    
    // 附加到主记录
    mainData.forEach(row => {
      const parentKey = row[entity.joinCondition.right];
      const children = childRecords.filter(
        child => child[entity.joinCondition.left] === parentKey
      );
      
      if (!row._relations) {
        row._relations = {};
      }
      row._relations[entity.name] = children;
    });
  }
}

private async queryChildRecords(
  entity: EntityRelation,
  parentKeys: any[],
  moduleId: string
) {
  // 构建子查询
  const query = this.knex(entity.name)
    .whereIn(entity.joinCondition.left, parentKeys);
  
  // 获取子表的字段映射
  const childMappings = await this.getChildMappings(entity.name, moduleId);
  
  // 应用权限过滤
  const filteredMappings = await this.permissionsService.filterMappingsByPermissions(
    childMappings,
    moduleId
  );
  
  // 构建 SELECT
  filteredMappings.forEach(mapping => {
    mapping.physicalFields.forEach(pf => {
      if (pf.entity === entity.name) {
        query.select(`${pf.entity}.${pf.name} AS ${mapping.logicalField}`);
      }
    });
  });
  
  return await query;
}
```

### 4. 更新控制器

```typescript
// engine.controller.ts
@Get('query/:moduleId')
async query(
  @Param('moduleId') moduleId: string,
  @Query('includeRelations') includeRelations?: string,
  @Query('page') page?: string,
  @Query('pageSize') pageSize?: string,
) {
  try {
    const config = await this.modulesService.getModuleConfig(moduleId);
    if (!config) {
      return {
        success: false,
        error: `Module not found: ${moduleId}`,
      };
    }
    
    // 应用权限过滤
    const permissions = await this.permissionsService.getModulePermissions(moduleId);
    if (permissions.size === 0) {
      return {
        success: false,
        error: '权限集合为空，无权访问任何字段',
        data: [],
      };
    }
    
    config.mappings = await this.permissionsService.filterMappingsByPermissions(
      config.mappings,
      moduleId,
    );
    
    if (config.mappings.length === 0) {
      return {
        success: false,
        error: '无权访问该模块的任何字段',
        data: [],
      };
    }
    
    // 执行查询
    const options = {
      includeRelations: includeRelations === 'true',
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    };
    
    const result = await this.engineService.executeDynamicQuery(config, options);
    
    return {
      success: true,
      data: result,
      count: result.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## 权限控制策略

### 1. 主表权限
- 在主查询中应用权限过滤
- 只返回有权限的字段

### 2. 关联表权限
- 为每个关联表单独应用权限过滤
- 支持细粒度的字段级权限控制

### 3. 权限配置示例

```typescript
// 权限节点格式
// 主表字段
hr_employee_base.emp_no.READ
hr_employee_base.full_name.READ

// 关联表字段（1:N）
hr_payroll_result.gross_amount.READ
hr_payroll_result.net_amount.READ
hr_payroll_result.payment_status.READ
```

## 性能优化

### 1. 批量查询
- 使用 `whereIn` 批量查询子记录
- 避免 N+1 查询问题

### 2. 字段选择
- 只查询有权限的字段
- 减少数据传输量

### 3. 分页
- 对主查询应用分页
- 子查询根据主查询结果动态加载

### 4. 缓存
- 缓存模块配置
- 缓存权限配置

## 使用示例

### 查询员工及其薪酬记录

```bash
# 只查询主表数据
GET /engine/query/MOD-HR-EMP

# 查询主表 + 关联表数据
GET /engine/query/MOD-HR-EMP?includeRelations=true

# 分页查询
GET /engine/query/MOD-HR-EMP?page=1&pageSize=20
```

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "empNo": "EMP-0001",
      "fullName": "John Doe",
      "deptName": "技术部",
      "empStatus": "在职",
      "_relations": {
        "hr_payroll_result": [
          {
            "period": "2024-01",
            "grossPay": 17000,
            "netPay": 14500,
            "status": "已发放"
          },
          {
            "period": "2024-02",
            "grossPay": 17000,
            "netPay": 14500,
            "status": "已发放"
          }
        ]
      }
    }
  ],
  "count": 1
}
```

## 总结

推荐使用**混合方案**：
1. 主表 + 1:1 关系使用 JOIN（平铺结构）
2. 1:N 关系使用嵌套结构（单独查询）
3. 支持细粒度的权限控制
4. 避免数据重复和 N+1 查询问题
5. 提供灵活的查询选项（是否包含关联数据）

这种方案在性能、可维护性和功能性之间取得了良好的平衡。
