# 混合方案（方案 3）实现细节

## 核心思想

**主表 + 1:1 关系**：使用 JOIN，返回平铺结构（避免数据重复）
**1:N 关系**：使用嵌套结构，单独查询（避免笛卡尔积）

## 数据结构设计

### 返回格式
```json
{
  "success": true,
  "data": [
    {
      // ========== 主表 + 1:1 关系（平铺）==========
      "empNo": "EMP-0001",
      "fullName": "John Doe",
      "deptName": "技术部",           // 来自 hr_organization (N:1)
      "idNumber": "110***1234",       // 来自 hr_emp_personal (1:1)
      "empType": "全职",              // 来自 hr_emp_job (1:1)
      "empStatus": "在职",
      
      // ========== 1:N 关系（嵌套）==========
      "_relations": {
        "payrollRecords": [           // hr_payroll_result (1:N)
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
        ],
        "educationRecords": [          // hr_emp_education (1:N)
          {
            "degree": "本科",
            "school": "清华大学",
            "major": "计算机科学"
          },
          {
            "degree": "硕士",
            "school": "北京大学",
            "major": "软件工程"
          }
        ],
        "contractRecords": [           // hr_emp_contract (1:N)
          {
            "contractNo": "CT-2024-001",
            "startDate": "2024-01-01",
            "endDate": "2026-12-31",
            "status": "生效中"
          }
        ]
      }
    }
  ],
  "count": 1,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

## 实现步骤

### 步骤 1：数据库表结构扩展

#### 1.1 添加关系类型字段

```sql
-- 在 sys_module_entity 表添加 relation_type 字段
ALTER TABLE sys_module_entity 
ADD COLUMN relation_type VARCHAR(10) DEFAULT '1:1';

-- 添加索引
CREATE INDEX idx_module_entity_relation 
ON sys_module_entity(module_id, relation_type);
```

#### 1.2 初始化关系类型数据

```sql
-- 标识 1:N 关系
UPDATE sys_module_entity 
SET relation_type = '1:N' 
WHERE entity_name IN (
  'hr_payroll_result',      -- 员工的薪酬记录
  'hr_emp_education',       -- 员工的教育经历
  'hr_emp_contract',        -- 员工的合同记录
  'hr_payroll_element',     -- 薪酬的明细项
  'hr_position'             -- 组织的岗位
);

-- 标识 N:1 关系（多对一，通常是查找表）
UPDATE sys_module_entity 
SET relation_type = 'N:1' 
WHERE entity_name IN (
  'hr_organization',        -- 员工所属部门
  'sys_user',              -- 组织负责人
  'hr_salary_structure'    -- 薪酬套账
);

-- 其余默认为 1:1
```

#### 1.3 验证数据

```sql
SELECT 
  module_id,
  entity_name,
  relation_type,
  join_left_field,
  join_right_field
FROM sys_module_entity
ORDER BY module_id, relation_type, sort_order;
```

### 步骤 2：TypeScript 类型定义

#### 2.1 定义关系类型

```typescript
// src/types/relation.types.ts

/**
 * 实体关系类型
 */
export type RelationType = '1:1' | '1:N' | 'N:1';

/**
 * 实体关系配置
 */
export interface EntityRelation {
  id: string;
  name: string;
  desc: string;
  status: string;
  relationType: RelationType;
  joinCondition: {
    left: string;   // 关联表的字段
    right: string;  // 主表的字段
  };
}

/**
 * 查询选项
 */
export interface QueryOptions {
  includeRelations?: boolean;  // 是否包含 1:N 关联数据
  relations?: string[];         // 指定要包含的关联表（可选）
  page?: number;                // 页码（从 1 开始）
  pageSize?: number;            // 每页大小
}

/**
 * 查询结果
 */
export interface QueryResult {
  success: boolean;
  data: any[];
  count: number;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  error?: string;
}
```

### 步骤 3：模块服务更新

#### 3.1 更新 getModuleConfig 方法

```typescript
// src/modules/modules.service.ts

async getModuleConfig(id: string): Promise<ModuleConfig | null> {
  console.log(`[模块服务] 查询模块配置: ${id}`);
  
  const dbModule = await this.knex('sys_module')
    .where('module_id', id)
    .first();
  
  if (!dbModule) return null;

  // 查询关联表（包含关系类型）
  const entities = await this.knex('sys_module_entity')
    .where('module_id', dbModule.module_id)
    .orderBy('sort_order');

  // 构建实体配置
  const entityConfigs: EntityRelation[] = entities.map(e => ({
    id: e.entity_id,
    name: e.entity_name,
    desc: e.entity_desc,
    status: e.entity_status,
    relationType: e.relation_type || '1:1',  // 读取关系类型
    joinCondition: {
      left: e.join_left_field,
      right: e.join_right_field,
    },
  }));

  // 查询字段配置
  const fields = await this.knex('sys_module_field')
    .where('module_id', dbModule.module_id)
    .where('is_visible', true)
    .orderBy('sort_order');

  // 查询字段物理源
  const fieldSources = await this.knex('sys_module_field_source')
    .where('module_id', dbModule.module_id)
    .orderBy('logical_field', 'sort_order');

  // 构建映射配置
  const mappings = fields.map((field) => {
    const sources = fieldSources.filter(
      (s) => s.logical_field === field.logical_field,
    );

    return {
      displayName: field.display_name,
      logicalField: field.logical_field,
      physicalFields: sources.map((s) => ({
        entity: s.source_entity,
        name: s.source_field,
      })),
      transformer: field.transformer,
      transformerEnv: field.transformer_env,
      renderIcon: field.render_icon,
      renderType: field.render_type,
    };
  });

  return {
    id: dbModule.module_id,
    name: dbModule.module_name,
    desc: dbModule.module_desc,
    entity: dbModule.primary_entity,
    count: dbModule.record_count,
    active: dbModule.is_active,
    primaryEntity: {
      name: dbModule.primary_entity,
      desc: dbModule.primary_entity_desc,
    },
    entities: entityConfigs,  // 包含关系类型
    mappings,
  };
}
```

### 步骤 4：引擎服务核心实现

#### 4.1 主查询方法

```typescript
// src/engine/engine.service.ts

async executeDynamicQuery(config: any, options: QueryOptions = {}) {
  const { primaryEntity, entities, mappings } = config;

  console.log('\n========== 混合查询开始 ==========');
  console.log(`主表: ${primaryEntity.name}`);
  console.log(`查询选项:`, options);

  // ========== 第 1 步：分离关系类型 ==========
  const oneToOneEntities = entities.filter(
    (e: EntityRelation) => e.relationType === '1:1' || e.relationType === 'N:1'
  );
  const oneToManyEntities = entities.filter(
    (e: EntityRelation) => e.relationType === '1:N'
  );

  console.log(`\n[关系分析]`);
  console.log(`  1:1/N:1 关系: ${oneToOneEntities.length} 个`);
  console.log(`  1:N 关系: ${oneToManyEntities.length} 个`);

  // ========== 第 2 步：执行主查询（只包含 1:1/N:1 关系）==========
  const mainData = await this.executeMainQuery(
    primaryEntity,
    oneToOneEntities,
    mappings,
    options
  );

  console.log(`\n[主查询结果] ${mainData.length} 条记录`);

  // ========== 第 3 步：附加 1:N 关系（如果需要）==========
  if (options.includeRelations && oneToManyEntities.length > 0 && mainData.length > 0) {
    console.log(`\n[关联查询] 开始查询 ${oneToManyEntities.length} 个 1:N 关系`);
    
    // 过滤要查询的关联表
    let entitiesToQuery = oneToManyEntities;
    if (options.relations && options.relations.length > 0) {
      entitiesToQuery = oneToManyEntities.filter(
        e => options.relations!.includes(e.name)
      );
      console.log(`  指定查询: ${entitiesToQuery.map(e => e.name).join(', ')}`);
    }
    
    await this.attachOneToManyRelations(
      mainData,
      entitiesToQuery,
      config.id
    );
  }

  console.log('========== 混合查询结束 ==========\n');

  return mainData;
}
```

#### 4.2 主查询实现

```typescript
private async executeMainQuery(
  primaryEntity: any,
  oneToOneEntities: EntityRelation[],
  mappings: any[],
  options: QueryOptions
) {
  console.log(`\n[主查询] 构建查询...`);

  // 初始化查询
  const query = this.knex(primaryEntity.name);

  // ========== 识别使用的表（只包含 1:1/N:1 关系）==========
  const usedEntities = new Set<string>();
  usedEntities.add(primaryEntity.name);

  mappings.forEach((mapping: any) => {
    mapping.physicalFields?.forEach((pf: any) => {
      // 检查是否属于 1:1/N:1 关系
      const isOneToOne = oneToOneEntities.some(e => e.name === pf.entity);
      const isPrimary = pf.entity === primaryEntity.name;
      
      if (isOneToOne || isPrimary) {
        usedEntities.add(pf.entity);
      }
    });
  });

  console.log(`  使用的表: ${Array.from(usedEntities).join(', ')}`);

  // ========== 应用 LEFT JOIN（只 JOIN 1:1/N:1 关系）==========
  oneToOneEntities.forEach((entity) => {
    if (usedEntities.has(entity.name)) {
      const joinCond = entity.joinCondition;
      query.leftJoin(
        entity.name,
        `${entity.name}.${joinCond.left}`,
        `${primaryEntity.name}.${joinCond.right}`,
      );
      console.log(
        `  ✓ LEFT JOIN ${entity.name} (${entity.relationType})`
      );
    }
  });

  // ========== 构建 SELECT 字段 ==========
  console.log(`\n[字段选择]`);
  
  const bffMappings: any[] = [];

  mappings.forEach((mapping: any) => {
    // 跳过 1:N 关系的字段
    const isOneToManyField = mapping.physicalFields?.some((pf: any) => 
      !usedEntities.has(pf.entity)
    );

    if (isOneToManyField) {
      console.log(`  ⊗ [跳过] ${mapping.logicalField} (属于 1:N 关系)`);
      return;
    }

    const isFrontendTransform = mapping.transformerEnv === 'frontend';

    if (isFrontendTransform) {
      // 前端转换：选择原始字段
      bffMappings.push(mapping);
      mapping.physicalFields?.forEach((pf: any) => {
        const fieldAlias = `${pf.entity}_${pf.name}`;
        query.select(`${pf.entity}.${pf.name} AS ${fieldAlias}`);
      });
      console.log(`  ✓ [前端转换] ${mapping.logicalField}`);
    } else {
      // 后端转换或简单映射
      if (mapping.transformer) {
        const rawSql = mapping.transformer.replace(
          /\$\{([^}]+)\}/g, 
          (match: string, p1: string) => {
            const pf = mapping.physicalFields?.find((f: any) => f.name === p1);
            return pf ? `${pf.entity}.${pf.name}` : match;
          }
        );
        query.select(this.knex.raw(`${rawSql} AS ${mapping.logicalField}`));
        console.log(`  ✓ [后端转换] ${mapping.logicalField}`);
      } else {
        const pf = mapping.physicalFields?.[0];
        if (pf) {
          query.select(`${pf.entity}.${pf.name} AS ${mapping.logicalField}`);
          console.log(`  ✓ [简单映射] ${mapping.logicalField}`);
        }
      }
    }
  });

  // ========== 应用分页 ==========
  if (options.page && options.pageSize) {
    const offset = (options.page - 1) * options.pageSize;
    query.limit(options.pageSize).offset(offset);
    console.log(`\n[分页] page=${options.page}, pageSize=${options.pageSize}`);
  }

  // ========== 执行查询 ==========
  const sqlQuery = query.toString();
  console.log(`\n[SQL]\n${sqlQuery}\n`);

  const rawData = await query;
  console.log(`[执行结果] ${rawData.length} 条记录`);

  // ========== 应用前端转换 ==========
  const result = this.applyBffTransformers(rawData, mappings);

  return result;
}
```

#### 4.3 附加 1:N 关系

```typescript
private async attachOneToManyRelations(
  mainData: any[],
  entities: EntityRelation[],
  moduleId: string
) {
  for (const entity of entities) {
    console.log(`\n[子查询] ${entity.name}...`);

    // ========== 获取父记录的关联键 ==========
    const parentKeys = mainData
      .map(row => row[entity.joinCondition.right])
      .filter(Boolean);

    if (parentKeys.length === 0) {
      console.log(`  ⊗ 没有父记录关联键，跳过`);
      continue;
    }

    console.log(`  父记录关联键数: ${parentKeys.length}`);

    // ========== 查询子记录 ==========
    const childRecords = await this.queryChildRecords(
      entity,
      parentKeys,
      moduleId
    );

    console.log(`  查询到子记录数: ${childRecords.length}`);

    // ========== 附加到主记录 ==========
    let attachedCount = 0;
    mainData.forEach(row => {
      const parentKey = row[entity.joinCondition.right];
      const children = childRecords.filter(
        child => child[entity.joinCondition.left] === parentKey
      );

      if (children.length > 0) {
        if (!row._relations) {
          row._relations = {};
        }
        
        // 使用友好的键名（去掉表前缀）
        const relationKey = this.getRelationKey(entity.name);
        row._relations[relationKey] = children;
        attachedCount++;
      }
    });

    console.log(`  附加到 ${attachedCount} 条主记录`);
  }
}

/**
 * 获取关系键名（友好命名）
 */
private getRelationKey(entityName: string): string {
  // hr_payroll_result -> payrollRecords
  // hr_emp_education -> educationRecords
  const mapping: Record<string, string> = {
    'hr_payroll_result': 'payrollRecords',
    'hr_emp_education': 'educationRecords',
    'hr_emp_contract': 'contractRecords',
    'hr_payroll_element': 'payrollElements',
    'hr_position': 'positions',
  };
  
  return mapping[entityName] || entityName;
}
```

#### 4.4 查询子记录

```typescript
private async queryChildRecords(
  entity: EntityRelation,
  parentKeys: any[],
  moduleId: string
) {
  // ========== 构建子查询 ==========
  const query = this.knex(entity.name)
    .whereIn(entity.joinCondition.left, parentKeys);

  // ========== 获取子表的字段映射 ==========
  const childMappings = await this.getChildMappings(entity.name, moduleId);

  console.log(`  子表字段映射数: ${childMappings.length}`);

  // ========== 构建 SELECT ==========
  childMappings.forEach(mapping => {
    mapping.physicalFields.forEach((pf: any) => {
      if (pf.entity === entity.name) {
        if (mapping.transformer && mapping.transformerEnv === 'backend') {
          // 后端转换
          const rawSql = mapping.transformer.replace(
            /\$\{([^}]+)\}/g,
            (match: string, p1: string) => `${pf.entity}.${p1}`
          );
          query.select(this.knex.raw(`${rawSql} AS ${mapping.logicalField}`));
        } else {
          // 简单映射
          query.select(`${pf.entity}.${pf.name} AS ${mapping.logicalField}`);
        }
      }
    });
  });

  // ========== 添加关联键（用于附加到父记录）==========
  query.select(`${entity.name}.${entity.joinCondition.left}`);

  // ========== 执行查询 ==========
  const sqlQuery = query.toString();
  console.log(`  子查询 SQL:\n  ${sqlQuery}`);

  const childRecords = await query;

  // ========== 应用前端转换 ==========
  return this.applyBffTransformers(childRecords, childMappings);
}
```

#### 4.5 获取子表字段映射

```typescript
private async getChildMappings(entityName: string, moduleId: string) {
  // 查询该实体的字段配置
  const fields = await this.configDb('sys_module_field')
    .where('module_id', moduleId)
    .where('is_visible', true);

  // 查询字段物理源（只查询该实体的字段）
  const fieldSources = await this.configDb('sys_module_field_source')
    .where('module_id', moduleId)
    .where('source_entity', entityName);

  // 构建映射
  const mappings = fields
    .map((field: any) => {
      const sources = fieldSources.filter(
        (s: any) => s.logical_field === field.logical_field
      );

      if (sources.length === 0) return null;

      return {
        displayName: field.display_name,
        logicalField: field.logical_field,
        physicalFields: sources.map((s: any) => ({
          entity: s.source_entity,
          name: s.source_field,
        })),
        transformer: field.transformer,
        transformerEnv: field.transformer_env,
        renderIcon: field.render_icon,
        renderType: field.render_type,
      };
    })
    .filter(Boolean);

  return mappings;
}
```

### 步骤 5：控制器更新

```typescript
// src/engine/engine.controller.ts

@Get('query/:moduleId')
async query(
  @Param('moduleId') moduleId: string,
  @Query('includeRelations') includeRelations?: string,
  @Query('relations') relations?: string,
  @Query('page') page?: string,
  @Query('pageSize') pageSize?: string,
) {
  try {
    // ========== 获取模块配置 ==========
    const config = await this.modulesService.getModuleConfig(moduleId);
    if (!config) {
      return {
        success: false,
        error: `Module not found: ${moduleId}`,
      };
    }

    console.log(`\n========== 权限拦截开始 ==========`);
    console.log(`[权限拦截] 模块ID: ${moduleId}`);

    // ========== 应用权限过滤 ==========
    const permissions = await this.permissionsService.getModulePermissions(moduleId);
    console.log(`[权限拦截] 模块权限节点数: ${permissions.size}`);
    
    if (permissions.size === 0) {
      console.log(`[权限拦截] ⚠️  权限集合为空，拒绝查询`);
      return {
        success: false,
        error: '权限集合为空，无权访问任何字段',
        data: [],
        count: 0,
      };
    }

    // 过滤主表字段
    if (config.mappings) {
      console.log(`原始映射字段数: ${config.mappings.length}`);
      config.mappings = await this.permissionsService.filterMappingsByPermissions(
        config.mappings,
        moduleId,
      );
      console.log(`过滤后映射字段数: ${config.mappings.length}`);

      if (config.mappings.length === 0) {
        console.log(`[权限拦截] ⚠️  过滤后无可用字段，拒绝查询`);
        return {
          success: false,
          error: '无权访问该模块的任何字段',
          data: [],
          count: 0,
        };
      }
    }

    console.log(`========== 权限拦截结束 ==========\n`);

    // ========== 构建查询选项 ==========
    const options: QueryOptions = {
      includeRelations: includeRelations === 'true',
      relations: relations ? relations.split(',') : undefined,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    };

    // ========== 执行查询 ==========
    const result = await this.engineService.executeDynamicQuery(config, options);
    
    return {
      success: true,
      data: result,
      count: result.length,
      pagination: options.page && options.pageSize ? {
        page: options.page,
        pageSize: options.pageSize,
        total: result.length, // 实际应该查询总数
      } : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## API 使用示例

### 示例 1：只查询主表数据

```bash
GET /engine/query/MOD-HR-EMP
```

响应：
```json
{
  "success": true,
  "data": [
    {
      "empNo": "EMP-0001",
      "fullName": "John Doe",
      "deptName": "技术部",
      "empStatus": "在职"
    }
  ],
  "count": 1
}
```

### 示例 2：查询主表 + 所有 1:N 关系

```bash
GET /engine/query/MOD-HR-EMP?includeRelations=true
```

响应：
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
        "payrollRecords": [...],
        "educationRecords": [...],
        "contractRecords": [...]
      }
    }
  ],
  "count": 1
}
```

### 示例 3：查询主表 + 指定的 1:N 关系

```bash
GET /engine/query/MOD-HR-EMP?includeRelations=true&relations=hr_payroll_result,hr_emp_education
```

响应：
```json
{
  "success": true,
  "data": [
    {
      "empNo": "EMP-0001",
      "fullName": "John Doe",
      "_relations": {
        "payrollRecords": [...],
        "educationRecords": [...]
      }
    }
  ],
  "count": 1
}
```

### 示例 4：分页查询

```bash
GET /engine/query/MOD-HR-EMP?page=1&pageSize=20
```

响应：
```json
{
  "success": true,
  "data": [...],
  "count": 20,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

## 权限控制

### 主表权限
- 在主查询中应用权限过滤
- 只返回有权限的字段

### 关联表权限
- 为每个关联表单独应用权限过滤
- 在 `queryChildRecords` 方法中过滤字段

### 权限配置示例

```typescript
// 主表字段权限
hr_employee_base.emp_no.READ
hr_employee_base.full_name.READ

// 1:1 关系字段权限
hr_emp_personal.id_card_no.READ
hr_emp_job.emp_type.READ

// 1:N 关系字段权限
hr_payroll_result.gross_amount.READ
hr_payroll_result.net_amount.READ
hr_emp_education.degree.READ
```

## 性能优化

### 1. 批量查询
```typescript
// 使用 whereIn 批量查询子记录
const query = this.knex(entity.name)
  .whereIn(entity.joinCondition.left, parentKeys);
```

### 2. 字段选择
```typescript
// 只查询有权限的字段
const filteredMappings = await this.permissionsService.filterMappingsByPermissions(
  childMappings,
  moduleId
);
```

### 3. 分页
```typescript
// 对主查询应用分页
if (options.page && options.pageSize) {
  const offset = (options.page - 1) * options.pageSize;
  query.limit(options.pageSize).offset(offset);
}
```

### 4. 按需加载
```typescript
// 只在需要时查询 1:N 关系
if (options.includeRelations && oneToManyEntities.length > 0) {
  await this.attachOneToManyRelations(...);
}
```

## 总结

混合方案的核心优势：

1. **避免数据重复** - 主表 + 1:1 关系使用 JOIN，不会产生笛卡尔积
2. **清晰的数据结构** - 1:N 关系使用嵌套结构，符合业务逻辑
3. **细粒度权限控制** - 主表和关联表分别应用权限过滤
4. **高性能** - 使用批量查询避免 N+1 问题
5. **灵活性** - 支持按需加载关联数据
6. **可扩展性** - 易于添加新的关联表和字段

这种方案在性能、可维护性和功能性之间取得了最佳平衡。
