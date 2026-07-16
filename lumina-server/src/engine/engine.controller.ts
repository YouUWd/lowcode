import { Controller, Get, Post, Delete, Param, Query, Headers, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { EngineService } from './engine.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ModulesService } from '../modules/modules.service';
import { QueryPayload, SavePayload } from './engine.dto';

@Controller()
export class EngineController {
  constructor(
    private readonly engineService: EngineService,
    private readonly modulesService: ModulesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * 1. 展示模块关联表及字段信息 (与画布和权限配置交互)
   * GET /api/module/:moduleId/meta
   */
  @Get('module/:moduleId/meta')
  async getModuleMeta(@Param('moduleId') moduleId: string) {
    const meta = await this.modulesService.getModuleMeta(moduleId);
    if (!meta) {
      throw new NotFoundException(`模块不存在: ${moduleId}`);
    }
    return {
      code: 200,
      message: 'success',
      data: meta,
    };
  }

  /**
   * 2. 基于模块的整体列表查询与详情查询
   * POST /api/module/:moduleId/query
   */
  @Post('module/:moduleId/query')
  async queryModuleData(
    @Param('moduleId') moduleId: string,
    @Body() payload: QueryPayload,
    @Headers('X-Role') roleHeader?: string,
  ) {
    const roleCode = roleHeader || 'viewer'; // 默认只读查看员
    try {
      const result = await this.engineService.executeQueryPayload(moduleId, payload, roleCode);
      return {
        code: 200,
        message: 'success',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error instanceof Error ? error.message : '查询异常');
    }
  }

  /**
   * 3. 基于模块的整体更新（新增/修改）
   * POST /api/module/:moduleId/save
   */
  @Post('module/:moduleId/save')
  async saveModuleData(
    @Param('moduleId') moduleId: string,
    @Body() payload: SavePayload,
    @Headers('X-Role') roleHeader?: string,
  ) {
    const roleCode = roleHeader || 'viewer';
    if (!payload || !payload.data) {
      throw new BadRequestException('保存的数据不能为空');
    }
    try {
      const savedId = await this.engineService.saveModuleRecord(moduleId, payload.data, roleCode);
      return {
        code: 200,
        message: 'success',
        data: savedId,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error instanceof Error ? error.message : '保存异常');
    }
  }

  /**
   * 4. 级联物理删除
   * DELETE /api/module/:moduleId/:id
   */
  @Delete('module/:moduleId/:id')
  async deleteModuleData(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
  ) {
    try {
      await this.engineService.deleteModuleRecord(moduleId, id);
      return {
        code: 200,
        message: 'success',
        data: null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error instanceof Error ? error.message : '删除异常');
    }
  }

  /**
   * 保留的原有 GET 动态查询接口，以保证系统其他部分的兼容性
   */
  @Get('query/:moduleId')
  async legacyQuery(
    @Param('moduleId') moduleId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    try {
      const config = await this.modulesService.getModuleConfig(moduleId);
      if (!config) {
        return { success: false, error: `Module not found: ${moduleId}` };
      }
      const permissions = await this.permissionsService.getModulePermissions(moduleId);
      if (permissions.size === 0) {
        return { success: false, error: '权限集合为空，无权访问任何字段', data: [], count: 0 };
      }
      if (config.mappings) {
        config.mappings = await this.permissionsService.filterMappingsByPermissions(config.mappings, moduleId);
        if (config.mappings.length === 0) {
          return { success: false, error: '无权访问该模块的任何字段', data: [], count: 0 };
        }
      }
      const result = await this.engineService.executeDynamicQuery(config, {
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
      });
      return {
        success: true,
        data: result,
        count: result.length,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
