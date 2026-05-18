import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { ModulesService } from './modules.service';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  /**
   * 获取所有模块列表
   * GET /api/modules
   */
  @Get()
  async getAllModules() {
    return this.modulesService.getAllModules();
  }

  /**
   * 获取模块详情
   * GET /api/modules/:id
   */
  @Get(':id')
  async getModuleDetail(@Param('id') moduleId: string) {
    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }
    return module;
  }

  /**
   * 获取模块的关联表信息
   * GET /api/modules/:id/entities
   */
  @Get(':id/entities')
  async getModuleEntities(@Param('id') moduleId: string) {
    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }
    return module.entities;
  }

  /**
   * 获取模块的字段配置
   * GET /api/modules/:id/fields
   */
  @Get(':id/fields')
  async getModuleFields(@Param('id') moduleId: string) {
    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }
    return module.mappings;
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
    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    const field = module.mappings.find((m) => m.logicalField === fieldName);
    if (!field) {
      throw new NotFoundException(`Field not found: ${fieldName}`);
    }

    return field;
  }

  // ==================== 新增模块接口 ====================

  /**
   * 新增模块
   * POST /api/modules
   */
  @Post()
  async createModule(@Body() moduleData: any) {
    if (!moduleData.id || !moduleData.name) {
      throw new BadRequestException('模块 ID 和名称不能为空');
    }

    await this.modulesService.addModule(moduleData);
    return { success: true, id: moduleData.id };
  }

  /**
   * 更新模块
   * PUT /api/modules/:id
   */
  @Put(':id')
  async updateModule(@Param('id') moduleId: string, @Body() moduleData: any) {
    const existingModule = await this.modulesService.getModuleConfig(moduleId);
    if (!existingModule) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    await this.modulesService.updateModule(moduleId, moduleData);
    return { success: true, id: moduleId };
  }

  /**
   * 删除模块
   * DELETE /api/modules/:id
   */
  @Delete(':id')
  async deleteModule(@Param('id') moduleId: string) {
    const existingModule = await this.modulesService.getModuleConfig(moduleId);
    if (!existingModule) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    await this.modulesService.deleteModule(moduleId);
    return { success: true, id: moduleId };
  }

  // ==================== 模块关联表接口 ====================

  /**
   * 新增模块关联表
   * POST /api/modules/:id/entities
   */
  @Post(':id/entities')
  async createModuleEntity(@Param('id') moduleId: string, @Body() entityData: any) {
    if (!entityData.id || !entityData.name) {
      throw new BadRequestException('关联表 ID 和名称不能为空');
    }

    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    await this.modulesService.addModuleEntity(moduleId, entityData);
    return { success: true, id: entityData.id };
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
    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    const entity = module.entities.find((e) => e.id === entityId);
    if (!entity) {
      throw new NotFoundException(`Entity not found: ${entityId}`);
    }

    await this.modulesService.updateModuleEntity(moduleId, entityId, entityData);
    return { success: true, id: entityId };
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
    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    const entity = module.entities.find((e) => e.id === entityId);
    if (!entity) {
      throw new NotFoundException(`Entity not found: ${entityId}`);
    }

    await this.modulesService.deleteModuleEntity(moduleId, entityId);
    return { success: true, id: entityId };
  }

  // ==================== 模块字段配置接口 ====================

  /**
   * 新增模块字段配置
   * POST /api/modules/:id/fields
   */
  @Post(':id/fields')
  async createModuleField(@Param('id') moduleId: string, @Body() fieldData: any) {
    if (!fieldData.logicalField || !fieldData.displayName) {
      throw new BadRequestException('字段名和显示名不能为空');
    }

    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    // 检查字段是否已存在
    const existingField = module.mappings.find((m) => m.logicalField === fieldData.logicalField);
    if (existingField) {
      throw new BadRequestException(`Field already exists: ${fieldData.logicalField}`);
    }

    await this.modulesService.addModuleField(moduleId, fieldData);
    return { success: true, logicalField: fieldData.logicalField };
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
    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    const field = module.mappings.find((m) => m.logicalField === fieldName);
    if (!field) {
      throw new NotFoundException(`Field not found: ${fieldName}`);
    }

    await this.modulesService.updateModuleField(moduleId, fieldName, fieldData);
    return { success: true, logicalField: fieldName };
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
    const module = await this.modulesService.getModuleConfig(moduleId);
    if (!module) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    const field = module.mappings.find((m) => m.logicalField === fieldName);
    if (!field) {
      throw new NotFoundException(`Field not found: ${fieldName}`);
    }

    await this.modulesService.deleteModuleField(moduleId, fieldName);
    return { success: true, logicalField: fieldName };
  }
}
