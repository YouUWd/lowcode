import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { EntityRelation } from '../modules/modules.service';

export interface QueryOptions {
  includeRelations?: boolean;
  relations?: string[];
  page?: number;
  pageSize?: number;
}

@Injectable()
export class EngineService {
  constructor(
    @Inject('BUSINESS_DB') private readonly knex: Knex,
    @Inject('CONFIG_DB') private readonly configDb: Knex,
  ) {}

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

  private applyBffTransformers(data: any[], mappings: any[]) {
    // DICT_MAP转换函数的字典
    // 将字典代码映射到其值映射
    const dictionaries = {
      EMP_STATUS: { '1': '在职', '0': '离职' },
      PAYMENT_STATUS: { '1': '已发放', '0': '未发放' },
      ORG_TYPE: { DEPT: '部门', CORP: '公司', GROUP: '集团' },
    };

    // 筛选只需要前端转换的映射
    const bffMappings = mappings.filter((m) => m.transformerEnv === 'frontend');

    console.log(`\n[前端转换] 处理 ${data.length} 行数据，应用 ${bffMappings.length} 个转换`);

    return data.map((row, rowIndex) => {
      const result: any = {};

      // 首先，添加所有后端转换和简单字段
      // 这些字段已经在数据库级别计算完成
      mappings.forEach((mapping) => {
        if (mapping.transformerEnv !== 'frontend') {
          // 后端转换或简单字段 - 已在行中
          result[mapping.logicalField] = row[mapping.logicalField];
        }
      });

      // 然后，应用前端转换
      // 这些在应用层计算，提供更多灵活性
      bffMappings.forEach((mapping) => {
        try {
          const transformed = this.evaluateTransformer(
            mapping.transformer,
            row,
            mapping.physicalFields,
            dictionaries,
          );
          result[mapping.logicalField] = transformed;

          if (rowIndex === 0) {
            // 输出第一行的转换结果用于调试
            console.log(
              `  ✓ [第0行] ${mapping.logicalField}: ${mapping.transformer} => ${transformed}`,
            );
          }
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

  private getRelationKey(entityName: string): string {
    // hr_payroll_result -> payrollRecords
    // hr_emp_education -> educationRecords
    const mapping: Record<string, string> = {
      'hr_payroll_result': 'payrollRecords',
      'hr_emp_education': 'educationRecords',
      'hr_emp_contract': 'contractRecords',
      'hr_payroll_element': 'payrollElements',
      'hr_position': 'positions',
      'hr_org_hierarchy': 'orgHierarchy',
    };
    
    return mapping[entityName] || entityName;
  }

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
      if (!mapping) return;
      
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

  private evaluateTransformer(
    transformer: string,
    row: any,
    physicalFields: any[],
    dictionaries: any,
  ): any {
    // 将${field}占位符替换为数据库行中的实际值
    // 这允许转换器表达式动态引用字段值
    let expression = transformer;

    physicalFields.forEach((pf) => {
      // 创建与查询中SELECT别名匹配的字段别名
      // 格式: {entity}_{fieldName}
      const fieldAlias = `${pf.entity}_${pf.name}`;
      const value = row[fieldAlias] ?? row[pf.name] ?? '';

      // 转义字符串值以安全评估
      // 用引号包装字符串以在表达式评估期间保留它们
      const escapedValue = typeof value === 'string' ? `'${value}'` : value;

      // 将所有${fieldName}出现替换为实际值
      expression = expression.replace(new RegExp(`\\$\\{${pf.name}\\}`, 'g'), escapedValue);
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
    // 从字典中查找对应的值
    const match = expression.match(/DICT_MAP\('([^']+)',\s*'?([^']*)'?\)/);
    if (match) {
      const [, dictCode, value] = match;
      return dictionaries[dictCode]?.[value] || value;
    }
    return expression;
  }

  private evalMaskSensitive(expression: string): string {
    // MASK_SENSITIVE('110101199001011234', 'ALL') -> '110***1234'
    // 掩盖敏感数据（PII），保留前3位和后4位
    const match = expression.match(/MASK_SENSITIVE\('([^']+)',\s*'([^']+)'\)/);
    if (match) {
      const [, value] = match;
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
    // 连接多个字符串值
    const match = expression.match(/CONCAT\((.*)\)/);
    if (match) {
      const args = match[1]
        .split(',')
        .map((arg) => arg.trim().replace(/^'|'$/g, ''))
        .join('');
      return args;
    }
    return expression;
  }
}
