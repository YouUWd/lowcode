import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

export type TransformerEnv = 'none' | 'backend' | 'frontend';

export interface Mapping {
  displayName: string;
  logicalField: string;
  physicalFields: Array<{
    entity: string;
    field: string;
  }>;
  transformer: string | null;
  transformerEnv: TransformerEnv;
  renderIcon: string;
  renderType: string;
}

export type RelationType = '1:1' | '1:N' | 'N:1';

export interface EntityRelation {
  id: string;
  name: string;
  desc: string;
  status: string;
  relationType: RelationType;
  joinCondition: {
    left: string;
    right: string;
  };
}

export interface ModuleConfig {
  id: string;
  name: string;
  desc: string;
  entity: string;
  count: number;
  active: boolean;
  primaryEntity: {
    name: string;
    desc: string;
  };
  entities: EntityRelation[];
  mappings: Mapping[];
}

@Injectable()
export class ModulesService {
  constructor(@Inject('CONFIG_DB') private readonly knex: Knex) {
    console.log('[模块服务] 服务已创建 (基于全新 ER 元数据)');
  }

  /**
   * 获取所有模块列表
   */
  async getAllModules() {
    const modules = await this.knex('module_meta').orderBy('created_at');
    console.log(`[模块服务] 查询到 ${modules.length} 个模块`);
    
    const result: any[] = [];
    for (const m of modules) {
      const tables = await this.knex('module_table_meta')
        .join('table_meta', 'module_table_meta.table_meta_id', 'table_meta.id')
        .where('module_table_meta.module_id', m.id)
        .orderBy('module_table_meta.sort_order', 'asc')
        .select('table_meta.*');

      const primaryTable = tables[0];
      const count = Math.max(0, tables.length - 1);

      result.push({
        id: m.id,
        name: m.name,
        desc: m.description,
        entity: primaryTable ? primaryTable.table_name : '未知主表',
        count: count,
        active: true,
      });
    }
    return result;
  }

  /**
   * (方案A核心) 从全局 ER 定义推断两张表之间的关联路径
   * 必须同时提供字段关联元数据 (relation_meta + relation_field_meta) 才能准确判断关系类型
   */
  async resolveRelation(sourceTableName: string, targetTableName: string): Promise<any> {
    // 1. 获取两张表的表元数据
    const sourceMeta = await this.knex('table_meta').where('table_name', sourceTableName).first();
    const targetMeta = await this.knex('table_meta').where('table_name', targetTableName).first();
    if (!sourceMeta || !targetMeta) return null;

    // 2. 获取源表在 relation_field_meta 中的所有参与记录
    const sourceRels = await this.knex('relation_field_meta')
      .join('field_meta', 'relation_field_meta.field_meta_id', 'field_meta.id')
      .where('field_meta.table_meta_id', sourceMeta.id)
      .select('relation_field_meta.relation_id', 'field_meta.column_name', 'relation_field_meta.cardinality');

    // 3. 获取目标表在 relation_field_meta 中的所有参与记录
    const targetRels = await this.knex('relation_field_meta')
      .join('field_meta', 'relation_field_meta.field_meta_id', 'field_meta.id')
      .where('field_meta.table_meta_id', targetMeta.id)
      .select('relation_field_meta.relation_id', 'field_meta.column_name', 'relation_field_meta.cardinality');

    // 4. 找到它们的交集（共同参与的 relation_id）
    for (const sRel of sourceRels) {
      const match = targetRels.find(tRel => tRel.relation_id === sRel.relation_id);
      if (match) {
        // 构建 RelationType
        let relType: RelationType = '1:1';
        if (sRel.cardinality === '1' && match.cardinality === 'N') relType = '1:N';
        else if (sRel.cardinality === 'N' && match.cardinality === '1') relType = 'N:1';
        
        return {
          relationType: relType,
          left: sRel.column_name,
          right: match.column_name
        };
      }
    }
    return null;
  }

  /**
   * 获取模块完整配置（包含实体和全量字段映射）
   */
  async getModuleConfig(id: string): Promise<ModuleConfig | null> {
    console.log(`[模块服务] 查询模块配置: ${id}`);
    
    const dbModule = await this.knex('module_meta')
      .where('id', id)
      .first();

    if (!dbModule) {
      return null;
    }

    // 查询包含的表
    const moduleTables = await this.knex('module_table_meta')
      .join('table_meta', 'module_table_meta.table_meta_id', 'table_meta.id')
      .where('module_table_meta.module_id', id)
      .orderBy('module_table_meta.sort_order', 'asc')
      .select('table_meta.*');

    if (moduleTables.length === 0) {
      return {
        id: dbModule.id,
        name: dbModule.name,
        desc: dbModule.description,
        entity: '',
        count: 0,
        active: true,
        primaryEntity: { name: '', desc: '' },
        entities: [],
        mappings: [],
      };
    }

    const primaryTable = moduleTables[0];
    const associatedTables = moduleTables.slice(1);

    const entities: EntityRelation[] = [];
    const mappings: Mapping[] = [];

    // 处理主表字段 (方案A：自动生成)
    const primaryFields = await this.knex('field_meta').where('table_meta_id', primaryTable.id);
    primaryFields.forEach(f => {
      mappings.push({
        displayName: f.label || f.column_name,
        logicalField: f.column_name, // 主表字段名作为默认逻辑字段名
        physicalFields: [{ entity: primaryTable.table_name, field: f.column_name }],
        transformer: null,
        transformerEnv: 'none',
        renderIcon: '',
        renderType: 'text',
      });
    });

    // 处理关联表
    for (const assocTable of associatedTables) {
      // 尝试自动推断关系
      const relInfo = await this.resolveRelation(primaryTable.table_name, assocTable.table_name);
      
      entities.push({
        id: assocTable.id.toString(),
        name: assocTable.table_name,
        desc: assocTable.display_name || '',
        status: 'active',
        relationType: relInfo ? relInfo.relationType : '1:1',
        joinCondition: {
          left: relInfo ? relInfo.left : 'id', // 兜底
          right: relInfo ? relInfo.right : 'id'
        },
      });

      // 处理关联表字段 (方案A：自动生成)
      const assocFields = await this.knex('field_meta').where('table_meta_id', assocTable.id);
      assocFields.forEach(f => {
        // 为了防止逻辑字段名冲突，加上表名作为前缀
        const logicalName = `${assocTable.table_name}_${f.column_name}`;
        mappings.push({
          displayName: f.label ? `${assocTable.display_name}-${f.label}` : logicalName,
          logicalField: logicalName, 
          physicalFields: [{ entity: assocTable.table_name, field: f.column_name }],
          transformer: null,
          transformerEnv: 'none',
          renderIcon: '',
          renderType: 'text',
        });
      });
    }

    const config: ModuleConfig = {
      id: dbModule.id,
      name: dbModule.name,
      desc: dbModule.description,
      entity: primaryTable.table_name,
      count: 0,
      active: true,
      primaryEntity: {
        name: primaryTable.table_name,
        desc: primaryTable.display_name || '',
      },
      entities,
      mappings,
    };

    console.log(`[模块服务] 模块配置构建完成: ${id}`);
    return config;
  }

  async addModule(moduleData: any): Promise<void> {
    await this.knex('module_meta').insert({
      id: moduleData.id,
      name: moduleData.name,
      description: moduleData.desc
    });
    
    // 如果传了 entity，自动作为主表
    if (moduleData.entity) {
      const tableMeta = await this.knex('table_meta').where('table_name', moduleData.entity).first();
      if (tableMeta) {
        await this.knex('module_table_meta').insert({
          module_id: moduleData.id,
          table_meta_id: tableMeta.id,
          sort_order: 1
        });
      }
    }
  }

  async updateModule(id: string, moduleData: any): Promise<void> {
    await this.knex('module_meta')
      .where('id', id)
      .update({
        name: moduleData.name,
        description: moduleData.desc,
        updated_at: this.knex.fn.now()
      });
  }

  async deleteModule(id: string): Promise<void> {
    await this.knex('module_table_meta').where('module_id', id).delete();
    await this.knex('module_meta').where('id', id).delete();
  }

  async addModuleEntity(moduleId: string, entityData: any): Promise<string> {
    // entityData.name 即为物理表名
    const tableMeta = await this.knex('table_meta').where('table_name', entityData.name).first();
    if (!tableMeta) throw new Error('未找到物理表');

    // 查找最大 sort_order
    const current = await this.knex('module_table_meta')
      .where('module_id', moduleId)
      .max('sort_order as maxSort')
      .first();
    const nextSort = (current?.maxSort || 0) + 1;

    await this.knex('module_table_meta').insert({
      module_id: moduleId,
      table_meta_id: tableMeta.id,
      sort_order: nextSort
    });
    return tableMeta.id.toString();
  }

  async syncModuleEntities(moduleId: string, entityNames: string[]): Promise<void> {
    const trx = await this.knex.transaction();
    try {
      // 1. 删除所有关联表（保留主表，即 sort_order = 1 的记录）
      await trx('module_table_meta')
        .where('module_id', moduleId)
        .where('sort_order', '>', 1)
        .delete();

      // 2. 批量重新插入关联表
      if (entityNames && entityNames.length > 0) {
        const tables = await trx('table_meta').whereIn('table_name', entityNames);
        const inserts = entityNames.map((name, index) => {
          const table = tables.find(t => t.table_name === name);
          if (!table) throw new Error(`未找到表: ${name}`);
          return {
            module_id: moduleId,
            table_meta_id: table.id,
            sort_order: index + 2
          };
        });
        if (inserts.length > 0) {
          await trx('module_table_meta').insert(inserts);
        }
      }
      await trx.commit();
    } catch (e) {
      await trx.rollback();
      throw e;
    }
  }

  async updateModuleEntity(moduleId: string, entityId: string, entityData: any): Promise<void> {
    // 方案A下不需要更新实体关联（关系通过全局ER推断）
  }

  async deleteModuleEntity(moduleId: string, entityId: string): Promise<void> {
    // entityId 在这里即为 table_meta_id
    await this.knex('module_table_meta')
      .where('module_id', moduleId)
      .where('table_meta_id', entityId)
      .delete();
  }

  // 废弃的接口方法（方案A：只读全量字段映射，不再需要自定义）
  async addModuleField(moduleId: string, fieldData: any): Promise<void> {}
  async updateModuleField(moduleId: string, logicalField: string, fieldData: any): Promise<void> {}
  async deleteModuleField(moduleId: string, logicalField: string): Promise<void> {}
}
