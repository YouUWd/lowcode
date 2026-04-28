import { Controller, Get, Param, Inject } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { Knex } from 'knex';

@Controller('modules')
export class ModulesController {
  private instanceId = Math.random().toString(36).substring(7);

  constructor(
    private readonly modulesService: ModulesService,
    @Inject('CONFIG_DB') private readonly knex: Knex,
  ) {
    console.log(`[ModulesController] 创建新实例: ${this.instanceId}`);
  }

  /**
   * 获取所有模块列表 (仅返回模块基本信息)
   * GET /api/modules
   */
  @Get()
  async getAllModules() {
    try {
      console.log(`[ModulesController] getAllModules() 被调用 (实例: ${this.instanceId})`);
      const modules = await this.modulesService.getAllModules();
      console.log(`[ModulesController] 从 ModulesService 获取模块数: ${modules.length} (实例: ${this.instanceId})`);
      console.log('[ModulesController] 模块详情:', modules.map(m => ({ id: m.id, name: m.name })));

      const result = {
        code: 200,
        message: 'success',
        data: modules,
      };
      
      console.log('[ModulesController] 返回数据数量:', result.data.length);
      return result;
    } catch (error) {
      console.error('[ModulesController] 查询模块失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 获取模块详情 (包含基本信息)
   * GET /api/modules/:id
   */
  @Get(':id')
  async getModuleDetail(@Param('id') moduleId: string) {
    try {
      const module = await this.modulesService.getModuleConfig(moduleId);

      if (!module) {
        return {
          code: 404,
          message: 'Module not found',
          data: null,
        };
      }

      return {
        code: 200,
        message: 'success',
        data: {
          id: module.id,
          name: module.name,
          desc: module.desc,
          entity: module.entity,
          primaryEntity: module.primaryEntity,
          count: module.count,
          active: module.active,
        },
      };
    } catch (error) {
      console.error('[ModulesController] 查询模块详情失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 获取模块的关联表信息
   * GET /api/modules/:id/entities
   */
  @Get(':id/entities')
  async getModuleEntities(@Param('id') moduleId: string) {
    try {
      console.log(`[ModulesController] 获取模块关联表: ${moduleId}`);
      const module = await this.modulesService.getModuleConfig(moduleId);
      console.log(`[ModulesController] 获取到模块配置, 关联表数: ${module?.entities?.length || 0}`);

      if (!module) {
        console.log(`[ModulesController] 模块不存在: ${moduleId}`);
        return {
          code: 404,
          message: 'Module not found',
          data: null,
        };
      }

      console.log(`[ModulesController] 返回关联表数据:`, module.entities.map(e => ({ id: e.id, name: e.name })));
      return {
        code: 200,
        message: 'success',
        data: module.entities,
      };
    } catch (error) {
      console.error('[ModulesController] 查询关联表失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 获取模块的字段配置
   * GET /api/modules/:id/fields
   */
  @Get(':id/fields')
  async getModuleFields(@Param('id') moduleId: string) {
    try {
      const module = await this.modulesService.getModuleConfig(moduleId);

      if (!module) {
        return {
          code: 404,
          message: 'Module not found',
          data: null,
        };
      }

      return {
        code: 200,
        message: 'success',
        data: module.mappings,
      };
    } catch (error) {
      console.error('[ModulesController] 查询字段配置失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 获取单个字段的详细信息
   * GET /api/modules/:id/fields/:fieldName
   */
  @Get(':id/fields/:fieldName')
  async getModuleFieldDetail(
    @Param('id') moduleId: string,
    @Param('fieldName') fieldName: string,
  ) {
    try {
      const module = await this.modulesService.getModuleConfig(moduleId);

      if (!module) {
        return {
          code: 404,
          message: 'Module not found',
          data: null,
        };
      }

      const field = module.mappings.find((m) => m.logicalField === fieldName);

      if (!field) {
        return {
          code: 404,
          message: 'Field not found',
          data: null,
        };
      }

      return {
        code: 200,
        message: 'success',
        data: field,
      };
    } catch (error) {
      console.error('[ModulesController] 查询字段详情失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }
}
