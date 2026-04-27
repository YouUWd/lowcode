import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';

@Injectable()
export class EngineService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async executeDynamicQuery(config: any) {
    const { primaryEntity, entities, mappings } = config;

    console.log('\n========== 查询执行开始 ==========');
    console.log(`主表: ${primaryEntity.name}`);
    console.log(`字段映射总数: ${mappings.length}`);

    // 第1步：从主表初始化查询
    const query = this.knex(primaryEntity.name);
    console.log(`\n[第1步] 从表初始化查询: ${primaryEntity.name}`);

    // 第2步：识别使用的物理表
    // 这样可以避免不必要的JOIN，提高查询性能
    const usedEntities = new Set<string>();
    mappings.forEach((row: any) => {
      row.physicalFields?.forEach((pf: any) => {
        usedEntities.add(pf.entity);
      });
    });
    console.log(`\n[第2步] 识别使用的表: ${Array.from(usedEntities).join(', ')}`);

    // 第3步：动态应用LEFT JOIN
    // 只JOIN实际使用的表，避免不必要的连接
    if (entities) {
      entities.forEach((entity: any) => {
        if (usedEntities.has(entity.name)) {
          const joinCond = entity.joinCondition;
          if (joinCond) {
            query.leftJoin(
              entity.name,
              `${entity.name}.${joinCond.left}`,
              `${primaryEntity.name}.${joinCond.right}`,
            );
            console.log(
              `  ✓ LEFT JOIN ${entity.name} ON ${entity.name}.${joinCond.left} = ${primaryEntity.name}.${joinCond.right}`,
            );
          }
        }
      });
    }

    // 第4步：构建SELECT字段，使用混合计算逻辑
    // 分离后端转换（数据库层）和前端转换（应用层）
    const fieldAliasMap = new Map<string, string>(); // 逻辑字段到别名的映射
    const bffMappings: any[] = []; // 存储需要前端转换的映射

    console.log(`\n[第3步] 构建SELECT字段:`);

    mappings.forEach((row: any) => {
      const isFrontendTransform = row.transformerEnv === 'frontend';

      if (isFrontendTransform) {
        // 前端层：获取原始字段供后续计算
        // 这些字段将在应用层进行转换
        bffMappings.push(row);
        console.log(
          `  ✓ [前端转换] ${row.logicalField} (转换器: ${row.transformer || '无'})`,
        );
        row.physicalFields?.forEach((pf: any) => {
          const fieldAlias = `${pf.entity}_${pf.name}`;
          query.select(`${pf.entity}.${pf.name} AS ${fieldAlias}`);
          console.log(`    └─ SELECT ${pf.entity}.${pf.name} AS ${fieldAlias}`);
        });
      } else {
        // 数据库层：应用下推逻辑
        // 这些转换在数据库级别执行，性能更好
        if (row.transformer) {
          // 将${field}替换为entity.field用于SQL执行
          const rawSql = row.transformer.replace(/\$\{([^}]+)\}/g, (match: string, p1: string) => {
            const pf = row.physicalFields?.find((f: any) => f.name === p1);
            return pf ? `${pf.entity}.${pf.name}` : match;
          });
          query.select(this.knex.raw(`${rawSql} AS ${row.logicalField}`));
          fieldAliasMap.set(row.logicalField, row.logicalField);
          console.log(`  ✓ [后端转换] ${row.logicalField} = ${rawSql}`);
        } else {
          // 简单字段映射 - 直接映射到逻辑字段名
          const pf = row.physicalFields?.[0];
          if (pf) {
            query.select(`${pf.entity}.${pf.name} AS ${row.logicalField}`);
            fieldAliasMap.set(row.logicalField, row.logicalField);
            console.log(`  ✓ [简单映射] ${row.logicalField} = ${pf.entity}.${pf.name}`);
          }
        }
      }
    });

    // 第5步：执行查询
    // 在执行前输出生成的SQL用于调试
    const sqlQuery = query.toString();
    console.log(`\n[第4步] 生成的SQL:\n${sqlQuery}\n`);

    const rawData = await query;
    console.log(`[第5步] 查询执行成功。返回行数: ${rawData.length}`);
    // 第6步：应用前端转换（上拉逻辑）
    // 在应用层进行数据转换
    const result = this.applyBffTransformers(rawData, mappings);
    console.log(`[第6步] 应用了 ${bffMappings.length} 个前端转换`);
    console.log('========== 查询执行结束 ==========\n');

    return result;
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
    const logicalFieldNames = new Set(mappings.map((m) => m.logicalField));

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
