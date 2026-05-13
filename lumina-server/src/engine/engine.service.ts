import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { EntityRelation } from '../modules/modules.service';
import { PermissionsService } from '../permissions/permissions.service';

export interface QueryOptions {
  page?: number;
  pageSize?: number;
}

@Injectable()
export class EngineService {
  constructor(
    @Inject('BUSINESS_DB') private readonly knex: Knex,
    @Inject('CONFIG_DB') private readonly configDb: Knex,
    private readonly permissionsService: PermissionsService,
  ) {}

  async executeDynamicQuery(config: any, options: QueryOptions = {}) {
    const { primaryEntity, entities, mappings } = config;

    console.log('\n========== 混合查询开始 ==========');
    console.log(`主表: ${primaryEntity.name}`);

    // 分离关系类型
    const oneToOneEntities = entities.filter(
      (e: EntityRelation) => e.relationType === '1:1' || e.relationType === 'N:1'
    );
    const oneToManyEntities = entities.filter(
      (e: EntityRelation) => e.relationType === '1:N'
    );

    console.log(`[关系分析] 1:1/N:1: ${oneToOneEntities.length} 个, 1:N: ${oneToManyEntities.length} 个`);

    // 执行主查询（包含 1:1/N:1 关系）
    const mainData = await this.executeMainQuery(
      primaryEntity,
      oneToOneEntities,
      mappings,
      options
    );

    console.log(`[主查询结果] ${mainData.length} 条记录`);

    // 附加 1:N 关系数据
    if (oneToManyEntities.length > 0 && mainData.length > 0) {
      console.log(`[关联查询] 开始查询 ${oneToManyEntities.length} 个 1:N 关系`);
      
      await this.attachOneToManyRelations(
        mainData,
        oneToManyEntities,
        primaryEntity,
        config.id
      );
    }

    console.log('========== 混合查询结束 ==========\n');

    return mainData;
  }

  private applyBffTransformers(data: any[], mappings: any[]) {
    // DICT_MAP转换函数的字典
    const dictionaries = {
      EMP_STATUS: { '1': '在职', '0': '离职' },
      PAYMENT_STATUS: { '1': '已发放', '0': '未发放' },
      ORG_TYPE: { DEPT: '部门', CORP: '公司', GROUP: '集团' },
      GENDER: { '1': '男', '2': '女', 'M': '男', 'F': '女' },
    };

    // 分类映射
    const bffMappings = mappings.filter((m) => m.transformerEnv === 'frontend');
    const databaseMappings = mappings.filter((m) => m.transformerEnv === 'database');
    const simpleMappings = mappings.filter((m) => m.transformerEnv === 'none');

    return data.map((row) => {
      const result: any = {};

      // 保留 id 字段（用于 1:N 关系关联）
      if (row.id !== undefined) {
        result.id = row.id;
      }

      // 1. 处理数据库转换字段（已经在数据库中计算好，使用逻辑字段名）
      databaseMappings.forEach((mapping) => {
        result[mapping.logicalField] = row[mapping.logicalField];
      });

      // 2. 处理简单映射字段（从 entity_field 格式映射到逻辑字段）
      simpleMappings.forEach((mapping) => {
        const pf = mapping.physicalFields?.[0];
        if (pf) {
          const fieldAlias = `${pf.entity}_${pf.field}`;
          result[mapping.logicalField] = row[fieldAlias];
        }
      });

      // 3. 处理前端转换字段（从 entity_field 格式的物理字段获取值并转换）
      bffMappings.forEach((mapping) => {
        try {
          const transformed = this.evaluateTransformer(
            mapping.transformer,
            row,
            mapping.physicalFields,
            dictionaries,
          );
          result[mapping.logicalField] = transformed;
        } catch (error) {
          console.error(`转换 ${mapping.logicalField} 时出错:`, error);
          result[mapping.logicalField] = null;
        }
      });

      return result;
    });
  }

  private async executeMainQuery(
    primaryEntity: any,
    oneToOneEntities: EntityRelation[],
    mappings: any[],
    options: QueryOptions
  ) {
    console.log(`[主查询] 构建查询...`);

    const query = this.knex(primaryEntity.name);

    // 识别使用的表（主表 + 1:1/N:1 关系表）
    const usedEntities = new Set<string>();
    usedEntities.add(primaryEntity.name);
    oneToOneEntities.forEach(e => usedEntities.add(e.name));

    console.log(`  使用的表: ${Array.from(usedEntities).join(', ')}`);

    // 应用 LEFT JOIN
    oneToOneEntities.forEach((entity) => {
      const joinCond = entity.joinCondition;
      const rightTable = primaryEntity.name;
      
      query.leftJoin(
        entity.name,
        `${entity.name}.${joinCond.left}`,
        `${rightTable}.${joinCond.right}`,
      );
      console.log(`  ✓ LEFT JOIN ${entity.name} ON ${entity.name}.${joinCond.left} = ${rightTable}.${joinCond.right}`);
    });

    // 构建 SELECT 字段
    const selectedFields = new Set<string>();

    // 选择主表主键（用于 1:N 关系关联）
    query.select(`${primaryEntity.name}.id`);
    selectedFields.add(`${primaryEntity.name}.id`);
    console.log(`  ✓ [主键] ${primaryEntity.name}.id`);

    mappings.forEach((mapping: any) => {
      // 只选择属于主查询实体的字段（排除 1:N 关系实体）
      const allFieldsInUsedEntities = mapping.physicalFields?.every((pf: any) => 
        usedEntities.has(pf.entity)
      );

      if (!allFieldsInUsedEntities) {
        return; // 跳过 1:N 关系字段
      }

      if (mapping.transformer && mapping.transformerEnv === 'database') {
        // 后端转换（数据库级别）：在数据库级别计算，使用逻辑字段名
        let rawSql = mapping.transformer.replace(
          /\$\{([^}]+)\}/g, 
          (match: string, p1: string) => {
            const pf = mapping.physicalFields?.find((f: any) => f.field === p1);
            return pf ? `${pf.entity}.${pf.field}` : match;
          }
        );
        
        // MySQL 到 SQLite 转换
        rawSql = rawSql.replace(
          /DATE_FORMAT\(([^,]+),\s*"([^"]+)"\)/g,
          (match: string, field: string, format: string) => {
            const sqliteFormat = format
              .replace(/%Y/g, '%Y')
              .replace(/%m/g, '%m')
              .replace(/%d/g, '%d')
              .replace(/%H/g, '%H')
              .replace(/%i/g, '%M')
              .replace(/%s/g, '%S');
            return `strftime('${sqliteFormat}', ${field})`;
          }
        );
        
        rawSql = rawSql.replace(
          /TIMESTAMPDIFF\(YEAR,\s*([^,]+),\s*NOW\(\)\)/gi,
          (match: string, field: string) => {
            return `CAST((julianday('now') - julianday(${field})) / 365.25 AS INTEGER)`;
          }
        );
        
        rawSql = rawSql.replace(
          /TIMESTAMPDIFF\((MONTH|DAY|HOUR|MINUTE|SECOND),\s*([^,]+),\s*NOW\(\)\)/gi,
          (match: string, unit: string, field: string) => {
            const divisors: Record<string, number> = {
              'MONTH': 30.44,
              'DAY': 1,
              'HOUR': 1/24,
              'MINUTE': 1/1440,
              'SECOND': 1/86400,
            };
            const divisor = divisors[unit.toUpperCase()] || 1;
            return `CAST((julianday('now') - julianday(${field})) / ${divisor} AS INTEGER)`;
          }
        );
        
        query.select(this.knex.raw(`${rawSql} AS ${mapping.logicalField}`));
      } else {
        // 前端转换和简单映射：统一选择物理字段（使用 entity_field 格式）
        mapping.physicalFields?.forEach((pf: any) => {
          const fieldAlias = `${pf.entity}_${pf.field}`;
          if (!selectedFields.has(fieldAlias)) {
            query.select(`${pf.entity}.${pf.field} AS ${fieldAlias}`);
            selectedFields.add(fieldAlias);
          }
        });
      }
    });

    // 应用分页
    if (options.page && options.pageSize) {
      const offset = (options.page - 1) * options.pageSize;
      query.limit(options.pageSize).offset(offset);
      console.log(`[分页] page=${options.page}, pageSize=${options.pageSize}`);
    }

    // 执行查询
    const sqlQuery = query.toString();
    console.log(`[SQL] ${sqlQuery}`);

    const rawData = await query;
    console.log(`[执行结果] ${rawData.length} 条记录`);

    // 过滤只属于主查询的映射
    const mainQueryMappings = mappings.filter((mapping: any) => {
      return mapping.physicalFields?.every((pf: any) => usedEntities.has(pf.entity));
    });

    // 应用前端转换
    const result = this.applyBffTransformers(rawData, mainQueryMappings);

    return result;
  }

  private async attachOneToManyRelations(
    mainData: any[],
    entities: EntityRelation[],
    primaryEntity: any,
    moduleId: string
  ) {
    for (const entity of entities) {
      console.log(`[子查询] ${entity.name}...`);

      // 获取父记录 ID（直接使用主表 id）
      const parentKeys = mainData
        .map(row => row.id)
        .filter(Boolean);

      if (parentKeys.length === 0) {
        console.log(`  ⊗ 没有父记录 ID，跳过`);
        continue;
      }

      console.log(`  父记录 ID 数: ${parentKeys.length}`);

      // 查询子记录
      const childRecords = await this.queryChildRecords(
        entity,
        parentKeys,
        moduleId,
        primaryEntity.name
      );

      console.log(`  查询到子记录数: ${childRecords.length}`);

      // 附加到主记录
      mainData.forEach(row => {
        const parentId = row.id;
        
        // 使用 entity.joinCondition.left 作为关联字段
        const children = childRecords.filter(child => 
          child[entity.joinCondition.left] === parentId
        );

        if (children.length > 0) {
          // 清理子记录中的关联键字段
          const cleanedChildren = children.map(child => {
            const cleaned = { ...child };
            delete cleaned[entity.joinCondition.left];
            return cleaned;
          });

          // 使用实体名称的复数形式作为关系键
          const relationKey = entity.name + 's';
          row[relationKey] = cleanedChildren;
        }
      });
    }
  }

  private async queryChildRecords(
    entity: EntityRelation,
    parentKeys: any[],
    moduleId: string,
    primaryEntityName: string
  ) {
    // 获取子表的字段映射（带权限过滤）
    const childMappings = await this.getChildMappings(entity, moduleId, primaryEntityName);

    console.log(`  子表字段映射数: ${childMappings.length}`);

    // 如果没有任何字段有权限，跳过查询
    if (childMappings.length === 0) {
      console.log(`  ⊗ 子表 ${entity.name} 没有可访问的字段，跳过查询`);
      return [];
    }

    // 构建子查询
    const query = this.knex(entity.name)
      .whereIn(entity.joinCondition.left, parentKeys);

    // 构建 SELECT - 统一使用 entity_field 格式
    const selectedFields = new Set<string>();

    childMappings.forEach(mapping => {
      if (!mapping) return;
      
      console.log(`  [字段] ${mapping.logicalField}, env: ${mapping.transformerEnv}`);
      
      if (mapping.transformer && mapping.transformerEnv === 'database') {
        // 后端转换（数据库级别）：在数据库级别计算，使用逻辑字段名
        let rawSql = mapping.transformer.replace(
          /\$\{([^}]+)\}/g,
          (match: string, p1: string) => {
            const pf = mapping.physicalFields?.find((f: any) => f.field === p1);
            return pf ? `${pf.entity}.${pf.field}` : match;
          }
        );
        query.select(this.knex.raw(`${rawSql} AS ${mapping.logicalField}`));
        console.log(`    后端转换: ${rawSql} AS ${mapping.logicalField}`);
      } else {
        // 前端转换和简单映射：统一选择物理字段（使用 entity_field 格式）
        mapping.physicalFields?.forEach((pf: any) => {
          const fieldAlias = `${pf.entity}_${pf.field}`;
          const fieldKey = `${pf.entity}.${pf.field}`;
          if (!selectedFields.has(fieldKey)) {
            query.select(`${pf.entity}.${pf.field} AS ${fieldAlias}`);
            selectedFields.add(fieldKey);
            console.log(`    物理字段: ${fieldKey} AS ${fieldAlias}`);
          }
        });
      }
    });

    // 添加关联键（用于附加到父记录）
    const joinKeyField = `${entity.name}.${entity.joinCondition.left}`;
    if (!selectedFields.has(joinKeyField)) {
      query.select(joinKeyField);
    }

    // 执行查询
    const sqlQuery = query.toString();
    console.log(`  子查询 SQL: ${sqlQuery}`);

    const childRecords = await query;
    console.log(`  子查询原始结果数: ${childRecords.length}`);
    if (childRecords.length > 0) {
      console.log(`  第一条原始记录:`, childRecords[0]);
    }

    // 应用前端转换
    const transformedRecords = this.applyBffTransformers(childRecords, childMappings);

    if (transformedRecords.length > 0) {
      console.log(`  第一条转换后记录:`, transformedRecords[0]);
    }

    // 保留关联键字段
    transformedRecords.forEach((record, index) => {
      record[entity.joinCondition.left] = childRecords[index][entity.joinCondition.left];
    });

    console.log(`  转换后记录数: ${transformedRecords.length}`);

    return transformedRecords;
  }

  private async getChildMappings(entity: EntityRelation, moduleId: string, primaryEntityName: string) {
    // 1:N 子查询只访问子表本身的字段
    // 不访问主表，也不访问主表的关联表
    const accessibleEntities = new Set<string>();
    accessibleEntities.add(entity.name); // 只有子表本身
    
    console.log(`  [子查询] 实体 ${entity.name} 可访问的表: ${Array.from(accessibleEntities).join(', ')}`);

    // 查询该实体的字段配置
    const fields = await this.configDb('sys_module_field')
      .where('module_id', moduleId)
      .where('is_visible', true);

    // 构建映射（从 source_mapping JSON 解析）
    const mappings = fields
      .map((field: any) => {
        let physicalFields: Array<{ entity: string; field: string }> = [];
        
        if (field.source_mapping) {
          try {
            const sources = JSON.parse(field.source_mapping);
            // 只保留来自子表的字段
            physicalFields = sources
              .filter((s: any) => accessibleEntities.has(s.entity))
              .map((s: any) => ({
                entity: s.entity,
                field: s.field,
              }));
          } catch (e) {
            console.warn(`[引擎服务] 解析 source_mapping 失败: ${field.logical_field}`, e);
          }
        }

        if (physicalFields.length === 0) return null;

        return {
          displayName: field.display_name,
          logicalField: field.logical_field,
          physicalFields,
          transformer: field.transformer,
          transformerEnv: field.transformer_env,
          renderIcon: field.render_icon,
          renderType: field.render_type,
        };
      })
      .filter(Boolean);

    console.log(`  [子查询字段] 过滤前: ${mappings.length} 个映射`);

    // 应用权限过滤
    const filteredMappings = await this.permissionsService.filterMappingsByPermissions(
      mappings,
      moduleId
    );

    console.log(`  [子查询字段] 过滤后: ${filteredMappings.length} 个映射`);

    return filteredMappings;
  }

  private evaluateTransformer(
    transformer: string,
    row: any,
    physicalFields: any[],
    dictionaries: any,
  ): any {
    // 将${field}占位符替换为数据库行中的实际值
    let expression = transformer;

    physicalFields.forEach((pf) => {
      // 尝试多种字段别名格式，优先使用带实体前缀的格式
      const fieldAlias = `${pf.entity}_${pf.field}`;
      let value = row[fieldAlias];
      
      // 如果找不到，尝试不带前缀的字段名
      if (value === undefined || value === null || value === '') {
        value = row[pf.field];
      }
      
      // 如果还是找不到，设置为空字符串
      if (value === undefined || value === null) {
        value = '';
      }

      // 转义字符串值
      const escapedValue = typeof value === 'string' ? `'${value}'` : value;

      // 将所有${fieldName}出现替换为实际值
      expression = expression.replace(new RegExp(`\\$\\{${pf.field}\\}`, 'g'), escapedValue);
    });

    // 根据函数名称路由到相应的转换函数
    if (expression.includes('DICT_MAP')) {
      return this.evalDictMap(expression, dictionaries);
    } else if (expression.includes('MASK_SENSITIVE')) {
      return this.evalMaskSensitive(expression);
    } else if (expression.includes('ASSEMBLE_FRACTION')) {
      return this.evalAssembleFraction(expression);
    } else if (expression.includes('ASSEMBLE_PERF_SUMMARY')) {
      return this.evalAssemblePerfSummary(expression);
    } else if (expression.includes('CONCAT')) {
      return this.evalConcat(expression);
    }

    return expression;
  }

  private evalDictMap(expression: string, dictionaries: any): string {
    // DICT_MAP('EMP_STATUS', '1') -> '在职'
    // DICT_MAP("GENDER", 1) -> '男'
    // 从字典中查找对应的值
    const match = expression.match(/DICT_MAP\(["']([^"']+)["'],\s*["']?([^"',)]*)["']?\)/);
    if (match) {
      const [, dictCode, value] = match;
      // 将值转换为字符串进行查找
      const stringValue = String(value);
      return dictionaries[dictCode]?.[stringValue] || value;
    }
    return expression;
  }

  private evalMaskSensitive(expression: string): string {
    // MASK_SENSITIVE('110101199001011234', 'ALL') -> '110***1234'
    // 掩盖敏感数据（PII），保留前3位和后4位
    const match = expression.match(/MASK_SENSITIVE\('([^']+)',\s*'([^']+)'\)/);
    if (match) {
      const value = match[1];
      if (value.length >= 7) {
        return value.substring(0, 3) + '****' + value.substring(value.length - 4);
      }
    }
    return expression;
  }

  private evalAssembleFraction(expression: string): string {
    // ASSEMBLE_FRACTION(50, 100) -> '50 / 100'
    // 格式化分数值，用于显示比例
    const match = expression.match(/ASSEMBLE_FRACTION\((\d+),\s*(\d+)\)/);
    if (match) {
      const [, current, max] = match;
      return `${current} / ${max}`;
    }
    return expression;
  }

  private evalAssemblePerfSummary(expression: string): string {
    // ASSEMBLE_PERF_SUMMARY(95, 'A') -> '95 (A)'
    // 格式化性能总结，显示分数和等级
    const match = expression.match(/ASSEMBLE_PERF_SUMMARY\(([^,]+),\s*'([^']+)'\)/);
    if (match) {
      const [, score, grade] = match;
      return `${score} (${grade})`;
    }
    return expression;
  }

  private evalConcat(expression: string): string {
    // CONCAT('John', ' ', 'Doe') -> 'John Doe'
    // CONCAT(95.5, "分 (", 'A', ")") -> '95.5分 (A)'
    // 连接多个字符串值
    const match = expression.match(/CONCAT\((.*)\)/);
    if (match) {
      const argsString = match[1];
      const args: string[] = [];
      let currentArg = '';
      let inQuote = false;
      let quoteChar = '';
      
      for (let i = 0; i < argsString.length; i++) {
        const char = argsString[i];
        
        if ((char === '"' || char === "'") && !inQuote) {
          // 开始引号
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar && inQuote) {
          // 结束引号
          inQuote = false;
          quoteChar = '';
        } else if (char === ',' && !inQuote) {
          // 参数分隔符
          args.push(currentArg.trim());
          currentArg = '';
        } else {
          // 普通字符
          currentArg += char;
        }
      }
      
      // 添加最后一个参数
      if (currentArg.trim()) {
        args.push(currentArg.trim());
      }
      
      // 连接所有参数
      return args.join('');
    }
    return expression;
  }
}
