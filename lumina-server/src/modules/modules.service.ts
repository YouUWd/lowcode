import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

export type TransformerEnv = 'none' | 'backend' | 'frontend';

export interface Mapping {
  displayName: string;
  logicalField: string;
  physicalFields: Array<{
    entity: string;
    name: string;
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
    console.log('[模块服务] 服务已创建');
  }

  /**
   * 获取所有模块列表
   */
  async getAllModules() {
    const modules = await this.knex('sys_module').orderBy('sort_order');
    console.log(`[模块服务] 查询到 ${modules.length} 个模块`);
    return modules.map((m) => ({
      id: m.module_id,
      name: m.module_name,
      desc: m.module_desc,
      entity: m.primary_entity,
      count: m.record_count,
      active: m.is_active,
    }));
  }

  /**
   * 获取模块完整配置（包含实体和字段映射）
   */
  async getModuleConfig(id: string): Promise<ModuleConfig | null> {
    console.log(`[模块服务] 查询模块配置: ${id}`);
    
    return this.knex('sys_module')
      .where('module_id', id)
      .first()
      .then(async (dbModule) => {
        console.log(`[模块服务] 查询模块基本信息结果:`, dbModule ? { id: dbModule.module_id, name: dbModule.module_name } : 'null');
        
        if (!dbModule) return null;

        // 查询关联表（包含关系类型）
        console.log(`[模块服务] 查询关联表: module_id = ${dbModule.module_id}`);
        const entities = await this.knex('sys_module_entity')
          .where('module_id', dbModule.module_id)
          .orderBy('sort_order');
        console.log(`[模块服务] 查询到关联表数: ${entities.length}`);
        console.log(`[模块服务] 关联表数据:`, entities.map(e => ({ id: e.entity_id, name: e.entity_name, relationType: e.relation_type })));

        // 查询字段配置
        console.log(`[模块服务] 查询字段配置: module_id = ${dbModule.module_id}`);
        const fields = await this.knex('sys_module_field')
          .where('module_id', dbModule.module_id)
          .where('is_visible', true)
          .orderBy('sort_order');
        console.log(`[模块服务] 查询到字段数: ${fields.length}`);

        // 查询字段物理源
        console.log(`[模块服务] 查询字段物理源: module_id = ${dbModule.module_id}`);
        const fieldSources = await this.knex('sys_module_field_source')
          .where('module_id', dbModule.module_id)
          .orderBy('logical_field', 'sort_order');
        console.log(`[模块服务] 查询到字段源数: ${fieldSources.length}`);

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
            transformerEnv: field.transformer_env as TransformerEnv,
            renderIcon: field.render_icon,
            renderType: field.render_type,
          };
        });

        // 构建模块配置
        const moduleConfig: ModuleConfig = {
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
          entities: entities.map((e) => ({
            id: e.entity_id,
            name: e.entity_name,
            desc: e.entity_desc,
            status: e.entity_status,
            relationType: (e.relation_type || '1:1') as RelationType,
            joinCondition: {
              left: e.join_left_field,
              right: e.join_right_field,
            },
          })),
          mappings,
        };

        console.log(`[模块服务] 构建完成的模块配置: 实体数=${moduleConfig.entities.length}, 字段数=${moduleConfig.mappings.length}`);
        return moduleConfig;
      });
  }

  /**
   * 添加模块 (数据库)
   */
  async addModule(moduleData: any): Promise<void> {
    await this.knex('sys_module').insert({
      module_id: moduleData.id,
      module_name: moduleData.name,
      module_desc: moduleData.desc,
      primary_entity: moduleData.entity,
      primary_entity_desc: moduleData.primaryEntity.desc,
      record_count: moduleData.count,
      is_active: moduleData.active,
    });
  }

  /**
   * 更新模块 (数据库)
   */
  async updateModule(id: string, moduleData: any): Promise<void> {
    await this.knex('sys_module')
      .where('module_id', id)
      .update({
        module_name: moduleData.name,
        module_desc: moduleData.desc,
        record_count: moduleData.count,
        is_active: moduleData.active,
        updated_at: new Date(),
      });
  }

  /**
   * 删除模块 (数据库)
   */
  async deleteModule(id: string): Promise<void> {
    await this.knex('sys_module').where('module_id', id).delete();
  }
}
