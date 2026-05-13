import { Controller, Get, Post, Put, Delete, Param, Body, Inject } from '@nestjs/common';
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

  // ==================== 新增模块接口 ====================

  /**
   * 新增模块
   * POST /api/modules
   */
  @Post()
  async createModule(@Body() moduleData: any) {
    try {
      console.log('[ModulesController] 新增模块:', moduleData);

      if (!moduleData.id || !moduleData.name) {
        return {
          code: 400,
          message: '模块 ID 和名称不能为空',
          data: null,
        };
      }

      await this.modulesService.addModule(moduleData);

      return {
        code: 200,
        message: '模块创建成功',
        data: { id: moduleData.id },
      };
    } catch (error) {
      console.error('[ModulesController] 新增模块失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 更新模块
   * PUT /api/modules/:id
   */
  @Put(':id')
  async updateModule(@Param('id') moduleId: string, @Body() moduleData: any) {
    try {
      console.log('[ModulesController] 更新模块:', moduleId, moduleData);

      const existingModule = await this.modulesService.getModuleConfig(moduleId);
      if (!existingModule) {
        return {
          code: 404,
          message: '模块不存在',
          data: null,
        };
      }

      await this.modulesService.updateModule(moduleId, moduleData);

      return {
        code: 200,
        message: '模块更新成功',
        data: { id: moduleId },
      };
    } catch (error) {
      console.error('[ModulesController] 更新模块失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 删除模块
   * DELETE /api/modules/:id
   */
  @Delete(':id')
  async deleteModule(@Param('id') moduleId: string) {
    try {
      console.log('[ModulesController] 删除模块:', moduleId);

      const existingModule = await this.modulesService.getModuleConfig(moduleId);
      if (!existingModule) {
        return {
          code: 404,
          message: '模块不存在',
          data: null,
        };
      }

      await this.modulesService.deleteModule(moduleId);

      return {
        code: 200,
        message: '模块删除成功',
        data: { id: moduleId, name: existingModule.name },
      };
    } catch (error) {
      console.error('[ModulesController] 删除模块失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  // ==================== 模块关联表接口 ====================

  /**
   * 新增模块关联表
   * POST /api/modules/:id/entities
   */
  @Post(':id/entities')
  async createModuleEntity(@Param('id') moduleId: string, @Body() entityData: any) {
    try {
      console.log('[ModulesController] 新增模块关联表:', moduleId, entityData);

      if (!entityData.id || !entityData.name) {
        return {
          code: 400,
          message: '关联表 ID 和名称不能为空',
          data: null,
        };
      }

      const module = await this.modulesService.getModuleConfig(moduleId);
      if (!module) {
        return {
          code: 404,
          message: '模块不存在',
          data: null,
        };
      }

      await this.modulesService.addModuleEntity(moduleId, entityData);

      return {
        code: 200,
        message: '关联表添加成功',
        data: { id: entityData.id },
      };
    } catch (error) {
      console.error('[ModulesController] 新增关联表失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 更新模块关联表
   * PUT /api/modules/:id/entities/:entityId
   */
  @Put(':id/entities/:entityId')
  async updateModuleEntity(
    @Param('id') moduleId: string,
    @Param('entityId') entityId: string,
    @Body() entityData: any,
  ) {
    try {
      console.log('[ModulesController] 更新模块关联表:', moduleId, entityId, entityData);

      const module = await this.modulesService.getModuleConfig(moduleId);
      if (!module) {
        return {
          code: 404,
          message: '模块不存在',
          data: null,
        };
      }

      const entity = module.entities.find((e) => e.id === entityId);
      if (!entity) {
        return {
          code: 404,
          message: '关联表不存在',
          data: null,
        };
      }

      await this.modulesService.updateModuleEntity(moduleId, entityId, entityData);

      return {
        code: 200,
        message: '关联表更新成功',
        data: { id: entityId },
      };
    } catch (error) {
      console.error('[ModulesController] 更新关联表失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 删除模块关联表
   * DELETE /api/modules/:id/entities/:entityId
   */
  @Delete(':id/entities/:entityId')
  async deleteModuleEntity(
    @Param('id') moduleId: string,
    @Param('entityId') entityId: string,
  ) {
    try {
      console.log('[ModulesController] 删除模块关联表:', moduleId, entityId);

      const module = await this.modulesService.getModuleConfig(moduleId);
      if (!module) {
        return {
          code: 404,
          message: '模块不存在',
          data: null,
        };
      }

      const entity = module.entities.find((e) => e.id === entityId);
      if (!entity) {
        return {
          code: 404,
          message: '关联表不存在',
          data: null,
        };
      }

      await this.modulesService.deleteModuleEntity(moduleId, entityId);

      return {
        code: 200,
        message: '关联表删除成功',
        data: { id: entityId },
      };
    } catch (error) {
      console.error('[ModulesController] 删除关联表失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  // ==================== 模块字段配置接口 ====================

  /**
   * 新增模块字段配置
   * POST /api/modules/:id/fields
   */
  @Post(':id/fields')
  async createModuleField(@Param('id') moduleId: string, @Body() fieldData: any) {
    try {
      console.log('[ModulesController] 新增模块字段配置:', moduleId, fieldData);

      if (!fieldData.logicalField || !fieldData.displayName) {
        return {
          code: 400,
          message: '字段名和显示名不能为空',
          data: null,
        };
      }

      const module = await this.modulesService.getModuleConfig(moduleId);
      if (!module) {
        return {
          code: 404,
          message: '模块不存在',
          data: null,
        };
      }

      // 检查字段是否已存在
      const existingField = module.mappings.find((m) => m.logicalField === fieldData.logicalField);
      if (existingField) {
        return {
          code: 400,
          message: '字段已存在',
          data: null,
        };
      }

      await this.modulesService.addModuleField(moduleId, fieldData);

      return {
        code: 200,
        message: '字段配置添加成功',
        data: { logicalField: fieldData.logicalField },
      };
    } catch (error) {
      console.error('[ModulesController] 新增字段配置失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 更新模块字段配置
   * PUT /api/modules/:id/fields/:fieldName
   */
  @Put(':id/fields/:fieldName')
  async updateModuleField(
    @Param('id') moduleId: string,
    @Param('fieldName') fieldName: string,
    @Body() fieldData: any,
  ) {
    try {
      console.log('[ModulesController] 更新模块字段配置:', moduleId, fieldName, fieldData);

      const module = await this.modulesService.getModuleConfig(moduleId);
      if (!module) {
        return {
          code: 404,
          message: '模块不存在',
          data: null,
        };
      }

      const field = module.mappings.find((m) => m.logicalField === fieldName);
      if (!field) {
        return {
          code: 404,
          message: '字段不存在',
          data: null,
        };
      }

      await this.modulesService.updateModuleField(moduleId, fieldName, fieldData);

      return {
        code: 200,
        message: '字段配置更新成功',
        data: { logicalField: fieldName },
      };
    } catch (error) {
      console.error('[ModulesController] 更新字段配置失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 删除模块字段配置
   * DELETE /api/modules/:id/fields/:fieldName
   */
  @Delete(':id/fields/:fieldName')
  async deleteModuleField(
    @Param('id') moduleId: string,
    @Param('fieldName') fieldName: string,
  ) {
    try {
      console.log('[ModulesController] 删除模块字段配置:', moduleId, fieldName);

      const module = await this.modulesService.getModuleConfig(moduleId);
      if (!module) {
        return {
          code: 404,
          message: '模块不存在',
          data: null,
        };
      }

      const field = module.mappings.find((m) => m.logicalField === fieldName);
      if (!field) {
        return {
          code: 404,
          message: '字段不存在',
          data: null,
        };
      }

      await this.modulesService.deleteModuleField(moduleId, fieldName);

      return {
        code: 200,
        message: '字段配置删除成功',
        data: { logicalField: fieldName },
      };
    } catch (error) {
      console.error('[ModulesController] 删除字段配置失败:', error);
      return {
        code: 500,
        message: error.message,
        data: null,
      };
    }
  }
}
